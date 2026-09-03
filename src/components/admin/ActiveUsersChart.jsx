"use client";

import React from "react";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/config/api";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function ActiveUsersChart() {
  const { data, error, isLoading } = useSWR(API_ENDPOINTS.admin.analytics.activeUsers, fetcher);

  const isError = error;
  const isEmpty = data && data.length === 0;
  const allZero = data && data.every((item) => item.post_count === 0 && item.comment_count === 0);

  // Recharts expects numeric x-axis for bar charts, so use index
  const chartData = data?.map((item, idx) => ({
    ...item,
    index: idx,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Active Users</CardTitle>
        <CardDescription>Posts and comments per user (top 10)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full animate-pulse rounded-md bg-muted" />
        ) : isError ? (
          <div className="text-destructive">Failed to load active users data</div>
        ) : isEmpty || allZero ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                style={{ fontSize: "12px" }}
              />
              <YAxis
                dataKey="username"
                type="category"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                style={{ fontSize: "11px" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Bar dataKey="post_count" stackId="a" fill="hsl(213 68% 50%)" name="Posts" />
              <Bar dataKey="comment_count" stackId="a" fill="hsl(17 82% 56%)" name="Comments" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
