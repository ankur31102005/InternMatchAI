-- Enable the pgvector extension for semantic similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure standard timezone is UTC
SET timezone TO 'UTC';
