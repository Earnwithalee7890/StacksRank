;; Lottery Contract
;; Simple lottery where users enter and owner picks winner

(define-constant CONTRACT-OWNER tx-sender)
(define-constant TICKET-PRICE u1000000) ;; 1 STX
(define-constant ERR-NOT-OWNER (err u100))

(define-data-var participant-count uint u0)
(define-map participants uint principal)

(define-public (enter)
  (let ((id (var-get participant-count)))
    (try! (stx-transfer? TICKET-PRICE tx-sender (as-contract tx-sender)))
    (map-set participants id tx-sender)
    (var-set participant-count (+ id u1))
    (ok id)
  )
)

(define-public (pick-winner (winner-id uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (let ((winner (unwrap! (map-get? participants winner-id) (err u404)))
          (prize (stx-get-balance (as-contract tx-sender))))
      (try! (as-contract (stx-transfer? prize tx-sender winner)))
      (var-set participant-count u0)
      (ok winner)
    )
  )
)

(define-read-only (get-pot)
  (ok (stx-get-balance (as-contract tx-sender)))
)

(define-read-only (get-participant-count)
  (ok (var-get participant-count))
)
