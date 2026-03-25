;; Daily Distributor Contract
;; Allows owner to deposit STX, users to claim a set amount (default 1 STX) every 24 hours (144 blocks),
;; and owner can withdraw remaining STX at any time.

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-INSUFFICIENT-FUNDS (err u402))
(define-constant ERR-TOO-SOON (err u403))

;; Variables
;; Default claim amount: 1 STX = 1,000,000 uSTX
(define-data-var claim-amount uint u1000000)
;; Default cooldown: 24 hours = ~144 blocks (assuming 10 min per block)
(define-data-var cooldown-blocks uint u144)

;; Maps
;; Tracks the block height when a user last claimed
(define-map last-claim-height principal uint)

;; --- Public Functions ---

;; 1. Deposit STX into the contract
;; Any user or owner can fund the distributor
(define-public (deposit (amount uint))
  (let ((contract-address (as-contract tx-sender)))
    (begin
      (try! (stx-transfer? amount tx-sender contract-address))
      (ok true)
    )
  )
)

;; 2. Withdraw STX from the contract
;; Only the owner can withdraw funds back to their wallet
(define-public (withdraw (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (try! (as-contract (stx-transfer? amount tx-sender CONTRACT-OWNER)))
    (ok true)
  )
)

;; 3. Claim STX
;; Users can claim the set amount once every 144 blocks (24 hours)
(define-public (claim)
  (let 
    (
      (caller tx-sender)
      (current-height block-height)
      (user-last-claim (default-to u0 (map-get? last-claim-height caller)))
      (blocks-passed (- current-height user-last-claim))
      (amount-to-claim (var-get claim-amount))
      (contract-address (as-contract tx-sender))
    )
    ;; Check if the user has waited long enough (or has never claimed)
    (asserts! (or (is-eq user-last-claim u0) (>= blocks-passed (var-get cooldown-blocks))) ERR-TOO-SOON)
    
    ;; Check if contract has enough STX balance
    (asserts! (>= (stx-get-balance contract-address) amount-to-claim) ERR-INSUFFICIENT-FUNDS)
    
    ;; Update their last claim height BEFORE transferring to prevent re-entrancy
    (map-set last-claim-height caller current-height)
    
    ;; Transfer from contract to user
    (try! (as-contract (stx-transfer? amount-to-claim tx-sender caller)))
    (ok amount-to-claim)
  )
)

;; --- Admin Functions ---

;; Update the claim amount (Can be modified by owner)
(define-public (set-claim-amount (new-amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (var-set claim-amount new-amount)
    (ok new-amount)
  )
)

;; Update the cooldown blocks (e.g., set to 72 for 12 hours)
(define-public (set-cooldown-blocks (new-cooldown uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (var-set cooldown-blocks new-cooldown)
    (ok new-cooldown)
  )
)

;; --- Read-Only Functions ---

;; Check the contract's STX balance
(define-read-only (get-contract-balance)
  (let ((contract-address (as-contract tx-sender)))
    (ok (stx-get-balance contract-address))
  )
)

;; Check when a user last claimed
(define-read-only (get-last-claim (user principal))
  (ok (default-to u0 (map-get? last-claim-height user)))
)

;; Check current claim amount configured
(define-read-only (get-claim-amount)
  (ok (var-get claim-amount))
)

;; Check current cooldown required
(define-read-only (get-cooldown-blocks)
  (ok (var-get cooldown-blocks))
)

(define-data-var claim-window uint u144)
