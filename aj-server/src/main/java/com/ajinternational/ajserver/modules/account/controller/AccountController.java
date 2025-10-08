package com.ajinternational.ajserver.modules.account.controller;

import com.ajinternational.ajserver.modules.hr.knowledge.dto.KnowledgeUpdateRequest; // YENİ EKLENDİ
import com.ajinternational.ajserver.modules.hr.knowledge.model.UserProductKnowledge; // YENİ EKLENDİ
import com.ajinternational.ajserver.modules.hr.knowledge.service.UserProductKnowledgeService; // YENİ EKLENDİ
import com.ajinternational.ajserver.modules.iam.dto.ChangePasswordRequest;
import com.ajinternational.ajserver.modules.iam.dto.UpdateProfileRequest;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.service.UserService;
import com.ajinternational.ajserver.modules.storage.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List; // YENİ EKLENDİ

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final UserProductKnowledgeService knowledgeService; // YENİ EKLENDİ

    // Giriş yapmış kullanıcının bilgilerini getirir
    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile(Authentication authentication) {
        return userService.getUserByUsername(authentication.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Giriş yapmış kullanıcının profilini günceller
    @PutMapping("/me")
    public ResponseEntity<User> updateMyProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        User updatedUser = userService.updateMyProfile(authentication.getName(), request);
        return ResponseEntity.ok(updatedUser);
    }

    // Giriş yapmış kullanıcının şifresini değiştirir
    @PostMapping("/change-password")
    public ResponseEntity<Void> changeMyPassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        userService.changeMyPassword(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/avatar")
    public ResponseEntity<String> uploadAvatar(Authentication authentication, @RequestParam("file") MultipartFile file) {
        String username = authentication.getName();
        String filePath = fileStorageService.storeFile(file, "avatars");
        userService.updateAvatarUrl(username, filePath);
        return ResponseEntity.ok(filePath);
    }

    // --- YENİ EKLENEN ENDPOINT'LER ---

    @GetMapping("/me/knowledge")
    public ResponseEntity<List<UserProductKnowledge>> getMyKnowledge(Authentication authentication) {
        User user = (User) userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        List<UserProductKnowledge> knowledgeList = knowledgeService.getKnowledgeByUserId(user.getId());
        return ResponseEntity.ok(knowledgeList);
    }

    @PostMapping("/me/knowledge")
    public ResponseEntity<Void> saveMyKnowledge(Authentication authentication, @Valid @RequestBody List<KnowledgeUpdateRequest> requests) {
        User user = (User) userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        knowledgeService.saveOrUpdateKnowledge(user.getId(), requests);
        return ResponseEntity.ok().build();
    }
}