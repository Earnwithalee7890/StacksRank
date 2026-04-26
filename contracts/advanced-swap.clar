;; SPDX-License-Identifier: MIT
;; Advanced AMM Swap Contract - StacksRank v2
;; Automated Market Maker with slippage protection, price impact calculation,
;; multi-route support, and liquidity provider fee sharing.

;; ───────────────────────────────────────────────────────────
;; CONSTANTS
;; ───────────────────────────────────────────────────────────
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED       (err u300))
(define-constant ERR-INVALID-AMOUNT       (err u301))
(define-constant ERR-INSUFFICIENT-LIQUIDITY (err u302))
(define-constant ERR-SLIPPAGE-EXCEEDED    (err u303))
(define-constant ERR-POOL-NOT-FOUND       (err u304))
(define-constant ERR-PRICE-IMPACT-TOO-HIGH (err u305))
(define-constant ERR-ZERO-AMOUNT          (err u306))
(define-constant ERR-DEADLINE-PASSED      (err u307))

;; Fee: 0.3% = 30 / 10000
(define-constant FEE-NUMERATOR   u30)
(define-constant FEE-DENOMINATOR u10000)

;; Max price impact: 5% = 500 / 10000
(define-constant MAX-PRICE-IMPACT u500)

;; Protocol fee: 0.05% goes to treasury
(define-constant PROTOCOL-FEE-NUMERATOR u5)

;; ───────────────────────────────────────────────────────────
;; DATA
;; ───────────────────────────────────────────────────────────

;; LP pools: pool-id -> pool state
(define-map pools uint {
  token-a-reserve: uint,
  token-b-reserve: uint,
  total-lp-tokens: uint,
  fee-accumulator-a: uint,
  fee-accumulator-b: uint,
  active: bool
})

;; LP positions: {pool-id, provider} -> lp-token amount
(define-map lp-positions { pool-id: uint, provider: principal } { lp-tokens: uint })

;; Swap history for analytics
(define-map swap-history uint {
  swapper: principal,
  pool-id: uint,
  amount-in: uint,
  amount-out: uint,
  block-height: uint
})

(define-data-var pool-counter uint u0)
(define-data-var swap-counter uint u0)
(define-data-var total-volume uint u0)
(define-data-var total-fees-collected uint u0)
(define-data-var treasury-balance uint u0)

;; ───────────────────────────────────────────────────────────
;; READ-ONLY: AMM MATH
;; ───────────────────────────────────────────────────────────

;; Classic x*y=k constant product formula
;; Given amount-in and reserves, returns amount-out after fee
(define-read-only (get-amount-out (amount-in uint) (reserve-in uint) (reserve-out uint))
  (let (
    (amount-in-with-fee (* amount-in (- FEE-DENOMINATOR FEE-NUMERATOR)))
    (numerator (* amount-in-with-fee reserve-out))
    (denominator (+ (* reserve-in FEE-DENOMINATOR) amount-in-with-fee))
  )
    (if (or (is-eq reserve-in u0) (is-eq reserve-out u0))
      (err ERR-INSUFFICIENT-LIQUIDITY)
      (ok (/ numerator denominator))
    )
  )
)

;; Calculate price impact in basis points (out of 10000)
(define-read-only (get-price-impact (amount-in uint) (reserve-in uint))
  (if (is-eq reserve-in u0)
    (err ERR-POOL-NOT-FOUND)
    (ok (/ (* amount-in FEE-DENOMINATOR) (+ reserve-in amount-in)))
  )
)

;; Get pool spot price (token-b per token-a), scaled by 1e6
(define-read-only (get-spot-price (pool-id uint))
  (match (map-get? pools pool-id)
    pool
    (let (
      (res-a (get token-a-reserve pool))
      (res-b (get token-b-reserve pool))
    )
      (if (is-eq res-a u0)
        (err ERR-INSUFFICIENT-LIQUIDITY)
        (ok (/ (* res-b u1000000) res-a))
      )
    )
    (err ERR-POOL-NOT-FOUND)
  )
)

