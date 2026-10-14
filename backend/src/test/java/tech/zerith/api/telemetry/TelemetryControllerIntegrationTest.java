package tech.zerith.api.telemetry;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import tech.zerith.api.config.SecurityConfig.JwtService;
import tech.zerith.api.config.SecurityConfig.UserPrincipal;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.UUID;
import java.util.stream.Stream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Caracteriza ingestão HTTP real, persistência JDBC/Flyway e geração de alertas
 * com fixtures próprias, sem usar DemoDataInitializer.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@TestPropertySource(properties = "zerith.seed.enabled=false")
@Import(TelemetryControllerIntegrationTest.FixedClockConfig.class)
class TelemetryControllerIntegrationTest {
    private static final UUID TENANT_A = UUID.fromString("a0000000-0000-0000-0000-000000000001");
    private static final UUID TENANT_B = UUID.fromString("b0000000-0000-0000-0000-000000000001");
    private static final UUID USER_A = UUID.fromString("a0000000-0000-0000-0000-000000000002");
    private static final UUID USER_B = UUID.fromString("b0000000-0000-0000-0000-000000000002");
    private static final UUID VEHICLE_A = UUID.fromString("a0000000-0000-0000-0000-000000000003");
    private static final UUID VEHICLE_B = UUID.fromString("b0000000-0000-0000-0000-000000000003");
    private static final UUID DEVICE_A = UUID.fromString("a0000000-0000-0000-0000-000000000004");
    private static final UUID DEVICE_B = UUID.fromString("b0000000-0000-0000-0000-000000000004");
    private static final String DEVICE_UID_A = "T3-DEVICE-A";
    private static final String DEVICE_UID_B = "T3-DEVICE-B";
    private static final String DEVICE_KEY_A = "t3-device-key-a-1d4a8b5f5c8e";
    private static final String DEVICE_KEY_B = "t3-device-key-b-7f2b0c3d9e1a";
    private static final OffsetDateTime CAPTURED_AT = OffsetDateTime.parse("2026-01-15T10:30:00Z");

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JwtService jwtService;
    @Autowired private ObjectMapper objectMapper;

    @BeforeEach
    void setUpFixtures() {
        jdbc.update("delete from alerts where tenant_id in (?, ?)", TENANT_A, TENANT_B);
        jdbc.update("delete from telemetry_readings where tenant_id in (?, ?)", TENANT_A, TENANT_B);
        jdbc.update("delete from devices where tenant_id in (?, ?)", TENANT_A, TENANT_B);
        jdbc.update("delete from app_users where tenant_id in (?, ?)", TENANT_A, TENANT_B);
        jdbc.update("delete from vehicles where tenant_id in (?, ?)", TENANT_A, TENANT_B);
        jdbc.update("delete from tenants where id in (?, ?)", TENANT_A, TENANT_B);

        jdbc.update("insert into tenants(id, name, slug) values (?, ?, ?)", TENANT_A, "Tenant A", "t3-a");
        jdbc.update("insert into tenants(id, name, slug) values (?, ?, ?)", TENANT_B, "Tenant B", "t3-b");
        jdbc.update("insert into app_users(id, tenant_id, full_name, email, password_hash, role) values (?, ?, ?, ?, ?, ?)",
                USER_A, TENANT_A, "Usuário A", "a@t3.test", "not-used-by-this-test", "ADMIN");
        jdbc.update("insert into app_users(id, tenant_id, full_name, email, password_hash, role) values (?, ?, ?, ?, ?, ?)",
                USER_B, TENANT_B, "Usuário B", "b@t3.test", "not-used-by-this-test", "ADMIN");
        insertVehicle(VEHICLE_A, TENANT_A, "T3-A");
        insertVehicle(VEHICLE_B, TENANT_B, "T3-B");
        insertDevice(DEVICE_A, TENANT_A, VEHICLE_A, DEVICE_UID_A, DEVICE_KEY_A);
        insertDevice(DEVICE_B, TENANT_B, VEHICLE_B, DEVICE_UID_B, DEVICE_KEY_B);
    }

