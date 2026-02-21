;; Rate Limiter Contract
;; Limit user actions to once per N blocks

(define-constant COOLDOWN u10) ;; blocks between actions
(define-constant ERR-COOLDOWN (err u100))

(define-map last-action principal uint)

(define-public (do-action)
  (let ((last (default-to u0 (map-get? last-action tx-sender))))
    (asserts! (>= stacks-block-height (+ last COOLDOWN)) ERR-COOLDOWN)
    (map-set last-action tx-sender stacks-block-height)
    (ok stacks-block-height)
  )
)

(define-read-only (can-act (user principal))
  (let ((last (default-to u0 (map-get? last-action user))))
    (ok (>= stacks-block-height (+ last COOLDOWN)))
  )
)

(define-read-only (blocks-until-ready (user principal))
  (let ((last (default-to u0 (map-get? last-action user)))
        (ready-at (+ last COOLDOWN)))
    (if (>= stacks-block-height ready-at)
      (ok u0)
      (ok (- ready-at stacks-block-height))
    )
  )
)