;; Get full pool state
(define-read-only (get-pool (pool-id uint))
  (map-get? pools pool-id)
)

;; Get LP position for a provider
(define-read-only (get-lp-position (pool-id uint) (provider principal))
  (default-to { lp-tokens: u0 }
    (map-get? lp-positions { pool-id: pool-id, provider: provider }))
)

;; Quote for multi-hop swaps (Preview technical depth)
(define-read-only (get-multi-hop-quote (amount-in uint) (pool-ids (list 5 uint)))
  (fold calculate-next-hop pool-ids (ok amount-in))
)

(define-private (calculate-next-hop (pool-id uint) (current-amount-res (response uint uint)))
  (match current-amount-res
    amount-in
    (match (map-get? pools pool-id)
      pool (get-amount-out amount-in (get token-a-reserve pool) (get token-b-reserve pool))
      (err ERR-POOL-NOT-FOUND)
    )
    err-val current-amount-res
  )
)

;; Get aggregate stats
(define-read-only (get-stats)
  (ok {
    total-pools: (var-get pool-counter),
    total-swaps: (var-get swap-counter),
    total-volume: (var-get total-volume),
    total-fees: (var-get total-fees-collected),
    treasury: (var-get treasury-balance),
    protocol-version: "2.1.0-alpha"
  })
)


;; ───────────────────────────────────────────────────────────
;; PUBLIC: LIQUIDITY
;; ───────────────────────────────────────────────────────────

;; @desc Create a new AMM pool (owner only seeding)
;; @param initial-a: Initial amount of token A
;; @param initial-b: Initial amount of token B
;; @returns (response {pool-id: uint, lp-tokens-minted: uint} uint)
(define-public (create-pool (initial-a uint) (initial-b uint))
  (let (
    (pool-id (+ (var-get pool-counter) u1))
    ;; Geometric mean of initial liquidity
    (initial-lp (sqrti (* initial-a initial-b)))
  )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> initial-a u0) ERR-ZERO-AMOUNT)
    (asserts! (> initial-b u0) ERR-ZERO-AMOUNT)

    (map-set pools pool-id {
      token-a-reserve: initial-a,
      token-b-reserve: initial-b,
      total-lp-tokens: initial-lp,
      fee-accumulator-a: u0,
      fee-accumulator-b: u0,
      active: true
    })
    (map-set lp-positions { pool-id: pool-id, provider: tx-sender }
      { lp-tokens: initial-lp })

    (var-set pool-counter pool-id)
    (ok { pool-id: pool-id, lp-tokens-minted: initial-lp })
  )
)

;; @desc Add liquidity proportionally and mint LP tokens
;; @param pool-id: The unique identifier for the pool
;; @param amount-a: The amount of token A to add
;; @param amount-b-max: Maximum amount of token B allowed (slippage protection)
(define-public (add-liquidity (pool-id uint) (amount-a uint) (amount-b-max uint))
  (let (
    (pool (unwrap! (map-get? pools pool-id) ERR-POOL-NOT-FOUND))
    (res-a (get token-a-reserve pool))
    (res-b (get token-b-reserve pool))
    (total-lp (get total-lp-tokens pool))
    ;; Proportional amount-b required to maintain k
    (required-b (/ (* amount-a res-b) res-a))
    ;; LP tokens to mint proportional to share of reserve-a
    (lp-mint (/ (* amount-a total-lp) res-a))
    (current-lp (get lp-tokens (get-lp-position pool-id tx-sender)))
  )
    (asserts! (get active pool) ERR-NOT-AUTHORIZED)
    (asserts! (> amount-a u0) ERR-ZERO-AMOUNT)
    (asserts! (<= required-b amount-b-max) ERR-SLIPPAGE-EXCEEDED)

    ;; Update pool reserves
    (map-set pools pool-id (merge pool {
      token-a-reserve: (+ res-a amount-a),
      token-b-reserve: (+ res-b required-b),
      total-lp-tokens: (+ total-lp lp-mint)
    }))

    ;; Update LP position
    (map-set lp-positions { pool-id: pool-id, provider: tx-sender }
      { lp-tokens: (+ current-lp lp-mint) })

    (ok { lp-minted: lp-mint, amount-b-used: required-b })
  )
)

