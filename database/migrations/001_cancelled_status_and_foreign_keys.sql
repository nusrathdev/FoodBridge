-- Brings a database created from an older schema.sql up to date. Run it once:
--   mysql -u root -p foodbridge < database/migrations/001_cancelled_status_and_foreign_keys.sql
-- A fresh database created from the current schema.sql does not need it.

-- 1. Volunteers can cancel a task, so the status column must accept 'cancelled'.
ALTER TABLE collection_tasks
    MODIFY status ENUM('assigned','collected','delivered','cancelled') DEFAULT 'assigned';

-- 2. Remove rows whose parent no longer exists. The old schema had no real foreign keys
--    (MySQL ignores an inline REFERENCES on a column), so deleting a donor left its food
--    posts behind. Those rows would block the constraints added in step 3.
DELETE d FROM donors d LEFT JOIN users u ON u.id = d.user_id WHERE u.id IS NULL;
DELETE fp FROM food_posts fp LEFT JOIN donors d ON d.id = fp.donor_id WHERE d.id IS NULL;
DELETE t FROM collection_tasks t
    LEFT JOIN food_posts fp ON fp.id = t.food_post_id
    LEFT JOIN users vol ON vol.id = t.volunteer_id
    LEFT JOIN users adm ON adm.id = t.assigned_by
    WHERE fp.id IS NULL OR vol.id IS NULL OR adm.id IS NULL;
DELETE x FROM distributions x
    LEFT JOIN collection_tasks t ON t.id = x.task_id
    LEFT JOIN users u ON u.id = x.distributed_by
    WHERE t.id IS NULL OR u.id IS NULL;
UPDATE audit_logs a LEFT JOIN users u ON u.id = a.actor_id
    SET a.actor_id = NULL WHERE a.actor_id IS NOT NULL AND u.id IS NULL;

-- 3. Real foreign keys.
--    CASCADE where a row means nothing without its parent (a food post without its donor).
--    No action (the default) where the row is history that must be kept (who collected a task).
ALTER TABLE donors
    ADD CONSTRAINT fk_donors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE food_posts
    ADD CONSTRAINT fk_food_posts_donor FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE;

ALTER TABLE collection_tasks
    ADD CONSTRAINT fk_tasks_food_post FOREIGN KEY (food_post_id) REFERENCES food_posts(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_tasks_volunteer FOREIGN KEY (volunteer_id) REFERENCES users(id),
    ADD CONSTRAINT fk_tasks_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id);

ALTER TABLE distributions
    ADD CONSTRAINT fk_distributions_task FOREIGN KEY (task_id) REFERENCES collection_tasks(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_distributions_user FOREIGN KEY (distributed_by) REFERENCES users(id);

ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;
