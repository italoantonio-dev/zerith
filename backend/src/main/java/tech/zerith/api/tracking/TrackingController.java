package tech.zerith.api.tracking;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tech.zerith.api.config.SecurityConfig.UserPrincipal;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.ArrayList;
import java.util.Base64;

@RestController
@RequestMapping("/api/v1/tracking")
public class TrackingController {
    private static final Duration TTL = Duration.ofMinutes(5);
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public TrackingController(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @GetMapping("/vehicles")
    public TrackingPage vehicles(@RequestParam(defaultValue = "100") int limit,
                                 @RequestParam(required = false) String cursor,
                                 @AuthenticationPrincipal UserPrincipal user) {
        int safeLimit = Math.max(1, Math.min(limit, 500));
        String afterCode = cursor == null ? null : decodeCursor(cursor);
        OffsetDateTime now = OffsetDateTime.now(clock);
        String cursorPredicate = afterCode == null ? "" : "and v.code > ?";
        Object[] queryParameters = afterCode == null
            ? new Object[]{user.tenantId(), safeLimit + 1}
            : new Object[]{user.tenantId(), afterCode, safeLimit + 1};
        List<TrackingVehicle> items = jdbc.query(("""
            select v.code, v.plate, v.model,
                   (select max(d.last_seen_at) from devices d where d.tenant_id = v.tenant_id and d.vehicle_id = v.id) last_seen_at,
                   (select t.latitude from telemetry_readings t where t.tenant_id = v.tenant_id and t.vehicle_id = v.id
                     and t.latitude is not null and t.longitude is not null order by t.captured_at desc, t.sequence_number desc, t.id desc limit 1) latitude,
                   (select t.longitude from telemetry_readings t where t.tenant_id = v.tenant_id and t.vehicle_id = v.id
                     and t.latitude is not null and t.longitude is not null order by t.captured_at desc, t.sequence_number desc, t.id desc limit 1) longitude,
                   (select t.speed_kmh from telemetry_readings t where t.tenant_id = v.tenant_id and t.vehicle_id = v.id
                     and t.latitude is not null and t.longitude is not null order by t.captured_at desc, t.sequence_number desc, t.id desc limit 1) speed_kmh,
                   (select t.captured_at from telemetry_readings t where t.tenant_id = v.tenant_id and t.vehicle_id = v.id
                     and t.latitude is not null and t.longitude is not null order by t.captured_at desc, t.sequence_number desc, t.id desc limit 1) captured_at,
                   (select t.received_at from telemetry_readings t where t.tenant_id = v.tenant_id and t.vehicle_id = v.id
                     and t.latitude is not null and t.longitude is not null order by t.captured_at desc, t.sequence_number desc, t.id desc limit 1) received_at,
                   (select t.data_origin from telemetry_readings t where t.tenant_id = v.tenant_id and t.vehicle_id = v.id
                     and t.latitude is not null and t.longitude is not null order by t.captured_at desc, t.sequence_number desc, t.id desc limit 1) data_origin,
                   exists(select 1 from alerts a where a.tenant_id = v.tenant_id and a.vehicle_id = v.id and a.status <> 'resolvido') active_alert
              from vehicles v where v.tenant_id = ? and v.active = true %s
             order by v.code, v.id limit ?
            """).formatted(cursorPredicate), (rs, row) -> map(rs, now), queryParameters);
        boolean hasNext = items.size() > safeLimit;
        if (hasNext) items = new ArrayList<>(items.subList(0, safeLimit));
        return new TrackingPage(items, hasNext ? encodeCursor(items.getLast().code()) : null);
    }

    private TrackingVehicle map(java.sql.ResultSet rs, OffsetDateTime now) throws java.sql.SQLException {
        OffsetDateTime lastSeen = rs.getObject("last_seen_at", OffsetDateTime.class);
        OffsetDateTime captured = rs.getObject("captured_at", OffsetDateTime.class);
        String connection = lastSeen == null ? "NO_COMMUNICATION" : age(lastSeen, now).compareTo(TTL) <= 0 ? "ONLINE" : "OFFLINE";
        String gps = captured == null ? ("ONLINE".equals(connection) ? "ONLINE_WITHOUT_GPS" : "NO_POSITION")
            : age(captured, now).compareTo(TTL) <= 0 ? "CURRENT" : "STALE";
        return new TrackingVehicle(rs.getString("code"), rs.getString("plate"), rs.getString("model"),
            rs.getBigDecimal("latitude"), rs.getBigDecimal("longitude"), rs.getBigDecimal("speed_kmh"), captured,
            rs.getObject("received_at", OffsetDateTime.class), captured == null ? null : Math.max(0, age(captured, now).getSeconds()),
            connection, gps, rs.getBoolean("active_alert"), rs.getString("data_origin") == null ? "UNKNOWN_LEGACY" : rs.getString("data_origin"));
    }

    private Duration age(OffsetDateTime value, OffsetDateTime now) {
        return Duration.between(value.toInstant(), now.toInstant()).isNegative() ? Duration.ZERO : Duration.between(value.toInstant(), now.toInstant());
    }

    private String encodeCursor(String code) { return Base64.getUrlEncoder().withoutPadding().encodeToString(code.getBytes(StandardCharsets.UTF_8)); }
    private String decodeCursor(String cursor) {
        try {
            String code = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            if (code.isBlank()) throw new IllegalArgumentException();
            return code;
        } catch (IllegalArgumentException ex) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Cursor inválido");
        }
    }

    public record TrackingPage(List<TrackingVehicle> items, String nextCursor) {}
    public record TrackingVehicle(String code, String plate, String model, BigDecimal latitude, BigDecimal longitude,
                                  BigDecimal speedKmh, OffsetDateTime capturedAt, OffsetDateTime receivedAt, Long ageSeconds,
                                  String connectionStatus, String gpsStatus, boolean hasActiveAlert, String dataOrigin) {}
}
