;; SPDX-License-Identifier: MIT
;; StacksRank Math Library
;; Common math utilities for Clarity contracts.

(define-read-only (min (a uint) (b uint))
  (if (<= a b) a b)
)

(define-read-only (max (a uint) (b uint))
  (if (>= a b) a b)
)

(define-read-only (abs-diff (a uint) (b uint))
  (if (>= a b) (- a b) (- b a))
)

;; Scaled multiplication: (a * b) / scale
(define-read-only (mul-scale (a uint) (b uint) (scale uint))
  (/ (* a b) scale)
)

;; Scaled division: (a * scale) / b
(define-read-only (div-scale (a uint) (scale uint) (b uint))
  (/ (* a scale) b)
)
