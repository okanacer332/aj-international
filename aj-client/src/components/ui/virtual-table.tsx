"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface VirtualTableColumn<T> {
    key: keyof T | string;
    header: string;
    width?: number;
    minWidth?: number;
    render?: (item: T, index: number) => React.ReactNode;
}

export interface VirtualTableProps<T> {
    data: T[];
    columns: VirtualTableColumn<T>[];
    rowHeight?: number;
    headerHeight?: number;
    containerHeight?: number;
    isLoading?: boolean;
    loadingRows?: number;
    onRowClick?: (item: T, index: number) => void;
    getRowId?: (item: T) => string;
    emptyMessage?: string;
    className?: string;
}

/**
 * Virtual Table Component
 * 
 * High-performance table that only renders visible rows.
 * Supports 100K+ rows without performance degradation.
 */
export function VirtualTable<T extends object>({
    data,
    columns,
    rowHeight = 48,
    headerHeight = 48,
    containerHeight = 600,
    isLoading = false,
    loadingRows = 10,
    onRowClick,
    getRowId,
    emptyMessage = "Veri bulunamadı",
    className,
}: VirtualTableProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);

    // Calculate scrollbar width
    useEffect(() => {
        if (parentRef.current) {
            const scrollWidth = parentRef.current.offsetWidth - parentRef.current.clientWidth;
            setScrollbarWidth(scrollWidth);
        }
    }, [data]);

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 10,
    });

    const virtualRows = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    const getCellValue = useCallback((item: T, column: VirtualTableColumn<T>) => {
        if (column.render) {
            return column.render(item, 0);
        }
        const value = (item as Record<string, unknown>)[column.key as string];
        if (value === null || value === undefined) return "-";
        if (value instanceof Date) return value.toLocaleDateString("tr-TR");
        return String(value);
    }, []);

    if (isLoading) {
        return (
            <div className={cn("rounded-md border", className)}>
                {/* Header Skeleton */}
                <div
                    className="flex bg-muted/50 border-b"
                    style={{ height: headerHeight }}
                >
                    {columns.map((col, i) => (
                        <div
                            key={i}
                            className="flex items-center px-4 font-medium"
                            style={{ width: col.width, minWidth: col.minWidth || 100 }}
                        >
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
                {/* Body Skeleton */}
                <div>
                    {Array.from({ length: loadingRows }).map((_, i) => (
                        <div key={i} className="flex border-b" style={{ height: rowHeight }}>
                            {columns.map((col, j) => (
                                <div
                                    key={j}
                                    className="flex items-center px-4"
                                    style={{ width: col.width, minWidth: col.minWidth || 100 }}
                                >
                                    <Skeleton className="h-4 w-full max-w-[80%]" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={cn("rounded-md border", className)}>
                <div
                    className="flex bg-muted/50 border-b"
                    style={{ height: headerHeight }}
                >
                    {columns.map((col, i) => (
                        <div
                            key={i}
                            className="flex items-center px-4 font-medium text-sm"
                            style={{ width: col.width, minWidth: col.minWidth || 100 }}
                        >
                            {col.header}
                        </div>
                    ))}
                </div>
                <div
                    className="flex items-center justify-center text-muted-foreground"
                    style={{ height: containerHeight - headerHeight }}
                >
                    {emptyMessage}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("rounded-md border overflow-hidden", className)}>
            {/* Header */}
            <div
                className="flex bg-muted/50 border-b"
                style={{ height: headerHeight, paddingRight: scrollbarWidth }}
            >
                {columns.map((col, i) => (
                    <div
                        key={i}
                        className="flex items-center px-4 font-medium text-sm flex-shrink-0"
                        style={{
                            width: col.width,
                            minWidth: col.minWidth || 100,
                            flex: col.width ? undefined : 1,
                        }}
                    >
                        {col.header}
                    </div>
                ))}
            </div>

            {/* Virtual Body */}
            <div
                ref={parentRef}
                className="overflow-auto"
                style={{ height: containerHeight - headerHeight }}
            >
                <div
                    style={{
                        height: `${totalSize}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {virtualRows.map((virtualRow) => {
                        const item = data[virtualRow.index];
                        const rowId = getRowId ? getRowId(item) : virtualRow.index;

                        return (
                            <div
                                key={rowId}
                                data-index={virtualRow.index}
                                className={cn(
                                    "flex border-b absolute left-0 w-full",
                                    onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors",
                                    virtualRow.index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                )}
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                onClick={() => onRowClick?.(item, virtualRow.index)}
                            >
                                {columns.map((col, colIndex) => (
                                    <div
                                        key={colIndex}
                                        className="flex items-center px-4 text-sm flex-shrink-0 overflow-hidden"
                                        style={{
                                            width: col.width,
                                            minWidth: col.minWidth || 100,
                                            flex: col.width ? undefined : 1,
                                        }}
                                    >
                                        <span className="truncate">
                                            {getCellValue(item, col)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer with count */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t text-sm text-muted-foreground">
                <span>Toplam: {data.length.toLocaleString("tr-TR")} kayıt</span>
                <span>
                    Görüntülenen: {virtualRows[0]?.index + 1 || 0} - {virtualRows[virtualRows.length - 1]?.index + 1 || 0}
                </span>
            </div>
        </div>
    );
}

/**
 * Example usage:
 * 
 * const columns: VirtualTableColumn<AuditLog>[] = [
 *   { key: "timestamp", header: "Tarih", width: 180, render: (item) => formatDate(item.timestamp) },
 *   { key: "action", header: "İşlem", width: 120 },
 *   { key: "username", header: "Kullanıcı", width: 150 },
 *   { key: "details", header: "Detay" },
 * ];
 * 
 * <VirtualTable
 *   data={auditLogs}
 *   columns={columns}
 *   containerHeight={500}
 *   onRowClick={(item) => showDetails(item)}
 * />
 */
