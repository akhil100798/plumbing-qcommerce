package com.pqc.core.config;

import com.pqc.core.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Value("${app.cors.allowed-origins:http://localhost:8081,http://localhost:8082,http://localhost:8083,http://localhost:3101,http://localhost:19007,http://localhost:19008,http://localhost:19009,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(request -> {
                org.springframework.web.cors.CorsConfiguration config = new org.springframework.web.cors.CorsConfiguration();
                config.setAllowedOrigins(resolveAllowedOrigins());
                config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(java.util.List.of("*"));
                config.setAllowCredentials(true);
                return config;
            }))
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, ex) -> {
                    response.setContentType("application/json");
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"status\":401,\"error\":\"UNAUTHORIZED\",\"message\":\"Authentication required.\"}");
                })
                .accessDeniedHandler((request, response, ex) -> {
                    response.setContentType("application/json");
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"status\":403,\"error\":\"ACCESS_DENIED\",\"message\":\"You do not have permission to perform this operation.\"}");
                }))
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.FORWARD, jakarta.servlet.DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/send-otp", "/api/v1/auth/verify-otp", "/api/v1/auth/google/customer").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/catalog/**").permitAll()
                .requestMatchers("/api/v1/admin/super/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers("/api/v1/admin/operations/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATIONS_ADMIN")
                .requestMatchers("/api/v1/admin/finance/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN")
                .requestMatchers("/api/v1/admin/support/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "SUPPORT_ADMIN")
                .requestMatchers("/api/v1/admin/plumber-manager/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "PLUMBER_MANAGER")
                .requestMatchers("/api/v1/admin/marketing/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MARKETING_ADMIN")
                .requestMatchers("/api/v1/admin/rbac/me").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATIONS_ADMIN", "PLUMBER_MANAGER", "FINANCE_ADMIN", "SUPPORT_ADMIN", "MARKETING_ADMIN", "STORE_MANAGER")
                .requestMatchers("/api/v1/admin/rbac/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/admin/seed-user").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers("/api/v1/delivery/**").denyAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/service-orders/*/material-requests").hasRole("PLUMBER")
                .requestMatchers(HttpMethod.GET, "/api/v1/users/me").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/users/me/availability").hasRole("PLUMBER")
                .requestMatchers("/api/v1/users/me/addresses", "/api/v1/users/me/addresses/**").authenticated()
                .requestMatchers("/api/v1/users/**", "/api/v1/users").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/ai/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATIONS_ADMIN", "FINANCE_ADMIN", "MARKETING_ADMIN", "STORE_MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/v1/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers("/api-docs/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/health/**", "/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private List<String> resolveAllowedOrigins() {
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .peek(origin -> {
                    if (origin.contains("*")) {
                        throw new IllegalStateException("Wildcard CORS origins are not allowed: " + origin);
                    }
                })
                .toList();
    }
}
