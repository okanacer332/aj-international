package com.ajinternational.ajserver.modules.hr.knowledge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record KnowledgeUpdateRequest(
        @NotBlank(message = "Ürün ID boş olamaz.")
        String productId,

        @Min(value = 1, message = "Puan en az 1 olabilir.")
        @Max(value = 10, message = "Puan en fazla 10 olabilir.")
        int score
) {}