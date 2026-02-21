;; Subscription Contract
;; Pay to subscribe for N blocks

(define-constant SUB-PRICE u500000) ;; 0.5 STX
(define-constant SUB-DURATION u144) ;; ~1 day in blocks

(define-map subscriptions principal uint) ;; expires-at block

(define-public (subscribe)
  (begin
    (try! (stx-transfer? SUB-PRICE tx-sender (as-contract tx-sender)))
    (map-set subscriptions tx-sender (+ stacks-block-height SUB-DURATION))
    (ok true)
  )
)

(define-read-only (is-subscribed (user principal))
  (match (map-get? subscriptions user)
    expires-at (ok (< stacks-block-height expires-at))
    (ok false)
  )
)

(define-read-only (get-expiry (user principal))
  (ok (map-get? subscriptions user))
)
