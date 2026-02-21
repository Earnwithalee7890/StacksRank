;; Simple Membership Contract
;; Users can join as members

(define-map members principal { joined-at: uint, active: bool })
(define-data-var member-count uint u0)

(define-constant ERR-ALREADY-MEMBER (err u101))
(define-constant ERR-NOT-MEMBER (err u102))

(define-public (join)
  (begin
    (asserts! (is-none (map-get? members tx-sender)) ERR-ALREADY-MEMBER)
    (map-set members tx-sender { joined-at: stacks-block-height, active: true })
    (var-set member-count (+ (var-get member-count) u1))
    (ok true)
  )
)

(define-public (leave)
  (begin
    (asserts! (is-some (map-get? members tx-sender)) ERR-NOT-MEMBER)
    (map-set members tx-sender { joined-at: stacks-block-height, active: false })
    (var-set member-count (- (var-get member-count) u1))
    (ok true)
  )
)

(define-read-only (is-member (user principal))
  (match (map-get? members user)
    member (ok (get active member))
    (ok false)
  )
)

(define-read-only (get-member-count)
  (ok (var-get member-count))
)
