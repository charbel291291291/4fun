/**
 * Skeleton.tsx
 * Loading skeleton components — one per major view section.
 * Prevents blank screens and improves perceived performance.
 */

import React from 'react';
import { cn } from './utils';

// ─────────────────────────────────────────────
// Base Skeleton Block
// ─────────────────────────────────────────────

export function SkeletonBlock({
  className,
  pulse = false,
}: {
  className?: string;
  pulse?: boolean;
}) {
  return (
    <div className={cn(pulse ? 'skeleton-pulse' : 'skeleton', className)} />
  );
}

// ─────────────────────────────────────────────
// Dashboard Skeleton
// ─────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-float-up">
      {/* Stat cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card shrink-0 w-[160px] md:w-auto p-5 space-y-3">
            <SkeletonBlock className="w-9 h-9 rounded-xl" />
            <SkeletonBlock className="w-20 h-2.5 mt-2" />
            <SkeletonBlock className="w-28 h-7" />
          </div>
        ))}
      </div>

      {/* Quick status row (mobile) */}
      <div className="grid grid-cols-3 gap-3 md:hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-3 space-y-2 text-center">
            <SkeletonBlock className="w-5 h-5 rounded-full mx-auto" pulse />
            <SkeletonBlock className="w-8 h-5 mx-auto" />
            <SkeletonBlock className="w-12 h-2 mx-auto" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="glass-card p-5 md:p-8 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonBlock className="w-40 h-5" />
            <SkeletonBlock className="w-56 h-3" />
          </div>
          <div className="flex gap-2">
            <SkeletonBlock className="w-16 h-8 rounded-xl" />
            <SkeletonBlock className="w-16 h-8 rounded-xl" />
          </div>
        </div>
        <SkeletonBlock className="w-full h-[200px] md:h-[280px] rounded-2xl" />
      </div>

      {/* Top performers */}
      <div className="glass-card p-5 md:p-8 space-y-4">
        <SkeletonBlock className="w-32 h-5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 bg-white/3 rounded-2xl space-y-3 text-center">
              <SkeletonBlock className="w-16 h-16 rounded-full mx-auto" pulse />
              <SkeletonBlock className="w-24 h-4 mx-auto" />
              <SkeletonBlock className="w-16 h-3 mx-auto" />
              <SkeletonBlock className="w-full h-10 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Model Card Skeleton (mobile)
// ─────────────────────────────────────────────

export function ModelCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-float-up">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-14 h-14 rounded-2xl shrink-0" pulse />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="w-28 h-4" />
            <SkeletonBlock className="w-20 h-3" />
          </div>
          <div className="text-left space-y-1">
            <SkeletonBlock className="w-16 h-5" />
            <SkeletonBlock className="w-12 h-2.5" />
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-black/20 rounded-xl p-2.5 space-y-1.5">
              <SkeletonBlock className="w-12 h-4 mx-auto" />
              <SkeletonBlock className="w-10 h-2 mx-auto" />
            </div>
          ))}
        </div>
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <SkeletonBlock className="w-24 h-2.5" />
            <SkeletonBlock className="w-8 h-2.5" />
          </div>
          <SkeletonBlock className="w-full h-1.5 rounded-full" />
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <SkeletonBlock key={i} className="flex-1 h-10 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ModelsViewSkeleton() {
  return (
    <div className="space-y-4 animate-float-up">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <SkeletonBlock className="w-20 h-2.5" />
              <SkeletonBlock className="w-10 h-6" />
            </div>
            <SkeletonBlock className="w-9 h-9 rounded-xl" />
          </div>
        ))}
      </div>
      {/* Search + filters */}
      <div className="flex gap-3">
        <SkeletonBlock className="flex-1 h-10 rounded-xl" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <SkeletonBlock key={i} className="w-16 h-10 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Cards */}
      {[...Array(3)].map((_, i) => (
        <ModelCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Notification Skeleton
// ─────────────────────────────────────────────

export function NotificationSkeleton() {
  return (
    <div className="glass-card p-4 animate-float-up">
      <div className="flex gap-4">
        <SkeletonBlock className="w-11 h-11 rounded-2xl shrink-0" pulse />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="w-40 h-4" />
          <SkeletonBlock className="w-full h-3" />
          <SkeletonBlock className="w-4/5 h-3" />
          <div className="flex gap-2 pt-1">
            <SkeletonBlock className="w-20 h-8 rounded-xl" />
            <SkeletonBlock className="w-16 h-8 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsViewSkeleton() {
  return (
    <div className="space-y-4 animate-float-up max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="w-32 h-7" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <SkeletonBlock key={i} className="w-20 h-8 rounded-2xl" />
          ))}
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Settings Skeleton
// ─────────────────────────────────────────────

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6 animate-float-up">
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="w-12 h-12 rounded-xl" pulse />
          <div className="space-y-2">
            <SkeletonBlock className="w-36 h-5" />
            <SkeletonBlock className="w-52 h-3" />
          </div>
        </div>
        <SkeletonBlock className="w-full h-16 rounded-2xl" />
        {[...Array(2)].map((_, i) => (
          <SkeletonBlock key={i} className="w-full h-20 rounded-2xl" />
        ))}
      </div>
      <SkeletonBlock className="w-full h-14 rounded-2xl" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Table Row Skeleton (desktop)
// ─────────────────────────────────────────────

export function TableRowSkeleton({ cols = 7 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/4">
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          {i === 0 ? (
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-10 h-10 rounded-full" pulse />
              <div className="space-y-1.5">
                <SkeletonBlock className="w-24 h-3.5" />
                <SkeletonBlock className="w-16 h-2.5" />
              </div>
            </div>
          ) : (
            <SkeletonBlock className="w-16 h-3.5" />
          )}
        </td>
      ))}
    </tr>
  );
}
