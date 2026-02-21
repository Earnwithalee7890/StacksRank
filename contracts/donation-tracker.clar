;; Donation Tracker Contract
;; Track donations from users

(define-map donations principal uint)
(define-data-var total-donated uint u0)
(define-data-var donor-count uint u0)

(define-public (donate (amount uint))
  (let ((prev (default-to u0 (map-get? donations tx-sender))))
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (if (is-eq prev u0)
      (var-set donor-count (+ (var-get donor-count) u1))
      true
    )
    (map-set donations tx-sender (+ prev amount))
    (var-set total-donated (+ (var-get total-donated) amount))
    (ok amount)
  )
)

(define-read-only (get-donation (donor principal))
  (ok (default-to u0 (map-get? donations donor)))
)

(define-read-only (get-total-donated)
  (ok (var-get total-donated))
)

(define-read-only (get-donor-count)
  (ok (var-get donor-count))
)
