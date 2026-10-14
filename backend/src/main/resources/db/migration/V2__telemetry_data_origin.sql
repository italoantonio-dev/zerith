ALTER TABLE telemetry_readings ADD COLUMN data_origin VARCHAR(20);
ALTER TABLE telemetry_readings ADD CONSTRAINT chk_telemetry_data_origin
    CHECK (data_origin IS NULL OR data_origin IN ('REAL', 'DEMONSTRATION'));
CREATE INDEX idx_telemetry_tracking_latest
    ON telemetry_readings(tenant_id, vehicle_id, captured_at DESC, sequence_number DESC);
