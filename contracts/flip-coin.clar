;; Flip Coin Contract
;; Simple coin flip game using block height

(define-constant ERR-TRANSFER-FAILED (err u100))

(define-data-var wins uint u0)
(define-data-var losses uint u0)

(define-read-only (flip)
  (ok (is-eq (mod stacks-block-height u2) u0))
)

(define-public (play (guess bool))
  (let ((result (is-eq (mod stacks-block-height u2) u0)))
    (if (is-eq guess result)
      (begin
        (var-set wins (+ (var-get wins) u1))
        (ok true)
      )
      (begin
        (var-set losses (+ (var-get losses) u1))
        (ok false)
      )
    )
  )
)

(define-read-only (get-stats)
  (ok { wins: (var-get wins), losses: (var-get losses) })
)
