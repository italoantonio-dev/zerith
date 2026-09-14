package tech.zerith.api.telemetry;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ingest")
public class TelemetryController {
    private final JdbcTemplate jdbc;
    public TelemetryController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @PostMapping("/telemetry")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Transactional
    public IngestResponse ingest(@RequestHeader("X-Device-Key") String apiKey,
                                 @Valid @RequestBody TelemetryRequest request) {
        DeviceRow device = jdbc.query("""
            select d.id device_id, d.tenant_id, d.vehicle_id, d.api_key_hash, v.code vehicle_code
              from devices d join vehicles v on v.id = d.vehicle_id and v.tenant_id = d.tenant_id
             where d.device_uid = ? and v.active = true
            """, (rs, row) -> new DeviceRow(
                rs.getObject("device_id", UUID.class), rs.getObject("tenant_id", UUID.class),
                rs.getObject("vehicle_id", UUID.class), rs.getString("api_key_hash"),
                rs.getString("vehicle_code")), request.deviceId())
            .stream().findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Dispositivo não autorizado"));

        if (!MessageDigest.isEqual(device.apiKeyHash().getBytes(StandardCharsets.UTF_8),
                                   sha256(apiKey).getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Dispositivo não autorizado");
        }

        Integer existing = jdbc.queryForObject(
            "select count(*) from telemetry_readings where device_id = ? and sequence_number = ?",
            Integer.class, device.deviceId(), request.sequence());
        if (existing != null && existing > 0) {
            return new IngestResponse(true, true, null, false, device.vehicleCode());
        }

        UUID readingId = UUID.randomUUID();
        try {
            jdbc.update("""
                insert into telemetry_readings(
                    id, tenant_id, vehicle_id, device_id, sequence_number, engine_temperature_c,
                    battery_voltage_v, vibration_g, rpm, speed_kmh, latitude, longitude,
                    odometer_km, dtc_codes, captured_at
                ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, readingId, device.tenantId(), device.vehicleId(), device.deviceId(), request.sequence(),
                request.engineTemperatureC(), request.batteryVoltageV(), request.vibrationG(), request.rpm(),
                request.speedKmh(), request.latitude(), request.longitude(), request.odometerKm(),
                request.dtcCodes() == null ? null : String.join(",", request.dtcCodes()), request.capturedAt());
        } catch (DuplicateKeyException duplicate) {
            return new IngestResponse(true, true, null, false, device.vehicleCode());
        }

        String status = calculateStatus(request);
        jdbc.update("update devices set status = 'online', last_seen_at = current_timestamp where id = ?", device.deviceId());
        jdbc.update("""
            update vehicles set status = ?, last_analysis_at = ?,
                   odometer_km = coalesce(?, odometer_km)
             where id = ? and tenant_id = ?
            """, status, request.capturedAt(), request.odometerKm(), device.vehicleId(), device.tenantId());

        boolean alertGenerated = !"normal".equals(status) && createAlertIfNeeded(device, readingId, request, status);
        return new IngestResponse(true, false, readingId.toString(), alertGenerated, device.vehicleCode());
    }

    private String calculateStatus(TelemetryRequest r) {
        if (greaterOrEqual(r.engineTemperatureC(), "105") || lowerThan(r.batteryVoltageV(), "11.5")
            || greaterOrEqual(r.vibrationG(), "5")) return "critico";
        if (greaterOrEqual(r.engineTemperatureC(), "95") || lowerThan(r.batteryVoltageV(), "12")
            || greaterOrEqual(r.vibrationG(), "3.5")) return "alerta";
        return "normal";
    }

    private boolean createAlertIfNeeded(DeviceRow device, UUID readingId, TelemetryRequest r, String status) {
        String component;
        String description;
        String recommendation;
        if (greaterOrEqual(r.engineTemperatureC(), "95")) {
            component = "Motor";
            description = "Temperatura do motor fora da faixa esperada: " + r.engineTemperatureC() + " °C";
            recommendation = "Verificar o sistema de arrefecimento e programar inspeção.";
        } else if (lowerThan(r.batteryVoltageV(), "12")) {
            component = "Bateria";
            description = "Tensão da bateria abaixo da faixa esperada: " + r.batteryVoltageV() + " V";
            recommendation = "Verificar bateria, alternador e conexões elétricas.";
        } else {
            component = "Vibração";
            description = "Vibração acima da faixa esperada: " + r.vibrationG() + " g";
            recommendation = "Inspecionar motor, suportes, pneus e transmissão.";
        }

        Integer recent = jdbc.queryForObject("""
            select count(*) from alerts
             where tenant_id = ? and vehicle_id = ? and component = ? and status <> 'resolvido'
               and created_at >= ?
            """, Integer.class, device.tenantId(), device.vehicleId(), component, OffsetDateTime.now().minusMinutes(30));
        if (recent != null && recent > 0) return false;

        jdbc.update("""
            insert into alerts(id,tenant_id,vehicle_id,telemetry_id,component,risk_level,status,description,recommendation)
            values (?,?,?,?,?,?,?,?,?)
            """, UUID.randomUUID(), device.tenantId(), device.vehicleId(), readingId, component,
            "critico".equals(status) ? "alto" : "medio", "pendente", description, recommendation);
        return true;
    }

    private static boolean greaterOrEqual(BigDecimal value, String limit) {
        return value != null && value.compareTo(new BigDecimal(limit)) >= 0;
    }
    private static boolean lowerThan(BigDecimal value, String limit) {
        return value != null && value.compareTo(new BigDecimal(limit)) < 0;
    }
    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    public record TelemetryRequest(
        @NotBlank String deviceId, @PositiveOrZero long sequence, @NotNull OffsetDateTime capturedAt,
        BigDecimal engineTemperatureC, BigDecimal batteryVoltageV, BigDecimal vibrationG,
        Integer rpm, BigDecimal speedKmh, BigDecimal latitude, BigDecimal longitude,
        BigDecimal odometerKm, List<String> dtcCodes
    ) {}
    public record IngestResponse(boolean accepted, boolean duplicate, String readingId,
                                 boolean alertGenerated, String vehicleId) {}
    private record DeviceRow(UUID deviceId, UUID tenantId, UUID vehicleId, String apiKeyHash, String vehicleCode) {}
}
