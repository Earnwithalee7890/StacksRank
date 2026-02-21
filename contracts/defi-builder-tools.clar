
;; defi-builder-tools v2
;; A comprehensive toolkit for Stacks builders to manage their on-chain presence
;; and access premium features.
;; Features: Registration, Status Updates (with cooldown), Service Requests (with cooldown),
;;           Donations, and Admin Withdrawals.

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-insufficient-funds (err u101))
(define-constant err-already-registered (err u102))
(define-constant err-not-registered (err u103))
(define-constant err-invalid-amount (err u104))
(define-constant err-cooldown-active (err u105))

;; Fees
(define-constant registration-fee u20000)   ;; 0.02 STX
(define-constant status-update-fee u10000)  ;; 0.01 STX
(define-constant service-request-fee u10000) ;; 0.01 STX
(define-constant min-donation u10000)       ;; 0.01 STX

;; Cooldown: 144 Bitcoin blocks ≈ 24 hours
(define-constant cooldown-blocks u144)

;; Data Maps

(define-map builders principal
    {
        name: (string-ascii 50),
        profile-url: (string-ascii 100),
        registered-at: uint,
        status: (string-ascii 50),
        reputation-score: uint
    }
)

(define-map service-requests uint
    {
        requester: principal,
        service-type: (string-ascii 20),
        details: (string-ascii 100),
        fulfilled: bool
    }
)

(define-map total-donations principal uint)

;; Cooldown tracking: last block when each user updated status or requested service
(define-map last-status-update principal uint)
(define-map last-service-request principal uint)

;; Data Vars
(define-data-var request-counter uint u0)
(define-data-var total-fees-collected uint u0)

;; Public Functions

;; @desc Register as a builder (one-time)
;; @param name: Builder's display name
;; @param profile-url: URL to builder's portfolio/profile
(define-public (register-builder (name (string-ascii 50)) (profile-url (string-ascii 100)))
    (let
        (
            (caller tx-sender)
        )
        (asserts! (is-none (map-get? builders caller)) err-already-registered)

        ;; Pay registration fee
        (try! (stx-transfer? registration-fee caller (as-contract tx-sender)))

        ;; Register builder
        (map-set builders caller {
            name: name,
            profile-url: profile-url,
            registered-at: burn-block-height,
            status: "active",
            reputation-score: u10
        })

        ;; Update total fees
        (var-set total-fees-collected (+ (var-get total-fees-collected) registration-fee))

        (ok true)
    )
)

;; @desc Update builder status (24-hour cooldown enforced)
;; @param new-status: New status message (max 50 chars)
(define-public (update-status (new-status (string-ascii 50)))
    (let
        (
            (caller tx-sender)
            (builder (unwrap! (map-get? builders caller) err-not-registered))
            (last-block (default-to u0 (map-get? last-status-update caller)))
        )
        ;; Enforce 24-hour cooldown
        (asserts! (>= burn-block-height (+ last-block cooldown-blocks)) err-cooldown-active)

        ;; Pay update fee
        (try! (stx-transfer? status-update-fee caller (as-contract tx-sender)))

        ;; Update status
        (map-set builders caller (merge builder { status: new-status }))

        ;; Record cooldown timestamp
        (map-set last-status-update caller burn-block-height)

        ;; Update total fees
        (var-set total-fees-collected (+ (var-get total-fees-collected) status-update-fee))

        (ok true)
    )
)

;; @desc Request a premium service (24-hour cooldown enforced)
;; @param service-type: Type of service (audit, design, promotion)
;; @param details: Specific details of the request
(define-public (request-service (service-type (string-ascii 20)) (details (string-ascii 100)))
    (let
        (
            (caller tx-sender)
            (current-id (var-get request-counter))
            (last-block (default-to u0 (map-get? last-service-request caller)))
        )
        ;; Enforce 24-hour cooldown
        (asserts! (>= burn-block-height (+ last-block cooldown-blocks)) err-cooldown-active)

        ;; Pay service fee
        (try! (stx-transfer? service-request-fee caller (as-contract tx-sender)))

        ;; Log request
        (map-set service-requests current-id {
            requester: caller,
            service-type: service-type,
            details: details,
            fulfilled: false
        })

        ;; Record cooldown timestamp
        (map-set last-service-request caller burn-block-height)

        ;; Increment counter
        (var-set request-counter (+ current-id u1))

        ;; Update total fees
        (var-set total-fees-collected (+ (var-get total-fees-collected) service-request-fee))

        (ok current-id)
    )
)

;; @desc Donate to the builder fund (no cooldown)
;; @param amount: Amount in uSTX to donate
(define-public (donate-to-fund (amount uint))
    (let
        (
            (caller tx-sender)
            (current-donation (default-to u0 (map-get? total-donations caller)))
        )
        (asserts! (>= amount min-donation) err-invalid-amount)

        ;; Transfer donation
        (try! (stx-transfer? amount caller (as-contract tx-sender)))

        ;; Log donation
        (map-set total-donations caller (+ current-donation amount))

        (var-set total-fees-collected (+ (var-get total-fees-collected) amount))

        (ok true)
    )
)

;; @desc Withdraw all collected fees to the owner
(define-public (withdraw-fees)
    (let
        (
            (caller tx-sender)
            (balance (stx-get-balance (as-contract tx-sender)))
        )
        (asserts! (is-eq caller contract-owner) err-owner-only)
        (asserts! (> balance u0) err-insufficient-funds)

        (try! (as-contract (stx-transfer? balance tx-sender contract-owner)))

        (ok balance)
    )
)

;; @desc Withdraw a specific amount to a recipient
;; @param amount: Amount to withdraw
;; @param recipient: Address to receive funds
(define-public (withdraw-partial (amount uint) (recipient principal))
    (let
        (
            (caller tx-sender)
            (balance (stx-get-balance (as-contract tx-sender)))
        )
        (asserts! (is-eq caller contract-owner) err-owner-only)
        (asserts! (<= amount balance) err-insufficient-funds)

        (try! (as-contract (stx-transfer? amount tx-sender recipient)))

        (ok amount)
    )
)

;; Read-only functions

(define-read-only (get-builder-profile (user principal))
    (map-get? builders user)
)

(define-read-only (get-request-info (request-id uint))
    (map-get? service-requests request-id)
)

(define-read-only (get-total-fees)
    (var-get total-fees-collected)
)

(define-read-only (get-contract-balance)
    (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-user-donation (user principal))
    (default-to u0 (map-get? total-donations user))
)

;; @desc Get blocks remaining before next status update is allowed
(define-read-only (get-status-cooldown-remaining (user principal))
    (let
        (
            (last-block (default-to u0 (map-get? last-status-update user)))
            (unlock-at (+ last-block cooldown-blocks))
        )
        (if (>= burn-block-height unlock-at)
            (ok u0)
            (ok (- unlock-at burn-block-height))
        )
    )
)

;; @desc Get blocks remaining before next service request is allowed
(define-read-only (get-service-cooldown-remaining (user principal))
    (let
        (
            (last-block (default-to u0 (map-get? last-service-request user)))
            (unlock-at (+ last-block cooldown-blocks))
        )
        (if (>= burn-block-height unlock-at)
            (ok u0)
            (ok (- unlock-at burn-block-height))
        )
    )
)

;; REVISION v2: Added 24-hour cooldown (144 blocks) to update-status and request-service.
;; ERROR CODE u105: err-cooldown-active returned when cooldown period has not elapsed.
