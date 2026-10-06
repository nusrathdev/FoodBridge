-- Adds delivery destinations. Run it once on a database that already has migration 001:
--   mysql -u root -p foodbridge < database/migrations/002_recipients.sql
-- A fresh database created from the current schema.sql does not need it.

-- The places the NGO delivers food to (shelters, communities, homes).
-- `active` lets an admin retire a recipient without deleting the history that points at it.
CREATE TABLE recipients (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    contact_phone VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The destination is chosen when a task is assigned. Nullable only because tasks created
-- before this migration have none; the API requires it for every new task.
ALTER TABLE collection_tasks
    ADD COLUMN recipient_id CHAR(36) NULL AFTER assigned_by,
    ADD CONSTRAINT fk_tasks_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(id);

-- A distribution records which recipient actually received the food.
-- recipient_group keeps the name as it was at the time, so old reports read the same.
ALTER TABLE distributions
    ADD COLUMN recipient_id CHAR(36) NULL AFTER task_id,
    ADD CONSTRAINT fk_distributions_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(id);
