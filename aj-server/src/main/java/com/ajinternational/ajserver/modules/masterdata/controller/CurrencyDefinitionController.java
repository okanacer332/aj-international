package com.ajinternational.ajserver.modules.masterdata.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.masterdata.model.CurrencyDefinition;
import com.ajinternational.ajserver.modules.masterdata.service.CurrencyDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/masterdata/currencies")
@RequiredArgsConstructor
public class CurrencyDefinitionController {

    private final CurrencyDefinitionService currencyService;

    @GetMapping
    @HasPermission("PAGE_CURRENCIES:READ")
    @PreAuthorize("hasAuthority('PAGE_CURRENCIES:READ')")
    public ResponseEntity<List<CurrencyDefinition>> getAllCurrencies() {
        return ResponseEntity.ok(currencyService.findAllCurrencies());
    }

    @PostMapping
    @HasPermission("PAGE_CURRENCIES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_CURRENCIES:WRITE')")
    public ResponseEntity<CurrencyDefinition> saveCurrency(@Valid @RequestBody CurrencyDefinition currency) {
        return ResponseEntity.ok(currencyService.saveCurrency(currency));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_CURRENCIES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_CURRENCIES:WRITE')")
    public ResponseEntity<Void> deleteCurrency(@PathVariable String id) {
        currencyService.deleteCurrency(id);
        return ResponseEntity.noContent().build();
    }
}