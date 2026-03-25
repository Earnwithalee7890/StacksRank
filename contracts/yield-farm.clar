;; Yield Farming / Staking Rewards Contract - StacksRank
;; Users stake STX to earn proportional rewards over time.
;; Rewards are distributed per block based on stake weight.
;; Supports early withdrawal penalty and compounding.

;; ───────────────────────────────────────────────────────────
;; CONSTANTS
;; ───────────────────────────────────────────────────────────
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED     (err u600))
(define-constant ERR-INVALID-AMOUNT     (err u601))
(define-constant ERR-NO-STAKE           (err u602))
(define-constant ERR-LOCK-ACTIVE        (err u603))
(define-constant ERR-INSUFFICIENT-POOL  (err u604))
(define-constant ERR-ZERO-REWARDS       (err u605))

;; Reward rate: rewards per block (in uSTX) from reward pool
(define-data-var rewards-per-block uint u100) ;; 0.0001 STX per block per total staked

;; Early withdrawal penalty: 10% = 1000 / 10000
(define-constant EARLY-WITHDRAW-PENALTY u1000)
(define-constant BASIS-POINTS u10000)

;; Minimum lock period: 144 blocks (~24 hours)
(define-constant MIN-LOCK-BLOCKS u144)

;; ───────────────────────────────────────────────────────────
;; DATA
;; ───────────────────────────────────────────────────────────

;; Staker positions
(define-map stakes principal {
  amount: uint,                  ;; uSTX staked
  start-block: uint,             ;; when they staked
  lock-until-block: uint,        ;; lock expiry (0 = flexible)
  reward-debt: uint,             ;; already-paid rewards snapshot
  pending-rewards: uint          ;; accrued but unclaimed rewards
})

;; Global farming state
(define-data-var total-staked uint u0)
(define-data-var reward-pool-balance uint u0)
(define-data-var accumulated-reward-per-token uint u0)  ;; scaled by 1e12
(define-data-var last-reward-block uint u0)
(define-data-var total-stakers uint u0)
(define-data-var total-rewards-paid uint u0)

;; ───────────────────────────────────────────────────────────
;; READ-ONLY
;; ───────────────────────────────────────────────────────────

;; Calculate accumulated reward per token up to current block
(define-read-only (get-accumulated-reward-per-token)
  (let (
    (last-block (var-get last-reward-block))
    (total (var-get total-staked))
    (blocks-elapsed (- stacks-block-height last-block))
    (new-rewards (* blocks-elapsed (var-get rewards-per-block)))
    (reward-increment (if (> total u0) (/ (* new-rewards u1000000000000) total) u0))
  )
    (+ (var-get accumulated-reward-per-token) reward-increment)
  )
)

;; Calculate pending rewards for a user
(define-read-only (get-pending-rewards (user principal))
  (match (map-get? stakes user)
    stake
    (let (
      (acc-reward (get-accumulated-reward-per-token))
      (user-stake (get amount stake))
      (reward-debt (get reward-debt stake))
      (base-pending (get pending-rewards stake))
      (new-rewards (/ (* user-stake (- acc-reward reward-debt)) u1000000000000))
    )
      (ok (+ base-pending new-rewards))
    )
    (err ERR-NO-STAKE)
  )
)

;; Get stake info for a user
(define-read-only (get-stake-info (user principal))
  (map-get? stakes user)
)

;; Get global farming stats
(define-read-only (get-farm-stats)
  (ok {
    total-staked: (var-get total-staked),
    reward-pool: (var-get reward-pool-balance),
    rewards-per-block: (var-get rewards-per-block),
    total-stakers: (var-get total-stakers),
    total-rewards-paid: (var-get total-rewards-paid),
    current-block: stacks-block-height
  })
)

;; Check if user can withdraw without penalty
(define-read-only (can-withdraw-without-penalty (user principal))
  (match (map-get? stakes user)
    stake
    (ok (>= stacks-block-height (get lock-until-block stake)))
    (err ERR-NO-STAKE)
  )
)

;; ───────────────────────────────────────────────────────────
;; PRIVATE: UPDATE REWARD STATE
;; ───────────────────────────────────────────────────────────

