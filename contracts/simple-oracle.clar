;; Simple Oracle Contract
;; Owner can set a price value, anyone can read it

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))

(define-data-var price uint u0)
(define-data-var last-updated uint u0)

(define-public (set-price (new-price uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (var-set price new-price)
    (var-set last-updated stacks-block-height)
    (ok true)
  )
)

(define-read-only (get-price)
  (ok { price: (var-get price), updated-at: (var-get last-updated) })
)
