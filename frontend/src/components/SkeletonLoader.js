import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

// Skeleton animation CSS class
const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

// PostCard Skeleton
export const PostCardSkeleton = () => (
  <Card className="overflow-hidden shadow-sm border-slate-200 bg-white">
    <CardContent className="p-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className={`w-12 h-12 bg-slate-200 rounded-full ${shimmer}`}></div>
        <div className="ml-3 flex-1">
          <div className={`h-4 bg-slate-200 rounded w-32 mb-2 ${shimmer}`}></div>
          <div className={`h-3 bg-slate-200 rounded w-24 ${shimmer}`}></div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        <div className={`h-4 bg-slate-200 rounded w-full ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-5/6 ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-4/6 ${shimmer}`}></div>
      </div>

      {/* Image placeholder (50% chance) */}
      {Math.random() > 0.5 && (
        <div className={`h-64 bg-slate-200 rounded-xl mb-4 ${shimmer}`}></div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
        <div className={`h-8 bg-slate-200 rounded w-16 ${shimmer}`}></div>
        <div className={`h-8 bg-slate-200 rounded w-16 ${shimmer}`}></div>
        <div className={`h-8 bg-slate-200 rounded w-16 ${shimmer}`}></div>
      </div>
    </CardContent>
  </Card>
);

// BlogCard Skeleton
export const BlogCardSkeleton = () => (
  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all border-slate-200 bg-white">
    <CardContent className="p-0">
      {/* Cover Image */}
      <div className={`h-48 bg-slate-200 ${shimmer}`}></div>

      <div className="p-6">
        {/* Author */}
        <div className="flex items-center mb-4">
          <div className={`w-10 h-10 bg-slate-200 rounded-full ${shimmer}`}></div>
          <div className="ml-3 flex-1">
            <div className={`h-3 bg-slate-200 rounded w-24 mb-2 ${shimmer}`}></div>
            <div className={`h-3 bg-slate-200 rounded w-16 ${shimmer}`}></div>
          </div>
        </div>

        {/* Title */}
        <div className={`h-6 bg-slate-200 rounded w-full mb-2 ${shimmer}`}></div>
        <div className={`h-6 bg-slate-200 rounded w-4/5 mb-4 ${shimmer}`}></div>

        {/* Excerpt */}
        <div className="space-y-2 mb-4">
          <div className={`h-4 bg-slate-200 rounded w-full ${shimmer}`}></div>
          <div className={`h-4 bg-slate-200 rounded w-5/6 ${shimmer}`}></div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <div className={`h-6 bg-slate-200 rounded-full w-16 ${shimmer}`}></div>
          <div className={`h-6 bg-slate-200 rounded-full w-20 ${shimmer}`}></div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex gap-4">
            <div className={`h-8 bg-slate-200 rounded w-12 ${shimmer}`}></div>
            <div className={`h-8 bg-slate-200 rounded w-12 ${shimmer}`}></div>
          </div>
          <div className={`h-8 bg-slate-200 rounded w-20 ${shimmer}`}></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Feed Skeleton (for HomePage)
export const FeedSkeleton = () => (
  <div className="space-y-3">
    <PostCardSkeleton />
    <PostCardSkeleton />
    <PostCardSkeleton />
  </div>
);

// Blog Grid Skeleton
export const BlogGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <BlogCardSkeleton />
    <BlogCardSkeleton />
    <BlogCardSkeleton />
    <BlogCardSkeleton />
  </div>
);

// Trending Item Skeleton
export const TrendingItemSkeleton = () => (
  <Card className="overflow-hidden shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className={`w-20 h-20 bg-slate-200 rounded-lg flex-shrink-0 ${shimmer}`}></div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className={`h-4 bg-slate-200 rounded w-full mb-2 ${shimmer}`}></div>
          <div className={`h-4 bg-slate-200 rounded w-3/4 mb-3 ${shimmer}`}></div>
          
          {/* Stats */}
          <div className="flex gap-4">
            <div className={`h-3 bg-slate-200 rounded w-12 ${shimmer}`}></div>
            <div className={`h-3 bg-slate-200 rounded w-12 ${shimmer}`}></div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Sidebar Skeleton (for WhoToFollow)
export const SidebarSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-slate-200 rounded-full ${shimmer}`}></div>
          <div>
            <div className={`h-3 bg-slate-200 rounded w-24 mb-2 ${shimmer}`}></div>
            <div className={`h-3 bg-slate-200 rounded w-16 ${shimmer}`}></div>
          </div>
        </div>
        <div className={`h-8 bg-slate-200 rounded w-16 ${shimmer}`}></div>
      </div>
    ))}
  </div>
);

// Profile Header Skeleton
export const ProfileHeaderSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
    {/* Cover Photo */}
    <div className={`h-48 sm:h-64 bg-slate-200 ${shimmer}`}></div>
    
    {/* Profile Info */}
    <div className="p-6">
      <div className="flex items-start gap-4 sm:gap-6 -mt-16 sm:-mt-20">
        {/* Avatar */}
        <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 rounded-full border-4 border-white ${shimmer}`}></div>
        
        <div className="flex-1 mt-16 sm:mt-20">
          {/* Name */}
          <div className={`h-7 bg-slate-200 rounded w-48 mb-2 ${shimmer}`}></div>
          {/* Username */}
          <div className={`h-4 bg-slate-200 rounded w-32 mb-4 ${shimmer}`}></div>
          
          {/* Stats */}
          <div className="flex gap-6 mb-4">
            <div>
              <div className={`h-6 bg-slate-200 rounded w-12 mb-1 ${shimmer}`}></div>
              <div className={`h-3 bg-slate-200 rounded w-16 ${shimmer}`}></div>
            </div>
            <div>
              <div className={`h-6 bg-slate-200 rounded w-12 mb-1 ${shimmer}`}></div>
              <div className={`h-3 bg-slate-200 rounded w-20 ${shimmer}`}></div>
            </div>
            <div>
              <div className={`h-6 bg-slate-200 rounded w-12 mb-1 ${shimmer}`}></div>
              <div className={`h-3 bg-slate-200 rounded w-16 ${shimmer}`}></div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-2">
            <div className={`h-10 bg-slate-200 rounded-lg w-24 ${shimmer}`}></div>
            <div className={`h-10 bg-slate-200 rounded-lg w-24 ${shimmer}`}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Post Detail Skeleton
export const PostDetailSkeleton = () => (
  <Card className="overflow-hidden shadow-lg border-slate-200 bg-white max-w-3xl mx-auto">
    <CardContent className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className={`w-14 h-14 bg-slate-200 rounded-full ${shimmer}`}></div>
        <div className="ml-4 flex-1">
          <div className={`h-5 bg-slate-200 rounded w-40 mb-2 ${shimmer}`}></div>
          <div className={`h-4 bg-slate-200 rounded w-24 ${shimmer}`}></div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 mb-6">
        <div className={`h-4 bg-slate-200 rounded w-full ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-full ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-3/4 ${shimmer}`}></div>
      </div>

      {/* Image */}
      <div className={`h-96 bg-slate-200 rounded-xl mb-6 ${shimmer}`}></div>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
        <div className={`h-10 bg-slate-200 rounded w-20 ${shimmer}`}></div>
        <div className={`h-10 bg-slate-200 rounded w-20 ${shimmer}`}></div>
        <div className={`h-10 bg-slate-200 rounded w-20 ${shimmer}`}></div>
      </div>
    </CardContent>
  </Card>
);

// Blog Detail Skeleton
export const BlogDetailSkeleton = () => (
  <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
    {/* Cover Image */}
    <div className={`h-64 sm:h-96 bg-slate-200 ${shimmer}`}></div>
    
    <div className="p-8">
      {/* Author Info */}
      <div className="flex items-center mb-6">
        <div className={`w-12 h-12 bg-slate-200 rounded-full ${shimmer}`}></div>
        <div className="ml-3">
          <div className={`h-4 bg-slate-200 rounded w-32 mb-2 ${shimmer}`}></div>
          <div className={`h-3 bg-slate-200 rounded w-24 ${shimmer}`}></div>
        </div>
      </div>
      
      {/* Title */}
      <div className={`h-10 bg-slate-200 rounded w-full mb-3 ${shimmer}`}></div>
      <div className={`h-10 bg-slate-200 rounded w-3/4 mb-6 ${shimmer}`}></div>
      
      {/* Tags */}
      <div className="flex gap-2 mb-8">
        <div className={`h-6 bg-slate-200 rounded-full w-20 ${shimmer}`}></div>
        <div className={`h-6 bg-slate-200 rounded-full w-24 ${shimmer}`}></div>
        <div className={`h-6 bg-slate-200 rounded-full w-16 ${shimmer}`}></div>
      </div>
      
      {/* Content */}
      <div className="space-y-4 mb-8">
        <div className={`h-4 bg-slate-200 rounded w-full ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-full ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-full ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-5/6 ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-full ${shimmer}`}></div>
        <div className={`h-4 bg-slate-200 rounded w-4/5 ${shimmer}`}></div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
        <div className={`h-10 bg-slate-200 rounded w-24 ${shimmer}`}></div>
        <div className={`h-10 bg-slate-200 rounded w-24 ${shimmer}`}></div>
        <div className={`h-10 bg-slate-200 rounded w-24 ${shimmer}`}></div>
      </div>
    </div>
  </div>
);

