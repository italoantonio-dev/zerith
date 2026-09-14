CREATE TABLE tenants (
  id UUID PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(80) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE app_users (
  id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), full_name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL, password_hash VARCHAR(100) NOT NULL, role VARCHAR(30) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, email)
);
CREATE TABLE drivers (
  id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), name VARCHAR(150) NOT NULL,
  document VARCHAR(30), active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE vehicles (
  id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), code VARCHAR(30) NOT NULL,
  plate VARCHAR(12) NOT NULL, model VARCHAR(120) NOT NULL, model_year INTEGER,
  vehicle_type VARCHAR(40) NOT NULL DEFAULT 'Carro', status VARCHAR(20) NOT NULL DEFAULT 'normal',
  odometer_km NUMERIC(12,2) NOT NULL DEFAULT 0, driver_id UUID REFERENCES drivers(id),
  last_analysis_at TIMESTAMP WITH TIME ZONE, last_maintenance_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, code), UNIQUE (tenant_id, plate)
);
CREATE TABLE devices (
  id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  device_uid VARCHAR(80) NOT NULL UNIQUE, api_key_hash VARCHAR(64) NOT NULL, firmware_version VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'offline', last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE telemetry_readings (
  id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  device_id UUID NOT NULL REFERENCES devices(id), sequence_number BIGINT NOT NULL,
  engine_temperature_c NUMERIC(6,2), battery_voltage_v NUMERIC(6,2), vibration_g NUMERIC(7,3),
  rpm INTEGER, speed_kmh NUMERIC(6,2), latitude NUMERIC(10,7), longitude NUMERIC(10,7),
  odometer_km NUMERIC(12,2), dtc_codes TEXT, captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (device_id, sequence_number)
);
CREATE TABLE alerts (
  id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  telemetry_id UUID REFERENCES telemetry_readings(id), component VARCHAR(100) NOT NULL,
  risk_level VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  description VARCHAR(500) NOT NULL, recommendation VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  maintenance_type VARCHAR(30) NOT NULL, description VARCHAR(500) NOT NULL, cost NUMERIC(14,2),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL, next_due_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vehicle_tenant ON vehicles(tenant_id, active);
CREATE INDEX idx_telemetry_vehicle_time ON telemetry_readings(tenant_id, vehicle_id, captured_at DESC);
CREATE INDEX idx_alert_tenant_status ON alerts(tenant_id, status, created_at DESC);
CREATE INDEX idx_device_tenant ON devices(tenant_id, device_uid);
