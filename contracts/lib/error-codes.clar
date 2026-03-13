
;; StacksRank Error Codes Library
;; Shared constants for error handling across all protocol contracts.

(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-FORBIDDEN (err u403))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-CONFLICT (err u409))
(define-constant ERR-INVALID-PARAMS (err u400))

;; Protocol specific
(define-constant ERR-INSUFFICIENT-FUNDS (err u1001))
(define-constant ERR-INSUFFICIENT-LIQUIDITY (err u1002))
(define-constant ERR-SLIPPAGE-EXCEEDED (err u1003))
(define-constant ERR-DEADLINE-PASSED (err u1004))
(define-constant ERR-QUORUM-NOT-MET (err u2001))
(define-constant ERR-PROPOSAL-ACTIVE (err u2002))

(define-read-only (get-error-message (code uint))
  (if (is-eq code u401) "Unauthorized access"
  (if (is-eq code u403) "Forbidden operation"
  (if (is-eq code u404) "Resource not found"
  (if (is-eq code u400) "Invalid parameters"
  "Unknown error"))))
)
