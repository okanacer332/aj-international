package com.ajinternational.ajserver.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.authentication.AuthenticationManager; // import et
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration; // import et

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Metot bazlı yetkilendirme (@PreAuthorize) için gerekli
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Frontend'den gelen isteklere izin vermek için CORS'u aktif et
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Stateless bir API olduğu için CSRF korumasına gerek yok
                .csrf(csrf -> csrf.disable())

                // Session yönetimini STATELESS olarak ayarla, çünkü JWT kullanıyoruz
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // İstekler için yetkilendirme kurallarını belirle
                .authorizeHttpRequests(auth -> auth
                        // /api/auth altındaki tüm yollara (login, register) kimlik doğrulaması olmadan izin ver
                        .requestMatchers("/api/auth/**").permitAll()
                        // Geriye kalan tüm istekler için kimlik doğrulaması zorunlu olsun
                        .anyRequest().authenticated()
                )

                // Kendi yazdığımız JWT filtresini, standart şifre filtresinden önce çalışacak şekilde ekle
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Frontend uygulamasının çalıştığı adrese izin ver
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
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