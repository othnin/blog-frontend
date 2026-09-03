"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/config/api";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function PostTrendChart() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const endpoint = useMemo(() => {
    let url = API_ENDPOINTS.admin.analytics.postTrend;
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    return url;
  }, [startDate, endDate]);

  const { data, error, isLoading } = useSWR(endpoint, fetcher);

  const isError = error;
  const isEmpty = data && data.length === 0;
  const allZero = data && data.every((item) => item.count === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing Trend</CardTitle>
        <CardDescription>Posts published per month, last 12 months</CardDescription>
        <div className="flex gap-2 mt-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
            placeholder="Start date"
          />
          <span className="text-sm text-muted-foreground self-center">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
            placeholder="End date"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full animate-pulse rounded-md bg-muted" />
        ) : isError ? (
          <div className="text-destructive">Failed to load publishing trend data</div>
        ) : isEmpty || allZero ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No posts published yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
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
              <Line type="monotone" dataKey="count" stroke="hsl(213 68% 50%)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
