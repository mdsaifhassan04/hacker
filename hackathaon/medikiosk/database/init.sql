-- MediKiosk Initial Database Schema (Placeholder)
-- Smart India Hackathon 2026

CREATE TABLE IF NOT EXISTS health_checks (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO health_checks (status) VALUES ('ok');
