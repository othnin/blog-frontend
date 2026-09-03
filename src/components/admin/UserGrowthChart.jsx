"use client";

import React from "react";
import useSWR from "swr";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/config/api";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function UserGrowthChart() {
  const { data, error, isLoading } = useSWR(API_ENDPOINTS.admin.analytics.userGrowth, fetcher);

  const isError = error;
  const isEmpty = data && data.length === 0;
  const allZero = data && data.every((item) => item.count === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>New signups per month, last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full animate-pulse rounded-md bg-muted" />
        ) : isError ? (
          <div className="text-destructive">Failed to load user growth data</div>
        ) : isEmpty || allZero ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No signup data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(213 68% 50%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(213 68% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="period"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                style={{ fontSize: "12px" }}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(213 68% 50%)"
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
