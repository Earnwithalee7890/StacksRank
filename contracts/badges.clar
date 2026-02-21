;; Badge Contract
;; Award badges to users

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-ALREADY-HAS (err u101))

(define-map badges { user: principal, badge: (string-ascii 30) } bool)
(define-map badge-count principal uint)

(define-public (award-badge (user principal) (badge (string-ascii 30)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (asserts! (is-none (map-get? badges { user: user, badge: badge })) ERR-ALREADY-HAS)
    (map-set badges { user: user, badge: badge } true)
    (map-set badge-count user (+ (default-to u0 (map-get? badge-count user)) u1))
    (ok true)
  )
)

(define-read-only (has-badge (user principal) (badge (string-ascii 30)))
  (ok (default-to false (map-get? badges { user: user, badge: badge })))
)

(define-read-only (get-badge-count (user principal))
  (ok (default-to u0 (map-get? badge-count user)))
)
