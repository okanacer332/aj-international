package com.ajinternational.ajserver.modules.operation;

import com.ajinternational.ajserver.config.security.HasPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/operation/tasks")
@RequiredArgsConstructor
public class TaskController {

    // Bu endpoint, "Görev Yönetimi" sayfasının varlığını ve yetkisini sisteme tanıtır.
    // Sayfa oluşturulduğunda görevleri listelemek için kullanılacak.
    @GetMapping
    @HasPermission("PAGE_TASKS:READ")
    @PreAuthorize("hasAuthority('PAGE_TASKS:READ')")
    public ResponseEntity<String> getTasks() {
        // Şimdilik sadece yetki kontrolü için var, bu yüzden boş bir OK dönebiliriz.
        return ResponseEntity.ok("Tasks endpoint is active.");
    }
}