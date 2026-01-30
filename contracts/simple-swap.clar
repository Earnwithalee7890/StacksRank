;; Simple STX Swap Contract - Working Version
;; Direct STX swaps with escrow

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u200))
(define-constant ERR-INVALID-AMOUNT (err u201))
(define-constant ERR-INSUFFICIENT-BALANCE (err u202))
(define-constant ERR-SWAP-NOT-FOUND (err u203))
(define-constant ERR-SWAP-EXPIRED (err u204))
(define-constant ERR-SWAP-COMPLETED (err u205))

;; Data variables
(define-data-var swap-counter uint u0)
(define-data-var total-volume uint u0)
(define-data-var fee-percentage uint u30) ;; 0.3%

;; Swap structure
(define-map swaps
  uint
  {
    initiator: principal,
    counterparty: principal,
    amount: uint,
    fee: uint,
    expiry: uint,
    completed: bool,
    cancelled: bool
  }
)

;; Read-only functions
(define-read-only (get-swap (swap-id uint))
  (map-get? swaps swap-id)
)

(define-read-only (get-stats)
  (ok {
    total-swaps: (var-get swap-counter),
    total-volume: (var-get total-volume),
    fee-percentage: (var-get fee-percentage)
  })
)

(define-read-only (calculate-fee (amount uint))
  (/ (* amount (var-get fee-percentage)) u10000)
)

;; Public functions
(define-public (create-swap (counterparty principal) (amount uint) (duration uint))
  (let
    (
      (swap-id (+ (var-get swap-counter) u1))
      (fee (calculate-fee amount))
      (total-amount (+ amount fee))
      (expiry (+ stacks-block-height duration))
    )
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> duration u0) ERR-INVALID-AMOUNT)
    
    ;; Transfer STX to contract as escrow
    (try! (stx-transfer? total-amount tx-sender (as-contract tx-sender)))
    
    ;; Create swap record
    (map-set swaps swap-id {
      initiator: tx-sender,
      counterparty: counterparty,
      amount: amount,
      fee: fee,
      expiry: expiry,
      completed: false,
      cancelled: false
    })
    
    (var-set swap-counter swap-id)
    (ok swap-id)
  )
)

(define-public (accept-swap (swap-id uint))
  (let
    (
      (swap (unwrap! (get-swap swap-id) ERR-SWAP-NOT-FOUND))
      (initiator (get initiator swap))
      (counterparty (get counterparty swap))
      (amount (get amount swap))
      (fee (get fee swap))
    )
    ;; Validations
    (asserts! (is-eq tx-sender counterparty) ERR-NOT-AUTHORIZED)
    (asserts! (< stacks-block-height (get expiry swap)) ERR-SWAP-EXPIRED)
    (asserts! (not (get completed swap)) ERR-SWAP-COMPLETED)
    (asserts! (not (get cancelled swap)) ERR-SWAP-COMPLETED)
    
    ;; Transfer STX from counterparty
    (try! (stx-transfer? amount tx-sender initiator))
    
    ;; Release escrowed STX to counterparty
    (try! (as-contract (stx-transfer? amount tx-sender counterparty)))
    
    ;; Mark as completed
    (map-set swaps swap-id (merge swap { completed: true }))
    
    ;; Update stats
    (var-set total-volume (+ (var-get total-volume) amount))
    
    (ok true)
  )
)

(define-public (cancel-swap (swap-id uint))
  (let
    (
      (swap (unwrap! (get-swap swap-id) ERR-SWAP-NOT-FOUND))
      (initiator (get initiator swap))
      (amount (get amount swap))
      (fee (get fee swap))
      (total-amount (+ amount fee))
    )
    ;; Only initiator can cancel
    (asserts! (is-eq tx-sender initiator) ERR-NOT-AUTHORIZED)
    (asserts! (not (get completed swap)) ERR-SWAP-COMPLETED)
    (asserts! (not (get cancelled swap)) ERR-SWAP-COMPLETED)
    
    ;; Return escrowed STX
    (try! (as-contract (stx-transfer? total-amount tx-sender initiator)))
    
    ;; Mark as cancelled
    (map-set swaps swap-id (merge swap { cancelled: true }))
    
    (ok true)
  )
)

;; Initialize
(begin
  (var-set swap-counter u0)
  (var-set total-volume u0)
)
