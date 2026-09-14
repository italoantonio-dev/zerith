#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Preencha localmente e nunca envie credenciais reais ao Git.
const char* WIFI_SSID = "SET_WIFI_SSID";
const char* WIFI_PASSWORD = "SET_WIFI_PASSWORD";
const char* API_URL = "http://SET_API_HOST:8081/api/v1/ingest/telemetry";
const char* DEVICE_ID = "ZERITH-ESP32-001";
const char* DEVICE_KEY = "SET_DEVICE_KEY";

unsigned long sequenceNumber = 1;
unsigned long lastSendAt = 0;
const unsigned long SEND_INTERVAL_MS = 15000;

void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

bool sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();

  StaticJsonDocument<512> payload;
  payload["deviceId"] = DEVICE_ID;
  payload["sequence"] = sequenceNumber;
  payload["capturedAt"] = "2026-09-14T14:00:00-03:00";
  payload["engineTemperatureC"] = random(820, 1080) / 10.0;
  payload["batteryVoltageV"] = random(116, 142) / 10.0;
  payload["vibrationG"] = random(15, 55) / 10.0;
  payload["rpm"] = random(750, 3200);
  payload["speedKmh"] = random(0, 90);
  payload["odometerKm"] = 25438.0 + sequenceNumber / 10.0;

  String body;
  serializeJson(payload, body);
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int status = http.POST(body);
  http.end();

  if (status >= 200 && status < 300) {
    sequenceNumber++;
    return true;
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  connectWifi();
}

void loop() {
  if (millis() - lastSendAt >= SEND_INTERVAL_MS) {
    lastSendAt = millis();
    Serial.println(sendTelemetry() ? "Telemetria enviada" : "Falha; leitura será reenviada");
  }
}
