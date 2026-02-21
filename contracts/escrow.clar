;; Escrow Contract
;; Simple two-party escrow

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-RESOLVED (err u101))

(define-data-var buyer principal tx-sender)
(define-data-var seller principal tx-sender)
(define-data-var amount uint u0)
(define-data-var resolved bool false)

(define-public (create-escrow (escrow-seller principal) (escrow-amount uint))
  (begin
    (var-set buyer tx-sender)
    (var-set seller escrow-seller)
    (var-set amount escrow-amount)
    (try! (stx-transfer? escrow-amount tx-sender (as-contract tx-sender)))
    (ok true)
  )
)

(define-public (release)
  (begin
    (asserts! (is-eq tx-sender (var-get buyer)) ERR-NOT-AUTHORIZED)
    (asserts! (not (var-get resolved)) ERR-ALREADY-RESOLVED)
    (var-set resolved true)
    (as-contract (stx-transfer? (var-get amount) tx-sender (var-get seller)))
  )
)

(define-public (refund)
  (begin
    (asserts! (is-eq tx-sender (var-get seller)) ERR-NOT-AUTHORIZED)
    (asserts! (not (var-get resolved)) ERR-ALREADY-RESOLVED)
    (var-set resolved true)
    (as-contract (stx-transfer? (var-get amount) tx-sender (var-get buyer)))
  )
)

(define-read-only (get-escrow-info)
  (ok { buyer: (var-get buyer), seller: (var-get seller), amount: (var-get amount), resolved: (var-get resolved) })
)
