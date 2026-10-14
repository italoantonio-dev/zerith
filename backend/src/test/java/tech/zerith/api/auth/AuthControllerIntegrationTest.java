package tech.zerith.api.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração para AuthController.
 * Utiliza H2 em memória (profile demo) com seed de dados para testes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@TestPropertySource(properties = {
    "zerith.seed.enabled=true",
    "zerith.seed.password=zerith-demo-password",
    "zerith.seed.device-key=test-device-key-12345678901234567890123456789012"
})
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String AUTH_ENDPOINT = "/api/v1/auth/login";

    private String validEmail;
    private String validPassword;

    @BeforeEach
    void setUp() {
        // Credenciais demo configuradas em DemoDataInitializer
        validEmail = "italo@zerith.tech";
        validPassword = "zerith-demo-password";
    }

    @Nested
    @DisplayName("Login - Casos válidos")
    class ValidLogin {

        @Test
        @DisplayName("Login com credenciais válidas retorna JWT em formato Bearer")
        void loginWithValidCredentialsReturnsJwt() throws Exception {
            mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"" + validEmail + "\",\"password\":\"" + validPassword + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.user.id").isNotEmpty())
                    .andExpect(jsonPath("$.user.email").value(validEmail))
                    .andExpect(jsonPath("$.user.role").value("ADMIN"))
                    .andExpect(jsonPath("$.user.company").value("Frota Demonstração Zerith"));
        }

        @Test
        @DisplayName("Login com e-mail em maiúsculas é normalizado (lowercase)")
        void loginWithUppercaseEmailIsLowercased() throws Exception {
            // O AuthController usa lower() no filtro de email
            mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"ITALO@ZERITH.TECH\",\"password\":\"" + validPassword + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.user.email").value("italo@zerith.tech"));
        }

        @Test
        @DisplayName("Login retorna usuário com tenant_id correto")
        void loginReturnsUserWithCorrectTenantId() throws Exception {
            mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"" + validEmail + "\",\"password\":\"" + validPassword + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user.tenantId").value("10000000-0000-0000-0000-000000000001"));
        }
    }

    @Nested
    @DisplayName("Login - Casos inválidos")
    class InvalidLogin {

        @Test
        @DisplayName("Login com senha incorreta retorna UNAUTHORIZED")
        void loginWithWrongPasswordReturnsUnauthorized() throws Exception {
            mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"" + validEmail + "\",\"password\":\"senha-errada\"}"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.type").value("https://zerith.tech/problems/request"))
                    .andExpect(jsonPath("$.title").value("Unauthorized"))
                    .andExpect(jsonPath("$.detail").value("E-mail ou senha inválidos"));
        }

        @Test
        @DisplayName("Login com e-mail inexistente retorna UNAUTHORIZED")
        void loginWithNonExistentEmailReturnsUnauthorized() throws Exception {
            mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"naoexiste@zerith.tech\",\"password\":\"qualquer\"}"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.detail").value("E-mail ou senha inválidos"));
        }

        @Test
        @DisplayName("Login com campo vazio retorna BAD REQUEST")
        void loginWithEmptyFieldsReturnsBadRequest() throws Exception {
            mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"\",\"password\":\"\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Login com e-mail em formato inválido retorna BAD REQUEST")
        void loginWithInvalidEmailFormatReturnsBadRequest() throws Exception {
            mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"nao-e-email\",\"password\":\"qualquer\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Segurança - Proteção de endpoints")
    class SecurityProtection {

        @Test
        @DisplayName("Endpoint sem autenticação é rejeitado com 401")
        void protectedEndpointWithoutJwtIsRejected() throws Exception {
            // NOTA: O sistema deve retornar 401 para não autenticado
            // Se retornar 403, indica problema de configuração de segurança
            mockMvc.perform(get("/api/v1/vehicles"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Endpoint sem Bearer token é rejeitado com 401")
        void protectedEndpointWithoutBearerTokenIsRejected() throws Exception {
            mockMvc.perform(get("/api/v1/vehicles")
                    .header("Authorization", "InvalidFormat"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("JWT inválido é rejeitado com 401")
        void invalidJwtIsRejected() throws Exception {
            mockMvc.perform(get("/api/v1/vehicles")
                    .header("Authorization", "Bearer invalid.jwt.token"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("JWT válido permite acesso a endpoint protegido")
        void validJwtAllowsAccessToProtectedEndpoint() throws Exception {
            // Primeiro obtém o token via login
            String response = mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"" + validEmail + "\",\"password\":\"" + validPassword + "\"}"))
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            // Extrai token do JSON usando substring simples
            String token = extractToken(response);

            mockMvc.perform(get("/api/v1/vehicles")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
        }

        private String extractToken(String json) {
            // Extrai accessToken do JSON: {"accessToken":"...", ...}
            int start = json.indexOf("\"accessToken\":\"");
            if (start == -1) return "";
            start += "\"accessToken\":\"".length();
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        }
    }

    @Nested
    @DisplayName("Validacao - Request validation")
    class ValidationTests {

        @Test
        @DisplayName("Requisicao sem body retorna 400")
        void requestWithoutBodyReturnsBadRequest() throws Exception {
            mockMvc.perform(post(AUTH_ENDPOINT))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Requisicao com Content-Type errado retorna 415")
        void requestWithWrongContentTypeHandled() throws Exception {
            mockMvc.perform(post(AUTH_ENDPOINT)
                    .contentType(MediaType.TEXT_PLAIN)
                    .content("email=test@test.com&password=123"))
                    .andExpect(status().isUnsupportedMediaType());
        }
    }
}