;; Profile Contract
;; Users can set and read their profile

(define-map profiles principal { name: (string-ascii 50), bio: (string-ascii 200) })

(define-public (set-profile (name (string-ascii 50)) (bio (string-ascii 200)))
  (begin
    (map-set profiles tx-sender { name: name, bio: bio })
    (ok true)
  )
)

(define-read-only (get-profile (user principal))
  (ok (map-get? profiles user))
)

(define-public (delete-profile)
  (begin
    (map-delete profiles tx-sender)
    (ok true)
  )
)
