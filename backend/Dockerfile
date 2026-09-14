FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src src
RUN mvn -q clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 zerith
COPY --from=build /app/target/zerith-api-0.1.0-SNAPSHOT.jar app.jar
USER zerith
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
