;; STX Daily Distributor
;; Users deposit STX into the contract, then users can claim 1 STX every 144 blocks (~24 hours).
;; Owner can withdraw all remaining STX at any time.
;; Uses the same proven as-contract pattern as reward-vault.clar (already deployed on mainnet).

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-UNAUTHORIZED       (err u401))
(define-constant ERR-INSUFFICIENT-FUNDS (err u402))
(define-constant ERR-TOO-SOON           (err u403))

;; Variables
(define-data-var owner principal tx-sender)
;; Claim amount: 1 STX = 1,000,000 uSTX
(define-data-var claim-amount uint u100000)     ;; 0.1 STX
;; Cooldown: 24 hours = ~144 blocks on Stacks mainnet
(define-data-var cooldown-blocks uint u144)
;; Total STX paid out (for tracking)
(define-data-var total-paid-out uint u0)

;; Map: tracks the block height when a user last claimed
(define-map last-claim-height principal uint)

;; -----------------------------------------------
;; 1. DEPOSIT - Owner sends STX into the contract
;; Uses the exact same pattern as reward-vault.clar collect-fee
;; -----------------------------------------------
(define-public (deposit (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-UNAUTHORIZED)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (ok amount)
  )
)

;; -----------------------------------------------
;; 2. WITHDRAW - Owner pulls STX out of the contract
;; Uses the exact same pattern as reward-vault.clar withdraw-fees
;; -----------------------------------------------
(define-public (withdraw (amount uint))
  (let
    (
      (current-balance (stx-get-balance (as-contract tx-sender)))
    )
    (asserts! (is-eq tx-sender (var-get owner)) ERR-UNAUTHORIZED)
    (asserts! (>= current-balance amount) ERR-INSUFFICIENT-FUNDS)
    (try! (as-contract (stx-transfer? amount tx-sender (var-get owner))))
    (ok amount)
  )
)

;; -----------------------------------------------
;; 3. CLAIM - User claims 1 STX once per 24 hours
;; KEY FIX: We save tx-sender as 'claimer' BEFORE entering as-contract
;; so that inside as-contract, 'claimer' is still the user, not the contract.
;; -----------------------------------------------
(define-public (claim)
  (let
    (
      ;; Save the original caller's address NOW, before any context change
      (claimer tx-sender)
      (last-claim (default-to u0 (map-get? last-claim-height tx-sender)))
      (blocks-since-last-claim (- block-height last-claim))
      (amount (var-get claim-amount))
      (balance (stx-get-balance (as-contract tx-sender)))
    )
    ;; Must wait cooldown period (or first time claimer)
    (asserts! (or (is-eq last-claim u0) (>= blocks-since-last-claim (var-get cooldown-blocks))) ERR-TOO-SOON)
    ;; Contract must have enough STX
    (asserts! (>= balance amount) ERR-INSUFFICIENT-FUNDS)

    ;; Update last claim block BEFORE the transfer (re-entrancy guard)
    ;; This strictly enforces the cooldown-blocks wait-time per user.
    (map-set last-claim-height claimer block-height)

    ;; Transfer from contract to the claimer
    ;; Inside as-contract: tx-sender = contract (the sender)
    ;; 'claimer' = the user address we saved above (the receiver)
    (try! (as-contract (stx-transfer? amount tx-sender claimer)))

    ;; Update stats
    (var-set total-paid-out (+ (var-get total-paid-out) amount))
    (ok amount)
  )
)

;; -----------------------------------------------
;; 4. ADMIN - Update claim amount (owner only)
;; -----------------------------------------------
(define-public (set-claim-amount (new-amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-UNAUTHORIZED)
    (var-set claim-amount new-amount)
    (ok new-amount)
  )
)

;; -----------------------------------------------
;; 5. ADMIN - Update cooldown in blocks (owner only)
;; -----------------------------------------------
(define-public (set-cooldown (new-cooldown uint))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-UNAUTHORIZED)
    (var-set cooldown-blocks new-cooldown)
    (ok new-cooldown)
  )
)

;; -----------------------------------------------
;; READ-ONLY FUNCTIONS
;; -----------------------------------------------

;; Contract's current STX balance
(define-read-only (get-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)

;; Block height when a specific user last claimed
(define-read-only (get-last-claim (user principal))
  (ok (default-to u0 (map-get? last-claim-height user)))
)

;; Current claim amount in uSTX
(define-read-only (get-claim-amount)
  (ok (var-get claim-amount))
)

;; Current cooldown in blocks
(define-read-only (get-cooldown)
  (ok (var-get cooldown-blocks))
)

;; Total STX paid out to all users
(define-read-only (get-total-paid-out)
  (ok (var-get total-paid-out))
)
