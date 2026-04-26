;; SPDX-License-Identifier: MIT
;; Governance Contract - StacksRank DAO
;; Token-weighted voting for protocol parameter changes.
(impl-trait .governance-trait.governance-trait)

;; Proposals expire after 1008 blocks (~7 days on Stacks).
;; Quorum: 10% of total supply. Majority: >50%.

;; ───────────────────────────────────────────────────────────
;; CONSTANTS
;; ───────────────────────────────────────────────────────────
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED    (err u500))
(define-constant ERR-PROPOSAL-EXPIRED  (err u501))
(define-constant ERR-ALREADY-VOTED     (err u502))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u503))
(define-constant ERR-QUORUM-NOT-MET    (err u504))
(define-constant ERR-PROPOSAL-ACTIVE   (err u505))
(define-constant ERR-INVALID-VOTE      (err u506))
(define-constant ERR-ALREADY-EXECUTED  (err u507))
(define-constant ERR-INVALID-PROPOSAL  (err u508))

;; Voting period: ~7 days on Stacks (~1008 blocks)
(define-constant VOTING-PERIOD u1008)

;; Quorum: minimum 100,000 uSTX worth of votes needed
(define-constant QUORUM-THRESHOLD u100000)

;; Minimum stake to propose: 5000 tokens
(define-constant MIN-PROPOSAL-STAKE u5000)


;; ───────────────────────────────────────────────────────────
;; DATA
;; ───────────────────────────────────────────────────────────

;; Governance tokens are now managed through the ve-token contract (Vote-Escrowed SRK)

;; Proposals
(define-map proposals uint {
  proposer: principal,
  title: (string-ascii 100),
  description: (string-ascii 500),
  param-key: (string-ascii 50),
  param-value: uint,
  votes-for: uint,
  votes-against: uint,
  start-block: uint,
  end-block: uint,
  executed: bool,
  cancelled: bool
})

;; Vote records: {proposal-id, voter} -> vote-weight
(define-map votes { proposal-id: uint, voter: principal } {
  weight: uint,
  support: bool
})

(define-data-var proposal-counter uint u0)
(define-data-var total-proposals-executed uint u0)

;; Protocol parameters controlled by governance
(define-map protocol-params (string-ascii 50) uint)

;; ───────────────────────────────────────────────────────────
;; READ-ONLY
;; ───────────────────────────────────────────────────────────

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-voting-power (voter principal))
  (contract-call? .ve-token get-voting-power voter)
)

(define-read-only (get-param (key (string-ascii 50)))
  (default-to u0 (map-get? protocol-params key))
)

