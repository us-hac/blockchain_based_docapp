-- =============================================================
--  Clinic Data Management System — MySQL Schema
--  Capstone Project 2026
-- =============================================================

-- Create and use the database
CREATE DATABASE IF NOT EXISTS clinic_db;
USE clinic_db;

-- =============================================================
-- TABLE: users
-- =============================================================

CREATE TABLE users (
    user_id       CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
    name          VARCHAR(100)    NOT NULL,
    email         VARCHAR(150)    NOT NULL UNIQUE,
    password_hash VARCHAR(255)    NOT NULL,
    role          ENUM('PATIENT','DOCTOR','ADMIN') NOT NULL DEFAULT 'PATIENT',
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- TABLE: patients
-- =============================================================

CREATE TABLE patients (
    patient_id    CHAR(36)    PRIMARY KEY DEFAULT (UUID()),
    user_id       CHAR(36)    NOT NULL UNIQUE,
    date_of_birth DATE,
    blood_type    VARCHAR(5),
    contact_info  TEXT,
    insurance_no  VARCHAR(50),
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_patients_user_id ON patients(user_id);

-- =============================================================
-- TABLE: doctors
-- =============================================================

CREATE TABLE doctors (
    doctor_id      CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    user_id        CHAR(36)     NOT NULL UNIQUE,
    specialization VARCHAR(100),
    license_no     VARCHAR(50)  NOT NULL UNIQUE,
    department     VARCHAR(100),
    CONSTRAINT fk_doctors_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_doctors_user_id ON doctors(user_id);

-- =============================================================
-- TABLE: medical_records
-- =============================================================

CREATE TABLE medical_records (
    record_id    CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    patient_id   CHAR(36)     NOT NULL,
    doctor_id    CHAR(36)     NOT NULL,
    diagnosis    TEXT         NOT NULL,
    prescription TEXT,
    data_hash    VARCHAR(64),             -- SHA-256 hex of JSON record
    tx_hash      VARCHAR(66),             -- Ethereum tx hash (0x + 64 hex chars)
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_records_patient FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_records_doctor FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id) ON DELETE RESTRICT
);

CREATE INDEX idx_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_records_doctor_id  ON medical_records(doctor_id);

-- =============================================================
-- TABLE: appointments
-- =============================================================

CREATE TABLE appointments (
    appointment_id CHAR(36)   PRIMARY KEY DEFAULT (UUID()),
    patient_id     CHAR(36)   NOT NULL,
    doctor_id      CHAR(36)   NOT NULL,
    scheduled_at   TIMESTAMP  NOT NULL,
    status         ENUM('PENDING','CONFIRMED','DONE','CANCELLED') NOT NULL DEFAULT 'PENDING',
    notes          TEXT,
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id  ON appointments(doctor_id);

-- =============================================================
-- TABLE: access_permissions
-- =============================================================

CREATE TABLE access_permissions (
    permission_id CHAR(36)   PRIMARY KEY DEFAULT (UUID()),
    patient_id    CHAR(36)   NOT NULL,
    doctor_id     CHAR(36)   NOT NULL,
    granted_at    TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at    TIMESTAMP  NULL DEFAULT NULL,  -- NULL = still active
    tx_hash       VARCHAR(66),                   -- Blockchain proof of grant/revoke
    CONSTRAINT fk_perm_patient FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_perm_doctor FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

CREATE INDEX idx_permissions_patient_id ON access_permissions(patient_id);
CREATE INDEX idx_permissions_doctor_id  ON access_permissions(doctor_id);

-- =============================================================
-- TABLE: audit_logs
-- =============================================================

CREATE TABLE audit_logs (
    log_id     CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    user_id    CHAR(36)     NOT NULL,
    patient_id CHAR(36)     NOT NULL,
    action     VARCHAR(100) NOT NULL,    -- e.g. VIEW_RECORD, ADD_RECORD, GRANT_ACCESS
    tx_hash    VARCHAR(66),              -- On-chain log reference
    logged_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_log_patient FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE RESTRICT
);

CREATE INDEX idx_logs_patient_id ON audit_logs(patient_id);
CREATE INDEX idx_logs_user_id    ON audit_logs(user_id);

-- =============================================================
-- SAMPLE DATA
-- =============================================================

-- ---- Users ------------------------------------------------
INSERT INTO users (user_id, name, email, password_hash, role) VALUES
-- Doctors (password: 'doctor123' — replace with bcrypt hash in production)
('d1000000-0000-0000-0000-000000000001',
 'Dr. Sarah Ramanujan',
 'sarah.ramanujan@clinic.com',
 '$2b$10$examplehashDOCTOR1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 'DOCTOR'),

('d1000000-0000-0000-0000-000000000002',
 'Dr. Arjun Mehta',
 'arjun.mehta@clinic.com',
 '$2b$10$examplehashDOCTOR2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 'DOCTOR'),

-- Patients (password: 'patient123')
('p1000000-0000-0000-0000-000000000001',
 'Priya Nair',
 'priya.nair@email.com',
 '$2b$10$examplehashPATIENT1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 'PATIENT'),

('p1000000-0000-0000-0000-000000000002',
 'Ravi Subramaniam',
 'ravi.sub@email.com',
 '$2b$10$examplehashPATIENT2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 'PATIENT'),

('p1000000-0000-0000-0000-000000000003',
 'Lakshmi Venkat',
 'lakshmi.v@email.com',
 '$2b$10$examplehashPATIENT3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 'PATIENT');

-- ---- Doctors -----------------------------------------------
INSERT INTO doctors (doctor_id, user_id, specialization, license_no, department) VALUES
('dc100000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000001',
 'Cardiology', 'LIC-2024-001', 'Cardiology'),

('dc100000-0000-0000-0000-000000000002',
 'd1000000-0000-0000-0000-000000000002',
 'General Medicine', 'LIC-2024-002', 'General OPD');

-- ---- Patients ----------------------------------------------
INSERT INTO patients (patient_id, user_id, date_of_birth, blood_type, contact_info, insurance_no) VALUES
('pt100000-0000-0000-0000-000000000001',
 'p1000000-0000-0000-0000-000000000001',
 '1990-05-14', 'B+', '+91-9876543210, Chennai', 'INS-001'),

('pt100000-0000-0000-0000-000000000002',
 'p1000000-0000-0000-0000-000000000002',
 '1985-11-22', 'O+', '+91-9876543211, Chennai', 'INS-002'),

('pt100000-0000-0000-0000-000000000003',
 'p1000000-0000-0000-0000-000000000003',
 '1978-03-08', 'A-', '+91-9876543212, Chennai', NULL);

-- ---- Medical Records (tx_hash left NULL until blockchain anchored) --
INSERT INTO medical_records
    (record_id, patient_id, doctor_id, diagnosis, prescription, data_hash, tx_hash)
VALUES
('re100000-0000-0000-0000-000000000001',
 'pt100000-0000-0000-0000-000000000001',
 'dc100000-0000-0000-0000-000000000001',
 'Hypertension Stage 1',
 'Amlodipine 5mg once daily; avoid high-sodium diet',
 NULL, NULL),

('re100000-0000-0000-0000-000000000002',
 'pt100000-0000-0000-0000-000000000002',
 'dc100000-0000-0000-0000-000000000002',
 'Acute Viral Fever',
 'Paracetamol 500mg every 6 hours; rest and fluids',
 NULL, NULL);

-- ---- Access Permissions ------------------------------------
INSERT INTO access_permissions (patient_id, doctor_id) VALUES
('pt100000-0000-0000-0000-000000000001',
 'dc100000-0000-0000-0000-000000000001');

-- =============================================================
-- RELATIONSHIP SUMMARY (for reference)
-- =============================================================
-- users         → patients         1 : 0..1   (one-to-one via user_id)
-- users         → doctors          1 : 0..1   (one-to-one via user_id)
-- patients      → medical_records  1 : many
-- doctors       → medical_records  1 : many
-- patients      → appointments     1 : many
-- doctors       → appointments     1 : many
-- patients      → access_permissions 1 : many
-- patients      → audit_logs       1 : many
-- =============================================================
