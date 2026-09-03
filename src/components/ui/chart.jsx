"use client";

import * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const COLORS_LIGHT = {
  chart1: "hsl(213 68% 50%)",
  chart2: "hsl(17 82% 56%)",
}

const COLORS_DARK = {
  chart1: "hsl(213 77% 56%)",
  chart2: "hsl(17 70% 50%)",
}

export const ChartContainer = React.forwardRef(
  ({ id, className, children, config, ...props }, ref) => {
    const [isDark, setIsDark] = React.useState(false)

    React.useEffect(() => {
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains("dark"))
      })
      observer.observe(document.documentElement, { attributes: true })
      setIsDark(document.documentElement.classList.contains("dark"))
      return () => observer.disconnect()
    }, [])

    const chartColors = isDark ? COLORS_DARK : COLORS_LIGHT

    const style = React.useMemo(
      () => ({
        "--color-chart-1": chartColors.chart1,
        "--color-chart-2": chartColors.chart2,
      }),
      [chartColors]
    )

    return (
      <div ref={ref} style={style} className={className} {...props}>
        {children}
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

export const ChartTooltipContent = React.forwardRef(
  ({ active, payload, label }, ref) => {
    if (active && payload && payload.length) {
      return (
        <div
          ref={ref}
          className="rounded-lg border border-border bg-popover p-2 shadow-md"
        >
          {label && (
            <p className="text-sm font-medium text-popover-foreground">{label}</p>
          )}
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm text-popover-foreground"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"