(define-private (update-pool)
  (let (
    (total (var-get total-staked))
    (last-block (var-get last-reward-block))
  )
    (if (and (> total u0) (> stacks-block-height last-block))
      (let (
        (blocks-elapsed (- stacks-block-height last-block))
        (new-rewards (* blocks-elapsed (var-get rewards-per-block)))
        (reward-increment (/ (* new-rewards u1000000000000) total))
      )
        (var-set accumulated-reward-per-token
          (+ (var-get accumulated-reward-per-token) reward-increment))
        (var-set last-reward-block stacks-block-height)
      )
      (var-set last-reward-block stacks-block-height)
    )
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: OWNER - SEED REWARD POOL
;; ───────────────────────────────────────────────────────────

(define-public (deposit-rewards (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set reward-pool-balance (+ (var-get reward-pool-balance) amount))
    (ok amount)
  )
)

(define-public (set-rewards-per-block (new-rate uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (update-pool)
    (var-set rewards-per-block new-rate)
    (ok new-rate)
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: STAKING
;; ───────────────────────────────────────────────────────────

;; Stake STX with optional lock period (0 = flexible, min MIN-LOCK-BLOCKS)
(define-public (stake (amount uint) (lock-blocks uint))
  (let (
    (acc-reward (begin (update-pool) (var-get accumulated-reward-per-token)))
    (existing (map-get? stakes tx-sender))
    (lock-until (if (> lock-blocks u0)
                   (+ stacks-block-height (max lock-blocks MIN-LOCK-BLOCKS))
                   u0))
  )
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    ;; Transfer STX to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; If already staked, harvest pending rewards first
    (match existing
      existing-stake
      (let (
        (pending (/ (* (get amount existing-stake)
                       (- acc-reward (get reward-debt existing-stake)))
                    u1000000000000))
        (current-pending (get pending-rewards existing-stake))
      )
        ;; Update stake adding to existing
        (map-set stakes tx-sender {
          amount: (+ (get amount existing-stake) amount),
          start-block: (get start-block existing-stake),
          lock-until-block: (max lock-until (get lock-until-block existing-stake)),
          reward-debt: acc-reward,
          pending-rewards: (+ current-pending pending)
        })
      )
      ;; New staker
      (begin
        (map-set stakes tx-sender {
          amount: amount,
          start-block: stacks-block-height,
          lock-until-block: lock-until,
          reward-debt: acc-reward,
          pending-rewards: u0
        })
        (var-set total-stakers (+ (var-get total-stakers) u1))
      )
    )

    (var-set total-staked (+ (var-get total-staked) amount))
    (print { event: "staked", user: tx-sender, amount: amount, lock-until: lock-until })
    (ok { amount: amount, lock-until: lock-until })
  )
)

;; Claim pending rewards without unstaking
(define-public (claim-rewards)
  (let (
    (stake-info (unwrap! (map-get? stakes tx-sender) ERR-NO-STAKE))
    (acc-reward (begin (update-pool) (var-get accumulated-reward-per-token)))
    (new-rewards (/ (* (get amount stake-info)
                       (- acc-reward (get reward-debt stake-info)))
                    u1000000000000))
    (total-pending (+ (get pending-rewards stake-info) new-rewards))
    (claimer tx-sender)
  )
    (asserts! (> total-pending u0) ERR-ZERO-REWARDS)
    (asserts! (<= total-pending (var-get reward-pool-balance)) ERR-INSUFFICIENT-POOL)

    ;; Pay out rewards
    (try! (as-contract (stx-transfer? total-pending tx-sender claimer)))

    ;; Reset pending rewards
    (map-set stakes tx-sender (merge stake-info {
      reward-debt: acc-reward,
      pending-rewards: u0
    }))

    (var-set reward-pool-balance (- (var-get reward-pool-balance) total-pending))
    (var-set total-rewards-paid (+ (var-get total-rewards-paid) total-pending))

    (print { event: "rewards-claimed", user: claimer, amount: total-pending })
    (ok total-pending)
  )
)

;; Unstake with optional early withdrawal penalty
(define-public (unstake (amount uint))
  (let (
    (stake-info (unwrap! (map-get? stakes tx-sender) ERR-NO-STAKE))
    (staked-amount (get amount stake-info))
    (lock-until (get lock-until-block stake-info))
    (acc-reward (begin (update-pool) (var-get accumulated-reward-per-token)))
    (pending (/ (* staked-amount (- acc-reward (get reward-debt stake-info))) u1000000000000))
    (total-pending (+ (get pending-rewards stake-info) pending))
    (early-withdraw (and (> lock-until u0) (< stacks-block-height lock-until)))
    (penalty (if early-withdraw (/ (* amount EARLY-WITHDRAW-PENALTY) BASIS-POINTS) u0))
    (payout (- amount penalty))
    (user tx-sender)
  )
    (asserts! (>= staked-amount amount) ERR-INVALID-AMOUNT)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    ;; Pay out any pending rewards first
    (if (> total-pending u0)
      (begin
        (try! (as-contract (stx-transfer? total-pending tx-sender user)))
        (var-set reward-pool-balance (- (var-get reward-pool-balance) total-pending))
        (var-set total-rewards-paid (+ (var-get total-rewards-paid) total-pending))
      )
      true
    )

    ;; Return principal minus early withdrawal penalty
    (try! (as-contract (stx-transfer? payout tx-sender user)))

    ;; Update stake record
    (let ((remaining (- staked-amount amount)))
      (if (is-eq remaining u0)
        (begin
          (map-delete stakes user)
          (var-set total-stakers (- (var-get total-stakers) u1))
        )
        (map-set stakes user {
          amount: remaining,
          start-block: stacks-block-height,
          lock-until-block: lock-until,
          reward-debt: acc-reward,
          pending-rewards: u0
        })
      )
    )

    (var-set total-staked (- (var-get total-staked) amount))

    (print { event: "unstaked", user: user, amount: amount, penalty: penalty,
             payout: payout, rewards: total-pending })
    (ok { unstaked: amount, penalty: penalty, payout: payout, rewards: total-pending })
  )
)

;; ───────────────────────────────────────────────────────────
;; INIT
;; ───────────────────────────────────────────────────────────
(begin
  (var-set total-staked u0)
  (var-set reward-pool-balance u0)
  (var-set rewards-per-block u100)
  (var-set accumulated-reward-per-token u0)
  (var-set last-reward-block stacks-block-height)
  (var-set total-stakers u0)
  (var-set total-rewards-paid u0)
)

(define-private (calculate-reward (time uint)) (* time u10))
