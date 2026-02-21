;; Bookmark Contract
;; Save favorite links on-chain

(define-map bookmarks { owner: principal, id: uint } { url: (string-ascii 200), title: (string-ascii 80) })
(define-map bookmark-count principal uint)

(define-public (add-bookmark (url (string-ascii 200)) (title (string-ascii 80)))
  (let ((count (default-to u0 (map-get? bookmark-count tx-sender)))
        (new-id (+ count u1)))
    (map-set bookmarks { owner: tx-sender, id: new-id } { url: url, title: title })
    (map-set bookmark-count tx-sender new-id)
    (ok new-id)
  )
)

(define-read-only (get-bookmark (user principal) (id uint))
  (ok (map-get? bookmarks { owner: user, id: id }))
)

(define-read-only (get-bookmark-count (user principal))
  (ok (default-to u0 (map-get? bookmark-count user)))
)
