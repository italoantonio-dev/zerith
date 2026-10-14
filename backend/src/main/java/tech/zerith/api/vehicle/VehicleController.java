package tech.zerith.api.vehicle;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tech.zerith.api.config.SecurityConfig.UserPrincipal;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
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

    @GetMapping("/{code}/position")
    public PositionResponse position(@PathVariable String code, @AuthenticationPrincipal UserPrincipal user) {
        ensureVehicleExists(code, user);
        return latestPosition(code, user).map(row -> toPositionResponse(code, row))
            .orElseGet(() -> new PositionResponse(code, null, null, null, null, null, null, "not_available"));
    }

    @GetMapping("/{code}/positions")
    public PositionPage positions(@PathVariable String code, @RequestParam OffsetDateTime from,
                                  @RequestParam OffsetDateTime to, @RequestParam(defaultValue = "500") int limit,
                                  @RequestParam(required = false) String cursor,
                                  @AuthenticationPrincipal UserPrincipal user) {
        ensureVehicleExists(code, user);
        if (to.isBefore(from) || Duration.between(from.toInstant(), to.toInstant()).compareTo(Duration.ofDays(31)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Intervalo de posições inválido");
        }
        int safeLimit = Math.max(1, Math.min(limit, 2000));
        Cursor decodedCursor = cursor == null ? null : decodeCursor(cursor);
        List<PositionRow> rows = queryPositions(code, from, to, safeLimit + 1, decodedCursor, user);
        boolean hasNext = rows.size() > safeLimit;
        if (hasNext) rows = new ArrayList<>(rows.subList(0, safeLimit));
        String nextCursor = hasNext ? encodeCursor(rows.getLast()) : null;
        return new PositionPage(rows.stream().map(this::toPositionPoint).toList(), nextCursor);
    }

    @GetMapping("/{code}/tracking")
    public List<TrackingPoint> tracking(@PathVariable String code, @RequestParam(defaultValue = "500") int limit,
                                        @AuthenticationPrincipal UserPrincipal user) {
        int safeLimit = Math.max(1, Math.min(limit, 2000));
        return jdbc.query("""
            select t.id, t.latitude, t.longitude, t.speed_kmh, t.captured_at, t.received_at, t.sequence_number
              from telemetry_readings t join vehicles v on v.id = t.vehicle_id and v.tenant_id = t.tenant_id
             where t.tenant_id = ? and v.code = ? and t.latitude is not null and t.longitude is not null
             order by t.captured_at asc, t.sequence_number asc, t.id asc
             limit ?
             """, (rs, row) -> mapPosition(rs), user.tenantId(), code, safeLimit)
             .stream().map(this::toTrackingPoint).toList();
    }

    private java.util.Optional<PositionRow> latestPosition(String code, UserPrincipal user) {
        return jdbc.query("""
            select t.id, t.latitude, t.longitude, t.speed_kmh, t.captured_at, t.received_at, t.sequence_number
              from telemetry_readings t join vehicles v on v.id = t.vehicle_id and v.tenant_id = t.tenant_id
             where t.tenant_id = ? and v.code = ? and t.latitude is not null and t.longitude is not null
             order by t.captured_at desc, t.sequence_number desc, t.id desc
             limit 1
            """, (rs, row) -> mapPosition(rs), user.tenantId(), code).stream().findFirst();
    }

    private List<PositionRow> queryPositions(String code, OffsetDateTime from, OffsetDateTime to, int limit,
                                              Cursor cursor, UserPrincipal user) {
        String cursorPredicate = cursor == null ? "" : """
               and (t.captured_at > ? or (t.captured_at = ? and (t.sequence_number > ?
                    or (t.sequence_number = ? and t.id > ?))))
            """;
        String sql = """
            select t.id, t.latitude, t.longitude, t.speed_kmh, t.captured_at, t.received_at, t.sequence_number
              from telemetry_readings t join vehicles v on v.id = t.vehicle_id and v.tenant_id = t.tenant_id
             where t.tenant_id = ? and v.code = ? and t.latitude is not null and t.longitude is not null
               and t.captured_at >= ? and t.captured_at <= ?
            """ + cursorPredicate + " order by t.captured_at asc, t.sequence_number asc, t.id asc limit ?";
        List<Object> args = new ArrayList<>(List.of(user.tenantId(), code, from, to));
        if (cursor != null) {
            args.add(cursor.capturedAt());
            args.add(cursor.capturedAt());
            args.add(cursor.sequenceNumber());
            args.add(cursor.sequenceNumber());
            args.add(cursor.id());
        }
        args.add(limit);
        return jdbc.query(sql, (rs, row) -> mapPosition(rs), args.toArray());
    }

    private void ensureVehicleExists(String code, UserPrincipal user) {
        Integer count = jdbc.queryForObject("select count(*) from vehicles where tenant_id = ? and code = ? and active = true",
            Integer.class, user.tenantId(), code);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Veículo não encontrado");
        }
    }

    private PositionRow mapPosition(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new PositionRow(rs.getObject("id", UUID.class), rs.getBigDecimal("latitude"), rs.getBigDecimal("longitude"),
            rs.getBigDecimal("speed_kmh"), rs.getObject("captured_at", OffsetDateTime.class),
            rs.getObject("received_at", OffsetDateTime.class), rs.getLong("sequence_number"));
    }

    private PositionResponse toPositionResponse(String code, PositionRow row) {
        return new PositionResponse(code, row.latitude(), row.longitude(), row.speedKmh(), row.capturedAt(), row.receivedAt(),
            Math.max(0, Duration.between(row.capturedAt(), OffsetDateTime.now()).getSeconds()), "device_telemetry");
    }

    private PositionPoint toPositionPoint(PositionRow row) {
        return new PositionPoint(row.latitude(), row.longitude(), row.speedKmh(), row.capturedAt(), row.receivedAt(), "device_telemetry");
    }

    private TrackingPoint toTrackingPoint(PositionRow row) {
        return new TrackingPoint(row.latitude(), row.longitude(), row.speedKmh(), row.capturedAt());
    }

    private String encodeCursor(PositionRow row) {
        String raw = row.capturedAt() + "|" + row.sequenceNumber() + "|" + row.id();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private Cursor decodeCursor(String encoded) {
        try {
            String[] values = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8).split("\\|", -1);
            if (values.length != 3) throw new IllegalArgumentException();
            return new Cursor(OffsetDateTime.parse(values[0]), Long.parseLong(values[1]), UUID.fromString(values[2]));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cursor inválido");
        }
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
    public record PositionResponse(String vehicleCode, BigDecimal latitude, BigDecimal longitude, BigDecimal speedKmh,
                                   OffsetDateTime capturedAt, OffsetDateTime receivedAt, Long ageSeconds, String source) {}
    public record PositionPoint(BigDecimal latitude, BigDecimal longitude, BigDecimal speedKmh,
                                OffsetDateTime capturedAt, OffsetDateTime receivedAt, String source) {}
    public record PositionPage(List<PositionPoint> items, String nextCursor) {}
    public record TrackingPoint(BigDecimal latitude, BigDecimal longitude, BigDecimal speedKmh, OffsetDateTime date) {}
    private record PositionRow(UUID id, BigDecimal latitude, BigDecimal longitude, BigDecimal speedKmh,
                               OffsetDateTime capturedAt, OffsetDateTime receivedAt, long sequenceNumber) {}
    private record Cursor(OffsetDateTime capturedAt, long sequenceNumber, UUID id) {}
}
