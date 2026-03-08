;; Collateralized Lending Contract - StacksRank
;; Users deposit STX as collateral and borrow against it.
;; Liquidation kicks in when health factor drops below 1.0.
;; Loan-to-value (LTV): 70%. Liquidation threshold: 80%. Liquidation bonus: 5%.

;; ───────────────────────────────────────────────────────────
;; CONSTANTS
;; ───────────────────────────────────────────────────────────
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED     (err u900))
(define-constant ERR-INVALID-AMOUNT     (err u901))
(define-constant ERR-INSUFFICIENT-COLLATERAL (err u902))
(define-constant ERR-ALREADY-HAS-LOAN  (err u903))
(define-constant ERR-NO-LOAN           (err u904))
(define-constant ERR-HEALTH-FACTOR-OK  (err u905))
(define-constant ERR-REPAYMENT-FAILED  (err u906))
(define-constant ERR-PRICE-NOT-AVAILABLE (err u907))

;; LTV = 70% = 7000 / 10000
(define-constant MAX-LTV u7000)

;; Liquidation threshold = 80% = 8000 / 10000
(define-constant LIQUIDATION-THRESHOLD u8000)

;; Liquidation bonus = 5% = 500 / 10000 (liquidator keeps extra collateral)
(define-constant LIQUIDATION-BONUS u500)

;; Annual interest rate = 8% = 800 / 10000 (accrued per block)
;; ~52560 blocks/year on Stacks. Rate per block = 800 / (10000 * 52560)
(define-constant INTEREST-RATE-BPS u800)
(define-constant BLOCKS-PER-YEAR u52560)
(define-constant BASIS-POINTS u10000)

;; ───────────────────────────────────────────────────────────
;; DATA
;; ───────────────────────────────────────────────────────────

;; Loan positions
(define-map loans principal {
  collateral-amount: uint,       ;; uSTX deposited as collateral
  borrowed-amount: uint,         ;; uSTX borrowed (principal)
  accrued-interest: uint,        ;; accumulated interest in uSTX
  opened-at-block: uint,
  last-interest-block: uint,
  active: bool
})

;; Protocol-wide state
(define-data-var total-collateral uint u0)
(define-data-var total-borrowed uint u0)
(define-data-var total-interest-earned uint u0)
(define-data-var loan-pool-balance uint u0)
(define-data-var stx-price-usd uint u200000)  ;; 6 decimals: $0.20 default

(define-data-var total-loans-opened uint u0)
(define-data-var total-liquidations uint u0)

;; ───────────────────────────────────────────────────────────
;; READ-ONLY
;; ───────────────────────────────────────────────────────────

(define-read-only (get-loan (user principal))
  (map-get? loans user)
)

;; Calculate accrued interest for a loan
(define-read-only (calculate-interest (principal-amount uint) (from-block uint))
  (let (
    (blocks-elapsed (- stacks-block-height from-block))
    ;; Interest = principal * rate * blocks / blocks_per_year
    (interest (/ (* (* principal-amount INTEREST-RATE-BPS) blocks-elapsed)
                  (* BLOCKS-PER-YEAR BASIS-POINTS)))
  )
    (ok interest)
  )
)

;; Health factor scaled by 1e6 (1.0 = 1,000,000)
;; Health = (collateral * LIQUIDATION-THRESHOLD) / (borrowed + interest)
(define-read-only (get-health-factor (user principal))
  (match (map-get? loans user)
    loan
    (let (
      (collateral (get collateral-amount loan))
      (borrowed (get borrowed-amount loan))
      (accrued (get accrued-interest loan))
      (new-interest (unwrap-panic (calculate-interest borrowed (get last-interest-block loan))))
      (total-debt (+ borrowed accrued new-interest))
    )
      (if (is-eq total-debt u0)
        (ok u999999999)  ;; No debt = max health
        (ok (/ (* collateral LIQUIDATION-THRESHOLD u1000000)
               (* total-debt BASIS-POINTS)))
      )
    )
    (err ERR-NO-LOAN)
  )
)

;; Max borrowable amount given collateral
(define-read-only (get-max-borrow (collateral-amount uint))
  (ok (/ (* collateral-amount MAX-LTV) BASIS-POINTS))
)

