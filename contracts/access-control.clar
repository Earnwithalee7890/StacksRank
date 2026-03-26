(impl-trait .guard-trait.guard-trait)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-OWNER (err u100))

(define-data-var paused bool false)
(define-map roles principal (string-ascii 20))

;; Guard Trait Implementation
(define-read-only (is-paused)
  (ok (var-get paused))
)

(define-public (set-paused (new-state bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (var-set paused new-state)
    (ok true)
  )
)

(define-read-only (is-authorized (user principal))
  (ok (or (is-eq user CONTRACT-OWNER) (is-some (map-get? roles user))))
)

;; Role Management
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

(define-data-var is-paused bool false)
(define-public (set-paused (status bool)) (begin (asserts! (is-owner) (err u403)) (ok (var-set is-paused status))))

(define-data-var is-paused bool false)
(define-public (set-paused (status bool)) (begin (asserts! (is-owner) (err u403)) (ok (var-set is-paused status))))
