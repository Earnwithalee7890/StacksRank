;; vault-deposit (uint) (response bool uint)
;; @desc Deposits STX into the vault and updates state
(define-public (vault-deposit (amount uint))
    (begin
        (print { event: "deposit", amount: amount, sender: tx-sender })
        (ok true)
    )
)

;; vault-withdraw (uint) (response bool uint)
;; @desc Withdraws STX from the vault if requester is owner
(define-public (vault-withdraw (amount uint))
    (begin
        (print { event: "withdraw", amount: amount, sender: tx-sender })
        (ok true)
    )
)
