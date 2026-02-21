;; Whitelist Contract
;; Simple address whitelist managed by owner

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-ALREADY-LISTED (err u101))

(define-map whitelist principal bool)
(define-data-var list-size uint u0)

(define-public (add-address (addr principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (asserts! (is-none (map-get? whitelist addr)) ERR-ALREADY-LISTED)
    (map-set whitelist addr true)
    (var-set list-size (+ (var-get list-size) u1))
    (ok true)
  )
)

(define-public (remove-address (addr principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (map-delete whitelist addr)
    (var-set list-size (- (var-get list-size) u1))
    (ok true)
  )
)

(define-read-only (is-whitelisted (addr principal))
  (ok (default-to false (map-get? whitelist addr)))
)

(define-read-only (get-list-size)
  (ok (var-get list-size))
)
