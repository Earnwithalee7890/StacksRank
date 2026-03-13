
;; Security Guard Trait
;; Standardizes emergency pause and authorization checks across the ecosystem.

(define-trait guard-trait
  (
    ;; Check if the contract is paused
    (is-paused () (response bool uint))
    
    ;; Set paused state (owner only)
    (set-paused (bool) (response bool uint))
    
    ;; Check if a principal is authorized
    (is-authorized (principal) (response bool uint))
  )
)
