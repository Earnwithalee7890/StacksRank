;; Announcement Board Contract
;; Post public announcements, only owner can post

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))

(define-map announcements uint { text: (string-ascii 200), posted-at: uint })
(define-data-var post-count uint u0)

(define-public (post (text (string-ascii 200)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (let ((id (+ (var-get post-count) u1)))
      (map-set announcements id { text: text, posted-at: stacks-block-height })
      (var-set post-count id)
      (ok id)
    )
  )
)

(define-read-only (get-announcement (id uint))
  (ok (map-get? announcements id))
)

(define-read-only (get-latest-id)
  (ok (var-get post-count))
)
