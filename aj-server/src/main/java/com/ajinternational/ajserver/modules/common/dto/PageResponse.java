package com.ajinternational.ajserver.modules.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Generic Page Response DTO for paginated API responses
 * 
 * Usage:
 * PageResponse<Product> response = PageResponse.<Product>builder()
 * .content(products)
 * .page(0)
 * .size(20)
 * .totalElements(100)
 * .build();
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    /**
     * List of items for the current page
     */
    private List<T> content;

    /**
     * Current page number (0-indexed)
     */
    private int page;

    /**
     * Number of items per page
     */
    private int size;

    /**
     * Total number of elements across all pages
     */
    private long totalElements;

    /**
     * Total number of pages
     */
    private int totalPages;

    /**
     * Whether this is the first page
     */
    private boolean first;

    /**
     * Whether this is the last page
     */
    private boolean last;

    /**
     * Whether there's content on this page
     */
    private boolean hasContent;

    /**
     * Create a PageResponse from Spring Data Page
     */
    public static <T> PageResponse<T> fromPage(org.springframework.data.domain.Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .hasContent(page.hasContent())
                .build();
    }

    /**
     * Create a PageResponse for unpaged data (all items in single page)
     */
    public static <T> PageResponse<T> unpaged(List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .page(0)
                .size(content.size())
                .totalElements(content.size())
                .totalPages(1)
                .first(true)
                .last(true)
                .hasContent(!content.isEmpty())
                .build();
    }
}
