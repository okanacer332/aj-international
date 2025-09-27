package com.ajinternational.ajserver.config;

import com.ajinternational.ajserver.modules.auth.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // 1. Authorization başlığı yoksa veya "Bearer " ile başlamıyorsa, isteği bir sonraki filtreye devret.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. "Bearer " kısmını atarak JWT'yi al.
        final String jwt = authHeader.substring(7);
        final String userEmail;

        try {
            userEmail = jwtUtil.extractUsername(jwt);
        } catch (Exception e) {
            // Token parse edilemezse (geçersiz, süresi dolmuş vb.), isteği filtresiz devam ettir.
            // Bu durumda kullanıcı kimliği doğrulanmamış olur ve korumalı endpoint'lere erişemez.
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Email'i token'dan alabildiysek ve kullanıcı henüz authenticate olmadıysa...
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // 4. Veritabanından kullanıcı bilgilerini (UserDetails) yükle.
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 5. Token'ı doğrula.
            if (jwtUtil.validateToken(jwt, userDetails)) {
                // 6. Token geçerliyse, Spring Security için bir Authentication nesnesi oluştur.
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // Şifre bilgisi burada gerekli değil
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 7. Oluşturulan Authentication nesnesini SecurityContext'e yerleştir.
                //    Bu işlem, kullanıcının bu istek için "giriş yapmış" olduğunu belirtir.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 8. İsteği bir sonraki filtreye devret.
        filterChain.doFilter(request, response);
    }
}