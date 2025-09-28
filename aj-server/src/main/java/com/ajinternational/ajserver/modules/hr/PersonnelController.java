package com.ajinternational.ajserver.modules.hr;

import com.ajinternational.ajserver.config.security.HasPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hr/personnel")
@RequiredArgsConstructor
public class PersonnelController {

    // Bu endpoint, "Personel Yönetimi" sayfasının varlığını ve yetkisini sisteme tanıtır.
    @GetMapping
    @HasPermission("PAGE_PERSONNEL:READ")
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:READ')")
    public ResponseEntity<String> getPersonnel() {
        return ResponseEntity.ok("Personnel endpoint is active.");
    }
}