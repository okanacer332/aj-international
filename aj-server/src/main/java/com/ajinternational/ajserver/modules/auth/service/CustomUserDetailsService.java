package com.ajinternational.ajserver.modules.auth.service;

import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Kullanıcıyı ARTIK USERNAME ile veritabanından bul
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + username));

        // 2. Kullanıcının rollerini bul
        Set<Role> roles = roleRepository.findAllById(user.getRoleIds()).stream().collect(Collectors.toSet());

        // 3. Roller ve izinlerden yetkileri oluştur
        Set<GrantedAuthority> authorities = roles.stream()
                .flatMap(role -> Stream.concat(
                        Stream.of(new SimpleGrantedAuthority("ROLE_" + role.getName().toUpperCase())),
                        role.getPermissions().stream().map(SimpleGrantedAuthority::new)
                ))
                .collect(Collectors.toSet());

        // 4. Spring Security'nin UserDetails nesnesini oluştur
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(), // ARTIK USERNAME KULLANILIYOR
                user.getPassword(),
                user.isActive(),
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked
                authorities
        );
    }
}