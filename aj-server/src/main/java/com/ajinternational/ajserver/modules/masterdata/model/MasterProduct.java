package com.ajinternational.ajserver.modules.masterdata.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Optional; // Hala subProducts için gerekli olabilir.

@Data
@NoArgsConstructor
@Document(collection = "master_products")
public class MasterProduct {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed(unique = true)
    private String code;

    private String name;

    private String description;

    // Hiyerarşi: Bu alan null ise Ana Ürün'dür.
    private String parentProductId;

    @Transient
    private List<MasterProduct> subProducts;

    // Sadece null olmayan değerler için standart getter.
    public Optional<String> getParentProductId() {
        return Optional.ofNullable(parentProductId);
    }
}