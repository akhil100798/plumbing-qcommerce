# Multi-stage build for Spring Boot backend
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/target/plumbing-core-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 10000
# Memory tuned for Render free tier (512MB RAM limit).
ENTRYPOINT ["java", "-Xmx400m", "-Xms256m", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