    @Test
    void validDeviceKeyPersistsTelemetryUnderResolvedDeviceVehicleAndTenant() throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 1, "90", "12.5", "1.0")
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.accepted").value(true))
                .andExpect(jsonPath("$.duplicate").value(false))
                .andExpect(jsonPath("$.alertGenerated").value(false))
                .andExpect(jsonPath("$.vehicleId").value("T3-A"));

        assertCount("select count(*) from telemetry_readings where device_id = ? and vehicle_id = ? and tenant_id = ?", 1,
                DEVICE_A, VEHICLE_A, TENANT_A);
        assertCount("select count(*) from alerts where tenant_id = ?", 0, TENANT_A);
    }

    @Test
    void invalidDeviceKeyIsRejectedWithoutPersistingTelemetry() throws Exception {
        ingest(DEVICE_UID_A, "wrong-device-key", 1, "90", "12.5", "1.0")
                .andExpect(status().isUnauthorized());
        assertCount("select count(*) from telemetry_readings where tenant_id = ?", 0, TENANT_A);
    }

    @Test
    void missingDeviceKeyIsRejectedBeforePersistence() throws Exception {
        mockMvc.perform(post("/api/v1/ingest/telemetry")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload(DEVICE_UID_A, 1, "90", "12.5", "1.0")))
                .andExpect(status().isBadRequest());
        assertCount("select count(*) from telemetry_readings where tenant_id = ?", 0, TENANT_A);
    }

    @Test
    void missingRequiredTelemetryFieldIsRejectedWithoutPersistence() throws Exception {
        String payloadWithoutCapturedAt = "{\"deviceId\":\"" + DEVICE_UID_A + "\",\"sequence\":1,\"engineTemperatureC\":90}";
        mockMvc.perform(post("/api/v1/ingest/telemetry")
                        .header("X-Device-Key", DEVICE_KEY_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithoutCapturedAt))
                .andExpect(status().isBadRequest());
        assertCount("select count(*) from telemetry_readings where tenant_id = ?", 0, TENANT_A);
    }

    @Test
    void negativeSequenceIsRejectedWithoutPersistence() throws Exception {
        mockMvc.perform(post("/api/v1/ingest/telemetry")
                        .header("X-Device-Key", DEVICE_KEY_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload(DEVICE_UID_A, -1, "90", "12.5", "1.0")))
                .andExpect(status().isBadRequest());
        assertCount("select count(*) from telemetry_readings where tenant_id = ?", 0, TENANT_A);
    }

    @ParameterizedTest(name = "coordenadas inválidas latitude={0}, longitude={1} são rejeitadas")
    @MethodSource("invalidCoordinateScenarios")
    void invalidCoordinatesAreRejectedWithoutPersistence(String latitude, String longitude) throws Exception {
        mockMvc.perform(post("/api/v1/ingest/telemetry")
                        .header("X-Device-Key", DEVICE_KEY_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithCoordinates(DEVICE_UID_A, 20, latitude, longitude)))
                .andExpect(status().isBadRequest());

        assertCount("select count(*) from telemetry_readings where tenant_id = ?", 0, TENANT_A);
    }

    static Stream<Arguments> invalidCoordinateScenarios() {
        return Stream.of(
                Arguments.of("90.0000001", "-46.6333080"),
                Arguments.of("-90.0000001", "-46.6333080"),
                Arguments.of("-23.5505200", "180.0000001"),
                Arguments.of("-23.5505200", "-180.0000001"),
                Arguments.of("-23.5505200", null),
                Arguments.of(null, "-46.6333080"));
    }

    @Test
    void validCoordinatePairIsPersistedWhileTelemetryWithoutGpsRemainsAccepted() throws Exception {
        mockMvc.perform(post("/api/v1/ingest/telemetry")
                        .header("X-Device-Key", DEVICE_KEY_A)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithCoordinates(DEVICE_UID_A, 21, "-23.5505200", "-46.6333080")))
                .andExpect(status().isAccepted());
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 22, "90", "12.5", "1.0")
                .andExpect(status().isAccepted());

        assertCount("select count(*) from telemetry_readings where tenant_id = ? and latitude is not null and longitude is not null",
                1, TENANT_A);
        assertCount("select count(*) from telemetry_readings where tenant_id = ? and latitude is null and longitude is null",
                1, TENANT_A);
    }

    @Test
    void deviceCannotIngestForAnotherTenantWhenAssociationIsInconsistent() throws Exception {
        UUID crossTenantDevice = UUID.fromString("a0000000-0000-0000-0000-000000000099");
        String crossTenantUid = "T3-CROSS-TENANT";
        String crossTenantKey = "t3-cross-tenant-device-key";
        jdbc.update("insert into devices(id, tenant_id, vehicle_id, device_uid, api_key_hash) values (?, ?, ?, ?, ?)",
                crossTenantDevice, TENANT_A, VEHICLE_B, crossTenantUid, sha256(crossTenantKey));

        ingest(crossTenantUid, crossTenantKey, 1, "90", "12.5", "1.0")
                .andExpect(status().isUnauthorized());
        assertCount("select count(*) from telemetry_readings where device_id = ?", 0, crossTenantDevice);
        assertCount("select count(*) from telemetry_readings where tenant_id = ?", 0, TENANT_B);
    }

    @Test
    void deviceKeyCanOnlyPersistForItsServerResolvedTenantAndVehicle() throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 1, "90", "12.5", "1.0").andExpect(status().isAccepted());
        assertCount("select count(*) from telemetry_readings where tenant_id = ? and vehicle_id = ?", 1, TENANT_A, VEHICLE_A);
        assertCount("select count(*) from telemetry_readings where tenant_id = ?", 0, TENANT_B);
    }

    @Test
    void repeatedSequenceForSameDeviceIsIdempotentAndDoesNotCreateAnotherAlert() throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 7, "105", "12.5", "1.0")
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.duplicate").value(false))
                .andExpect(jsonPath("$.alertGenerated").value(true));
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 7, "105", "12.5", "1.0")
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.duplicate").value(true))
                .andExpect(jsonPath("$.alertGenerated").value(false));

        assertCount("select count(*) from telemetry_readings where device_id = ? and sequence_number = ?", 1, DEVICE_A, 7L);
        assertCount("select count(*) from alerts where tenant_id = ?", 1, TENANT_A);
    }

    @Test
    void sameSequenceOnDifferentDevicesDoesNotDeduplicate() throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 8, "90", "12.5", "1.0").andExpect(status().isAccepted());
        ingest(DEVICE_UID_B, DEVICE_KEY_B, 8, "90", "12.5", "1.0").andExpect(status().isAccepted());
        assertCount("select count(*) from telemetry_readings where sequence_number = ?", 2, 8L);
    }

    @ParameterizedTest(name = "temperatura {0} gera {1} / {2}")
    @MethodSource("temperatureScenarios")
    void temperatureThresholdsUseConfiguredBoundaries(String temperature, int expectedAlerts, String riskLevel) throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 10, temperature, "12.5", "1.0")
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.alertGenerated").value(expectedAlerts == 1));
        assertCount("select count(*) from alerts where tenant_id = ? and component = 'Motor'", expectedAlerts, TENANT_A);
        if (expectedAlerts == 1) {
            assertCount("select count(*) from alerts where tenant_id = ? and component = 'Motor' and risk_level = ?", 1, TENANT_A, riskLevel);
        }
    }

    static Stream<Arguments> temperatureScenarios() {
        return Stream.of(
                Arguments.of("94.99", 0, null),
                Arguments.of("95", 1, "medio"),
                Arguments.of("104.99", 1, "medio"),
                Arguments.of("105", 1, "alto"));
    }

    @ParameterizedTest(name = "bateria {0} gera {1} / {2}")
    @MethodSource("batteryScenarios")
    void batteryThresholdsUseConfiguredBoundaries(String voltage, int expectedAlerts, String riskLevel) throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 11, "90", voltage, "1.0")
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.alertGenerated").value(expectedAlerts == 1));
        assertCount("select count(*) from alerts where tenant_id = ? and component = 'Bateria'", expectedAlerts, TENANT_A);
        if (expectedAlerts == 1) {
            assertCount("select count(*) from alerts where tenant_id = ? and component = 'Bateria' and risk_level = ?", 1, TENANT_A, riskLevel);
        }
    }

    static Stream<Arguments> batteryScenarios() {
        return Stream.of(
                Arguments.of("12", 0, null),
                Arguments.of("11.99", 1, "medio"),
                Arguments.of("11.5", 1, "medio"),
                Arguments.of("11.49", 1, "alto"));
    }

    @ParameterizedTest(name = "vibração {0} gera {1} / {2}")
    @MethodSource("vibrationScenarios")
    void vibrationThresholdsUseConfiguredBoundaries(String vibration, int expectedAlerts, String riskLevel) throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 12, "90", "12.5", vibration)
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.alertGenerated").value(expectedAlerts == 1));
        assertCount("select count(*) from alerts where tenant_id = ? and component = 'Vibração'", expectedAlerts, TENANT_A);
        if (expectedAlerts == 1) {
            assertCount("select count(*) from alerts where tenant_id = ? and component = 'Vibração' and risk_level = ?", 1, TENANT_A, riskLevel);
        }
    }

    static Stream<Arguments> vibrationScenarios() {
        return Stream.of(
                Arguments.of("3.49", 0, null),
                Arguments.of("3.5", 1, "medio"),
                Arguments.of("4.99", 1, "medio"),
                Arguments.of("5", 1, "alto"));
    }

    @Test
    void aReadingWithMultipleBreachesCreatesOnlyTheFirstRuleAlert() throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 13, "105", "11.0", "5")
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.alertGenerated").value(true));
        assertCount("select count(*) from alerts where tenant_id = ?", 1, TENANT_A);
        assertCount("select count(*) from alerts where tenant_id = ? and component = 'Motor' and risk_level = 'alto'", 1, TENANT_A);
        assertCount("select count(*) from alerts where tenant_id = ? and component in ('Bateria', 'Vibração')", 0, TENANT_A);
    }

    @Test
    void authenticatedAlertListingIsTenantIsolated() throws Exception {
        ingest(DEVICE_UID_A, DEVICE_KEY_A, 14, "105", "12.5", "1.0").andExpect(status().isAccepted());
        ingest(DEVICE_UID_B, DEVICE_KEY_B, 14, "105", "12.5", "1.0").andExpect(status().isAccepted());

        mockMvc.perform(get("/api/v1/alerts").header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].vehicleId").value("T3-A"));
        mockMvc.perform(get("/api/v1/alerts").header("Authorization", bearerFor(USER_B, TENANT_B, "b@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].vehicleId").value("T3-B"));
    }

    @Test
    void authenticatedTrackingReturnsOnlyLocatedReadingsChronologicallyForTheAuthenticatedTenant() throws Exception {
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 101, CAPTURED_AT.plusMinutes(2), "-23.5505200", "-46.6333080", "35.5");
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 102, CAPTURED_AT.plusMinutes(3), null, null, "40.0");
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 103, CAPTURED_AT.plusMinutes(4), "-23.5510000", "-46.6325000", "42.0");
        insertTelemetry(VEHICLE_B, DEVICE_B, TENANT_B, 104, CAPTURED_AT.plusMinutes(5), "-22.9068470", "-43.1728960", "28.0");

        mockMvc.perform(get("/api/v1/vehicles/T3-A/tracking?limit=10")
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].latitude").value(-23.5505200))
                .andExpect(jsonPath("$[0].longitude").value(-46.6333080))
                .andExpect(jsonPath("$[0].speedKmh").value(35.5))
                .andExpect(jsonPath("$[0].date").value(jsonTimestamp(CAPTURED_AT.plusMinutes(2))))
                .andExpect(jsonPath("$[1].date").value(jsonTimestamp(CAPTURED_AT.plusMinutes(4))));

        mockMvc.perform(get("/api/v1/vehicles/T3-A/tracking?limit=10")
                        .header("Authorization", bearerFor(USER_B, TENANT_B, "b@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void lastPositionReturnsTheNewestValidSyntheticFixtureForTheAuthenticatedTenant() throws Exception {
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 201, CAPTURED_AT.plusMinutes(2), "-23.5505200", "-46.6333080", "35.5");
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 202, CAPTURED_AT.plusMinutes(3), null, null, "40.0");
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 203, CAPTURED_AT.plusMinutes(4), "-23.5510000", "-46.6325000", "42.0");

        mockMvc.perform(get("/api/v1/vehicles/T3-A/position")
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicleCode").value("T3-A"))
                .andExpect(jsonPath("$.latitude").value(-23.5510000))
                .andExpect(jsonPath("$.longitude").value(-46.6325000))
                .andExpect(jsonPath("$.speedKmh").value(42.0))
                .andExpect(jsonPath("$.capturedAt").value(jsonTimestamp(CAPTURED_AT.plusMinutes(4))))
                .andExpect(jsonPath("$.receivedAt").isNotEmpty())
                .andExpect(jsonPath("$.ageSeconds").isNumber())
                .andExpect(jsonPath("$.source").value("device_telemetry"));

        mockMvc.perform(get("/api/v1/vehicles/T3-A/position")
                        .header("Authorization", bearerFor(USER_B, TENANT_B, "b@t3.test")))
                .andExpect(status().isNotFound());
    }

    @Test
    void positionsReturnsOnlyValidSyntheticCoordinatesChronologicallyWithinTheRequestedInterval() throws Exception {
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 211, CAPTURED_AT.plusMinutes(2), "-23.5505200", "-46.6333080", "35.5");
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 212, CAPTURED_AT.plusMinutes(3), null, null, "40.0");
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 213, CAPTURED_AT.plusMinutes(4), "-23.5510000", "-46.6325000", "42.0");
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 214, CAPTURED_AT.plusMinutes(6), "-23.5520000", "-46.6315000", "45.0");

        mockMvc.perform(get("/api/v1/vehicles/T3-A/positions")
                        .param("from", CAPTURED_AT.plusMinutes(1).toString())
                        .param("to", CAPTURED_AT.plusMinutes(5).toString())
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].capturedAt").value(jsonTimestamp(CAPTURED_AT.plusMinutes(2))))
                .andExpect(jsonPath("$.items[1].capturedAt").value(jsonTimestamp(CAPTURED_AT.plusMinutes(4))));
    }

    @Test
    void positionsUsesCursorPaginationWithDeterministicChronologicalOrder() throws Exception {
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 221, CAPTURED_AT.plusMinutes(2), "-23.5505200", "-46.6333080", "35.5");
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 222, CAPTURED_AT.plusMinutes(3), "-23.5510000", "-46.6325000", "42.0");

        String firstPage = mockMvc.perform(get("/api/v1/vehicles/T3-A/positions")
                        .param("from", CAPTURED_AT.plusMinutes(1).toString())
                        .param("to", CAPTURED_AT.plusMinutes(5).toString())
                        .param("limit", "1")
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].capturedAt").value(jsonTimestamp(CAPTURED_AT.plusMinutes(2))))
                .andExpect(jsonPath("$.nextCursor").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        JsonNode firstPageJson = objectMapper.readTree(firstPage);
        String cursor = firstPageJson.path("nextCursor").asText();

        mockMvc.perform(get("/api/v1/vehicles/T3-A/positions")
                        .param("from", CAPTURED_AT.plusMinutes(1).toString())
                        .param("to", CAPTURED_AT.plusMinutes(5).toString())
                        .param("limit", "1")
                        .param("cursor", cursor)
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].capturedAt").value(jsonTimestamp(CAPTURED_AT.plusMinutes(3))))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Test
    void positionsRejectsIntervalsLongerThanThirtyOneDaysAndRequiresJwt() throws Exception {
        mockMvc.perform(get("/api/v1/vehicles/T3-A/positions")
                        .param("from", CAPTURED_AT.toString())
                        .param("to", CAPTURED_AT.plusDays(31).plusSeconds(1).toString())
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/vehicles/T3-A/position"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/vehicles/T3-A/positions")
                        .param("from", CAPTURED_AT.toString())
                        .param("to", CAPTURED_AT.plusMinutes(1).toString()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void trackingFleetReturnsAnOnlineVehicleWithCurrentGpsAndUnknownLegacyOrigin() throws Exception {
        jdbc.update("update devices set last_seen_at = ? where id = ?", CAPTURED_AT.plusMinutes(4), DEVICE_A);
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 300, CAPTURED_AT.plusMinutes(2), "-23.5505200", "-46.6333080", "35.5");

        mockMvc.perform(get("/api/v1/tracking/vehicles")
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].code").value("T3-A"))
                .andExpect(jsonPath("$.items[0].connectionStatus").value("ONLINE"))
                .andExpect(jsonPath("$.items[0].gpsStatus").value("CURRENT"))
                .andExpect(jsonPath("$.items[0].dataOrigin").value("UNKNOWN_LEGACY"));
    }

    @Test
    void trackingFleetCalculatesFreshnessOriginsAlertsPaginationAndTenantIsolation() throws Exception {
        UUID vehicleA2 = UUID.fromString("a0000000-0000-0000-0000-000000000005");
        UUID deviceA2 = UUID.fromString("a0000000-0000-0000-0000-000000000006");
        insertVehicle(vehicleA2, TENANT_A, "T3-A2");
        insertDevice(deviceA2, TENANT_A, vehicleA2, "T3-DEVICE-A2", "t3-device-key-a2");
        jdbc.update("update devices set last_seen_at = ? where id = ?", CAPTURED_AT.plusMinutes(5), DEVICE_A);
        jdbc.update("update devices set last_seen_at = ? where id = ?", CAPTURED_AT.plusMinutes(5), deviceA2);
        insertTelemetry(VEHICLE_A, DEVICE_A, TENANT_A, 401, CAPTURED_AT.minusMinutes(1), "-23.5505200", "-46.6333080", "35.5");
        jdbc.update("update telemetry_readings set data_origin = 'REAL', received_at = ? where tenant_id = ? and sequence_number = ?",
                CAPTURED_AT.plusMinutes(5), TENANT_A, 401L);
        insertTelemetry(VEHICLE_B, DEVICE_B, TENANT_B, 402, CAPTURED_AT.plusMinutes(4), "-22.9068470", "-43.1728960", "28.0");
        jdbc.update("update telemetry_readings set data_origin = 'DEMONSTRATION' where tenant_id = ? and sequence_number = ?", TENANT_B, 402L);
        jdbc.update("insert into alerts(id, tenant_id, vehicle_id, component, risk_level, status, description) values (?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), TENANT_A, VEHICLE_A, "Motor", "alto", "pendente", "fixture");

        String first = mockMvc.perform(get("/api/v1/tracking/vehicles").param("limit", "1")
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].connectionStatus").value("ONLINE"))
                .andExpect(jsonPath("$.items[0].gpsStatus").value("STALE"))
                .andExpect(jsonPath("$.items[0].receivedAt").value(jsonTimestamp(CAPTURED_AT.plusMinutes(5))))
                .andExpect(jsonPath("$.items[0].dataOrigin").value("REAL"))
                .andExpect(jsonPath("$.items[0].hasActiveAlert").value(true))
                .andExpect(jsonPath("$.nextCursor").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String cursor = objectMapper.readTree(first).path("nextCursor").asText();
        mockMvc.perform(get("/api/v1/tracking/vehicles").param("limit", "9999").param("cursor", cursor)
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].code").value("T3-A2"))
                .andExpect(jsonPath("$.items[0].gpsStatus").value("ONLINE_WITHOUT_GPS"))
                .andExpect(jsonPath("$.items[0].hasActiveAlert").value(false));
        mockMvc.perform(get("/api/v1/tracking/vehicles")
                        .header("Authorization", bearerFor(USER_B, TENANT_B, "b@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].code").value("T3-B"))
                .andExpect(jsonPath("$.items[0].dataOrigin").value("DEMONSTRATION"));
    }

    @Test
    void trackingFleetDistinguishesOfflineAndNoCommunication() throws Exception {
        UUID vehicleA2 = UUID.fromString("a0000000-0000-0000-0000-000000000007");
        UUID deviceA2 = UUID.fromString("a0000000-0000-0000-0000-000000000008");
        insertVehicle(vehicleA2, TENANT_A, "T3-A2");
        insertDevice(deviceA2, TENANT_A, vehicleA2, "T3-DEVICE-A2", "t3-device-key-a2");
        jdbc.update("update devices set last_seen_at = ? where id = ?", CAPTURED_AT.minusMinutes(1), DEVICE_A);

        mockMvc.perform(get("/api/v1/tracking/vehicles")
                        .header("Authorization", bearerFor(USER_A, TENANT_A, "a@t3.test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].connectionStatus").value("OFFLINE"))
                .andExpect(jsonPath("$.items[0].gpsStatus").value("NO_POSITION"))
                .andExpect(jsonPath("$.items[1].connectionStatus").value("NO_COMMUNICATION"))
                .andExpect(jsonPath("$.items[1].gpsStatus").value("NO_POSITION"));
    }

    @Test
    void ingestionPersistsOnlyExplicitDemonstrationOrigin() throws Exception {
        String body = "{\"deviceId\":\"" + DEVICE_UID_A + "\",\"sequence\":501,\"capturedAt\":\"" + CAPTURED_AT
                + "\",\"latitude\":-23.5505200,\"longitude\":-46.6333080,\"dataOrigin\":\"DEMONSTRATION\"}";
        mockMvc.perform(post("/api/v1/ingest/telemetry").header("X-Device-Key", DEVICE_KEY_A)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isAccepted());
        String origin = jdbc.queryForObject("select data_origin from telemetry_readings where tenant_id = ? and sequence_number = ?",
                String.class, TENANT_A, 501L);
        org.junit.jupiter.api.Assertions.assertEquals("DEMONSTRATION", origin);
    }

    private org.springframework.test.web.servlet.ResultActions ingest(String deviceUid, String deviceKey, long sequence,
                                                                        String temperature, String voltage, String vibration) throws Exception {
        return mockMvc.perform(post("/api/v1/ingest/telemetry")
                .header("X-Device-Key", deviceKey)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload(deviceUid, sequence, temperature, voltage, vibration)));
    }

    private String payload(String deviceUid, long sequence, String temperature, String voltage, String vibration) {
        return "{\"deviceId\":\"" + deviceUid + "\",\"sequence\":" + sequence
                + ",\"capturedAt\":\"" + CAPTURED_AT + "\",\"engineTemperatureC\":" + temperature
                + ",\"batteryVoltageV\":" + voltage + ",\"vibrationG\":" + vibration + "}";
    }

    private String payloadWithCoordinates(String deviceUid, long sequence, String latitude, String longitude) {
        String coordinates = latitude == null ? "" : ",\"latitude\":" + latitude;
        if (longitude != null) coordinates += ",\"longitude\":" + longitude;
        return "{\"deviceId\":\"" + deviceUid + "\",\"sequence\":" + sequence
                + ",\"capturedAt\":\"" + CAPTURED_AT + "\",\"engineTemperatureC\":90"
                + coordinates + "}";
    }

    private void insertVehicle(UUID id, UUID tenantId, String code) {
        jdbc.update("insert into vehicles(id, tenant_id, code, plate, model) values (?, ?, ?, ?, ?)",
                id, tenantId, code, "PL-" + code, "Fixture");
    }

    private void insertDevice(UUID id, UUID tenantId, UUID vehicleId, String uid, String key) {
        jdbc.update("insert into devices(id, tenant_id, vehicle_id, device_uid, api_key_hash) values (?, ?, ?, ?, ?)",
                id, tenantId, vehicleId, uid, sha256(key));
    }

    private void insertTelemetry(UUID vehicleId, UUID deviceId, UUID tenantId, long sequence, OffsetDateTime capturedAt,
                                 String latitude, String longitude, String speedKmh) {
        jdbc.update("""
                insert into telemetry_readings(id, tenant_id, vehicle_id, device_id, sequence_number,
                                               latitude, longitude, speed_kmh, captured_at)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), tenantId, vehicleId, deviceId, sequence,
                latitude == null ? null : new BigDecimal(latitude), longitude == null ? null : new BigDecimal(longitude),
                new BigDecimal(speedKmh), capturedAt);
    }

    private String bearerFor(UUID userId, UUID tenantId, String email) {
        return "Bearer " + jwtService.generate(new UserPrincipal(userId, tenantId, "Fixture", email, "ADMIN"));
    }

    private void assertCount(String sql, int expected, Object... args) {
        Integer actual = jdbc.queryForObject(sql, Integer.class, args);
        org.junit.jupiter.api.Assertions.assertEquals(expected, actual);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static String jsonTimestamp(OffsetDateTime value) {
        return value.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    @TestConfiguration
    static class FixedClockConfig {
        @Bean @Primary Clock fixedClock() { return Clock.fixed(Instant.parse("2026-01-15T10:35:00Z"), ZoneOffset.UTC); }
    }
}
