CREATE DATABASE IF NOT EXISTS advanced_wasel_palestine
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE advanced_wasel_palestine;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS roles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_id BIGINT UNSIGNED NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NULL,
    failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role_id (role_id),
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checkpoints (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    current_status VARCHAR(50) NOT NULL,
    description TEXT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_checkpoints_status (current_status),
    KEY idx_checkpoints_location (latitude, longitude),
    KEY idx_checkpoints_created_by (created_by),
    KEY idx_checkpoints_updated_by (updated_by),
    KEY idx_checkpoints_created_at (created_at),
    KEY idx_checkpoints_updated_at (updated_at),
    CONSTRAINT fk_checkpoints_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_checkpoints_updated_by
        FOREIGN KEY (updated_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checkpoint_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    checkpoint_id BIGINT UNSIGNED NOT NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by BIGINT UNSIGNED NULL,
    change_note TEXT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_csh_checkpoint_id (checkpoint_id),
    KEY idx_csh_changed_by (changed_by),
    KEY idx_csh_changed_at (changed_at),
    CONSTRAINT fk_csh_checkpoint
        FOREIGN KEY (checkpoint_id) REFERENCES checkpoints (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_csh_changed_by
        FOREIGN KEY (changed_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incident_categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_incident_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incident_severities (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    rank_order SMALLINT UNSIGNED NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_incident_severities_name (name),
    UNIQUE KEY uq_incident_severities_rank_order (rank_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incident_statuses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_incident_statuses_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incidents (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    severity_id BIGINT UNSIGNED NOT NULL,
    status_id BIGINT UNSIGNED NOT NULL,
    checkpoint_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    verified_by BIGINT UNSIGNED NULL,
    closed_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL DEFAULT NULL,
    closed_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_incidents_category_id (category_id),
    KEY idx_incidents_severity_id (severity_id),
    KEY idx_incidents_status_id (status_id),
    KEY idx_incidents_checkpoint_id (checkpoint_id),
    KEY idx_incidents_created_by (created_by),
    KEY idx_incidents_verified_by (verified_by),
    KEY idx_incidents_closed_by (closed_by),
    KEY idx_incidents_location (latitude, longitude),
    KEY idx_incidents_created_at (created_at),
    KEY idx_incidents_verified_at (verified_at),
    KEY idx_incidents_closed_at (closed_at),
    KEY idx_incidents_updated_at (updated_at),
    KEY idx_incidents_status_updated_at (status_id, updated_at),
    CONSTRAINT fk_incidents_category
        FOREIGN KEY (category_id) REFERENCES incident_categories (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_incidents_severity
        FOREIGN KEY (severity_id) REFERENCES incident_severities (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_incidents_status
        FOREIGN KEY (status_id) REFERENCES incident_statuses (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_incidents_checkpoint
        FOREIGN KEY (checkpoint_id) REFERENCES checkpoints (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_incidents_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_incidents_verified_by
        FOREIGN KEY (verified_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_incidents_closed_by
        FOREIGN KEY (closed_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incident_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id BIGINT UNSIGNED NOT NULL,
    from_status_id BIGINT UNSIGNED NULL,
    to_status_id BIGINT UNSIGNED NOT NULL,
    changed_by BIGINT UNSIGNED NULL,
    change_reason TEXT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ish_incident_id (incident_id),
    KEY idx_ish_from_status_id (from_status_id),
    KEY idx_ish_to_status_id (to_status_id),
    KEY idx_ish_changed_by (changed_by),
    KEY idx_ish_changed_at (changed_at),
    CONSTRAINT fk_ish_incident
        FOREIGN KEY (incident_id) REFERENCES incidents (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ish_from_status
        FOREIGN KEY (from_status_id) REFERENCES incident_statuses (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_ish_to_status
        FOREIGN KEY (to_status_id) REFERENCES incident_statuses (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_ish_changed_by
        FOREIGN KEY (changed_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reports (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    submitted_by BIGINT UNSIGNED NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    description TEXT NOT NULL,
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'under_review', 'approved', 'rejected', 'merged', 'converted') NOT NULL DEFAULT 'pending',
    confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    trust_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    trust_status ENUM('suspicious', 'needs_review', 'trusted') NOT NULL DEFAULT 'needs_review',
    trust_reasons JSON NULL,
    duplicate_of_report_id BIGINT UNSIGNED NULL,
    converted_incident_id BIGINT UNSIGNED NULL,
    PRIMARY KEY (id),
    KEY idx_reports_submitted_by (submitted_by),
    KEY idx_reports_category_id (category_id),
    KEY idx_reports_status (status),
    KEY idx_reports_duplicate_of_report_id (duplicate_of_report_id),
    KEY idx_reports_converted_incident_id (converted_incident_id),
    KEY idx_reports_location (latitude, longitude),
    KEY idx_reports_reported_at (reported_at),
    KEY idx_reports_confidence_score (confidence_score),
    KEY idx_reports_trust_score (trust_score),
    KEY idx_reports_trust_status (trust_status),
    KEY idx_reports_submitted_reported_at (submitted_by, reported_at),
    KEY idx_reports_category_status_reported_at (category_id, status, reported_at),
    CONSTRAINT fk_reports_submitted_by
        FOREIGN KEY (submitted_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reports_category
        FOREIGN KEY (category_id) REFERENCES incident_categories (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_reports_duplicate_of_report
        FOREIGN KEY (duplicate_of_report_id) REFERENCES reports (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reports_converted_incident
        FOREIGN KEY (converted_incident_id) REFERENCES incidents (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT chk_reports_confidence_score
        CHECK (confidence_score >= 0 AND confidence_score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_votes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    report_id BIGINT UNSIGNED NOT NULL,
    vote_type ENUM('confirm', 'deny') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_report_votes_user_report (user_id, report_id),
    KEY idx_report_votes_report_id (report_id),
    KEY idx_report_votes_vote_type (vote_type),
    CONSTRAINT fk_report_votes_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_report_votes_report
        FOREIGN KEY (report_id) REFERENCES reports (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    report_id BIGINT UNSIGNED NOT NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    image_url VARCHAR(500) NOT NULL,
    media_type ENUM('accident', 'checkpoint', 'traffic') NOT NULL,
    caption VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_report_images_report_id (report_id),
    KEY idx_report_images_uploaded_by (uploaded_by),
    KEY idx_report_images_media_type (media_type),
    CONSTRAINT fk_report_images_report
        FOREIGN KEY (report_id) REFERENCES reports (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_report_images_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_image_analyses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    report_image_id BIGINT UNSIGNED NOT NULL,
    analysis_provider VARCHAR(100) NOT NULL,
    detected_label VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    summary TEXT NOT NULL,
    severity_hint VARCHAR(50) NULL,
    is_relevant TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_report_image_analyses_report_image_id (report_image_id),
    KEY idx_report_image_analyses_label (detected_label),
    CONSTRAINT fk_report_image_analyses_report_image
        FOREIGN KEY (report_image_id) REFERENCES report_images (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_points_ledger (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    report_id BIGINT UNSIGNED NULL,
    action_type ENUM('report_approved', 'report_converted', 'trusted_report_bonus') NOT NULL,
    points INT NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_points_ledger_user_report_action (user_id, report_id, action_type),
    KEY idx_user_points_ledger_user_id (user_id),
    KEY idx_user_points_ledger_report_id (report_id),
    KEY idx_user_points_ledger_action_type (action_type),
    CONSTRAINT fk_user_points_ledger_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_user_points_ledger_report
        FOREIGN KEY (report_id) REFERENCES reports (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS external_api_caches (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider VARCHAR(50) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    cache_key VARCHAR(191) NOT NULL,
    request_url VARCHAR(500) NOT NULL,
    response_payload JSON NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_external_api_caches_provider_endpoint_cache_key (provider, endpoint, cache_key),
    KEY idx_external_api_caches_expires_at (expires_at),
    KEY idx_external_api_caches_provider_endpoint (provider, endpoint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS external_api_request_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider VARCHAR(50) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    cache_key VARCHAR(191) NULL,
    request_url VARCHAR(500) NOT NULL,
    status_code INT UNSIGNED NULL,
    duration_ms INT UNSIGNED NULL,
    was_cached TINYINT(1) NOT NULL DEFAULT 0,
    was_successful TINYINT(1) NOT NULL DEFAULT 1,
    error_message VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_external_api_request_logs_provider_created_at (provider, created_at),
    KEY idx_external_api_request_logs_endpoint_created_at (endpoint, created_at),
    KEY idx_external_api_request_logs_was_cached (was_cached)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_moderation_actions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    report_id BIGINT UNSIGNED NOT NULL,
    action_type ENUM('approved', 'rejected', 'merged', 'flagged_abuse', 'converted_to_incident') NOT NULL,
    performed_by BIGINT UNSIGNED NULL,
    target_report_id BIGINT UNSIGNED NULL,
    target_incident_id BIGINT UNSIGNED NULL,
    action_note TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_rma_report_id (report_id),
    KEY idx_rma_performed_by (performed_by),
    KEY idx_rma_target_report_id (target_report_id),
    KEY idx_rma_target_incident_id (target_incident_id),
    KEY idx_rma_created_at (created_at),
    CONSTRAINT fk_rma_report
        FOREIGN KEY (report_id) REFERENCES reports (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_rma_performed_by
        FOREIGN KEY (performed_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_rma_target_report
        FOREIGN KEY (target_report_id) REFERENCES reports (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_rma_target_incident
        FOREIGN KEY (target_incident_id) REFERENCES incidents (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    geographic_area VARCHAR(255) NOT NULL,
    category_id BIGINT UNSIGNED NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_alert_subscriptions_user_id (user_id),
    KEY idx_alert_subscriptions_category_id (category_id),
    KEY idx_alert_subscriptions_is_active (is_active),
    KEY idx_alert_subscriptions_created_at (created_at),
    CONSTRAINT fk_alert_subscriptions_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_alert_subscriptions_category
        FOREIGN KEY (category_id) REFERENCES incident_categories (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    subscription_id BIGINT UNSIGNED NOT NULL,
    incident_id BIGINT UNSIGNED NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'read') NOT NULL DEFAULT 'pending',
    payload JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_alerts_subscription_incident (subscription_id, incident_id),
    KEY idx_alerts_subscription_id (subscription_id),
    KEY idx_alerts_incident_id (incident_id),
    KEY idx_alerts_status (status),
    KEY idx_alerts_created_at (created_at),
    KEY idx_alerts_sent_at (sent_at),
    CONSTRAINT fk_alerts_subscription
        FOREIGN KEY (subscription_id) REFERENCES alert_subscriptions (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_alerts_incident
        FOREIGN KEY (incident_id) REFERENCES incidents (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS route_estimations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    start_lat DECIMAL(10,7) NOT NULL,
    start_lng DECIMAL(10,7) NOT NULL,
    end_lat DECIMAL(10,7) NOT NULL,
    end_lng DECIMAL(10,7) NOT NULL,
    estimated_distance_km DECIMAL(10,2) NOT NULL,
    estimated_duration_minutes INT UNSIGNED NOT NULL,
    base_duration_minutes INT UNSIGNED NOT NULL,
    constraints_delay_minutes INT UNSIGNED NOT NULL DEFAULT 0,
    mobility_delay_minutes INT UNSIGNED NOT NULL DEFAULT 0,
    route_provider VARCHAR(50) NULL,
    route_provider_source VARCHAR(30) NULL,
    weather_provider VARCHAR(50) NULL,
    weather_provider_source VARCHAR(30) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_route_estimations_created_at (created_at),
    KEY idx_route_estimations_duration (estimated_duration_minutes),
    KEY idx_route_estimations_distance (estimated_distance_km)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE route_estimations
    ADD COLUMN IF NOT EXISTS route_provider VARCHAR(50) NULL AFTER mobility_delay_minutes,
    ADD COLUMN IF NOT EXISTS route_provider_source VARCHAR(30) NULL AFTER route_provider,
    ADD COLUMN IF NOT EXISTS weather_provider VARCHAR(50) NULL AFTER route_provider_source,
    ADD COLUMN IF NOT EXISTS weather_provider_source VARCHAR(30) NULL AFTER weather_provider;

CREATE TABLE IF NOT EXISTS route_estimation_constraints (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    route_estimation_id BIGINT UNSIGNED NOT NULL,
    constraint_type VARCHAR(50) NOT NULL,
    value VARCHAR(255) NULL,
    PRIMARY KEY (id),
    KEY idx_rec_route_estimation_id (route_estimation_id),
    KEY idx_rec_constraint_type (constraint_type),
    CONSTRAINT fk_rec_route_estimation
        FOREIGN KEY (route_estimation_id) REFERENCES route_estimations (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS route_estimation_factors (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    route_estimation_id BIGINT UNSIGNED NOT NULL,
    factor_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    delay_minutes INT UNSIGNED NOT NULL DEFAULT 0,
    affected_checkpoint_id BIGINT UNSIGNED NULL,
    affected_incident_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ref_route_estimation_id (route_estimation_id),
    KEY idx_ref_factor_type (factor_type),
    KEY idx_ref_affected_checkpoint_id (affected_checkpoint_id),
    KEY idx_ref_affected_incident_id (affected_incident_id),
    CONSTRAINT fk_ref_route_estimation
        FOREIGN KEY (route_estimation_id) REFERENCES route_estimations (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ref_affected_checkpoint
        FOREIGN KEY (affected_checkpoint_id) REFERENCES checkpoints (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_ref_affected_incident
        FOREIGN KEY (affected_incident_id) REFERENCES incidents (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT UNSIGNED NULL,
    action_type ENUM('create', 'update', 'verify', 'close', 'approve', 'reject', 'merge', 'flag_abuse', 'convert_to_incident') NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    description TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_logs_actor_user_id (actor_user_id),
    KEY idx_audit_logs_entity (entity_type, entity_id),
    KEY idx_audit_logs_action_type (action_type),
    KEY idx_audit_logs_created_at (created_at),
    CONSTRAINT fk_audit_logs_actor_user
        FOREIGN KEY (actor_user_id) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

