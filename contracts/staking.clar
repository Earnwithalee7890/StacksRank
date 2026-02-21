;; Staking Rewards Contract
;; Stake STX and earn simple rewards

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-NO-STAKE (err u101))

(define-map stakes principal { amount: uint, staked-at: uint })

(define-public (stake (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set stakes tx-sender { amount: amount, staked-at: stacks-block-height })
    (ok true)
  )
)

(define-public (unstake)
  (let ((info (unwrap! (map-get? stakes tx-sender) ERR-NO-STAKE)))
    (try! (as-contract (stx-transfer? (get amount info) tx-sender tx-sender)))
    (map-delete stakes tx-sender)
    (ok (get amount info))
  )
)

(define-read-only (get-stake (user principal))
  (ok (map-get? stakes user))
)

(define-read-only (get-blocks-staked (user principal))
  (match (map-get? stakes user)
    info (ok (- stacks-block-height (get staked-at info)))
    (ok u0)
  )
)
