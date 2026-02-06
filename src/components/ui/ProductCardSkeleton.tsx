import { cn } from "@/lib/utils";
import React from "react";

interface ProductCardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const ProductCardSkeleton = ({ className, ...props }: ProductCardSkeletonProps) => {
  return (
    <div className={cn("relative bg-card rounded-xl overflow-hidden border border-border", className)} {...props}>
      {/* Image skeleton */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer" />
        
        {/* Discount badge skeleton */}
        <div className="absolute top-3 left-3 w-14 h-7 rounded-xl skeleton-shimmer" />
        
        {/* Platform badge skeleton */}
        <div className="absolute top-3 right-3 w-16 h-7 rounded-xl skeleton-shimmer" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Rating skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded skeleton-shimmer" />
            ))}
          </div>
          <div className="w-16 h-4 rounded skeleton-shimmer" />
        </div>

        {/* Title skeleton - 2 lines */}
        <div className="space-y-2">
          <div className="h-5 rounded skeleton-shimmer" />
          <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        </div>

        {/* Price skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-7 rounded skeleton-shimmer" />
          <div className="w-14 h-4 rounded skeleton-shimmer" />
        </div>

        {/* Button skeleton */}
        <div className="h-11 rounded-lg skeleton-shimmer" />

        {/* Trust badges skeleton */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-border">
          <div className="w-20 h-4 rounded skeleton-shimmer" />
          <div className="w-24 h-4 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton 
          key={i} 
          className="animate-fade-in"
          style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export const MobileProductCardSkeleton = ({ className, ...props }: ProductCardSkeletonProps) => {
  return (
    <div className={cn("w-full bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-border/30", className)} {...props}>
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <div className="absolute inset-0 skeleton-shimmer" />
        <div className="absolute top-2.5 left-2.5 w-12 h-6 rounded-xl skeleton-shimmer" />
        <div className="absolute top-2.5 right-2.5 w-14 h-6 rounded-xl skeleton-shimmer" />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded skeleton-shimmer" />
          <div className="w-8 h-3 rounded skeleton-shimmer" />
        </div>
        <div className="h-4 rounded skeleton-shimmer" />
        <div className="flex items-center gap-2">
          <div className="w-16 h-5 rounded skeleton-shimmer" />
          <div className="w-12 h-3 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const MobileProductGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(count)].map((_, i) => (
        <MobileProductCardSkeleton 
          key={i}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;
