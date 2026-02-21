;; Simple Poll Contract
;; Create a yes/no poll and let people vote

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-ALREADY-VOTED (err u101))

(define-data-var question (string-ascii 200) "Do you like Stacks?")
(define-data-var yes-count uint u0)
(define-data-var no-count uint u0)
(define-map voters principal bool)

(define-public (vote-yes)
  (begin
    (asserts! (is-none (map-get? voters tx-sender)) ERR-ALREADY-VOTED)
    (map-set voters tx-sender true)
    (var-set yes-count (+ (var-get yes-count) u1))
    (ok true)
  )
)

(define-public (vote-no)
  (begin
    (asserts! (is-none (map-get? voters tx-sender)) ERR-ALREADY-VOTED)
    (map-set voters tx-sender false)
    (var-set no-count (+ (var-get no-count) u1))
    (ok true)
  )
)

(define-read-only (get-results)
  (ok { yes: (var-get yes-count), no: (var-get no-count) })
)

(define-read-only (get-question)
  (ok (var-get question))
)

(define-read-only (has-voted (voter principal))
  (ok (is-some (map-get? voters voter)))
)
