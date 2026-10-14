package tech.zerith.api.data;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@TestPropertySource(properties = {
        "zerith.seed.enabled=true",
        "zerith.seed.password=demo-test-password",
        "zerith.seed.device-key=demo-test-device-key",
        "zerith.demo-dataset.enabled=true",
        "spring.datasource.url=jdbc:h2:mem:demo_dataset;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"
})
class DemoDatasetInitializerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void datasetSeedsDemonstrationRouteAndCriticalAlertThroughNormalIngestion() throws Exception {
        String login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"italo@zerith.tech\",\"password\":\"demo-test-password\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(login).path("accessToken").asText();

        mockMvc.perform(get("/api/v1/tracking/vehicles").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].code").value("V001"))
                .andExpect(jsonPath("$.items[0].dataOrigin").value("DEMONSTRATION"))
                .andExpect(jsonPath("$.items[0].gpsStatus").value("CURRENT"))
                .andExpect(jsonPath("$.items[0].hasActiveAlert").value(true));

        String from = OffsetDateTime.now().minusHours(1).toString();
        String to = OffsetDateTime.now().plusMinutes(1).toString();
        mockMvc.perform(get("/api/v1/vehicles/V001/positions")
                        .param("from", from).param("to", to).param("limit", "50")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(12))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());

        mockMvc.perform(get("/api/v1/alerts").param("status", "pendente")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].vehicleId").value("V001"))
                .andExpect(jsonPath("$[0].riskLevel").value("alto"));
    }
}