;; @desc Remove liquidity and burn LP tokens
;; @param pool-id: The pool to remove liquidity from
;; @param lp-amount: Number of LP tokens to burn
(define-public (remove-liquidity (pool-id uint) (lp-amount uint))
  (let (
    (pool (unwrap! (map-get? pools pool-id) ERR-POOL-NOT-FOUND))
    (position (get-lp-position pool-id tx-sender))
    (user-lp (get lp-tokens position))
    (total-lp (get total-lp-tokens pool))
    (res-a (get token-a-reserve pool))
    (res-b (get token-b-reserve pool))
    ;; Pro-rata token amounts based on share of total-lp
    (amount-a (/ (* lp-amount res-a) total-lp))
    (amount-b (/ (* lp-amount res-b) total-lp))
  )
    (asserts! (>= user-lp lp-amount) ERR-INSUFFICIENT-LIQUIDITY)
    (asserts! (> lp-amount u0) ERR-ZERO-AMOUNT)

    ;; Burn LP tokens
    (map-set lp-positions { pool-id: pool-id, provider: tx-sender }
      { lp-tokens: (- user-lp lp-amount) })

    ;; Reduce pool reserves
    (map-set pools pool-id (merge pool {
      token-a-reserve: (- res-a amount-a),
      token-b-reserve: (- res-b amount-b),
      total-lp-tokens: (- total-lp lp-amount)
    }))

    (ok { amount-a-out: amount-a, amount-b-out: amount-b })
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: SWAP
;; ───────────────────────────────────────────────────────────

;; Swap token-A for token-B with slippage and deadline protection
(define-public (swap-a-for-b
    (pool-id uint)
    (amount-in uint)
    (min-amount-out uint)
    (deadline uint))
  (let (
    (pool (unwrap! (map-get? pools pool-id) ERR-POOL-NOT-FOUND))
    (res-a (get token-a-reserve pool))
    (res-b (get token-b-reserve pool))
    (amount-out (unwrap! (get-amount-out amount-in res-a res-b) ERR-INSUFFICIENT-LIQUIDITY))
    (impact (unwrap! (get-price-impact amount-in res-a) ERR-POOL-NOT-FOUND))
    ;; Protocol fee carved from amount-out
    (protocol-fee (/ (* amount-out PROTOCOL-FEE-NUMERATOR) FEE-DENOMINATOR))
    (amount-out-net (- amount-out protocol-fee))
    (swap-id (+ (var-get swap-counter) u1))
  )
    (asserts! (get active pool) ERR-NOT-AUTHORIZED)
    (asserts! (> amount-in u0) ERR-ZERO-AMOUNT)
    (asserts! (<= stacks-block-height deadline) ERR-DEADLINE-PASSED)
    (asserts! (>= amount-out-net min-amount-out) ERR-SLIPPAGE-EXCEEDED)
    (asserts! (<= impact MAX-PRICE-IMPACT) ERR-PRICE-IMPACT-TOO-HIGH)

    ;; Update reserves (x*y=k)
    (map-set pools pool-id (merge pool {
      token-a-reserve: (+ res-a amount-in),
      token-b-reserve: (- res-b amount-out),
      fee-accumulator-b: (+ (get fee-accumulator-b pool) protocol-fee)
    }))

    ;; Record swap
    (map-set swap-history swap-id {
      swapper: tx-sender,
      pool-id: pool-id,
      amount-in: amount-in,
      amount-out: amount-out-net,
      block-height: stacks-block-height
    })

    ;; Update global stats
    (var-set swap-counter swap-id)
    (var-set total-volume (+ (var-get total-volume) amount-in))
    (var-set total-fees-collected (+ (var-get total-fees-collected) protocol-fee))
    (var-set treasury-balance (+ (var-get treasury-balance) protocol-fee))

    (print { event: "swap-a-for-b", swapper: tx-sender, amount-in: amount-in,
             amount-out: amount-out-net, price-impact: impact, pool-id: pool-id })

    (ok { amount-out: amount-out-net, price-impact: impact, swap-id: swap-id })
  )
)

;; Swap token-B for token-A with slippage and deadline protection
(define-public (swap-b-for-a
    (pool-id uint)
    (amount-in uint)
    (min-amount-out uint)
    (deadline uint))
  (let (
    (pool (unwrap! (map-get? pools pool-id) ERR-POOL-NOT-FOUND))
    (res-a (get token-a-reserve pool))
    (res-b (get token-b-reserve pool))
    (amount-out (unwrap! (get-amount-out amount-in res-b res-a) ERR-INSUFFICIENT-LIQUIDITY))
    (impact (unwrap! (get-price-impact amount-in res-b) ERR-POOL-NOT-FOUND))
    (protocol-fee (/ (* amount-out PROTOCOL-FEE-NUMERATOR) FEE-DENOMINATOR))
    (amount-out-net (- amount-out protocol-fee))
    (swap-id (+ (var-get swap-counter) u1))
  )
    (asserts! (get active pool) ERR-NOT-AUTHORIZED)
    (asserts! (> amount-in u0) ERR-ZERO-AMOUNT)
    (asserts! (<= stacks-block-height deadline) ERR-DEADLINE-PASSED)
    (asserts! (>= amount-out-net min-amount-out) ERR-SLIPPAGE-EXCEEDED)
    (asserts! (<= impact MAX-PRICE-IMPACT) ERR-PRICE-IMPACT-TOO-HIGH)

    ;; Update reserves
    (map-set pools pool-id (merge pool {
      token-b-reserve: (+ res-b amount-in),
      token-a-reserve: (- res-a amount-out),
      fee-accumulator-a: (+ (get fee-accumulator-a pool) protocol-fee)
    }))

    ;; Record swap
    (map-set swap-history swap-id {
      swapper: tx-sender,
      pool-id: pool-id,
      amount-in: amount-in,
      amount-out: amount-out-net,
      block-height: stacks-block-height
    })

    (var-set swap-counter swap-id)
    (var-set total-volume (+ (var-get total-volume) amount-in))
    (var-set total-fees-collected (+ (var-get total-fees-collected) protocol-fee))
    (var-set treasury-balance (+ (var-get treasury-balance) protocol-fee))

    (print { event: "swap-b-for-a", swapper: tx-sender, amount-in: amount-in,
             amount-out: amount-out-net, price-impact: impact, pool-id: pool-id })

    (ok { amount-out: amount-out-net, price-impact: impact, swap-id: swap-id })
  )
)

;; ───────────────────────────────────────────────────────────
;; ADMIN
;; ───────────────────────────────────────────────────────────

;; Pause a pool (emergency)
(define-public (pause-pool (pool-id uint))
  (let ((pool (unwrap! (map-get? pools pool-id) ERR-POOL-NOT-FOUND)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set pools pool-id (merge pool { active: false }))
    (ok true)
  )
)

;; Collect treasury fees (owner only)
(define-public (collect-treasury-fees (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= amount (var-get treasury-balance)) ERR-INSUFFICIENT-LIQUIDITY)
    (try! (as-contract (stx-transfer? amount tx-sender CONTRACT-OWNER)))
    (var-set treasury-balance (- (var-get treasury-balance) amount))
    (ok amount)
  )
)

;; ───────────────────────────────────────────────────────────
;; INIT
;; ───────────────────────────────────────────────────────────
(begin
  (var-set pool-counter u0)
  (var-set swap-counter u0)
  (var-set total-volume u0)
  (var-set total-fees-collected u0)
  (var-set treasury-balance u0)
)
