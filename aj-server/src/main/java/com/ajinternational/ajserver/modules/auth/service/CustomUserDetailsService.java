package com.ajinternational.ajserver.modules.auth.service;

import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Deprecated
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // ... (bu metot aynı kalabilir) ...
        logger.warn("Attempting to load user by username only: '{}'. This might be ambiguous due to multi-tenancy.", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + username));
        logger.warn("Found user by username only: ID={}, Tenant={}. Roles and permissions will be loaded based on THIS user.", user.getId(), user.getTenantId());
        return buildUserDetails(user);
    }

    public UserDetails loadUserByUsernameAndTenantId(String username, String tenantId) throws UsernameNotFoundException {
        logger.debug("Attempting to load user by username '{}' and tenantId '{}'", username, tenantId);

        // --- DEĞİŞİKLİK BURADA: Değişkenleri final yap ---
        final String finalUsername = username;
        String tempEffectiveTenantId = tenantId; // Geçici değişken

        if ("aj-admin".equals(finalUsername) && !StringUtils.hasText(tenantId)) {
            logger.warn("TenantId missing for 'aj-admin', defaulting to 'SYSTEM'.");
            tempEffectiveTenantId = "SYSTEM";
        } else if (!StringUtils.hasText(tenantId)) {
            logger.error("TenantId is required but missing for username '{}'. Cannot load user details.", finalUsername);
            throw new UsernameNotFoundException("Tenant ID eksik olduğu için kullanıcı yüklenemedi: " + finalUsername);
        }

        final String effectiveTenantId = tempEffectiveTenantId; // Final değişkene ata
        // --- DEĞİŞİKLİK SONU ---

        User user = userRepository.findByUsernameAndTenantId(finalUsername, effectiveTenantId) // final değişkenleri kullan
                .orElseThrow(() -> {
                    // Lambda içinde final değişkenleri kullanabiliriz
                    logger.warn("Kullanıcı bulunamadı: username='{}', tenantId='{}'", finalUsername, effectiveTenantId); // Satır 56 civarı
                    return new UsernameNotFoundException("Kullanıcı '" + finalUsername + "' tenant '" + effectiveTenantId + "' için bulunamadı."); // Satır 57 civarı
                });
        logger.debug("Found user by username and tenantId: ID={}, Tenant={}", user.getId(), user.getTenantId());

        return buildUserDetails(user);
    }

    private UserDetails buildUserDetails(final User user) {
        // ... (bu metot aynı) ...
        Set<Role> roles = roleRepository.findAllById(user.getRoleIds()).stream().collect(Collectors.toSet());
        Set<GrantedAuthority> authorities = roles.stream()
                .flatMap(role -> Stream.concat(
                        Stream.of(new SimpleGrantedAuthority("ROLE_" + role.getName().toUpperCase())),
                        role.getPermissions().stream().map(SimpleGrantedAuthority::new)
                ))
                .collect(Collectors.toSet());
        logger.debug("User '{}' (Tenant '{}') authorities loaded: {}", user.getUsername(), user.getTenantId(), authorities);
        return new org.springframework.security.core.userdetails.User(
                user.getUsername() + ":" + user.getTenantId(),
                user.getPassword(),
                user.isActive(),
                true, true, true,
                authorities
        );
    }
}