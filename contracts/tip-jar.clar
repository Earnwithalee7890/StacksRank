;; Tip Jar Contract
;; Accept STX tips and let the owner withdraw

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))

(define-data-var total-tips uint u0)

(define-public (send-tip (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set total-tips (+ (var-get total-tips) amount))
    (ok amount)
  )
)

(define-public (withdraw)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (let ((balance (stx-get-balance (as-contract tx-sender))))
      (try! (as-contract (stx-transfer? balance tx-sender CONTRACT-OWNER)))
      (ok balance)
    )
  )
)

(define-read-only (get-total-tips)
  (ok (var-get total-tips))
)

(define-read-only (get-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)
