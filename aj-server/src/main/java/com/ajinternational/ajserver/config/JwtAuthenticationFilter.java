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

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username;
        final String tenantId; // YENİ: tenantId eklendi

        try {
            username = jwtUtil.extractUsername(jwt);
            tenantId = jwtUtil.extractTenantId(jwt); // YENİ: tenantId token'dan çekildi
        } catch (Exception e) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Kullanıcı adı ve tenantId'yi token'dan alabildiysek ve kullanıcı henüz authenticate olmadıysa...
        if (username != null && tenantId != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails)) {

                // YENİ: TenantAwarePrincipal oluşturuluyor
                TenantAwarePrincipal principal = new TenantAwarePrincipal(userDetails, tenantId);

                // GÜNCELLENDİ: Authentication token'ı UserDetails yerine TenantAwarePrincipal ile oluşturuluyor
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        principal, // Principal olarak UserDetails yerine özel nesnemizi veriyoruz
                        null,
                        userDetails.getAuthorities()
                );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 7. Oluşturulan Authentication nesnesini SecurityContext'e yerleştir.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}