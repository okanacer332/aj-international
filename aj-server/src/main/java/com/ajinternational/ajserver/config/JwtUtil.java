package com.ajinternational.ajserver.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils; // StringUtils import edildi

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    // Ayırıcı karakter
    private static final String SUBJECT_SEPARATOR = ":";

    private SecretKey getKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // --- DEĞİŞİKLİK: Subject'ten sadece kullanıcı adını çıkar ---
    public String extractUsername(String token) {
        String subject = extractClaim(token, Claims::getSubject);
        if (StringUtils.hasText(subject) && subject.contains(SUBJECT_SEPARATOR)) {
            return subject.substring(0, subject.lastIndexOf(SUBJECT_SEPARATOR));
        }
        // Eğer ayırıcı yoksa (eski tokenlar veya beklenmedik durum), tüm subject'i dön
        return subject;
    }
    // --- DEĞİŞİKLİK SONU ---

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // --- DEĞİŞİKLİK: Subject'ten tenant ID'yi çıkar (aynı zamanda claim'den de alabiliriz) ---
    public String extractTenantIdFromSubject(String token) {
        String subject = extractClaim(token, Claims::getSubject);
        if (StringUtils.hasText(subject) && subject.contains(SUBJECT_SEPARATOR)) {
            return subject.substring(subject.lastIndexOf(SUBJECT_SEPARATOR) + 1);
        }
        return null; // Subject'te tenantId bulunamazsa null dön
    }
    // --- DEĞİŞİKLİK SONU ---

    // Ayrı claim olarak tenantId'yi çıkarmak için metot (bu hala geçerli)
    public String extractTenantIdFromClaim(String token) {
        return extractClaim(token, claims -> claims.get("tenantId", String.class));
    }

    // extractTenantId metodunu güncelleyelim, önce subject'e baksın, yoksa claim'e
    public String extractTenantId(String token) {
        String tenantIdFromSubject = extractTenantIdFromSubject(token);
        if (StringUtils.hasText(tenantIdFromSubject)) {
            return tenantIdFromSubject;
        }
        // Eğer subject'te yoksa (belki eski token), claim'e bak
        return extractTenantIdFromClaim(token);
    }


    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UserDetails userDetails, String tenantId) {
        // --- DEĞİŞİKLİK: Subject'i birleştirilmiş bilgi ile ayarla ---
        String subject = userDetails.getUsername() + SUBJECT_SEPARATOR + tenantId;
        // --- DEĞİŞİKLİK SONU ---

        // tenantId'yi ayrıca claim olarak da ekleyebiliriz (opsiyonel ama yedeklilik sağlar)
        Map<String, Object> claims = Map.of("tenantId", tenantId);

        return Jwts.builder()
                .claims(claims) // Custom claim'leri ekle
                .subject(subject) // Birleştirilmiş subject'i ayarla
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    // --- DEĞİŞİKLİK: Token doğrulaması artık subject'ten çıkarılan username'e göre ---
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String usernameFromToken = extractUsername(token); // Artık subject'ten parse edilmiş username
        return (usernameFromToken.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
    // --- DEĞİŞİKLİK SONU ---
}