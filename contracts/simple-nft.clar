;; Simple NFT Contract
;; Mint numbered NFTs

(define-non-fungible-token simple-nft uint)
(define-data-var last-id uint u0)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))

(define-public (mint)
  (let ((new-id (+ (var-get last-id) u1)))
    (try! (nft-mint? simple-nft new-id tx-sender))
    (var-set last-id new-id)
    (ok new-id)
  )
)

(define-public (transfer (id uint) (recipient principal))
  (begin
    (try! (nft-transfer? simple-nft id tx-sender recipient))
    (ok true)
  )
)

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? simple-nft id))
)

(define-read-only (get-last-id)
  (ok (var-get last-id))
)
