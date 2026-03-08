;; Price Oracle Contract - StacksRank
;; Decentralized TWAP (Time-Weighted Average Price) oracle.
;; Multiple trusted reporters submit prices; TWAP is computed over a window.
;; Includes staleness checks, outlier rejection, and circuit breakers.

;; ───────────────────────────────────────────────────────────
;; CONSTANTS
;; ───────────────────────────────────────────────────────────
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED    (err u700))
(define-constant ERR-STALE-PRICE       (err u701))
(define-constant ERR-INVALID-PRICE     (err u702))
(define-constant ERR-NOT-REPORTER      (err u703))
(define-constant ERR-CIRCUIT-BREAKER   (err u704))
(define-constant ERR-FEED-NOT-FOUND    (err u705))
(define-constant ERR-TOO-MANY-REPORTERS (err u706))

;; Max price deviation before circuit breaker trips: 20% = 2000 bps
(define-constant MAX-DEVIATION-BPS u2000)

;; Staleness threshold: 12 blocks (~2 hours)
(define-constant STALENESS-THRESHOLD u12)

;; TWAP window: last 10 price observations
(define-constant TWAP-OBSERVATIONS u10)

;; Max reporters per feed
(define-constant MAX-REPORTERS u5)

;; ───────────────────────────────────────────────────────────
;; DATA
;; ───────────────────────────────────────────────────────────

;; Authorized price reporters
(define-map reporters principal { active: bool, feed-count: uint })

;; Price feeds: feed-id -> feed config
(define-map feeds (string-ascii 20) {
  name: (string-ascii 20),
  decimals: uint,
  circuit-breaker-active: bool,
  last-valid-price: uint,
  last-update-block: uint,
  observation-count: uint
})

;; Latest price from each reporter per feed
(define-map reporter-prices
  { feed: (string-ascii 20), reporter: principal }
  { price: uint, block-height: uint }
)

;; Circular buffer of TWAP observations: {feed, index} -> {price, block}
(define-map price-observations
  { feed: (string-ascii 20), index: uint }
  { price: uint, block-height: uint, reporter: principal }
)

(define-data-var reporter-count uint u0)

;; ───────────────────────────────────────────────────────────
;; READ-ONLY
;; ───────────────────────────────────────────────────────────

(define-read-only (get-feed (feed-id (string-ascii 20)))
  (map-get? feeds feed-id)
)

(define-read-only (get-reporter-price (feed-id (string-ascii 20)) (reporter principal))
  (map-get? reporter-prices { feed: feed-id, reporter: reporter })
)

;; Get the latest validated price with staleness check
(define-read-only (get-latest-price (feed-id (string-ascii 20)))
  (match (map-get? feeds feed-id)
    feed
    (let (
      (last-block (get last-update-block feed))
      (blocks-since (- stacks-block-height last-block))
      (price (get last-valid-price feed))
    )
      (if (> blocks-since STALENESS-THRESHOLD)
        (err ERR-STALE-PRICE)
        (if (get circuit-breaker-active feed)
          (err ERR-CIRCUIT-BREAKER)
          (ok { price: price, block: last-block, staleness: blocks-since })
        )
      )
    )
    (err ERR-FEED-NOT-FOUND)
  )
)

;; Compute simple TWAP from stored observations
(define-read-only (get-twap (feed-id (string-ascii 20)))
  (match (map-get? feeds feed-id)
    feed
    (let (
      (count (min (get observation-count feed) TWAP-OBSERVATIONS))
      (current-index (mod (get observation-count feed) TWAP-OBSERVATIONS))
    )
      ;; Sum up to 3 most-recent observations for on-chain efficiency
      (let (
        (obs-0 (default-to { price: u0, block-height: u0, reporter: CONTRACT-OWNER }
                  (map-get? price-observations { feed: feed-id, index: (mod current-index TWAP-OBSERVATIONS) })))
        (obs-1 (default-to { price: u0, block-height: u0, reporter: CONTRACT-OWNER }
                  (map-get? price-observations { feed: feed-id, index: (mod (+ current-index u1) TWAP-OBSERVATIONS) })))
        (obs-2 (default-to { price: u0, block-height: u0, reporter: CONTRACT-OWNER }
                  (map-get? price-observations { feed: feed-id, index: (mod (+ current-index u2) TWAP-OBSERVATIONS) })))
        (valid-count (if (> (get price obs-2) u0) u3 (if (> (get price obs-1) u0) u2 u1)))
        (sum (+ (get price obs-0) (get price obs-1) (get price obs-2)))
        (twap (/ sum valid-count))
      )
        (ok { twap: twap, samples: valid-count, latest: (get price obs-0) })
      )
    )
    (err ERR-FEED-NOT-FOUND)
  )
)

