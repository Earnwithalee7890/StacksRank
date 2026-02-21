;; Todo List Contract
;; On-chain todo list per user

(define-map todos { owner: principal, id: uint } { task: (string-ascii 100), done: bool })
(define-map user-task-count principal uint)

(define-read-only (get-task-count (user principal))
  (default-to u0 (map-get? user-task-count user))
)

(define-public (add-todo (task (string-ascii 100)))
  (let ((current-count (get-task-count tx-sender))
        (new-id (+ current-count u1)))
    (map-set todos { owner: tx-sender, id: new-id } { task: task, done: false })
    (map-set user-task-count tx-sender new-id)
    (ok new-id)
  )
)

(define-public (complete-todo (id uint))
  (let ((todo (unwrap! (map-get? todos { owner: tx-sender, id: id }) (err u404))))
    (map-set todos { owner: tx-sender, id: id } (merge todo { done: true }))
    (ok true)
  )
)

(define-read-only (get-todo (user principal) (id uint))
  (ok (map-get? todos { owner: user, id: id }))
)
