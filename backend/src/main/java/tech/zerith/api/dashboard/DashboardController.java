package tech.zerith.api.dashboard;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tech.zerith.api.config.SecurityConfig.UserPrincipal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
    private final JdbcTemplate jdbc;
    public DashboardController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/summary")
    public DashboardSummary summary(@AuthenticationPrincipal UserPrincipal user) {
        int total = count("select count(*) from vehicles where tenant_id = ? and active = true", user);
        int activeAlerts = count("select count(*) from alerts where tenant_id = ? and status <> 'resolvido'", user);
        int critical = count("select count(*) from vehicles where tenant_id = ? and status = 'critico' and active = true", user);
        OffsetDateTime lastUpdate = jdbc.queryForObject(
            "select max(received_at) from telemetry_readings where tenant_id = ?",
            OffsetDateTime.class, user.tenantId());

        List<TemperaturePoint> temperatures = jdbc.query("""
            select cast(captured_at as date) reading_day, avg(engine_temperature_c) avg_temperature
              from telemetry_readings
             where tenant_id = ? and captured_at >= ?
               and engine_temperature_c is not null
             group by cast(captured_at as date)
             order by reading_day
            """, (rs, row) -> new TemperaturePoint(
                rs.getObject("reading_day", LocalDate.class),
                rs.getBigDecimal("avg_temperature").setScale(1, RoundingMode.HALF_UP)
            ), user.tenantId(), OffsetDateTime.now().minusDays(7));

        List<RiskCount> alertsByRisk = jdbc.query("""
            select risk_level, count(*) total from alerts
             where tenant_id = ? and status <> 'resolvido'
             group by risk_level
            """, (rs, row) -> new RiskCount(rs.getString("risk_level"), rs.getInt("total")), user.tenantId());

        List<RecentAlert> recent = jdbc.query("""
            select v.code, a.component, a.risk_level, a.status, a.created_at
              from alerts a join vehicles v on v.id = a.vehicle_id and v.tenant_id = a.tenant_id
             where a.tenant_id = ? order by a.created_at desc limit 5
            """, (rs, row) -> new RecentAlert(
                rs.getString("code"), rs.getString("component"), rs.getString("risk_level"),
                rs.getString("status"), rs.getObject("created_at", OffsetDateTime.class)
            ), user.tenantId());

        return new DashboardSummary(total, activeAlerts, critical, lastUpdate,
            calculateCoverage(user), temperatures, alertsByRisk, recent);
    }

    private int count(String sql, UserPrincipal user) {
        Integer value = jdbc.queryForObject(sql, Integer.class, user.tenantId());
        return value == null ? 0 : value;
    }

    private BigDecimal calculateCoverage(UserPrincipal user) {
        Integer total = jdbc.queryForObject("select count(*) from vehicles where tenant_id = ? and active = true",
            Integer.class, user.tenantId());
        Integer withReading = jdbc.queryForObject("""
            select count(distinct vehicle_id) from telemetry_readings
             where tenant_id = ? and received_at >= ?
            """, Integer.class, user.tenantId(), OffsetDateTime.now().minusHours(24));
        if (total == null || total == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(withReading == null ? 0 : withReading)
            .multiply(BigDecimal.valueOf(100))
            .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP);
    }

    public record DashboardSummary(int totalVehicles, int activeAlerts, int criticalVehicles,
                                   OffsetDateTime lastUpdate, BigDecimal telemetryCoveragePercent,
                                   List<TemperaturePoint> temperatureData, List<RiskCount> alertsByRisk,
                                   List<RecentAlert> recentAlerts) {}
    public record TemperaturePoint(LocalDate date, BigDecimal value) {}
    public record RiskCount(String riskLevel, int value) {}
    public record RecentAlert(String vehicleId, String component, String riskLevel,
                              String status, OffsetDateTime date) {}
}
