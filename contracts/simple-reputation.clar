;; Simple Reputation Contract - Advanced Version
;; Tracks user reputation with daily check-ins, contributions, and tiers
;; Tiers: Novice (0-99), Builder (100-499), Expert (500-999), Legend (1000+)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-REGISTERED (err u102))
(define-constant ERR-ALREADY-CHECKED-IN (err u103))
(define-constant ERR-INVALID-AMOUNT (err u104))

;; Data variables
(define-data-var total-users uint u0)
(define-data-var total-check-ins uint u0)

;; User reputation data
(define-map users
  principal
  {
    score: uint,
    streak: uint,
    last-check-in: uint,
    contributions: uint,
    registered-at: uint
  }
)

;; Contribution tracking
(define-map contributions
  { user: principal, contribution-id: uint }
  {
    description: (string-ascii 256),
    points: uint,
    timestamp: uint
  }
)

;; Read-only functions
(define-read-only (get-user-info (user principal))
  (map-get? users user)
)

(define-read-only (get-total-users)
  (ok (var-get total-users))
)

(define-read-only (get-leaderboard-stats)
  (ok {
    total-users: (var-get total-users),
    total-check-ins: (var-get total-check-ins)
  })
)

(define-read-only (get-tier (user principal))
  (let
    (
      (user-data (unwrap! (map-get? users user) (err u404)))
      (score (get score user-data))
    )
    (if (>= score u1000)
      (ok "Legend")
      (if (>= score u500)
        (ok "Expert")
        (if (>= score u100)
          (ok "Builder")
          (ok "Novice")
        )
      )
    )
  )
)

(define-read-only (get-contract-version)
  (ok u2)
)

;; Public functions
(define-public (register-user)
  (let
    (
      (caller tx-sender)
      (existing-user (map-get? users caller))
    )
    (asserts! (is-none existing-user) ERR-ALREADY-REGISTERED)
    
    (map-set users caller {
      score: u0,
      streak: u0,
      last-check-in: u0,
      contributions: u0,
      registered-at: stacks-block-height
    })
    
    (var-set total-users (+ (var-get total-users) u1))
    (print { event: "register", user: caller, timestamp: stacks-block-height })
    (ok true)
  )
)

(define-public (daily-check-in)
  (let
    (
      (caller tx-sender)
      (user-data (unwrap! (map-get? users caller) ERR-NOT-REGISTERED))
      (last-check (get last-check-in user-data))
      (current-streak (get streak user-data))
      (current-score (get score user-data))
    )
    ;; Check if already checked in today (within last 144 blocks ~24h)
    (asserts! (> (- stacks-block-height last-check) u144) ERR-ALREADY-CHECKED-IN)
    
    (let
      (
        ;; Calculate new streak
        (new-streak (if (and (> last-check u0) (<= (- stacks-block-height last-check) u288))
                      (+ current-streak u1)  ;; Continue streak
                      u1))                    ;; Reset streak
        ;; Calculate points: 10 base + streak bonus
        (points (+ u10 new-streak))
        (new-score (+ current-score points))
      )
      
      (map-set users caller (merge user-data {
        score: new-score,
        streak: new-streak,
        last-check-in: stacks-block-height
      }))
      
      (var-set total-check-ins (+ (var-get total-check-ins) u1))
      (print { event: "check-in", user: caller, points: points, total-score: new-score })
      (ok points)
    )
  )
)

(define-public (add-contribution (description (string-ascii 256)) (points uint))
  (let
    (
      (caller tx-sender)
      (user-data (unwrap! (map-get? users caller) ERR-NOT-REGISTERED))
      (contribution-id (get contributions user-data))
      (new-score (+ (get score user-data) points))
    )
    (asserts! (> points u0) ERR-INVALID-AMOUNT)
    (asserts! (<= points u100) ERR-INVALID-AMOUNT)
    
    ;; Record contribution
    (map-set contributions 
      { user: caller, contribution-id: contribution-id }
      {
        description: description,
        points: points,
        timestamp: stacks-block-height
      }
    )
    
    ;; Update user stats
    (map-set users caller (merge user-data {
      score: new-score,
      contributions: (+ contribution-id u1)
    }))
    
    (print { event: "contribution", user: caller, points: points, total-score: new-score })
    (ok true)
  )
)

;; Initialize contract
(begin
  (var-set total-users u0)
  (var-set total-check-ins u0)
)
