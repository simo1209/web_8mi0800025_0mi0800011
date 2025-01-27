DROP TABLE IF EXISTS images;
CREATE TABLE IF NOT EXISTS images (
    id BIGSERIAL PRIMARY KEY,
    album_id BIGINT NOT NULL REFERENCES albums(id),

    filepath TEXT NOT NULL,
    dbname TEXT NOT NULL,

    descr TEXT,
    visibility TEXT,
    geo_data JSONB,
    view_count BIGINT DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS albums;
CREATE TABLE IF NOT EXISTS albums (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id),

    name TEXT NOT NULL,
    descr TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
