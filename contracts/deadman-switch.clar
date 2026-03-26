;; Deadman Switch Contract
;; Owner must check in periodically or funds become claimable

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-OWNER-ALIVE (err u101))
(define-constant TIMEOUT u1000) ;; blocks

(define-data-var beneficiary principal tx-sender)
(define-data-var last-checkin uint stacks-block-height)

(define-public (checkin)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (var-set last-checkin stacks-block-height)
    (ok true)
  )
)

(define-public (set-beneficiary (addr principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (var-set beneficiary addr)
    (ok true)
  )
)

(define-public (claim)
  (begin
    (asserts! (> stacks-block-height (+ (var-get last-checkin) TIMEOUT)) ERR-OWNER-ALIVE)
    (let ((balance (stx-get-balance (as-contract tx-sender))))
      (try! (as-contract (stx-transfer? balance tx-sender (var-get beneficiary))))
      (ok balance)
    )
  )
)

(define-read-only (get-status)
  (ok { last-checkin: (var-get last-checkin), beneficiary: (var-get beneficiary), timeout: TIMEOUT })
)

(define-data-var grace-period uint u1008)

(define-data-var grace-period uint u1008)
