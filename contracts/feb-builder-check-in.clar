
;; feb-builder-check-in.clar
;; Implements a simple daily check-in with ZERO fees

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-too-soon (err u103))

;; Data Maps
;; Map to track the total number of check-ins per user
(define-map user-check-in-count principal uint)
;; Map to track the block height of the last check-in per user
(define-map user-last-check-in principal uint)

;; Public Functions

;; @desc Perform a check-in
;; Increments the count if more than 144 blocks (~24h) have passed since the last one
(define-public (check-in)
    (let
        (
            (caller tx-sender)
            (current-count (default-to u0 (map-get? user-check-in-count caller)))
            (last-height (default-to u0 (map-get? user-last-check-in caller)))
        )
        ;; Enforce 144 block cooldown (approx. 24 hours on Mainnet)
        (asserts! (or (is-eq last-height u0) (>= (- block-height last-height) u144)) err-too-soon)

        ;; Update official tracking maps
        (map-set user-check-in-count caller (+ current-count u1))
        (map-set user-last-check-in caller block-height)
        
        ;; Structured print for off-chain indexing
        (print { event: "check-in", user: caller, count: (+ current-count u1), block: block-height })
        
        (ok true)
    )
)

;; Read-only Functions

;; Return the check-in count for a specific user
(define-read-only (get-check-in-count (user principal))
    (default-to u0 (map-get? user-check-in-count user))
)

;; Return the last block height when the user checked in
(define-read-only (get-last-check-in (user principal))
    (default-to u0 (map-get? user-last-check-in user))
)

;; Check if the user is currently allowed to check in again
(define-read-only (is-check-in-available (user principal))
    (let
        (
            (last-height (default-to u0 (map-get? user-last-check-in user)))
        )
        (or (is-eq last-height u0) (>= (- block-height last-height) u144))
    )
)
