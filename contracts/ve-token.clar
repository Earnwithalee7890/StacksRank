;; veSRK (Vote-Escrowed StacksRank Token)
;; Lock SRK tokens to receive veSRK, which represents voting power.
;; Voting power linearly decays until the lock expires.

(use-trait sip-010-trait .trait-sip-010.sip-010-trait)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INVALID-AMOUNT (err u400))
(define-constant ERR-LOCK-TOO-SHORT (err u402))
(define-constant ERR-LOCK-TOO-LONG (err u403))
(define-constant ERR-NOT-LOCKED (err u404))
(define-constant ERR-LOCK-NOT-EXPIRED (err u405))

;; Maximum lock time: 1 year (approx 52560 blocks at 10 mins/block)
(define-constant MAX-LOCK-BLOCKS u52560)
;; Minimum lock time: 7 days
(define-constant MIN-LOCK-BLOCKS u1008)

(define-map locked-balances
  principal
  {
    amount: uint,
    end-block: uint
  }
)

(define-data-var total-locked uint u0)

;; Read-Only Functions

(define-read-only (get-locked-balance (user principal))
  (default-to { amount: u0, end-block: u0 } (map-get? locked-balances user))
)

;; Calculate the voting power (ve-balance) for a user at the current block
(define-read-only (get-voting-power (user principal))
  (let (
    (lock (get-locked-balance user))
    (amount (get amount lock))
    (end-block (get end-block lock))
  )
    (if (or (is-eq amount u0) (<= end-block block-height))
      u0
      ;; Voting power = (amount * remaining-blocks) / MAX-LOCK-BLOCKS
      (/ (* amount (- end-block block-height)) MAX-LOCK-BLOCKS)
    )
  )
)

(define-read-only (get-total-locked)
  (var-get total-locked)
)

;; Public Functions

;; Create or increase a lock
(define-public (lock-tokens (amount uint) (lock-blocks uint))
  (let (
    (user tx-sender)
    (current-lock (get-locked-balance user))
    (current-amount (get amount current-lock))
    (current-end (get end-block current-lock))
    (new-end (+ block-height lock-blocks))
  )
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (>= lock-blocks MIN-LOCK-BLOCKS) ERR-LOCK-TOO-SHORT)
    (asserts! (<= lock-blocks MAX-LOCK-BLOCKS) ERR-LOCK-TOO-LONG)
    (asserts! (or (is-eq current-amount u0) (>= new-end current-end)) ERR-LOCK-TOO-SHORT)

    ;; Transfer tokens from user to this contract
    (try! (contract-call? .srk-token transfer amount user (as-contract tx-sender) none))

    ;; Update lock
    (map-set locked-balances user {
      amount: (+ current-amount amount),
      end-block: new-end
    })

    (var-set total-locked (+ (var-get total-locked) amount))
    
    (print { event: "tokens-locked", user: user, amount: amount, end-block: new-end })
    (ok true)
  )
)

;; Withdraw tokens after lock expires
(define-public (withdraw)
  (let (
    (user tx-sender)
    (lock (get-locked-balance user))
    (amount (get amount lock))
    (end-block (get end-block lock))
  )
    (asserts! (> amount u0) ERR-NOT-LOCKED)
    (asserts! (>= block-height end-block) ERR-LOCK-NOT-EXPIRED)

    ;; Reset lock
    (map-delete locked-balances user)
    (var-set total-locked (- (var-get total-locked) amount))

    ;; Transfer back from contract to user
    (try! (as-contract (contract-call? .srk-token transfer amount tx-sender user none)))

    (print { event: "tokens-withdrawn", user: user, amount: amount })
    (ok amount)
  )
)
