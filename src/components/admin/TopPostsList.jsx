"use client";

import React from "react";
import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/config/api";
import { Heart, Eye } from "lucide-react";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function TopPostsList() {
  const { data, error, isLoading } = useSWR(API_ENDPOINTS.admin.analytics.topPosts, fetcher);

  const isError = error;
  const isEmpty = data && data.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Posts</CardTitle>
        <CardDescription>Most-liked published posts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-destructive">Failed to load top posts data</div>
        ) : isEmpty ? (
          <div className="text-muted-foreground">No posts found</div>
        ) : (
          <div className="space-y-3">
            {data.map((post, idx) => (
              <div
                key={post.id}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium truncate text-foreground">{idx + 1}. {post.title}</p>
                  <p className="text-xs text-muted-foreground truncate">by {post.author_username}</p>
                </div>
                <div className="flex gap-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-rose-500">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm font-medium">{post.like_count}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">{post.view_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
