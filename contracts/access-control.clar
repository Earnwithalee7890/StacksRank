;; Access Control Contract
;; Role-based access control

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))

(define-map roles principal (string-ascii 20))

(define-public (set-role (user principal) (role (string-ascii 20)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (map-set roles user role)
    (ok true)
  )
)

(define-public (remove-role (user principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (map-delete roles user)
    (ok true)
  )
)

(define-read-only (get-role (user principal))
  (ok (map-get? roles user))
)

(define-read-only (has-role (user principal) (role (string-ascii 20)))
  (match (map-get? roles user)
    user-role (ok (is-eq user-role role))
    (ok false)
  )
)
