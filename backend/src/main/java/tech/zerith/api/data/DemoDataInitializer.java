package tech.zerith.api.data;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "zerith.seed.enabled", havingValue = "true")
public class DemoDataInitializer implements ApplicationRunner {
    private static final UUID TENANT = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID USER = UUID.fromString("20000000-0000-0000-0000-000000000001");
    private static final UUID DRIVER = UUID.fromString("30000000-0000-0000-0000-000000000001");
    private static final UUID VEHICLE = UUID.fromString("40000000-0000-0000-0000-000000000001");
    private static final UUID DEVICE = UUID.fromString("50000000-0000-0000-0000-000000000001");

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final String demoPassword;
    private final String deviceKey;

    public DemoDataInitializer(JdbcTemplate jdbc, PasswordEncoder encoder,
                               @Value("${zerith.seed.password}") String demoPassword,
                               @Value("${zerith.seed.device-key}") String deviceKey) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.demoPassword = demoPassword;
        this.deviceKey = deviceKey;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (demoPassword.isBlank() || deviceKey.isBlank()) {
            throw new IllegalStateException("Defina ZERITH_DEMO_PASSWORD e ZERITH_DEVICE_KEY para habilitar a carga demo");
        }
        insert("tenants", TENANT, "insert into tenants(id,name,slug) values (?,?,?)",
            TENANT, "Frota Demonstração Zerith", "demo");
        insert("app_users", USER,
            "insert into app_users(id,tenant_id,full_name,email,password_hash,role) values (?,?,?,?,?,?)",
            USER, TENANT, "Ítalo Antônio", "italo@zerith.tech", encoder.encode(demoPassword), "ADMIN");
        insert("drivers", DRIVER, "insert into drivers(id,tenant_id,name,document) values (?,?,?,?)",
            DRIVER, TENANT, "Motorista Demonstração", "DEMO");
        insert("vehicles", VEHICLE, """
            insert into vehicles(id,tenant_id,code,plate,model,model_year,vehicle_type,status,odometer_km,
                                 driver_id,last_analysis_at,last_maintenance_at) values (?,?,?,?,?,?,?,?,?,?,?,?)
            """, VEHICLE, TENANT, "V001", "ZER-2026", "Fiat Strada", 2024, "Utilitário", "normal",
            25438.0, DRIVER, OffsetDateTime.now(), OffsetDateTime.now().minusMonths(2));
        insert("devices", DEVICE,
            "insert into devices(id,tenant_id,vehicle_id,device_uid,api_key_hash,firmware_version) values (?,?,?,?,?,?)",
            DEVICE, TENANT, VEHICLE, "ZERITH-ESP32-001", sha256(deviceKey), "0.1.0");
    }

    private void insert(String table, UUID id, String sql, Object... args) {
        Integer count = jdbc.queryForObject("select count(*) from " + table + " where id = ?", Integer.class, id);
        if (count != null && count == 0) jdbc.update(sql, args);
    }

    private static String sha256(String value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
            .digest(value.getBytes(StandardCharsets.UTF_8)));
    }
}
