#!/bin/sh
set -e

echo "=== STARTING SPRING BOOT STAGING BACKEND IN CONTAINER ==="
java -Xmx400m -Xms256m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar app.jar > /tmp/spring.log 2>&1 &
SPRING_PID=$!
echo "Spring Boot started with PID $SPRING_PID, monitoring startup..."

for i in $(seq 1 45); do
  if curl -s http://127.0.0.1:10000/actuator/health | grep -q 'UP'; then
    echo "PASS: Spring Boot reached UP status on attempt $i!"
    echo "Health response:"
    curl -s http://127.0.0.1:10000/actuator/health
    echo ""
    echo "Spring Boot log excerpt (Flyway, DatabaseIsolationRuntimeGuard, Tomcat):"
    grep -E "DatabaseIsolationRuntimeGuard|Flyway|Tomcat|Started PlumbingCoreApplication" /tmp/spring.log || true
    kill $SPRING_PID 2>/dev/null || true
    exit 0
  fi
  sleep 2
done

echo "Spring Boot startup timed out. Last 80 lines of log:"
tail -n 80 /tmp/spring.log
kill $SPRING_PID 2>/dev/null || true
exit 1
