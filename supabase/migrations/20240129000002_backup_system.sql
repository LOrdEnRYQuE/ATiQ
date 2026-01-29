-- Automated Backup Script for Supabase
-- Run this daily to backup critical data

-- Create backup function
CREATE OR REPLACE FUNCTION create_daily_backup()
RETURNS TABLE(
    backup_name TEXT,
    table_name TEXT,
    row_count BIGINT,
    backup_time TIMESTAMPTZ
) AS $$
DECLARE
    backup_timestamp TIMESTAMPTZ := NOW();
    backup_name TEXT := 'backup_' || to_char(backup_timestamp, 'YYYY_MM_DD_HH24_MI_SS');
BEGIN
    -- Backup users table
    INSERT INTO backups.users_backup (backup_id, user_data, backup_time)
    SELECT 
        backup_name,
        json_agg(to_jsonb(t)),
        backup_timestamp
    FROM (
        SELECT * FROM users
    ) t;
    
    RETURN QUERY
    SELECT 
        backup_name,
        'users',
        (SELECT COUNT(*) FROM users),
        backup_timestamp;
    
    -- Backup projects table
    INSERT INTO backups.projects_backup (backup_id, project_data, backup_time)
    SELECT 
        backup_name,
        json_agg(to_jsonb(t)),
        backup_timestamp
    FROM (
        SELECT * FROM projects
    ) t;
    
    RETURN QUERY
    SELECT 
        backup_name,
        'projects',
        (SELECT COUNT(*) FROM projects),
        backup_timestamp;
    
    -- Backup ai_requests table (last 30 days only)
    INSERT INTO backups.ai_requests_backup (backup_id, request_data, backup_time)
    SELECT 
        backup_name,
        json_agg(to_jsonb(t)),
        backup_timestamp
    FROM (
        SELECT * FROM ai_requests 
        WHERE created_at >= backup_timestamp - interval '30 days'
    ) t;
    
    RETURN QUERY
    SELECT 
        backup_name,
        'ai_requests_30d',
        (SELECT COUNT(*) FROM ai_requests WHERE created_at >= backup_timestamp - interval '30 days'),
        backup_timestamp;
    
    -- Backup subscriptions table
    INSERT INTO backups.subscriptions_backup (backup_id, subscription_data, backup_time)
    SELECT 
        backup_name,
        json_agg(to_jsonb(t)),
        backup_timestamp
    FROM (
        SELECT * FROM subscriptions
    ) t;
    
    RETURN QUERY
    SELECT 
        backup_name,
        'subscriptions',
        (SELECT COUNT(*) FROM subscriptions),
        backup_timestamp;
END;
$$ LANGUAGE plpgsql;

-- Create backup schema and tables
CREATE SCHEMA IF NOT EXISTS backups;

-- Backup tables
CREATE TABLE IF NOT EXISTS backups.users_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id TEXT NOT NULL,
    user_data JSONB NOT NULL,
    backup_time TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backups.projects_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id TEXT NOT NULL,
    project_data JSONB NOT NULL,
    backup_time TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backups.ai_requests_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id TEXT NOT NULL,
    request_data JSONB NOT NULL,
    backup_time TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backups.subscriptions_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id TEXT NOT NULL,
    subscription_data JSONB NOT NULL,
    backup_time TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for backup tables
CREATE INDEX IF NOT EXISTS idx_users_backup_backup_id ON backups.users_backup(backup_id);
CREATE INDEX IF NOT EXISTS idx_users_backup_backup_time ON backups.users_backup(backup_time);

CREATE INDEX IF NOT EXISTS idx_projects_backup_backup_id ON backups.projects_backup(backup_id);
CREATE INDEX IF NOT EXISTS idx_projects_backup_backup_time ON backups.projects_backup(backup_time);

CREATE INDEX IF NOT EXISTS idx_ai_requests_backup_backup_id ON backups.ai_requests_backup(backup_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_backup_backup_time ON backups.ai_requests_backup(backup_time);

CREATE INDEX IF NOT EXISTS idx_subscriptions_backup_backup_id ON backups.subscriptions_backup(backup_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_backup_backup_time ON backups.subscriptions_backup(backup_time);

-- Create cleanup function to remove old backups (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old user backups
    DELETE FROM backups.users_backup 
    WHERE backup_time < NOW() - interval '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old project backups
    DELETE FROM backups.projects_backup 
    WHERE backup_time < NOW() - interval '90 days';
    
    -- Clean up old AI request backups
    DELETE FROM backups.ai_requests_backup 
    WHERE backup_time < NOW() - interval '90 days';
    
    -- Clean up old subscription backups
    DELETE FROM backups.subscriptions_backup 
    WHERE backup_time < NOW() - interval '90 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to service role
GRANT USAGE ON SCHEMA backups TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA backups TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA backups TO service_role;

-- Create a view for backup status
CREATE OR REPLACE VIEW backups.backup_status AS
SELECT 
    'users' as table_name,
    COUNT(*) as backup_count,
    MAX(backup_time) as last_backup
FROM backups.users_backup
UNION ALL
SELECT 
    'projects' as table_name,
    COUNT(*) as backup_count,
    MAX(backup_time) as last_backup
FROM backups.projects_backup
UNION ALL
SELECT 
    'ai_requests' as table_name,
    COUNT(*) as backup_count,
    MAX(backup_time) as last_backup
FROM backups.ai_requests_backup
UNION ALL
SELECT 
    'subscriptions' as table_name,
    COUNT(*) as backup_count,
    MAX(backup_time) as last_backup
FROM backups.subscriptions_backup;

-- Grant access to backup status view
GRANT SELECT ON backups.backup_status TO service_role;
