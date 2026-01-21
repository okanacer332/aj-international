"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
    /** Fallback image URL if main image fails to load */
    fallbackSrc?: string;
    /** Show skeleton while loading */
    showSkeleton?: boolean;
    /** Aspect ratio for placeholder (e.g., "16/9", "1/1", "4/3") */
    aspectRatio?: string;
    /** Container className */
    containerClassName?: string;
}

/**
 * Optimized Image Component
 * 
 * Features:
 * - Automatic lazy loading
 * - Blur placeholder support
 * - Loading skeleton
 * - Error fallback
 * - Responsive sizing
 * - Automatic format conversion (WebP/AVIF)
 */
export function OptimizedImage({
    src,
    alt,
    fallbackSrc = "/logos/aj-international.jpeg",
    showSkeleton = true,
    aspectRatio,
    containerClassName,
    className,
    priority = false,
    ...props
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;

    return (
        <div
            className={cn(
                "relative overflow-hidden",
                containerClassName
            )}
            style={aspectRatio ? { aspectRatio } : undefined}
        >
            {/* Loading Skeleton */}
            {showSkeleton && isLoading && (
                <Skeleton className="absolute inset-0 z-10" />
            )}

            {/* Optimized Image */}
            <Image
                src={imageSrc}
                alt={alt}
                className={cn(
                    "transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                priority={priority}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    if (!hasError) {
                        setHasError(true);
                    }
                }}
                {...props}
            />
        </div>
    );
}

/**
 * Avatar Component - Optimized for user avatars
 */
export function OptimizedAvatar({
    src,
    alt,
    size = 40,
    fallbackSrc = "/avatars/arhamkhnz.png",
    className,
    ...props
}: OptimizedImageProps & { size?: number }) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={size}
            height={size}
            fallbackSrc={fallbackSrc}
            containerClassName={cn("rounded-full", className)}
            className="rounded-full object-cover"
            {...props}
        />
    );
}

/**
 * Product Image - Optimized for product listings
 */
export function ProductImage({
    src,
    alt,
    className,
    ...props
}: OptimizedImageProps) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            aspectRatio="1/1"
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            containerClassName={cn("bg-muted rounded-lg", className)}
            className="object-cover"
            {...props}
        />
    );
}

/**
 * Logo Image - Optimized for logos
 */
export function LogoImage({
    src,
    alt,
    width = 120,
    height = 40,
    className,
    ...props
}: OptimizedImageProps) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            showSkeleton={false}
            priority
            className={cn("object-contain", className)}
            {...props}
        />
    );
}

/**
 * Example usage:
 * 
 * <OptimizedImage
 *   src="/products/product-1.jpg"
 *   alt="Product Name"
 *   width={400}
 *   height={300}
 *   showSkeleton
 * />
 * 
 * <OptimizedAvatar
 *   src={user.avatarUrl}
 *   alt={user.name}
 *   size={48}
 * />
 * 
 * <ProductImage
 *   src={product.imageUrl}
 *   alt={product.name}
 * />
 */
