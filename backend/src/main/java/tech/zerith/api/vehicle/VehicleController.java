package tech.zerith.api.vehicle;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tech.zerith.api.config.SecurityConfig.UserPrincipal;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehicles")
public class VehicleController {
    private final JdbcTemplate jdbc;
    public VehicleController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping
    public List<VehicleResponse> list(@AuthenticationPrincipal UserPrincipal user) {
        return jdbc.query("""
            select v.code, v.plate, v.model, v.status, v.last_analysis_at, v.vehicle_type,
                   v.model_year, v.odometer_km, d.name driver_name, v.last_maintenance_at,
                   dev.device_uid, dev.status device_status, dev.last_seen_at
              from vehicles v
              left join drivers d on d.id = v.driver_id and d.tenant_id = v.tenant_id
              left join devices dev on dev.vehicle_id = v.id and dev.tenant_id = v.tenant_id
             where v.tenant_id = ? and v.active = true
             order by v.code
            """, (rs, row) -> map(rs), user.tenantId());
    }

    @GetMapping("/{code}")
    public VehicleResponse get(@PathVariable String code, @AuthenticationPrincipal UserPrincipal user) {
        return jdbc.query("""
            select v.code, v.plate, v.model, v.status, v.last_analysis_at, v.vehicle_type,
                   v.model_year, v.odometer_km, d.name driver_name, v.last_maintenance_at,
                   dev.device_uid, dev.status device_status, dev.last_seen_at
              from vehicles v
              left join drivers d on d.id = v.driver_id and d.tenant_id = v.tenant_id
              left join devices dev on dev.vehicle_id = v.id and dev.tenant_id = v.tenant_id
             where v.tenant_id = ? and v.code = ? and v.active = true
            """, (rs, row) -> map(rs), user.tenantId(), code)
            .stream().findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Veículo não encontrado"));
    }

    @GetMapping("/{code}/telemetry")
    public List<TelemetryPoint> telemetry(@PathVariable String code,
                                          @RequestParam(defaultValue = "14") int limit,
                                          @AuthenticationPrincipal UserPrincipal user) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return jdbc.query("""
            select t.captured_at, t.engine_temperature_c, t.vibration_g, t.battery_voltage_v,
                   t.rpm, t.speed_kmh, t.odometer_km
              from telemetry_readings t
              join vehicles v on v.id = t.vehicle_id and v.tenant_id = t.tenant_id
             where t.tenant_id = ? and v.code = ?
             order by t.captured_at desc
             limit ?
            """, (rs, row) -> new TelemetryPoint(
                rs.getObject("captured_at", OffsetDateTime.class),
                rs.getBigDecimal("engine_temperature_c"),
                rs.getBigDecimal("vibration_g"),
                rs.getBigDecimal("battery_voltage_v"),
                (Integer) rs.getObject("rpm"),
                rs.getBigDecimal("speed_kmh"),
                rs.getBigDecimal("odometer_km")
            ), user.tenantId(), code, safeLimit).reversed();
    }

    private VehicleResponse map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new VehicleResponse(
            rs.getString("code"), rs.getString("plate"), rs.getString("model"), rs.getString("status"),
            rs.getObject("last_analysis_at", OffsetDateTime.class), rs.getString("vehicle_type"),
            (Integer) rs.getObject("model_year"), rs.getBigDecimal("odometer_km"), rs.getString("driver_name"),
            rs.getObject("last_maintenance_at", OffsetDateTime.class), rs.getString("device_uid"),
            rs.getString("device_status"), rs.getObject("last_seen_at", OffsetDateTime.class)
        );
    }

    public record VehicleResponse(
        String id, String placa, String modelo, String status, OffsetDateTime ultimaAnalise,
        String tipo, Integer ano, BigDecimal km, String motorista, OffsetDateTime ultimaManutencao,
        String deviceId, String deviceStatus, OffsetDateTime deviceLastSeenAt
    ) {}
    public record TelemetryPoint(
        OffsetDateTime date, BigDecimal temperature, BigDecimal vibration, BigDecimal voltage,
        Integer rpm, BigDecimal speedKmh, BigDecimal odometerKm
    ) {}
}
