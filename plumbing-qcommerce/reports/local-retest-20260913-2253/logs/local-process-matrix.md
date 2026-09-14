# Local process matrix

| Component | Identity / command | Port | URL | API target | Result |
|---|---|---:|---|---|---|
| Backend | fixkart_retest_backend_20260914; rebuilt Spring image | 8081 | http://localhost:8081 | isolated Postgres | Actuator UP after recovery |
| Customer | Expo start --web --port 8082; restarted with EXPO_PUBLIC_API_BASE_URL | 8082 | http://localhost:8082 | localhost:8081 | Chrome guest/catalog; OTP 400 |
| Plumber | Verified Node Expo server, original PID 1284 | 8083 | http://localhost:8083 | localhost:8081 | Real browser login, acceptance, arrival, pickup |
| Store | Expo start --web --port 8084, recovered after interruption | 8084 | http://localhost:8084 | localhost:8081 | Real browser login, preparation/readiness |
| Admin | Verified Next start, original PID 10500 | 3001 | http://localhost:3001 | localhost:8081 | Real browser login and 37 authenticated views |

See process-recovery evidence for final current PIDs; old PID snapshots are historical. Docker Desktop and two frontends stopped during interruption and were recovered.
