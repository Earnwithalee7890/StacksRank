;; Fee Collector
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-INACTIVE (err u101))

(define-data-var fee-amount uint u20000)
(define-data-var current-owner principal tx-sender)
(define-data-var active bool true)

(define-public (pay-fee)
    (begin
        (asserts! (var-get active) ERR-INACTIVE)
        (stx-transfer? (var-get fee-amount) tx-sender (as-contract tx-sender))
    )
)

(define-public (withdraw)
    (begin
        (asserts! (is-eq tx-sender (var-get current-owner)) ERR-OWNER-ONLY)
        (let ((balance (stx-get-balance (as-contract tx-sender))))
            (as-contract (stx-transfer? balance tx-sender (var-get current-owner)))
        )
    )
)

(define-public (set-fee (new-fee uint))
    (begin
        (asserts! (is-eq tx-sender (var-get current-owner)) ERR-OWNER-ONLY)
        (ok (var-set fee-amount new-fee))
    )
)

(define-public (transfer-ownership (new-owner principal))
    (begin
        (asserts! (is-eq tx-sender (var-get current-owner)) ERR-OWNER-ONLY)
        (ok (var-set current-owner new-owner))
    )
)

(define-public (toggle-active (status bool))
    (begin
        (asserts! (is-eq tx-sender (var-get current-owner)) ERR-OWNER-ONLY)
        (ok (var-set active status))
    )
)

(define-read-only (get-fee)
    (ok (var-get fee-amount))
)

(define-read-only (get-owner)
    (ok (var-get current-owner))
)

(define-read-only (get-balance)
    (ok (stx-get-balance (as-contract tx-sender)))
)

(define-read-only (is-active)
    (ok (var-get active))
)
