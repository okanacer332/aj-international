package com.ajinternational.ajserver.modules.masterdata.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "master_services")
// Bir tenant içinde Araç Plakası benzersiz olmalı
@CompoundIndex(name = "tenant_plate_idx", def = "{'tenantId' : 1, 'vehiclePlate' : 1}", unique = true)
public class ServiceDefinition {

    @Id
    private String id;

    private String tenantId;

    @NotBlank(message = "Şoför adı boş olamaz")
    private String driverName;

    @NotBlank(message = "Telefon boş olamaz")
    private String phone;

    @NotBlank(message = "Araç plakası boş olamaz")
    private String vehiclePlate;

    @Min(value = 1, message = "Kapasite en az 1 olmalıdır")
    private Integer vehicleCapacity = 1;

    public ServiceDefinition(String tenantId, String driverName, String phone, String vehiclePlate, Integer vehicleCapacity) {
        this.tenantId = tenantId;
        this.driverName = driverName;
        this.phone = phone;
        this.vehiclePlate = vehiclePlate;
        this.vehicleCapacity = vehicleCapacity;
    }
}