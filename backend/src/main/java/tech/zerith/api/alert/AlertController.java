package tech.zerith.api.alert;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tech.zerith.api.config.SecurityConfig.UserPrincipal;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {
    private final JdbcTemplate jdbc;
    public AlertController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping
    public List<AlertResponse> list(@RequestParam(required = false) String status,
                                    @AuthenticationPrincipal UserPrincipal user) {
        String sql = """
            select a.id, v.code vehicle_code, a.component, a.risk_level, a.status,
                   a.created_at, a.description, a.recommendation
              from alerts a join vehicles v on v.id = a.vehicle_id and v.tenant_id = a.tenant_id
             where a.tenant_id = ?
            """ + (status == null ? "" : " and a.status = ?") + " order by a.created_at desc";
        Object[] args = status == null ? new Object[]{user.tenantId()} : new Object[]{user.tenantId(), status};
        return jdbc.query(sql, (rs, row) -> new AlertResponse(
            rs.getObject("id", UUID.class).toString(), rs.getString("vehicle_code"),
            rs.getString("component"), rs.getString("risk_level"), rs.getString("status"),
            rs.getObject("created_at", OffsetDateTime.class), rs.getString("description"),
            rs.getString("recommendation")), args);
    }

    @PatchMapping("/{id}/status")
    public AlertResponse changeStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request,
                                      @AuthenticationPrincipal UserPrincipal user) {
        int updated = jdbc.update("""
            update alerts set status = ?,
                acknowledged_at = case when ? = 'resolvido' then current_timestamp else acknowledged_at end
             where id = ? and tenant_id = ?
            """, request.status(), request.status(), id, user.tenantId());
        if (updated == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerta não encontrado");
        return list(null, user).stream().filter(a -> a.id().equals(id.toString())).findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerta não encontrado"));
    }

    public record StatusRequest(@Pattern(regexp = "pendente|agendado|resolvido") String status) {}
    public record AlertResponse(String id, String vehicleId, String component, String riskLevel,
                                String status, OffsetDateTime date, String description, String recommendation) {}
}
