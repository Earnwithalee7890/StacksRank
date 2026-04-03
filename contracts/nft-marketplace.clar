;; NFT Marketplace Contract - StacksRank
;; List, buy, make offers, and auction STX-denominated NFTs.
;; Supports royalties, platform fees, and time-limited auctions.

;; ───────────────────────────────────────────────────────────
;; CONSTANTS
;; ───────────────────────────────────────────────────────────
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED    (err u800))
(define-constant ERR-LISTING-NOT-FOUND (err u801))
(define-constant ERR-INVALID-PRICE     (err u802))
(define-constant ERR-AUCTION-ENDED     (err u803))
(define-constant ERR-BID-TOO-LOW       (err u804))
(define-constant ERR-NOT-SELLER        (err u805))
(define-constant ERR-AUCTION-ACTIVE    (err u806))
(define-constant ERR-OFFER-NOT-FOUND   (err u807))

;; Platform fee: 2.5% = 250 / 10000
(define-constant PLATFORM-FEE-BPS u250)
(define-constant BASIS-POINTS u10000)

;; ───────────────────────────────────────────────────────────
;; DATA
;; ───────────────────────────────────────────────────────────

;; Fixed-price listings
(define-map listings uint {
  seller: principal,
  contract-address: principal,
  token-id: uint,
  price: uint,                   ;; uSTX
  royalty-bps: uint,             ;; creator royalty in basis points
  creator: principal,
  active: bool,
  listed-at: uint
})

;; Auction listings
(define-map auctions uint {
  seller: principal,
  contract-address: principal,
  token-id: uint,
  reserve-price: uint,           ;; minimum bid
  current-bid: uint,
  current-bidder: (optional principal),
  end-block: uint,
  royalty-bps: uint,
  creator: principal,
  settled: bool
})

;; Best offers per listing
(define-map offers { listing-id: uint, offerer: principal } {
  amount: uint,
  expiry: uint,
  active: bool
})

(define-data-var listing-counter uint u0)
(define-data-var auction-counter uint u0)
(define-data-var total-volume uint u0)
(define-data-var total-fees uint u0)
(define-data-var platform-balance uint u0)

;; ───────────────────────────────────────────────────────────
;; READ-ONLY
;; ───────────────────────────────────────────────────────────

(define-read-only (get-listing (listing-id uint))
  (map-get? listings listing-id)
)

(define-read-only (get-auction (auction-id uint))
  (map-get? auctions auction-id)
)

(define-read-only (get-offer (listing-id uint) (offerer principal))
  (map-get? offers { listing-id: listing-id, offerer: offerer })
)

;; Calculate fees for a sale price
(define-read-only (calculate-fees (price uint) (royalty-bps uint))
  (let (
    (platform-fee (/ (* price PLATFORM-FEE-BPS) BASIS-POINTS))
    (royalty (/ (* price royalty-bps) BASIS-POINTS))
    (seller-proceeds (- price (+ platform-fee royalty)))
  )
    (ok { platform-fee: platform-fee, royalty: royalty, seller-proceeds: seller-proceeds })
  )
)

(define-read-only (get-market-stats)
  (ok {
    total-listings: (var-get listing-counter),
    total-auctions: (var-get auction-counter),
    total-volume: (var-get total-volume),
    total-fees: (var-get total-fees),
    platform-balance: (var-get platform-balance)
  })
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: FIXED-PRICE LISTINGS
;; ───────────────────────────────────────────────────────────

;; Create a fixed-price listing
(define-public (list-nft
    (contract-address principal)
    (token-id uint)
    (price uint)
    (royalty-bps uint)
    (creator principal))
  (let (
    (listing-id (+ (var-get listing-counter) u1))
  )
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (asserts! (<= royalty-bps u1000) ERR-INVALID-PRICE) ;; Max 10% royalty

    (map-set listings listing-id {
      seller: tx-sender,
      contract-address: contract-address,
      token-id: token-id,
      price: price,
      royalty-bps: royalty-bps,
      creator: creator,
      active: true,
      listed-at: stacks-block-height
    })

    (var-set listing-counter listing-id)
    (print { event: "nft-listed", listing-id: listing-id, seller: tx-sender,
             token-id: token-id, price: price })
    (ok listing-id)
  )
)

;; Buy a fixed-price listing
(define-public (buy-listing (listing-id uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-LISTING-NOT-FOUND))
    (price (get price listing))
    (seller (get seller listing))
    (creator (get creator listing))
    (royalty-bps (get royalty-bps listing))
    (fees (unwrap! (calculate-fees price royalty-bps) ERR-INVALID-PRICE))
    (platform-fee (get platform-fee fees))
    (royalty (get royalty fees))
    (seller-proceeds (get seller-proceeds fees))
    (buyer tx-sender)
  )
    (asserts! (get active listing) ERR-LISTING-NOT-FOUND)
    (asserts! (not (is-eq buyer seller)) ERR-NOT-AUTHORIZED)

    ;; Transfer STX from buyer
    (try! (stx-transfer? seller-proceeds buyer seller))
    (if (> royalty u0)
      (try! (stx-transfer? royalty buyer creator))
      true
    )
    (try! (stx-transfer? platform-fee buyer (as-contract tx-sender)))

    ;; Deactivate listing
    (map-set listings listing-id (merge listing { active: false }))

    ;; Update stats
    (var-set total-volume (+ (var-get total-volume) price))
    (var-set total-fees (+ (var-get total-fees) platform-fee))
    (var-set platform-balance (+ (var-get platform-balance) platform-fee))

    (print { event: "nft-sold", listing-id: listing-id, buyer: buyer, seller: seller,
             price: price, royalty: royalty, platform-fee: platform-fee })
    (ok { price: price, seller-proceeds: seller-proceeds, royalty: royalty })
  )
)

