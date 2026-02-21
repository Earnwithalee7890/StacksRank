
;; feb-builder-check-in
;; Helper contract for Stacks Builder Rewards February 2026
;; Implements check-in logic to boost on-chain activity metrics

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-insufficient-funds (err u101))
(define-constant check-in-fee u20000) ;; 0.02 STX

;; Data Maps
(define-map check-ins principal uint) ;; User -> Check-in Count
(define-map total-fees-collected principal uint) ;; Tracker for total fees per user

;; Public Functions

;; @desc User check-in function
;; Transfers 0.02 STX fee to contract and increments check-in count
(define-public (check-in)
    (let
        (
            (caller tx-sender)
            (current-count (default-to u0 (map-get? check-ins caller)))
            (current-fees (default-to u0 (map-get? total-fees-collected caller)))
        )
        ;; Transfer 0.02 STX from caller to contract
        (try! (stx-transfer? check-in-fee caller (as-contract tx-sender)))

        ;; Update check-in count and fees
        (map-set check-ins caller (+ current-count u1))
        (map-set total-fees-collected caller (+ current-fees check-in-fee))
        
        ;; Log event for off-chain tracking
        (print { event: "check-in", user: caller, count: (+ current-count u1), fee: check-in-fee })
        
        (ok true)
    )
)

;; @desc Withdraw collected fees
;; Only callable by contract owner
(define-public (withdraw-fees)
    (let
        (
            (caller tx-sender)
            (balance (stx-get-balance (as-contract tx-sender)))
        )
        ;; Assert owner
        (asserts! (is-eq caller contract-owner) err-owner-only)
        
        ;; Transfer all balance to owner
        (try! (as-contract (stx-transfer? balance tx-sender contract-owner)))
        
        (ok balance)
    )
)

;; Read-only functions

(define-read-only (get-check-in-count (user principal))
    (default-to u0 (map-get? check-ins user))
)

(define-read-only (get-total-fees-collected (user principal))
    (default-to u0 (map-get? total-fees-collected user))
)

(define-read-only (get-contract-balance)
    (stx-get-balance (as-contract tx-sender))
)
