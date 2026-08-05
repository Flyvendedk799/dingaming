import { cn } from "@/lib/utils";
import React from "react";

interface ProductCardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Loading placeholders.
 *
 * These had drifted well away from the cards they stand in for: a 4:5 image
 * frame against the card's real ratio, five star placeholders for the ratings
 * that were removed, a trust-badge row and a full-width button that no card
 * has. Every one of those was a layout shift the moment real data arrived.
 * The shapes below mirror the actual cards: cover, eyebrow, two title lines,
 * price row.
 */
const ProductCardSkeleton = ({ className, ...props }: ProductCardSkeletonProps) => (
  <div
    className={cn("relative overflow-hidden rounded-xl border border-border bg-card", className)}
    {...props}
  >
    <div className="relative aspect-[8/7] overflow-hidden">
      <div className="skeleton-shimmer absolute inset-0" />
    </div>

    <div className="space-y-3 p-4">
      <div className="skeleton-shimmer h-3 w-24 rounded" />
      <div className="space-y-2">
        <div className="skeleton-shimmer h-4 rounded" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
      </div>
      <div className="flex items-end justify-between gap-3 pt-1">
        <div className="skeleton-shimmer h-6 w-24 rounded" />
        <div className="skeleton-shimmer h-9 w-20 rounded-lg" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {[...Array(count)].map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const MobileProductCardSkeleton = ({ className, ...props }: ProductCardSkeletonProps) => (
  <div
    className={cn("w-full overflow-hidden rounded-xl border border-border bg-card", className)}
    {...props}
  >
    <div className="relative aspect-[8/7]">
      <div className="skeleton-shimmer absolute inset-0" />
    </div>
    <div className="space-y-2 p-3">
      <div className="skeleton-shimmer h-3 w-20 rounded" />
      <div className="skeleton-shimmer h-4 rounded" />
      <div className="skeleton-shimmer h-5 w-20 rounded" />
    </div>
  </div>
);

export const MobileProductGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-3">
    {[...Array(count)].map((_, i) => (
      <MobileProductCardSkeleton key={i} />
    ))}
  </div>
);

export default ProductCardSkeleton;
