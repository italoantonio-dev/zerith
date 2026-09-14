package tech.zerith.api.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tech.zerith.api.config.SecurityConfig.JwtService;
import tech.zerith.api.config.SecurityConfig.UserPrincipal;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    public AuthController(JdbcTemplate jdbc, PasswordEncoder encoder, JwtService jwt) {
        this.jdbc = jdbc; this.encoder = encoder; this.jwt = jwt;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        UserRow user = jdbc.query("""
            select u.id, u.tenant_id, u.full_name, u.email, u.password_hash, u.role, t.name tenant_name
              from app_users u join tenants t on t.id = u.tenant_id
             where lower(u.email) = lower(?) and u.active = true and t.active = true
            """, (rs, row) -> new UserRow(rs.getObject("id", UUID.class), rs.getObject("tenant_id", UUID.class),
                rs.getString("full_name"), rs.getString("email"), rs.getString("password_hash"),
                rs.getString("role"), rs.getString("tenant_name")), request.email())
            .stream().findFirst().orElseThrow(this::unauthorized);
        if (!encoder.matches(request.password(), user.passwordHash())) throw unauthorized();
        UserPrincipal principal = new UserPrincipal(user.id(), user.tenantId(), user.name(), user.email(), user.role());
        return new LoginResponse(jwt.generate(principal), "Bearer",
            new UserResponse(user.id().toString(), user.tenantId().toString(), user.name(),
                user.email(), user.role(), user.tenantName()));
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
    }
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record LoginResponse(String accessToken, String tokenType, UserResponse user) {}
    public record UserResponse(String id, String tenantId, String name, String email, String role, String company) {}
    private record UserRow(UUID id, UUID tenantId, String name, String email, String passwordHash, String role, String tenantName) {}
}
