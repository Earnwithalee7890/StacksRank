;; Simple Storage Contract
;; Store and retrieve a value per user

(define-map user-storage principal (string-ascii 200))

(define-public (store-value (value (string-ascii 200)))
  (begin
    (map-set user-storage tx-sender value)
    (ok true)
  )
)

(define-read-only (get-value (user principal))
  (ok (map-get? user-storage user))
)

(define-public (delete-value)
  (begin
    (map-delete user-storage tx-sender)
    (ok true)
  )
)
