package tech.zerith.api.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Configuration
public class SecurityConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        return http.csrf(csrf -> csrf.disable()).cors(cors -> {})
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/api/v1/ingest/**", "/actuator/health").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
                }))
            .build();
    }

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${zerith.cors.allowed-origins}") String origins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of(HttpHeaders.AUTHORIZATION));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    JwtService jwtService(@Value("${zerith.jwt.secret}") String secret,
                          @Value("${zerith.jwt.expiration-minutes}") long minutes) {
        return new JwtService(secret, minutes);
    }

    @Bean
    JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService, JdbcTemplate jdbc) {
        return new JwtAuthenticationFilter(jwtService, jdbc);
    }

    public record UserPrincipal(UUID userId, UUID tenantId, String name, String email, String role) {}

    public static final class JwtService {
        private final SecretKey key;
        private final long expirationMinutes;
        public JwtService(String secret, long expirationMinutes) {
            validateSecret(secret);
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            this.expirationMinutes = expirationMinutes;
        }

        private static void validateSecret(String secret) {
            String normalized = secret == null ? "" : secret.trim();
            String upper = normalized.toUpperCase();
            if (normalized.isEmpty()
                    || upper.startsWith("CHANGE_ME_")
                    || upper.startsWith("REPLACE_ME_")
                    || upper.startsWith("REPLACE_WITH_")
                    || upper.contains("PLACEHOLDER")) {
                throw new IllegalStateException("JWT_SECRET deve conter um segredo configurado fora do repositório");
            }
        }
        public String generate(UserPrincipal user) {
            Instant now = Instant.now();
            return Jwts.builder().subject(user.userId().toString())
                    .claim("tenantId", user.tenantId().toString()).claim("role", user.role())
                    .issuedAt(Date.from(now)).expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                    .signWith(key).compact();
        }
        public Claims parse(String token) {
            return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        }
    }

    public static final class JwtAuthenticationFilter extends OncePerRequestFilter {
        private final JwtService jwtService;
        private final JdbcTemplate jdbc;
        public JwtAuthenticationFilter(JwtService jwtService, JdbcTemplate jdbc) {
            this.jwtService = jwtService; this.jdbc = jdbc;
        }
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            String header = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (header == null) {
                // No auth header, let chain continue (for permitAll endpoints)
                chain.doFilter(request, response);
                return;
            }

            if (!header.startsWith("Bearer ")) {
                // Malformed auth header
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                return;
            }

            // Header exists and starts with Bearer
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    Claims claims = jwtService.parse(header.substring(7));
                    UUID userId = UUID.fromString(claims.getSubject());
                    UserPrincipal principal = jdbc.queryForObject(
                            "select id, tenant_id, full_name, email, role from app_users where id = ? and active = true",
                            (rs, row) -> new UserPrincipal(rs.getObject("id", UUID.class),
                                    rs.getObject("tenant_id", UUID.class), rs.getString("full_name"),
                                    rs.getString("email"), rs.getString("role")), userId);
                    if (principal != null) {
                        var auth = new UsernamePasswordAuthenticationToken(principal, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + principal.role())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                } catch (Exception ignored) {
                    // Token invalid, expired, malformed, or user not found
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                    return;
                }
            }
            chain.doFilter(request, response);
        }
    }
}