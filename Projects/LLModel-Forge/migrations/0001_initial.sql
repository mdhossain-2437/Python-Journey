-- LLModel-Forge Database Schema
-- PostgreSQL Migration

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE model_stage AS ENUM ('development', 'staging', 'production', 'archived');
CREATE TYPE pipeline_status AS ENUM ('idle', 'running', 'completed', 'failed');
CREATE TYPE step_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE feature_status AS ENUM ('online', 'offline', 'staging', 'archived');
CREATE TYPE experiment_status AS ENUM ('running', 'completed', 'failed', 'stopped');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'ML Engineer',
    team TEXT DEFAULT 'Data Science',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    stage model_stage DEFAULT 'development',
    framework TEXT NOT NULL,
    description TEXT,
    accuracy REAL,
    f1_score REAL,
    latency INTEGER,
    tags JSONB DEFAULT '[]',
    author_id VARCHAR(36) REFERENCES users(id),
    model_path TEXT,
    config_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiments table
CREATE TABLE IF NOT EXISTS experiments (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    name TEXT NOT NULL,
    description TEXT,
    status experiment_status DEFAULT 'running',
    model_id VARCHAR(36) REFERENCES models(id),
    author_id VARCHAR(36) REFERENCES users(id),
    hyperparameters JSONB,
    metrics JSONB,
    accuracy REAL,
    f1_score REAL,
    duration TEXT,
    epochs_completed INTEGER DEFAULT 0,
    total_epochs INTEGER DEFAULT 10,
    logs JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Features table
CREATE TABLE IF NOT EXISTS features (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    data_type TEXT NOT NULL,
    entity TEXT NOT NULL,
    status feature_status DEFAULT 'staging',
    version TEXT DEFAULT '1.0.0',
    source_table TEXT,
    transformation_sql TEXT,
    statistics JSONB,
    author_id VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    name TEXT NOT NULL,
    description TEXT,
    status pipeline_status DEFAULT 'idle',
    schedule TEXT,
    trigger_type TEXT DEFAULT 'manual',
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    author_id VARCHAR(36) REFERENCES users(id),
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline Steps table
CREATE TABLE IF NOT EXISTS pipeline_steps (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    pipeline_id VARCHAR(36) NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    step_type TEXT NOT NULL,
    status step_status DEFAULT 'pending',
    "order" INTEGER NOT NULL,
    duration TEXT,
    logs JSONB DEFAULT '[]',
    config JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Pipeline Runs table
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    pipeline_id VARCHAR(36) NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    status pipeline_status DEFAULT 'running',
    triggered_by VARCHAR(36) REFERENCES users(id),
    duration TEXT,
    logs JSONB DEFAULT '[]',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Labeling Tasks table
CREATE TABLE IF NOT EXISTS labeling_tasks (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    name TEXT NOT NULL,
    description TEXT,
    dataset_path TEXT,
    total_items INTEGER DEFAULT 0,
    completed_items INTEGER DEFAULT 0,
    classes JSONB,
    author_id VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    task_id VARCHAR(36) NOT NULL REFERENCES labeling_tasks(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    labeled_by VARCHAR(36) REFERENCES users(id),
    confidence REAL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    model_id VARCHAR(36) REFERENCES models(id),
    user_id VARCHAR(36) REFERENCES users(id),
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    score REAL,
    risk TEXT,
    latency INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    environment TEXT DEFAULT 'development',
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    message TEXT NOT NULL,
    model_id VARCHAR(36) REFERENCES models(id),
    pipeline_id VARCHAR(36) REFERENCES pipelines(id),
    is_read BOOLEAN DEFAULT FALSE,
    user_id VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    slack_notifications BOOLEAN DEFAULT FALSE,
    pipeline_alerts BOOLEAN DEFAULT TRUE,
    model_drift_alerts BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT FALSE,
    dark_mode BOOLEAN DEFAULT TRUE,
    compact_view BOOLEAN DEFAULT FALSE
);

-- Integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    metadata JSONB,
    is_connected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_models_stage ON models(stage);
CREATE INDEX IF NOT EXISTS idx_models_author ON models(author_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_model ON experiments(model_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_status ON pipelines(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_steps_pipeline ON pipeline_steps(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_id);

-- Demo user (password: demo123)
INSERT INTO users (id, username, email, password, name, role, team)
VALUES (
    'user_demo',
    'demo',
    'demo@llmodel-forge.com',
    '$2a$10$rOQKZDKQjm8Q7YB4vjfz8eB6xVz0TtBY8MKqV8cqr8HQhwvFhS5Vu',
    'Demo User',
    'ML Engineer',
    'Data Science'
) ON CONFLICT (username) DO NOTHING;

-- Insert demo user settings
INSERT INTO user_settings (user_id, email_notifications, slack_notifications, pipeline_alerts, model_drift_alerts)
VALUES ('user_demo', TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

