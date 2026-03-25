
;; Governance Trait Definition
;; Used to standardize governance interactions across the StacksRank ecosystem.

(define-trait governance-trait
  (
    ;; Create a new proposal
    (create-proposal ((string-ascii 100) (string-ascii 500) (string-ascii 50) uint) (response { proposal-id: uint, end-block: uint } uint))
    
    ;; Cast a vote
    (cast-vote (uint bool) (response { support: bool, weight: uint } uint))
    
    ;; Execute a proposal
    (execute-proposal (uint) (response bool uint))
    
    ;; Read proposal data
    (get-proposal (uint) (optional {
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
    }))
  )
)

;; Added super-user role for emergency governance actions
