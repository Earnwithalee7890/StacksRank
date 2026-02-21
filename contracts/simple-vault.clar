;; Simple Multi-Sig Vault - Working Version
;; Secure vaults with multiple signers

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-INVALID-AMOUNT (err u301))
(define-constant ERR-VAULT-NOT-FOUND (err u302))
(define-constant ERR-ALREADY-SIGNED (err u303))
(define-constant ERR-NOT-ENOUGH-SIGNATURES (err u304))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u305))
(define-constant ERR-INVALID-SIGNERS (err u306))

;; Data variables
(define-data-var vault-counter uint u0)
(define-data-var proposal-counter uint u0)

;; Vault structure
(define-map vaults
  uint
  {
    owner: principal,
    balance: uint,
    required-sigs: uint,
    active: bool
  }
)

;; Vault signers (stored separately for iterations)
(define-map vault-signers
  { vault-id: uint, signer: principal }
  { authorized: bool }
)

;; Withdrawal proposals
(define-map proposals
  uint
  {
    vault-id: uint,
    proposer: principal,
    recipient: principal,
    amount: uint,
    signatures: uint,
    executed: bool,
    created-at: uint
  }
)

;; Proposal signatures
(define-map proposal-signatures
  { proposal-id: uint, signer: principal }
  { signed: bool }
)

;; Read-only functions
(define-read-only (get-vault (vault-id uint))
  (map-get? vaults vault-id)
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

(define-read-only (is-signer (vault-id uint) (signer principal))
  (default-to false 
    (get authorized (map-get? vault-signers { vault-id: vault-id, signer: signer }))
  )
)

(define-read-only (has-signed (proposal-id uint) (signer principal))
  (default-to false
    (get signed (map-get? proposal-signatures { proposal-id: proposal-id, signer: signer }))
  )
)

;; Public functions
(define-public (create-vault (signer1 principal) (signer2 principal) (required-sigs uint))
  (let
    (
      (vault-id (+ (var-get vault-counter) u1))
    )
    (asserts! (> required-sigs u0) ERR-INVALID-SIGNERS)
    (asserts! (<= required-sigs u2) ERR-INVALID-SIGNERS)
    
    ;; Create vault
    (map-set vaults vault-id {
      owner: tx-sender,
      balance: u0,
      required-sigs: required-sigs,
      active: true
    })
    
    ;; Add signers
    (map-set vault-signers { vault-id: vault-id, signer: tx-sender } { authorized: true })
    (map-set vault-signers { vault-id: vault-id, signer: signer1 } { authorized: true })
    (map-set vault-signers { vault-id: vault-id, signer: signer2 } { authorized: true })
    
    (var-set vault-counter vault-id)
    (ok vault-id)
  )
)

(define-public (deposit (vault-id uint) (amount uint))
  (let
    (
      (vault (unwrap! (get-vault vault-id) ERR-VAULT-NOT-FOUND))
    )
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (get active vault) ERR-NOT-AUTHORIZED)
    
    ;; Transfer STX to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    ;; Update vault balance
    (map-set vaults vault-id (merge vault {
      balance: (+ (get balance vault) amount)
    }))
    
    (ok true)
  )
)

(define-public (propose-withdrawal (vault-id uint) (recipient principal) (amount uint))
  (let
    (
      (vault (unwrap! (get-vault vault-id) ERR-VAULT-NOT-FOUND))
      (proposal-id (+ (var-get proposal-counter) u1))
    )
    (asserts! (is-signer vault-id tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (<= amount (get balance vault)) ERR-INVALID-AMOUNT)
    
    ;; Create proposal
    (map-set proposals proposal-id {
      vault-id: vault-id,
      proposer: tx-sender,
      recipient: recipient,
      amount: amount,
      signatures: u1,
      executed: false,
      created-at: stacks-block-height
    })
    
    ;; Auto-sign by proposer
    (map-set proposal-signatures { proposal-id: proposal-id, signer: tx-sender } { signed: true })
    
    (var-set proposal-counter proposal-id)
    (ok proposal-id)
  )
)

(define-public (sign-proposal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (get-proposal proposal-id) ERR-PROPOSAL-NOT-FOUND))
      (vault-id (get vault-id proposal))
      (vault (unwrap! (get-vault vault-id) ERR-VAULT-NOT-FOUND))
    )
    (asserts! (is-signer vault-id tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (not (has-signed proposal-id tx-sender)) ERR-ALREADY-SIGNED)
    (asserts! (not (get executed proposal)) ERR-PROPOSAL-NOT-FOUND)
    
    ;; Add signature
    (map-set proposal-signatures { proposal-id: proposal-id, signer: tx-sender } { signed: true })
    
    (let
      (
        (new-sig-count (+ (get signatures proposal) u1))
        (updated-proposal (merge proposal { signatures: new-sig-count }))
      )
      (map-set proposals proposal-id updated-proposal)
      
      ;; Execute if enough signatures
      (if (>= new-sig-count (get required-sigs vault))
        (execute-withdrawal proposal-id)
        (ok true)
      )
    )
  )
)

(define-private (execute-withdrawal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (get-proposal proposal-id) ERR-PROPOSAL-NOT-FOUND))
      (vault-id (get vault-id proposal))
      (vault (unwrap! (get-vault vault-id) ERR-VAULT-NOT-FOUND))
      (amount (get amount proposal))
      (recipient (get recipient proposal))
    )
    ;; Transfer STX from contract
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    
    ;; Update vault balance
    (map-set vaults vault-id (merge vault {
      balance: (- (get balance vault) amount)
    }))
    
    ;; Mark proposal as executed
    (map-set proposals proposal-id (merge proposal { executed: true }))
    
    (ok true)
  )
)

;; Initialize
(begin
  (var-set vault-counter u0)
  (var-set proposal-counter u0)
)