(define-read-only (is-proposal-passing (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal
    (let (
      (for (get votes-for proposal))
      (against (get votes-against proposal))
      (total (+ for against))
      (quorum-met (>= total QUORUM-THRESHOLD))
      (majority (> for against))
    )
      (ok { passing: (and quorum-met majority), votes-for: for, votes-against: against,
            quorum-met: quorum-met, total-votes: total })
    )
    (err ERR-PROPOSAL-NOT-FOUND)
  )
)

(define-read-only (get-stats)
  (ok {
    total-proposals: (var-get proposal-counter),
    executed: (var-get total-proposals-executed),
    token-supply: (contract-call? .ve-token get-total-locked)
  })
)

;; Governance tokens are now distributed and locked via srk-token and ve-token contracts.

;; ───────────────────────────────────────────────────────────
;; PUBLIC: PROPOSALS
;; ───────────────────────────────────────────────────────────

;; Create a new governance proposal
(define-public (create-proposal
    (title (string-ascii 100))
    (description (string-ascii 500))
    (param-key (string-ascii 50))
    (param-value uint))
  (let (
    (proposal-id (+ (var-get proposal-counter) u1))
    (voting-power (get-voting-power tx-sender))
    (end-block (+ stacks-block-height VOTING-PERIOD))
  )
    ;; Proposer must have at least the minimum stake
    (asserts! (>= voting-power MIN-PROPOSAL-STAKE) ERR-NOT-AUTHORIZED)
    
    ;; Basic validation for title and description length
    (asserts! (> (len title) u5) ERR-INVALID-PROPOSAL)
    (asserts! (> (len description) u10) ERR-INVALID-PROPOSAL)

    (map-set proposals proposal-id {
      proposer: tx-sender,
      title: title,
      description: description,
      param-key: param-key,
      param-value: param-value,
      votes-for: u0,
      votes-against: u0,
      start-block: stacks-block-height,
      end-block: end-block,
      executed: false,
      cancelled: false
    })

    (var-set proposal-counter proposal-id)
    (print { event: "proposal-created", id: proposal-id, proposer: tx-sender,
             param-key: param-key, param-value: param-value })
    (ok { proposal-id: proposal-id, end-block: end-block })
  )
)


;; Cast a vote on a proposal (token-weighted)
(define-public (cast-vote (proposal-id uint) (support bool))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (voting-power (get-voting-power tx-sender))
  )
    (asserts! (> voting-power u0) ERR-NOT-AUTHORIZED)
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-PROPOSAL-EXPIRED)
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    (asserts! (not (get cancelled proposal)) ERR-ALREADY-EXECUTED)
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender }))
              ERR-ALREADY-VOTED)

    ;; Record vote
    (map-set votes { proposal-id: proposal-id, voter: tx-sender }
      { weight: voting-power, support: support })

    ;; Update proposal vote tallies
    (if support
      (map-set proposals proposal-id
        (merge proposal { votes-for: (+ (get votes-for proposal) voting-power) }))
      (map-set proposals proposal-id
        (merge proposal { votes-against: (+ (get votes-against proposal) voting-power) }))
    )

    (print { event: "vote-cast", voter: tx-sender, proposal-id: proposal-id,
             support: support, weight: voting-power })
    (ok { support: support, weight: voting-power })
  )
)

;; Execute a passed proposal (updates protocol param)
(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (status (unwrap! (is-proposal-passing proposal-id) ERR-PROPOSAL-NOT-FOUND))
  )
    (asserts! (> stacks-block-height (get end-block proposal)) ERR-PROPOSAL-ACTIVE)
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    (asserts! (not (get cancelled proposal)) ERR-ALREADY-EXECUTED)
    (asserts! (get passing status) ERR-QUORUM-NOT-MET)

    ;; Apply the parameter change
    (map-set protocol-params (get param-key proposal) (get param-value proposal))

    ;; Mark as executed
    (map-set proposals proposal-id (merge proposal { executed: true }))
    (var-set total-proposals-executed (+ (var-get total-proposals-executed) u1))

    (print { event: "proposal-executed", id: proposal-id,
             param-key: (get param-key proposal), new-value: (get param-value proposal) })
    (ok true)
  )
)

;; Cancel a proposal (proposer or owner only)
(define-public (cancel-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
  )
    (asserts!
      (or (is-eq tx-sender (get proposer proposal)) (is-eq tx-sender CONTRACT-OWNER))
      ERR-NOT-AUTHORIZED)
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)

    (map-set proposals proposal-id (merge proposal { cancelled: true }))
    (ok true)
  )
)

;; ───────────────────────────────────────────────────────────
;; INIT
;; ───────────────────────────────────────────────────────────
(begin
  (var-set proposal-counter u0)
  (var-set total-proposals-executed u0)
  ;; Seed default protocol params
  (map-set protocol-params "swap-fee-bps" u30)
  (map-set protocol-params "flash-loan-fee-bps" u9)
  (map-set protocol-params "max-price-impact-bps" u500)
  (map-set protocol-params "cooldown-blocks" u144)
)

;; Validation: Ensure proposal length is non-zero
(asserts! (> (len (get title proposal)) u0) (err u400))

;; Validation: Ensure proposal length is non-zero
(asserts! (> (len (get title proposal)) u0) (err u400))
