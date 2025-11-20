package com.ajinternational.ajserver.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. CORS preflight (ön uçuş) isteklerine kimlik doğrulaması olmadan izin ver.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. GİRİŞ ve KAYIT yollarına herkese açık izin ver.
                        .requestMatchers("/api/auth/**").permitAll()

                        // 3. Yüklenen dosyalara (avatarlar) GET isteğiyle gelen herkese izin ver.
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // 4. *** WEBSOCKET İZNİ (YENİ) ***
                        // WebSocket Handshake işlemi için bu yolun açık olması şarttır.
                        .requestMatchers("/ws-operation/**").permitAll()

                        // 5. Geriye kalan tüm istekler için kimlik doğrulaması iste.
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Frontend'in çalıştığı adresler ve production domainleri
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://213.74.252.238",
                "http://213.74.252.238:7777",
                "http://192.168.1.203",
                "https://app.ajkalite.xyz",
                "http://app.ajkalite.xyz"
        ));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        // WebSocket için headerların geçişine izin ver
        configuration.setAllowedHeaders(List.of("*"));
        // Cookie ve Auth headerlar için true olmalı
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}