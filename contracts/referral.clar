;; Referral Contract
;; Track referrals between users

(define-map referrals principal principal) ;; user -> referrer
(define-map referral-count principal uint)

(define-constant ERR-ALREADY-REFERRED (err u100))
(define-constant ERR-SELF-REFER (err u101))

(define-public (register-referral (referrer principal))
  (begin
    (asserts! (not (is-eq tx-sender referrer)) ERR-SELF-REFER)
    (asserts! (is-none (map-get? referrals tx-sender)) ERR-ALREADY-REFERRED)
    (map-set referrals tx-sender referrer)
    (map-set referral-count referrer (+ (default-to u0 (map-get? referral-count referrer)) u1))
    (ok true)
  )
)

(define-read-only (get-referrer (user principal))
  (ok (map-get? referrals user))
)

(define-read-only (get-referral-count (user principal))
  (ok (default-to u0 (map-get? referral-count user)))
)

(define-public (register-referral (ref principal)) (ok true))

(define-public (register-referral (ref principal)) (ok true))
