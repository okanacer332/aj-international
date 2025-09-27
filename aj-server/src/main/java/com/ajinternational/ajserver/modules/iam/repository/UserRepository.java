package com.ajinternational.ajserver.modules.iam.repository;

import com.ajinternational.ajserver.modules.iam.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Kullanıcıyı kullanıcı adına göre bulur.
     * @param username Kullanıcı adı
     * @return Bulunan kullanıcı nesnesi veya boş Optional
     */
    Optional<User> findByUsername(String username);

    /**
     * Belirtilen kullanıcı adının sistemde olup olmadığını kontrol eder.
     * @param username Kontrol edilecek kullanıcı adı
     * @return kullanıcı adı varsa true, yoksa false
     */
    boolean existsByUsername(String username);

    // email ile ilgili metotları şimdilik kaldırıyoruz, gerekirse daha sonra ekleriz.
}