(define-read-only (get-protocol-stats)
  (ok {
    total-collateral: (var-get total-collateral),
    total-borrowed: (var-get total-borrowed),
    total-interest-earned: (var-get total-interest-earned),
    loan-pool-balance: (var-get loan-pool-balance),
    total-loans: (var-get total-loans-opened),
    total-liquidations: (var-get total-liquidations)
  })
)

;; ───────────────────────────────────────────────────────────
;; PRIVATE
;; ───────────────────────────────────────────────────────────

(define-private (accrue-interest-for (user principal))
  (match (map-get? loans user)
    loan
    (let (
      (new-interest (unwrap-panic
        (calculate-interest (get borrowed-amount loan) (get last-interest-block loan))))
    )
      (map-set loans user (merge loan {
        accrued-interest: (+ (get accrued-interest loan) new-interest),
        last-interest-block: stacks-block-height
      }))
      new-interest
    )
    u0
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: POOL FUNDING
;; ───────────────────────────────────────────────────────────

;; Owner seeds the loan pool with STX
(define-public (fund-pool (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set loan-pool-balance (+ (var-get loan-pool-balance) amount))
    (ok amount)
  )
)

;; Owner updates the STX price (in a real system this reads from price oracle)
(define-public (update-price (new-price uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> new-price u0) ERR-INVALID-AMOUNT)
    (var-set stx-price-usd new-price)
    (ok new-price)
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: LENDING
;; ───────────────────────────────────────────────────────────

;; Open a loan: deposit collateral and borrow up to 70% LTV
(define-public (open-loan (collateral-amount uint) (borrow-amount uint))
  (let (
    (max-borrow (unwrap! (get-max-borrow collateral-amount) ERR-INVALID-AMOUNT))
  )
    (asserts! (is-none (map-get? loans tx-sender)) ERR-ALREADY-HAS-LOAN)
    (asserts! (> collateral-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> borrow-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (<= borrow-amount max-borrow) ERR-INSUFFICIENT-COLLATERAL)
    (asserts! (<= borrow-amount (var-get loan-pool-balance)) ERR-INSUFFICIENT-COLLATERAL)

    ;; Lock collateral in contract
    (try! (stx-transfer? collateral-amount tx-sender (as-contract tx-sender)))

    ;; Send borrowed amount to borrower
    (let ((borrower tx-sender))
      (try! (as-contract (stx-transfer? borrow-amount tx-sender borrower)))
    )

    ;; Record loan
    (map-set loans tx-sender {
      collateral-amount: collateral-amount,
      borrowed-amount: borrow-amount,
      accrued-interest: u0,
      opened-at-block: stacks-block-height,
      last-interest-block: stacks-block-height,
      active: true
    })

    (var-set total-collateral (+ (var-get total-collateral) collateral-amount))
    (var-set total-borrowed (+ (var-get total-borrowed) borrow-amount))
    (var-set loan-pool-balance (- (var-get loan-pool-balance) borrow-amount))
    (var-set total-loans-opened (+ (var-get total-loans-opened) u1))

    (print { event: "loan-opened", borrower: tx-sender,
             collateral: collateral-amount, borrowed: borrow-amount })
    (ok { collateral: collateral-amount, borrowed: borrow-amount, max-borrow: max-borrow })
  )
)

;; Add more collateral to an existing loan (improves health factor)
(define-public (add-collateral (amount uint))
  (let (
    (loan (unwrap! (map-get? loans tx-sender) ERR-NO-LOAN))
  )
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (get active loan) ERR-NO-LOAN)

    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    (map-set loans tx-sender (merge loan {
      collateral-amount: (+ (get collateral-amount loan) amount)
    }))

    (var-set total-collateral (+ (var-get total-collateral) amount))
    (ok amount)
  )
)

;; Repay loan (partial or full)
(define-public (repay-loan (repay-amount uint))
  (let (
    (loan (unwrap! (map-get? loans tx-sender) ERR-NO-LOAN))
    (interest-accrued (accrue-interest-for tx-sender))
    (updated-loan (unwrap! (map-get? loans tx-sender) ERR-NO-LOAN))
    (total-debt (+ (get borrowed-amount updated-loan) (get accrued-interest updated-loan)))
    (is-full-repay (>= repay-amount total-debt))
    (actual-repay (if is-full-repay total-debt repay-amount))
    (borrower tx-sender)
  )
    (asserts! (get active loan) ERR-NO-LOAN)
    (asserts! (> repay-amount u0) ERR-INVALID-AMOUNT)

    ;; Collect repayment
    (try! (stx-transfer? actual-repay tx-sender (as-contract tx-sender)))

    (if is-full-repay
      ;; Full repay — return collateral and close loan
      (begin
        (try! (as-contract (stx-transfer? (get collateral-amount updated-loan) tx-sender borrower)))
        (var-set total-collateral (- (var-get total-collateral) (get collateral-amount updated-loan)))
        (var-set total-borrowed (- (var-get total-borrowed) (get borrowed-amount updated-loan)))
        (var-set total-interest-earned (+ (var-get total-interest-earned) (get accrued-interest updated-loan)))
        (var-set loan-pool-balance (+ (var-get loan-pool-balance) (get borrowed-amount updated-loan)))
        (map-set loans borrower (merge updated-loan {
          borrowed-amount: u0,
          accrued-interest: u0,
          collateral-amount: u0,
          active: false
        }))
        (print { event: "loan-closed", borrower: borrower, repaid: actual-repay })
      )
      ;; Partial repay
      (let (
        (interest-portion (min (get accrued-interest updated-loan) actual-repay))
        (principal-portion (- actual-repay interest-portion))
      )
        (map-set loans borrower (merge updated-loan {
          borrowed-amount: (- (get borrowed-amount updated-loan) principal-portion),
          accrued-interest: (- (get accrued-interest updated-loan) interest-portion)
        }))
        (var-set loan-pool-balance (+ (var-get loan-pool-balance) principal-portion))
        (var-set total-interest-earned (+ (var-get total-interest-earned) interest-portion))
        (print { event: "loan-partial-repay", borrower: borrower, amount: actual-repay })
      )
    )

    (ok { repaid: actual-repay, full-close: is-full-repay })
  )
)

;; Liquidate an undercollateralized position
(define-public (liquidate (borrower principal))
  (let (
    (loan (unwrap! (map-get? loans borrower) ERR-NO-LOAN))
    (health (unwrap! (get-health-factor borrower) ERR-NO-LOAN))
    (interest-accrued (accrue-interest-for borrower))
    (updated-loan (unwrap! (map-get? loans borrower) ERR-NO-LOAN))
    (total-debt (+ (get borrowed-amount updated-loan) (get accrued-interest updated-loan)))
    (collateral (get collateral-amount updated-loan))
    (liquidator-reward (/ (* collateral LIQUIDATION-BONUS) BASIS-POINTS))
    (protocol-collateral (- collateral liquidator-reward))
    (liquidator tx-sender)
  )
    ;; Health factor must be below 1.0 (< 1,000,000)
    (asserts! (< health u1000000) ERR-HEALTH-FACTOR-OK)
    (asserts! (get active updated-loan) ERR-NO-LOAN)

    ;; Liquidator repays the debt
    (try! (stx-transfer? total-debt liquidator (as-contract tx-sender)))

    ;; Liquidator receives collateral + bonus
    (try! (as-contract (stx-transfer? collateral tx-sender liquidator)))

    ;; Close the loan
    (map-set loans borrower (merge updated-loan {
      borrowed-amount: u0,
      accrued-interest: u0,
      collateral-amount: u0,
      active: false
    }))

    (var-set total-collateral (- (var-get total-collateral) collateral))
    (var-set total-borrowed (- (var-get total-borrowed) (get borrowed-amount updated-loan)))
    (var-set loan-pool-balance (+ (var-get loan-pool-balance) total-debt))
    (var-set total-interest-earned (+ (var-get total-interest-earned) (get accrued-interest updated-loan)))
    (var-set total-liquidations (+ (var-get total-liquidations) u1))

    (print { event: "liquidation", borrower: borrower, liquidator: liquidator,
             collateral-seized: collateral, debt-repaid: total-debt,
             health-factor: health })
    (ok { collateral-received: collateral, debt-repaid: total-debt })
  )
)

;; ───────────────────────────────────────────────────────────
;; INIT
;; ───────────────────────────────────────────────────────────
(begin
  (var-set total-collateral u0)
  (var-set total-borrowed u0)
  (var-set total-interest-earned u0)
  (var-set loan-pool-balance u0)
  (var-set stx-price-usd u200000)
  (var-set total-loans-opened u0)
  (var-set total-liquidations u0)
)
