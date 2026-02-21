;; Piggy Bank Contract
;; Save STX and only the owner can break the bank

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))

(define-data-var total-saved uint u0)

(define-public (deposit (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set total-saved (+ (var-get total-saved) amount))
    (ok amount)
  )
)

(define-public (break-bank)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (let ((balance (stx-get-balance (as-contract tx-sender))))
      (try! (as-contract (stx-transfer? balance tx-sender CONTRACT-OWNER)))
      (var-set total-saved u0)
      (ok balance)
    )
  )
)

(define-read-only (get-savings)
  (ok (var-get total-saved))
)
