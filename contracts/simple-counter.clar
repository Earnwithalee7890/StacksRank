;; Simple Counter Contract
;; A basic counter that anyone can increment or decrement

(define-data-var counter int 0)

(define-read-only (get-counter)
  (ok (var-get counter))
)

(define-public (increment)
  (begin
    (var-set counter (+ (var-get counter) 1))
    (ok (var-get counter))
  )
)

(define-public (decrement)
  (begin
    (var-set counter (- (var-get counter) 1))
    (ok (var-get counter))
  )
)

(define-public (reset)
  (begin
    (var-set counter 0)
    (ok true)
  )
)
