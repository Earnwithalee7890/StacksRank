;; Timelock Contract
;; Lock STX for a set number of blocks

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-TOO-EARLY (err u101))

(define-data-var lock-until uint u0)
(define-data-var locked-amount uint u0)

(define-public (lock (amount uint) (blocks uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set lock-until (+ stacks-block-height blocks))
    (var-set locked-amount (+ (var-get locked-amount) amount))
    (ok true)
  )
)

(define-public (unlock)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (asserts! (>= stacks-block-height (var-get lock-until)) ERR-TOO-EARLY)
    (let ((amount (var-get locked-amount)))
      (try! (as-contract (stx-transfer? amount tx-sender CONTRACT-OWNER)))
      (var-set locked-amount u0)
      (ok amount)
    )
  )
)

(define-read-only (get-lock-info)
  (ok { amount: (var-get locked-amount), unlocks-at: (var-get lock-until) })
)
