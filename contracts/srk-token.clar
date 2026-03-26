;; StacksRank Token (SRK)
;; A SIP-010 compliant fungible token with minting rights for governance

(impl-trait .trait-sip-010.sip-010-trait)

(define-fungible-token srk)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))

;; Permissions Map: Allows governance to mint via multisig or direct calls
(define-map minters principal bool)

;; Initialization
(begin
  ;; Token contract owner is minter by default
  (map-set minters CONTRACT-OWNER true)
  ;; Mint initial supply of 100M tokens to owner
  (try! (ft-mint? srk u100000000000000 CONTRACT-OWNER))
)

;; SIP-010 Standard Methods
(define-read-only (get-total-supply)
  (ok (ft-get-supply srk))
)

(define-read-only (get-name)
  (ok "StacksRank Token")
)

(define-read-only (get-symbol)
  (ok "SRK")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance srk account))
)

(define-read-only (get-token-uri)
  (ok (some u"https://stacksrank.com/metadata/srk-token.json"))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (match (ft-transfer? srk amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

;; Minting / Burning (Advanced logic strictly for protocol)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (default-to false (map-get? minters tx-sender)) ERR-NOT-AUTHORIZED)
    (ft-mint? srk amount recipient)
  )
)

(define-public (burn (amount uint) (sender principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (ft-burn? srk amount sender)
  )
)

;; Admin functions
(define-public (add-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (map-set minters minter true))
  )
)

(define-public (remove-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (map-set minters minter false))
  )
)

;; Implements SIP-010-trait
(define-read-only (get-total-supply) (ok (ft-get-supply stacksrank-token)))

;; Implements SIP-010-trait
(define-read-only (get-total-supply) (ok (ft-get-supply stacksrank-token)))
