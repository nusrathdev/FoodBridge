-- Foreign keys are declared with FOREIGN KEY clauses on purpose. MySQL silently ignores an
-- inline `col ... REFERENCES other(id)`, which is how this schema ran without any constraints before.
-- CASCADE where a row means nothing without its parent; the default (no action) where the row
-- is history that must be kept.

CREATE TABLE users (
                       id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                       name VARCHAR(100) NOT NULL,
                       email VARCHAR(150) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       role ENUM('donor','admin','volunteer') NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donors (
                        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                        user_id CHAR(36) NOT NULL,
                        org_name VARCHAR(200),
                        food_handling_cert VARCHAR(255),
                        status ENUM('pending','approved','rejected') DEFAULT 'pending',
                        rejection_reason TEXT,
                        verified_at TIMESTAMP,
                        CONSTRAINT fk_donors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE food_posts (
                            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                            donor_id CHAR(36) NOT NULL,
                            food_type VARCHAR(200) NOT NULL,
                            quantity VARCHAR(100) NOT NULL,
                            pickup_address TEXT NOT NULL,
                            pickup_window_start DATETIME NOT NULL,
                            pickup_window_end DATETIME NOT NULL,
                            status ENUM('available','assigned','collected','distributed','expired') DEFAULT 'available',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT fk_food_posts_donor FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE
);

CREATE TABLE collection_tasks (
                                  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                                  food_post_id CHAR(36) NOT NULL,
                                  volunteer_id CHAR(36) NOT NULL,
                                  assigned_by CHAR(36) NOT NULL,
                                  status ENUM('assigned','collected','delivered','cancelled') DEFAULT 'assigned',
                                  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  collected_at TIMESTAMP,
                                  delivered_at TIMESTAMP,
                                  CONSTRAINT fk_tasks_food_post FOREIGN KEY (food_post_id) REFERENCES food_posts(id) ON DELETE CASCADE,
                                  CONSTRAINT fk_tasks_volunteer FOREIGN KEY (volunteer_id) REFERENCES users(id),
                                  CONSTRAINT fk_tasks_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE distributions (
                               id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                               task_id CHAR(36),
                               recipient_group VARCHAR(200),
                               quantity_distributed VARCHAR(100),
                               distributed_by CHAR(36),
                               distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               notes TEXT,
                               CONSTRAINT fk_distributions_task FOREIGN KEY (task_id) REFERENCES collection_tasks(id) ON DELETE CASCADE,
                               CONSTRAINT fk_distributions_user FOREIGN KEY (distributed_by) REFERENCES users(id)
);

CREATE TABLE audit_logs (
                            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                            actor_id CHAR(36),
                            action VARCHAR(100) NOT NULL,
                            entity VARCHAR(100),
                            entity_id CHAR(36),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);
