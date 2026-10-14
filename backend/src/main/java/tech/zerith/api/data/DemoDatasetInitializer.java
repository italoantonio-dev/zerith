package tech.zerith.api.data;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import tech.zerith.api.telemetry.TelemetryController;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Component
@Order(2)
@ConditionalOnProperty(name = "zerith.demo-dataset.enabled", havingValue = "true")
public class DemoDatasetInitializer implements ApplicationRunner {
    private static final String DEVICE_UID = "ZERITH-ESP32-001";
    private static final long FIRST_SEQUENCE = 900_001L;
    private static final BigDecimal START_LATITUDE = new BigDecimal("-23.5505200");
    private static final BigDecimal START_LONGITUDE = new BigDecimal("-46.6333080");

    private final TelemetryController telemetry;
    private final Clock clock;
    private final String deviceKey;

    public DemoDatasetInitializer(TelemetryController telemetry, Clock clock,
                                  @Value("${zerith.seed.device-key}") String deviceKey) {
        this.telemetry = telemetry;
        this.clock = clock;
        this.deviceKey = deviceKey;
    }

    @Override
    public void run(ApplicationArguments args) {
        OffsetDateTime end = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC).withNano(0).minusSeconds(30);
        for (int index = 0; index < 12; index++) {
            boolean critical = index == 11;
            telemetry.ingest(deviceKey, new TelemetryController.TelemetryRequest(
                    DEVICE_UID, FIRST_SEQUENCE + index, end.minusSeconds((11L - index) * 20),
                    critical ? new BigDecimal("108.0") : new BigDecimal("91.5"), new BigDecimal("12.6"),
                    new BigDecimal("1.2"), 1850 + index * 20,
                    new BigDecimal("28.0").add(new BigDecimal(index)),
                    START_LATITUDE.add(new BigDecimal(index).movePointLeft(5)),
                    START_LONGITUDE.add(new BigDecimal(index).movePointLeft(5)),
                    new BigDecimal("25438.0").add(new BigDecimal(index).movePointLeft(1)),
                    critical ? List.of("DEMO_OVERHEAT") : List.of(), "DEMONSTRATION"));
        }
    }
}
