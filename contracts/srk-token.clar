;; StacksRank Token (SRK)
;; SIP-010 Compliant Token

(impl-trait .trait-sip-010.sip-010-trait)

(define-fungible-token srk-token)

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-INSUFFICIENT-BALANCE (err u102))

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
        (ft-transfer? srk-token amount sender recipient)
    )
)

(define-read-only (get-name) (ok "StacksRank Token"))
(define-read-only (get-symbol) (ok "SRK"))
(define-read-only (get-decimals) (ok u6))
(define-read-only (get-balance (address principal)) (ok (ft-get-balance srk-token address)))
(define-read-only (get-total-supply) (ok (ft-get-supply srk-token)))
(define-read-only (get-token-uri) (ok (some u"https://stacksrank.app/token-metadata.json")))
