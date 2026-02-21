;; Guestbook Contract
;; Sign the guestbook with a message

(define-map guestbook uint { signer: principal, message: (string-ascii 150) })
(define-data-var entry-count uint u0)

(define-public (sign (message (string-ascii 150)))
  (let ((id (+ (var-get entry-count) u1)))
    (map-set guestbook id { signer: tx-sender, message: message })
    (var-set entry-count id)
    (ok id)
  )
)

(define-read-only (get-entry (id uint))
  (ok (map-get? guestbook id))
)

(define-read-only (get-entry-count)
  (ok (var-get entry-count))
)
