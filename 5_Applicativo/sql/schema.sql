CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    token_hash BYTEA NOT NULL UNIQUE,
    salt BYTEA NOT NULL,
    metadata BYTEA NOT NULL,
    path TEXT NOT NULL,
    ciphertext_length BIGINT NOT NULL,
    max_downloads INT NOT NULL DEFAULT 1,
    download_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL UNIQUE REFERENCES files(id) ON DELETE CASCADE,
    email BYTEA,
    notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('upload','download','delete','expire')),
    time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actor_ip INET,
    details TEXT
);
