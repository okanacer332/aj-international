package com.ajinternational.ajserver.config;

import com.ajinternational.ajserver.modules.auth.service.CustomUserDetailsService;
import io.jsonwebtoken.Claims; // Claims import edildi
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger; // Logger eklendi
import org.slf4j.LoggerFactory; // Logger eklendi
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException; // Eklendi
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils; // StringUtils eklendi
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class); // Logger tanımlandı

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private static final String SUBJECT_SEPARATOR = ":"; // Ayırıcı JwtUtil'deki ile aynı olmalı

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        String subject = null;
        String username = null;
        String tenantId = null; // tenantId değişkeni eklendi

        try {
            // --- DEĞİŞİKLİK: Subject'i çıkar ---
            subject = jwtUtil.extractClaim(jwt, Claims::getSubject);

            // --- DEĞİŞİKLİK: Subject'i parse et ---
            if (StringUtils.hasText(subject) && subject.contains(SUBJECT_SEPARATOR)) {
                int separatorIndex = subject.lastIndexOf(SUBJECT_SEPARATOR);
                username = subject.substring(0, separatorIndex);
                tenantId = subject.substring(separatorIndex + 1);
            } else {
                // Ayırıcı yoksa, eski token olabilir, sadece username'i almayı dene
                username = subject;
                // Bu durumda tenantId null kalacak, UserDetailsService buna göre davranmalı
                logger.warn("JWT subject does not contain tenant separator: '{}'. Assuming legacy token or missing tenant.", subject);
            }
            // --- DEĞİŞİKLİK SONU ---

        } catch (Exception e) {
            logger.error("Error parsing JWT: {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        // --- DEĞİŞİKLİK: Artık username kontrolü yapıyoruz (userEmail yerine) ---
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = null;
            try {
                // --- DEĞİŞİKLİK: UserDetailsService'e hem username hem tenantId geç ---
                // BU METODU CustomUserDetailsService'e ekleyeceğiz!
                userDetails = this.userDetailsService.loadUserByUsernameAndTenantId(username, tenantId);
                // --- DEĞİŞİKLİK SONU ---

            } catch (UsernameNotFoundException e) {
                logger.warn("User not found for username '{}' and tenantId '{}'", username, tenantId);
                // Kullanıcı bulunamazsa filtre zincirine devam et (yetkisiz olacak)
                filterChain.doFilter(request, response);
                return;
            } catch (Exception e) {
                logger.error("Error loading user details for username '{}', tenantId '{}': {}", username, tenantId, e.getMessage());
                // Diğer hatalarda da devam et
                filterChain.doFilter(request, response);
                return;
            }


            // Token doğrulaması aynı kalabilir (içindeki username kontrolü güncellenmişti)
            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.debug("User '{}' authenticated successfully for tenant '{}'", username, tenantId);
            } else {
                logger.warn("JWT validation failed for user '{}', tenant '{}'", username, tenantId);
            }
        }
        // --- DEĞİŞİKLİK SONU ---

        filterChain.doFilter(request, response);
    }
}