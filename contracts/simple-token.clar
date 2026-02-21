;; Simple Token Contract
;; Basic fungible token

(define-fungible-token simple-token)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (ft-mint? simple-token amount recipient)
  )
)

(define-public (transfer (amount uint) (to principal))
  (ft-transfer? simple-token amount tx-sender to)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance simple-token account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply simple-token))
)
