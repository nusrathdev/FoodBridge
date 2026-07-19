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
                        user_id CHAR(36) NOT NULL REFERENCES users(id),
                        org_name VARCHAR(200),
                        food_handling_cert VARCHAR(255),
                        status ENUM('pending','approved','rejected') DEFAULT 'pending',
                        rejection_reason TEXT,
                        verified_at TIMESTAMP
);

CREATE TABLE food_posts (
                            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                            donor_id CHAR(36) NOT NULL REFERENCES donors(id),
                            food_type VARCHAR(200) NOT NULL,
                            quantity VARCHAR(100) NOT NULL,
                            pickup_address TEXT NOT NULL,
                            pickup_window_start DATETIME NOT NULL,
                            pickup_window_end DATETIME NOT NULL,
                            status ENUM('available','assigned','collected','distributed','expired') DEFAULT 'available',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_tasks (
                                  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                                  food_post_id CHAR(36) NOT NULL REFERENCES food_posts(id),
                                  volunteer_id CHAR(36) NOT NULL REFERENCES users(id),
                                  assigned_by CHAR(36) NOT NULL REFERENCES users(id),
                                  status ENUM('assigned','collected','delivered') DEFAULT 'assigned',
                                  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  collected_at TIMESTAMP,
                                  delivered_at TIMESTAMP
);

CREATE TABLE distributions (
                               id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                               task_id CHAR(36) REFERENCES collection_tasks(id),
                               recipient_group VARCHAR(200),
                               quantity_distributed VARCHAR(100),
                               distributed_by CHAR(36) REFERENCES users(id),
                               distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               notes TEXT
);

CREATE TABLE audit_logs (
                            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                            actor_id CHAR(36) REFERENCES users(id),
                            action VARCHAR(100) NOT NULL,
                            entity VARCHAR(100),
                            entity_id CHAR(36),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);