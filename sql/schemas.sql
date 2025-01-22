CREATE TABLE IF NOT EXISTS images (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    description TEXT,
    visibility TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);