;; Check if a price is within acceptable deviation from current price
(define-read-only (is-within-bounds (feed-id (string-ascii 20)) (new-price uint))
  (match (map-get? feeds feed-id)
    feed
    (let (
      (current (get last-valid-price feed))
      (deviation (if (> new-price current)
                   (/ (* (- new-price current) u10000) current)
                   (/ (* (- current new-price) u10000) current)))
    )
      (ok (<= deviation MAX-DEVIATION-BPS))
    )
    ;; If no price set yet, any price is valid
    (ok true)
  )
)

(define-read-only (is-reporter (user principal))
  (match (map-get? reporters user)
    r (get active r)
    false
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: ADMIN - FEED MANAGEMENT
;; ───────────────────────────────────────────────────────────

;; Register a new price feed
(define-public (register-feed (feed-id (string-ascii 20)) (name (string-ascii 20)) (decimals uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set feeds feed-id {
      name: name,
      decimals: decimals,
      circuit-breaker-active: false,
      last-valid-price: u0,
      last-update-block: stacks-block-height,
      observation-count: u0
    })
    (ok true)
  )
)

;; Add a trusted reporter
(define-public (add-reporter (reporter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (< (var-get reporter-count) MAX-REPORTERS) ERR-TOO-MANY-REPORTERS)
    (map-set reporters reporter { active: true, feed-count: u0 })
    (var-set reporter-count (+ (var-get reporter-count) u1))
    (ok true)
  )
)

;; Remove a reporter
(define-public (remove-reporter (reporter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set reporters reporter { active: false, feed-count: u0 })
    (ok true)
  )
)

;; Manually trip/reset circuit breaker
(define-public (set-circuit-breaker (feed-id (string-ascii 20)) (active bool))
  (let ((feed (unwrap! (map-get? feeds feed-id) ERR-FEED-NOT-FOUND)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set feeds feed-id (merge feed { circuit-breaker-active: active }))
    (ok active)
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: PRICE REPORTING
;; ───────────────────────────────────────────────────────────

;; Submit a price update for a feed (reporters only)
(define-public (submit-price (feed-id (string-ascii 20)) (price uint))
  (let (
    (feed (unwrap! (map-get? feeds feed-id) ERR-FEED-NOT-FOUND))
    (in-bounds (unwrap! (is-within-bounds feed-id price) ERR-INVALID-PRICE))
    (obs-index (mod (get observation-count feed) TWAP-OBSERVATIONS))
    (new-count (+ (get observation-count feed) u1))
  )
    (asserts! (is-reporter tx-sender) ERR-NOT-REPORTER)
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (asserts! (not (get circuit-breaker-active feed)) ERR-CIRCUIT-BREAKER)
    (asserts! in-bounds ERR-CIRCUIT-BREAKER)

    ;; Store reporter's latest price
    (map-set reporter-prices { feed: feed-id, reporter: tx-sender }
      { price: price, block-height: stacks-block-height })

    ;; Write to circular observation buffer
    (map-set price-observations { feed: feed-id, index: obs-index }
      { price: price, block-height: stacks-block-height, reporter: tx-sender })

    ;; Update feed with new validated price
    (map-set feeds feed-id (merge feed {
      last-valid-price: price,
      last-update-block: stacks-block-height,
      observation-count: new-count
    }))

    (print { event: "price-submitted", feed: feed-id, reporter: tx-sender,
             price: price, block: stacks-block-height })
    (ok { price: price, observation-index: obs-index })
  )
)

;; ───────────────────────────────────────────────────────────
;; INIT
;; ───────────────────────────────────────────────────────────
(begin
  (var-set reporter-count u0)
  ;; Register default feeds
  (map-set feeds "STX-USD" {
    name: "STX-USD",
    decimals: u6,
    circuit-breaker-active: false,
    last-valid-price: u0,
    last-update-block: stacks-block-height,
    observation-count: u0
  })
  (map-set feeds "BTC-USD" {
    name: "BTC-USD",
    decimals: u6,
    circuit-breaker-active: false,
    last-valid-price: u0,
    last-update-block: stacks-block-height,
    observation-count: u0
  })
)
