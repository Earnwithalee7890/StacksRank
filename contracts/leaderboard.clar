;; Leaderboard Contract
;; Track scores on a leaderboard

(define-map scores principal uint)
(define-data-var top-scorer principal tx-sender)
(define-data-var top-score uint u0)

(define-public (submit-score (score uint))
  (begin
    (map-set scores tx-sender score)
    (if (> score (var-get top-score))
      (begin
        (var-set top-scorer tx-sender)
        (var-set top-score score)
        (ok true)
      )
      (ok true)
    )
  )
)

(define-read-only (get-score (player principal))
  (ok (default-to u0 (map-get? scores player)))
)

(define-read-only (get-leader)
  (ok { player: (var-get top-scorer), score: (var-get top-score) })
)
