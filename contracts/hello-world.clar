;; Hello World Contract
;; Returns a greeting message

(define-read-only (say-hello)
  (ok "Hello, Stacks!")
)

(define-read-only (greet (name (string-ascii 50)))
  (ok name)
)

(define-data-var message (string-ascii 100) "Welcome to Stacks")

(define-public (set-message (new-message (string-ascii 100)))
  (begin
    (var-set message new-message)
    (ok true)
  )
)

(define-read-only (get-message)
  (ok (var-get message))
)
