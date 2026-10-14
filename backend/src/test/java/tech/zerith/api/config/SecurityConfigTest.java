package tech.zerith.api.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class SecurityConfigTest {
    @Test
    void rejectsPlaceholderJwtSecret() {
        assertThrows(IllegalStateException.class,
            () -> new SecurityConfig.JwtService("CHANGE_ME_JWT_SECRET", 480));
    }
}
