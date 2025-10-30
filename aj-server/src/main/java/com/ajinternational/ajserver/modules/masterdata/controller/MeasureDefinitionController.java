package com.ajinternational.ajserver.modules.masterdata.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.masterdata.model.MeasureDefinition;
import com.ajinternational.ajserver.modules.masterdata.service.MeasureDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/masterdata/measures") // API yolunu 'measures' olarak belirledik
@RequiredArgsConstructor
public class MeasureDefinitionController {

    private final MeasureDefinitionService measureService;

    @GetMapping
    @HasPermission("PAGE_MEASURES:READ")
    @PreAuthorize("hasAuthority('PAGE_MEASURES:READ')")
    public ResponseEntity<List<MeasureDefinition>> getAllMeasures() {
        return ResponseEntity.ok(measureService.findAllMeasures());
    }

    @PostMapping
    @HasPermission("PAGE_MEASURES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_MEASURES:WRITE')")
    public ResponseEntity<MeasureDefinition> saveMeasure(@Valid @RequestBody MeasureDefinition measureDefinition) {
        return ResponseEntity.ok(measureService.saveMeasure(measureDefinition));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_MEASURES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_MEASURES:WRITE')")
    public ResponseEntity<Void> deleteMeasure(@PathVariable String id) {
        measureService.deleteMeasure(id);
        return ResponseEntity.noContent().build();
    }
}