;; Cancel a listing
(define-public (cancel-listing (listing-id uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-LISTING-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender (get seller listing)) ERR-NOT-SELLER)
    (asserts! (get active listing) ERR-LISTING-NOT-FOUND)
    (map-set listings listing-id (merge listing { active: false }))
    (ok true)
  )
)

;; ───────────────────────────────────────────────────────────
;; PUBLIC: AUCTION
;; ───────────────────────────────────────────────────────────

;; Create an auction (ends in `duration` blocks)
(define-public (create-auction
    (contract-address principal)
    (token-id uint)
    (reserve-price uint)
    (duration uint)
    (royalty-bps uint)
    (creator principal))
  (let (
    (auction-id (+ (var-get auction-counter) u1))
    (end-block (+ stacks-block-height duration))
  )
    (asserts! (> duration u0) ERR-INVALID-PRICE)
    (asserts! (> reserve-price u0) ERR-INVALID-PRICE)
    (asserts! (<= royalty-bps u1000) ERR-INVALID-PRICE)

    (map-set auctions auction-id {
      seller: tx-sender,
      contract-address: contract-address,
      token-id: token-id,
      reserve-price: reserve-price,
      current-bid: u0,
      current-bidder: none,
      end-block: end-block,
      royalty-bps: royalty-bps,
      creator: creator,
      settled: false
    })

    (var-set auction-counter auction-id)
    (print { event: "auction-created", auction-id: auction-id, seller: tx-sender,
             reserve-price: reserve-price, end-block: end-block })
    (ok { auction-id: auction-id, end-block: end-block })
  )
)

;; Place a bid on an auction (holds funds in escrow)
(define-public (place-bid (auction-id uint) (bid-amount uint))
  (let (
    (auction (unwrap! (map-get? auctions auction-id) ERR-LISTING-NOT-FOUND))
    (current-bid (get current-bid auction))
    (current-bidder (get current-bidder auction))
    (bidder tx-sender)
  )
    (asserts! (< stacks-block-height (get end-block auction)) ERR-AUCTION-ENDED)
    (asserts! (not (get settled auction)) ERR-AUCTION-ENDED)
    (asserts! (>= bid-amount (get reserve-price auction)) ERR-BID-TOO-LOW)
    (asserts! (> bid-amount current-bid) ERR-BID-TOO-LOW)

    ;; Refund previous highest bidder
    (match current-bidder
      prev-bidder
      (try! (as-contract (stx-transfer? current-bid tx-sender prev-bidder)))
      true
    )

    ;; Lock new bid in contract
    (try! (stx-transfer? bid-amount bidder (as-contract tx-sender)))

    ;; Update auction
    (map-set auctions auction-id (merge auction {
      current-bid: bid-amount,
      current-bidder: (some bidder)
    }))

    (print { event: "bid-placed", auction-id: auction-id, bidder: bidder, amount: bid-amount })
    (ok { bid: bid-amount, auction-id: auction-id })
  )
)

;; Settle auction after end block
(define-public (settle-auction (auction-id uint))
  (let (
    (auction (unwrap! (map-get? auctions auction-id) ERR-LISTING-NOT-FOUND))
    (seller (get seller auction))
    (creator (get creator auction))
    (price (get current-bid auction))
    (royalty-bps (get royalty-bps auction))
    (fees (unwrap! (calculate-fees price royalty-bps) ERR-INVALID-PRICE))
    (platform-fee (get platform-fee fees))
    (royalty (get royalty fees))
    (seller-proceeds (get seller-proceeds fees))
  )
    (asserts! (>= stacks-block-height (get end-block auction)) ERR-AUCTION-ACTIVE)
    (asserts! (not (get settled auction)) ERR-LISTING-NOT-FOUND)

    (match (get current-bidder auction)
      winner
      (begin
        ;; Pay seller, creator, platform
        (try! (as-contract (stx-transfer? seller-proceeds tx-sender seller)))
        (if (> royalty u0)
          (try! (as-contract (stx-transfer? royalty tx-sender creator)))
          true
        )
        (var-set total-volume (+ (var-get total-volume) price))
        (var-set total-fees (+ (var-get total-fees) platform-fee))
        (var-set platform-balance (+ (var-get platform-balance) platform-fee))
        (print { event: "auction-settled", auction-id: auction-id, winner: winner, price: price })
        true
      )
      ;; No bidders - auction expires
      (print { event: "auction-expired", auction-id: auction-id })
    )

    (map-set auctions auction-id (merge auction { settled: true }))
    (ok true)
  )
)

;; ───────────────────────────────────────────────────────────
;; ADMIN
;; ───────────────────────────────────────────────────────────

(define-public (withdraw-platform-fees (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= amount (var-get platform-balance)) ERR-INVALID-PRICE)
    (try! (as-contract (stx-transfer? amount tx-sender CONTRACT-OWNER)))
    (var-set platform-balance (- (var-get platform-balance) amount))
    (ok amount)
  )
)

;; ───────────────────────────────────────────────────────────
;; INIT
;; ───────────────────────────────────────────────────────────
(begin
  (var-set listing-counter u0)
  (var-set auction-counter u0)
  (var-set total-volume u0)
  (var-set total-fees u0)
  (var-set platform-balance u0)
)

(define-map nft-metadata uint (string-ascii 256))

(define-map nft-metadata uint (string-ascii 256))
