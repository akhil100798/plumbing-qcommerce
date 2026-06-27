CREATE TABLE IF NOT EXISTS user_addresses (
    id BIGSERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id)
);
