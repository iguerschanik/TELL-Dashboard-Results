"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
  ReferenceLine,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { DiagnosisCharts } from "@/components/diagnosis-charts"
import type { TellRecord } from "@/types/tell-record"
import { useMemo, useState } from "react"
import { formatDateToDDMMYYYY } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type RiskBucket = {
  count: number
  percentage: number
}

type RiskBuckets = {
  normal: RiskBucket
  atRisk: RiskBucket
  highRisk: RiskBucket
}

type GroupOverviewProps = {
  filteredRecords: TellRecord[]
  beforeAfterStats: {
    N_before: number
    N_after: number
    avg_before: number | null
    avg_after: number | null
    delta_abs: number | null
    delta_pct: number | null
  } | null
  eventDate: string | null
  timelineViewMode: "full" | "before" | "after"
  onTimelineViewModeChange: (value: "full" | "before" | "after") => void
  composite1Buckets: RiskBuckets
  composite2Buckets: RiskBuckets
  composite3Buckets: RiskBuckets
}

export function GroupOverview({
  filteredRecords,
  beforeAfterStats,
  eventDate,
  timelineViewMode,
  onTimelineViewModeChange,
  composite1Buckets,
  composite2Buckets,
  composite3Buckets,
}: GroupOverviewProps) {
  const lineChartData = useMemo(() => {
    if (filteredRecords.length === 0) {
      return []
    }

    const groupedByDate = filteredRecords.reduce(
      (acc, record) => {
        if (!record.test_date || typeof record.test_date !== "string") {
          return acc
        }

        const date = record.test_date.slice(0, 10)
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(record)
        return acc
      },
      {} as Record<string, TellRecord[]>,
    )

    const chartData = Object.entries(groupedByDate)
      .map(([date, records]) => {
        const timestamp = new Date(date).getTime()
        return {
          date: date,
          timestamp: timestamp,
          composite1: records.reduce((sum, r) => sum + (Number(r.composite_1) || 0), 0) / records.length,
          composite2: records.reduce((sum, r) => sum + (Number(r.composite_2) || 0), 0) / records.length,
          composite3: records.reduce((sum, r) => sum + (Number(r.composite_3) || 0), 0) / records.length,
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    return chartData
  }, [filteredRecords])

  const filteredChartData = useMemo(() => {
    if (!eventDate || timelineViewMode === "full") {
      return lineChartData
    }

    const eventTimestamp = new Date(eventDate).getTime()

    if (timelineViewMode === "before") {
      return lineChartData.filter((point) => point.timestamp <= eventTimestamp)
    } else if (timelineViewMode === "after") {
      return lineChartData.filter((point) => point.timestamp >= eventTimestamp)
    }

    return lineChartData
  }, [lineChartData, eventDate, timelineViewMode])

  const eventLineInfo = useMemo(() => {
    if (!eventDate || lineChartData.length === 0) return null

    const eventTimestamp = new Date(eventDate).getTime()
    const minTimestamp = Math.min(...lineChartData.map((d) => d.timestamp))
    const maxTimestamp = Math.max(...lineChartData.map((d) => d.timestamp))

    if (eventTimestamp >= minTimestamp && eventTimestamp <= maxTimestamp) {
      return { timestamp: eventTimestamp, show: true }
    }

    return null
  }, [eventDate, lineChartData])

  const formattedEventDate = useMemo(() => {
    if (!eventDate) return null
    return formatDateToDDMMYYYY(eventDate)
  }, [eventDate])

  const compositeBeforeAfterStats = useMemo(() => {
    if (!eventDate) {
      return null
    }

    const beforeRecords: TellRecord[] = []
    const afterRecords: TellRecord[] = []

    filteredRecords.forEach((record) => {
      if (!record.test_date || typeof record.test_date !== "string") {
        return
      }

      const recordDate = record.test_date.slice(0, 10)

      if (recordDate < eventDate) {
        beforeRecords.push(record)
      } else {
        afterRecords.push(record)
      }
    })

    const calculateStats = (field: keyof TellRecord) => {
      const n_before = beforeRecords.length
      const n_after = afterRecords.length

      let avg_before: number | null = null
      if (n_before > 0) {
        const sum_before = beforeRecords.reduce((sum, r) => sum + (Number(r[field]) || 0), 0)
        avg_before = sum_before / n_before
      }

      let avg_after: number | null = null
      if (n_after > 0) {
        const sum_after = afterRecords.reduce((sum, r) => sum + (Number(r[field]) || 0), 0)
        avg_after = sum_after / n_after
      }

      let delta_abs: number | null = null
      let delta_pct: number | null = null

      if (avg_before !== null && avg_after !== null) {
        delta_abs = avg_after - avg_before

        if (avg_before !== 0) {
          delta_pct = (delta_abs / avg_before) * 100
        }
      }

      return { avg_before, avg_after, delta_abs, delta_pct }
    }

    return {
      composite1: calculateStats("composite_1"),
      composite2: calculateStats("composite_2"),
      composite3: calculateStats("composite_3"),
    }
  }, [filteredRecords, eventDate])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0].payload
    const date = data.date

    const formattedDate = date ? formatDateToDDMMYYYY(date) : date

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2 text-gray-900">Date: {formattedDate}</p>
        <div className="space-y-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Composite 1:</span> {data.composite1?.toFixed(1) || "N/A"}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Composite 2:</span> {data.composite2?.toFixed(1) || "N/A"}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Composite 3:</span> {data.composite3?.toFixed(1) || "N/A"}
          </p>
        </div>
      </div>
    )
  }

  const xAxisDomain = useMemo(() => {
    if (lineChartData.length === 0) return ["dataMin", "dataMax"]

    const minTimestamp = Math.min(...lineChartData.map((d) => d.timestamp))
    const maxTimestamp = Math.max(...lineChartData.map((d) => d.timestamp))

    if (!eventDate || timelineViewMode === "full") {
      return [minTimestamp, maxTimestamp]
    }

    const eventTimestamp = new Date(eventDate).getTime()

    if (timelineViewMode === "before") {
      return [minTimestamp, eventTimestamp]
    } else if (timelineViewMode === "after") {
      return [eventTimestamp, maxTimestamp]
    }

    return [minTimestamp, maxTimestamp]
  }, [lineChartData, eventDate, timelineViewMode])

  const [showAnalysis, setShowAnalysis] = useState(true)

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-3 h-full flex flex-col">
        {compositeBeforeAfterStats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Event Analysis (Before/After X)</h3>
              <Button variant="outline" size="sm" onClick={() => setShowAnalysis(!showAnalysis)}>
                {showAnalysis ? "Hide analysis" : "Show analysis"}
              </Button>
            </div>
            {showAnalysis && (
              <div
                className="bg-white rounded-lg overflow-x-auto"
                style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Composite</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Before X – Avg</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">After X – Avg</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Δ Change (After – Before)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-[#1e3a8a]">Composite 1</td>
                      <td className="py-2 px-3 text-center">
                        {compositeBeforeAfterStats.composite1.avg_before !== null
                          ? compositeBeforeAfterStats.composite1.avg_before.toFixed(1)
                          : "–"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {compositeBeforeAfterStats.composite1.avg_after !== null
                          ? compositeBeforeAfterStats.composite1.avg_after.toFixed(1)
                          : "–"}
                      </td>
                      <td className="py-2 px-3 text-center font-medium">
                        {compositeBeforeAfterStats.composite1.delta_abs !== null ? (
                          <span
                            className={
                              compositeBeforeAfterStats.composite1.delta_abs > 0
                                ? "text-green-600"
                                : compositeBeforeAfterStats.composite1.delta_abs < 0
                                  ? "text-red-600"
                                  : "text-gray-500"
                            }
                          >
                            {compositeBeforeAfterStats.composite1.delta_abs > 0 ? "+" : ""}
                            {compositeBeforeAfterStats.composite1.delta_abs.toFixed(1)}
                            {compositeBeforeAfterStats.composite1.delta_pct !== null && (
                              <span className="text-xs ml-1">
                                ({compositeBeforeAfterStats.composite1.delta_pct > 0 ? "+" : ""}
                                {compositeBeforeAfterStats.composite1.delta_pct.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-500">–</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-[#dc2626]">Composite 2</td>
                      <td className="py-2 px-3 text-center">
                        {compositeBeforeAfterStats.composite2.avg_before !== null
                          ? compositeBeforeAfterStats.composite2.avg_before.toFixed(1)
                          : "–"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {compositeBeforeAfterStats.composite2.avg_after !== null
                          ? compositeBeforeAfterStats.composite2.avg_after.toFixed(1)
                          : "–"}
                      </td>
                      <td className="py-2 px-3 text-center font-medium">
                        {compositeBeforeAfterStats.composite2.delta_abs !== null ? (
                          <span
                            className={
                              compositeBeforeAfterStats.composite2.delta_abs > 0
                                ? "text-green-600"
                                : compositeBeforeAfterStats.composite2.delta_abs < 0
                                  ? "text-red-600"
                                  : "text-gray-500"
                            }
                          >
                            {compositeBeforeAfterStats.composite2.delta_abs > 0 ? "+" : ""}
                            {compositeBeforeAfterStats.composite2.delta_abs.toFixed(1)}
                            {compositeBeforeAfterStats.composite2.delta_pct !== null && (
                              <span className="text-xs ml-1">
                                ({compositeBeforeAfterStats.composite2.delta_pct > 0 ? "+" : ""}
                                {compositeBeforeAfterStats.composite2.delta_pct.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-500">–</span>
                        )}
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-[#f59e0b]">Composite 3</td>
                      <td className="py-2 px-3 text-center">
                        {compositeBeforeAfterStats.composite3.avg_before !== null
                          ? compositeBeforeAfterStats.composite3.avg_before.toFixed(1)
                          : "–"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {compositeBeforeAfterStats.composite3.avg_after !== null
                          ? compositeBeforeAfterStats.composite3.avg_after.toFixed(1)
                          : "–"}
                      </td>
                      <td className="py-2 px-3 text-center font-medium">
                        {compositeBeforeAfterStats.composite3.delta_abs !== null ? (
                          <span
                            className={
                              compositeBeforeAfterStats.composite3.delta_abs > 0
                                ? "text-green-600"
                                : compositeBeforeAfterStats.composite3.delta_abs < 0
                                  ? "text-red-600"
                                  : "text-gray-500"
                            }
                          >
                            {compositeBeforeAfterStats.composite3.delta_abs > 0 ? "+" : ""}
                            {compositeBeforeAfterStats.composite3.delta_abs.toFixed(1)}
                            {compositeBeforeAfterStats.composite3.delta_pct !== null && (
                              <span className="text-xs ml-1">
                                ({compositeBeforeAfterStats.composite3.delta_pct > 0 ? "+" : ""}
                                {compositeBeforeAfterStats.composite3.delta_pct.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-500">–</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <Card className="flex-[2.3] flex flex-col min-h-0" style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}>
          <CardHeader className="pb-1 flex-shrink-0">
            <CardTitle className="text-base text-center">Average Scores Over Time</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3 px-4 flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex items-center justify-center min-h-0">
              {filteredChartData.length === 0 ? (
                <div className="text-sm text-gray-500">No data to display</div>
              ) : (
                <ChartContainer
                  config={{
                    composite1: {
                      label: "Composite 1",
                      color: "#1e3a8a",
                    },
                    composite2: {
                      label: "Composite 2",
                      color: "#dc2626",
                    },
                    composite3: {
                      label: "Composite 3",
                      color: "#f59e0b",
                    },
                  }}
                  className="h-full w-full max-h-[320px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredChartData} margin={{ top: 15, right: 25, left: 5, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={xAxisDomain}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(timestamp) => {
                          const date = new Date(timestamp)
                          return formatDateToDDMMYYYY(date)
                        }}
                      />
                      <YAxis tick={{ fontSize: 11 }} domain={[20, 50]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#94a3b8", strokeWidth: 1 }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />

                      {eventLineInfo && (
                        <ReferenceLine
                          x={eventLineInfo.timestamp}
                          stroke="#6b7280"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          opacity={0.7}
                          label={{
                            value: `Event Date ${formattedEventDate}`,
                            position: "top",
                            fill: "#374151",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />
                      )}

                      <Line
                        type="monotone"
                        dataKey="composite1"
                        stroke="var(--color-composite1)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Composite 1"
                      />
                      <Line
                        type="monotone"
                        dataKey="composite2"
                        stroke="var(--color-composite2)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Composite 2"
                      />
                      <Line
                        type="monotone"
                        dataKey="composite3"
                        stroke="var(--color-composite3)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Composite 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>

            {eventDate && (
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <Button
                  variant={timelineViewMode === "before" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTimelineViewModeChange("before")}
                  className="flex-1"
                >
                  Before Event X
                </Button>
                <Button
                  variant={timelineViewMode === "full" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTimelineViewModeChange("full")}
                  className="flex-1"
                >
                  Full Timeline
                </Button>
                <Button
                  variant={timelineViewMode === "after" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTimelineViewModeChange("after")}
                  className="flex-1"
                >
                  After Event X
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex-1 min-h-0">
          <DiagnosisCharts
            filteredRecords={filteredRecords}
            composite1Buckets={composite1Buckets}
            composite2Buckets={composite2Buckets}
            composite3Buckets={composite3Buckets}
          />
        </div>
      </div>
    </div>
  )
}
