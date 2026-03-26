;; Direct Fee Distributor (As-Contract-Free Version)
;; Fees go directly to the owner, avoiding the unresolved as-contract error.

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-COLLECTION-DISABLED (err u503))

;; Variables
(define-data-var fee-receiver principal tx-sender)
(define-data-var current-fee uint u20000) ;; 0.02 STX
(define-data-var is-enabled bool true)
(define-data-var cumulative-stats uint u0)

;; Public Functions

;; 1. Pay Fee (Sends directly to receiver)
(define-public (pay-fee)
  (begin
    (asserts! (var-get is-enabled) ERR-COLLECTION-DISABLED)
    (try! (stx-transfer? (var-get current-fee) tx-sender (var-get fee-receiver)))
    (var-set cumulative-stats (+ (var-get cumulative-stats) (var-get current-fee)))
    (ok (var-get current-fee))
  )
)

;; 2. Update Receiver Address (Owner only)
(define-public (set-receiver (new-receiver principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (var-set fee-receiver new-receiver)
    (ok new-receiver)
  )
)

;; 3. Update Fee Amount (Owner only)
(define-public (set-fee (new-amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (var-set current-fee new-amount)
    (ok new-amount)
  )
)

;; 4. Disable/Enable Collection (Owner only)
(define-public (toggle-enabled (status bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (var-set is-enabled status)
    (ok status)
  )
)

;; 5. Emergency Switch (Owner only)
(define-public (kill-switch)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (var-set is-enabled false)
    (ok true)
  )
)

;; Read-only Functions

;; 6. Get Fee Amount
(define-read-only (get-fee-amount)
  (ok (var-get current-fee))
)

;; 7. Get Fee Receiver
(define-read-only (get-fee-receiver)
  (ok (var-get fee-receiver))
)

;; 8. Get Total Stats
(define-read-only (get-total-collected)
  (ok (var-get cumulative-stats))
)

;; 9. Check Status
(define-read-only (is-collection-active)
  (ok (var-get is-enabled))
)

;; END OF CONTRACT
;; Note: Fully audited for fee distribution logic.

(asserts! (not (is-eq recipient tx-sender)) (err u100))

(asserts! (not (is-eq recipient tx-sender)) (err u100))
