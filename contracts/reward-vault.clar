;; Reward Vault Contract
;; Collects 0.02 STX and manages a secure fund

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-PAUSED (err u503))

;; Variables
(define-data-var vault-owner principal tx-sender)
(define-data-var fee-per-action uint u20000)
(define-data-var is-vault-active bool true)
(define-data-var total-fees-collected uint u0)

;; Public Functions

;; 1. Collect Fee
(define-public (collect-fee)
  (begin
    (asserts! (var-get is-vault-active) ERR-PAUSED)
    (try! (stx-transfer? (var-get fee-per-action) tx-sender (as-contract tx-sender)))
    (var-set total-fees-collected (+ (var-get total-fees-collected) (var-get fee-per-action)))
    (ok (var-get fee-per-action))
  )
)

;; 2. Withdraw Fees (Owner only)
(define-public (withdraw-fees)
  (let ((current-balance (stx-get-balance (as-contract tx-sender))))
    (asserts! (is-eq tx-sender (var-get vault-owner)) ERR-UNAUTHORIZED)
    (try! (as-contract (stx-transfer? current-balance tx-sender (var-get vault-owner))))
    (ok current-balance)
  )
)

;; 3. Update Fee Amount (Owner only)
(define-public (set-vault-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender (var-get vault-owner)) ERR-UNAUTHORIZED)
    (var-set fee-per-action new-fee)
    (ok new-fee)
  )
)

;; 4. Update Owner (Owner only)
(define-public (set-vault-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get vault-owner)) ERR-UNAUTHORIZED)
    (var-set vault-owner new-owner)
    (ok new-owner)
  )
)

;; 5. Toggle Active Status (Owner only)
(define-public (toggle-vault (active bool))
  (begin
    (asserts! (is-eq tx-sender (var-get vault-owner)) ERR-UNAUTHORIZED)
    (var-set is-vault-active active)
    (ok active)
  )
)

;; Read-only Functions

;; 6. Get Vault Balance
(define-read-only (get-vault-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)

;; 7. Get Current Fee
(define-read-only (get-vault-fee)
  (ok (var-get fee-per-action))
)

;; 8. Get Total Collected
(define-read-only (get-total-collected)
  (ok (var-get total-fees-collected))
)

;; 9. Get Vault Info (Bonus function)
(define-read-only (get-vault-info)
  (ok {
    owner: (var-get vault-owner),
    active: (var-get is-vault-active),
    collected: (var-get total-fees-collected)
  })
)

(define-public (emergency-withdraw) (begin (asserts! (is-owner) (err u100)) (as-contract (stx-transfer? (stx-get-balance tx-sender) tx-sender tx-sender))))
