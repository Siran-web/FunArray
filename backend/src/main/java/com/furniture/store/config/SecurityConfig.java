package com.furniture.store.config;

import com.furniture.store.auth.security.JwtAccessDeniedHandler;
import com.furniture.store.auth.security.JwtAuthenticationEntryPoint;
import com.furniture.store.auth.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
            JwtAccessDeniedHandler jwtAccessDeniedHandler
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAccessDeniedHandler = jwtAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        // Public discovery & auth endpoints
                        .requestMatchers(
                                "/api/v1/health",
                                "/api/v1/auth/**",
                                "/api/auth/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        // Public product & catalog browsing & inventory check
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/products/**",
                                "/api/products/**",
                                "/api/v1/categories/**",
                                "/api/categories/**",
                                "/api/v1/stores/**",
                                "/api/stores/**",
                                "/api/v1/inventory/check/**",
                                "/api/inventory/check/**",
                                "/api/v1/inventory/variant/**",
                                "/api/v1/inventory/product/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/inventory/check",
                                "/api/inventory/check",
                                "/api/v1/inventory/reserve",
                                "/api/inventory/reserve",
                                "/api/v1/inventory/release",
                                "/api/inventory/release",
                                "/api/v1/inventory/commit",
                                "/api/inventory/commit"
                        ).permitAll()
                        // Admin restricted catalog mutations
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/categories/**",
                                "/api/categories/**",
                                "/api/v1/products/**",
                                "/api/products/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/categories/**",
                                "/api/categories/**",
                                "/api/v1/products/**",
                                "/api/products/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH,
                                "/api/v1/categories/**",
                                "/api/categories/**",
                                "/api/v1/products/**",
                                "/api/products/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/categories/**",
                                "/api/categories/**",
                                "/api/v1/products/**",
                                "/api/products/**"
                        ).hasRole("ADMIN")
                        // Admin portal restricted endpoints
                        .requestMatchers(
                                "/api/v1/admin/**",
                                "/api/admin/**"
                        ).hasRole("ADMIN")
                        // Staff restricted endpoints
                        .requestMatchers(
                                "/api/v1/staff/**",
                                "/api/staff/**",
                                "/api/store/**"
                        ).hasAnyRole("STAFF", "STORE_STAFF", "STORE_MANAGER", "ADMIN")
                        // Storage presigned uploads, Rooms, Visualization & Customer endpoints
                        .requestMatchers(
                                "/api/v1/storage/**",
                                "/api/storage/**",
                                "/api/v1/rooms/**",
                                "/api/rooms/**",
                                "/api/v1/visualizations/**",
                                "/api/visualizations/**",
                                "/api/v1/visualization/**",
                                "/api/visualization/**",
                                "/api/v1/addresses/**",
                                "/api/v1/users/**",
                                "/api/v1/cart/**",
                                "/api/cart/**",
                                "/api/v1/checkout/**",
                                "/api/checkout/**",
                                "/api/v1/orders/**",
                                "/api/orders/**"
                        ).authenticated()
                        // Default fallback
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:3000", "http://localhost:3001", "https://*.vercel.app"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
