;; Multisig Contract
;; Simple 2-of-2 multisig approval

(define-constant SIGNER-1 tx-sender)
(define-constant ERR-NOT-SIGNER (err u100))
(define-constant ERR-ALREADY-APPROVED (err u101))
(define-constant ERR-NOT-APPROVED (err u102))

(define-data-var signer-2 principal tx-sender)
(define-data-var approval-1 bool false)
(define-data-var approval-2 bool false)
(define-data-var withdraw-amount uint u0)

(define-public (set-signer-2 (addr principal))
  (begin
    (asserts! (is-eq tx-sender SIGNER-1) ERR-NOT-SIGNER)
    (var-set signer-2 addr)
    (ok true)
  )
)

(define-public (propose-withdraw (amount uint))
  (begin
    (asserts! (is-eq tx-sender SIGNER-1) ERR-NOT-SIGNER)
    (var-set withdraw-amount amount)
    (var-set approval-1 true)
    (var-set approval-2 false)
    (ok true)
  )
)

(define-public (approve)
  (begin
    (asserts! (is-eq tx-sender (var-get signer-2)) ERR-NOT-SIGNER)
    (var-set approval-2 true)
    (ok true)
  )
)

(define-public (execute)
  (begin
    (asserts! (var-get approval-1) ERR-NOT-APPROVED)
    (asserts! (var-get approval-2) ERR-NOT-APPROVED)
    (var-set approval-1 false)
    (var-set approval-2 false)
    (as-contract (stx-transfer? (var-get withdraw-amount) tx-sender SIGNER-1))
  )
)

(define-read-only (get-status)
  (ok { amount: (var-get withdraw-amount), approved-1: (var-get approval-1), approved-2: (var-get approval-2) })
)

(asserts! (< block-height (get expires proposal)) (err u700))
