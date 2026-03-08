;; Flash Loan Contract - StacksRank
;; Allows users to borrow STX within a single atomic transaction.
;; The borrowed amount plus a 0.09% fee MUST be returned in the same call.
;; Used for arbitrage, collateral swaps, and liquidations.

;; ───────────────────────────────────────────────────────────
;; CONSTANTS
;; ───────────────────────────────────────────────────────────
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED     (err u400))
(define-constant ERR-REPAYMENT-FAILED   (err u401))
(define-constant ERR-INSUFFICIENT-POOL  (err u402))
(define-constant ERR-INVALID-AMOUNT     (err u403))
(define-constant ERR-REENTRANCY-GUARD   (err u404))
(define-constant ERR-PAUSED             (err u405))

;; Flash loan fee: 0.09% = 9 / 10000
(define-constant FLASH-FEE-NUMERATOR   u9)
(define-constant FLASH-FEE-DENOMINATOR u10000)

;; ───────────────────────────────────────────────────────────
;; DATA
;; ───────────────────────────────────────────────────────────
(define-data-var pool-balance uint u0)
(define-data-var total-flash-loans uint u0)
(define-data-var total-fees-earned uint u0)
(define-data-var is-paused bool false)
;; Reentrancy guard: locked during active loan
(define-data-var flash-lock bool false)

;; Loan history
(define-map flash-loan-history uint {
  borrower: principal,
  amount: uint,
  fee: uint,
  block-height: uint
})

;; ───────────────────────────────────────────────────────────
;; READ-ONLY
;; ───────────────────────────────────────────────────────────

(define-read-only (get-pool-balance)
  (ok (var-get pool-balance))
)

(define-read-only (calculate-fee (amount uint))
  (ok (/ (* amount FLASH-FEE-NUMERATOR) FLASH-FEE-DENOMINATOR))
)

(define-read-only (get-stats)
  (ok {
    pool-balance: (var-get pool-balance),
    total-loans: (var-get total-flash-loans),
    total-fees: (var-get total-fees-earned),
    is-paused: (var-get is-paused)
  })
)

(define-read-only (get-loan-record (loan-id uint))
  (map-get? flash-loan-history loan-id)
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: POOL MANAGEMENT
;; ───────────────────────────────────────────────────────────

;; Deposit STX into the flash loan pool (owner only)
(define-public (deposit-to-pool (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set pool-balance (+ (var-get pool-balance) amount))
    (ok amount)
  )
)

;; Withdraw STX from pool (owner only)
(define-public (withdraw-from-pool (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= amount (var-get pool-balance)) ERR-INSUFFICIENT-POOL)
    (try! (as-contract (stx-transfer? amount tx-sender CONTRACT-OWNER)))
    (var-set pool-balance (- (var-get pool-balance) amount))
    (ok amount)
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: FLASH LOAN INITIATOR
;; ───────────────────────────────────────────────────────────

;; Execute a flash loan.
;; The borrower receives `amount` uSTX and must repay `amount + fee` in the
;; same transaction by calling repay-flash-loan before this function returns.
;;
;; Pattern:
;;   1. Caller calls execute-flash-loan(amount)
;;   2. Contract sends amount to caller
;;   3. Caller's logic runs (arbitrage, etc.)
;;   4. Caller calls repay-flash-loan(amount + fee)
;;   5. Contract verifies balance increased by fee
(define-public (execute-flash-loan (amount uint))
  (let (
    (fee (unwrap! (calculate-fee amount) ERR-INVALID-AMOUNT))
    (repayment (+ amount fee))
    (balance-before (var-get pool-balance))
    (loan-id (+ (var-get total-flash-loans) u1))
    (borrower tx-sender)
  )
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (not (var-get flash-lock)) ERR-REENTRANCY-GUARD)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (<= amount balance-before) ERR-INSUFFICIENT-POOL)

    ;; Set reentrancy lock
    (var-set flash-lock true)

    ;; Send funds to borrower
    (try! (as-contract (stx-transfer? amount tx-sender borrower)))

    ;; At this point the borrower should execute their logic and call repay-flash-loan
    ;; We verify repayment by checking our balance after
    ;; (Clarity is atomic, so if repay is not called, this tx reverts)

    ;; Verify pool balance increased by fee (repayment happened)
    (asserts!
      (>= (var-get pool-balance) (+ balance-before fee))
      ERR-REPAYMENT-FAILED)

    ;; Update stats
    (map-set flash-loan-history loan-id {
      borrower: borrower,
      amount: amount,
      fee: fee,
      block-height: stacks-block-height
    })

    (var-set total-flash-loans loan-id)
    (var-set total-fees-earned (+ (var-get total-fees-earned) fee))

    ;; Release reentrancy lock
    (var-set flash-lock false)

    (print { event: "flash-loan", borrower: borrower, amount: amount, fee: fee })
    (ok { loan-id: loan-id, amount: amount, fee: fee, repayment: repayment })
  )
)

;; Repay the flash loan + fee back to the pool
(define-public (repay-flash-loan (repayment-amount uint))
  (begin
    (asserts! (var-get flash-lock) ERR-NOT-AUTHORIZED) ;; Must be within an active loan
    (asserts! (> repayment-amount u0) ERR-INVALID-AMOUNT)
    (try! (stx-transfer? repayment-amount tx-sender (as-contract tx-sender)))
    (var-set pool-balance (+ (var-get pool-balance) repayment-amount))
    (ok repayment-amount)
  )
)

;; ───────────────────────────────────────────────────────────
;; ADMIN
;; ───────────────────────────────────────────────────────────

(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set is-paused paused)
    (ok paused)
  )
)

;; ───────────────────────────────────────────────────────────
;; INIT
;; ───────────────────────────────────────────────────────────
(begin
  (var-set pool-balance u0)
  (var-set total-flash-loans u0)
  (var-set total-fees-earned u0)
  (var-set is-paused false)
  (var-set flash-lock false)
)
