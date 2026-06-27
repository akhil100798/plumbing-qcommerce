package com.pqc.core.config;

import com.pqc.core.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

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
                config.setAllowedOriginPatterns(java.util.List.of("http://localhost:3100", "http://localhost:19006", "http://localhost:8081", "http://localhost:3000", "http://127.0.0.1:*"));
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
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/send-otp", "/api/v1/auth/verify-otp").permitAll()
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
                .requestMatchers(HttpMethod.GET, "/api/v1/delivery/*/status").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/delivery/available").hasRole("DELIVERY_PARTNER")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/delivery/*/accept").hasRole("DELIVERY_PARTNER")
                .requestMatchers(HttpMethod.POST, "/api/v1/delivery/*/confirm-otp").hasRole("CUSTOMER")
                .requestMatchers(HttpMethod.POST, "/api/v1/delivery/material-request").hasRole("PLUMBER")
                .requestMatchers("/api/v1/users/**", "/api/v1/users").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/ai/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATIONS_ADMIN", "FINANCE_ADMIN", "MARKETING_ADMIN", "STORE_MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/v1/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers("/api-docs/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/health/**").permitAll()
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}




