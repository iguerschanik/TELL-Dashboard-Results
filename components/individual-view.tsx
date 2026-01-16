"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import type { TellRecord } from "@/types/tell-record"
import { useMemo, useState } from "react"
import { formatDateToDDMMYYYY } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type IndividualViewProps = {
  allRecords: TellRecord[]
  filteredRecords: TellRecord[]
  selectedParticipantCode: string | null
  onSelectParticipant: (code: string | null) => void
  individualEventDate: string | null
  onIndividualEventDateChange: (date: string | null) => void
  groupEventDate: string | null
  jsonLoaded: boolean
}

export function IndividualView({
  allRecords,
  filteredRecords,
  selectedParticipantCode,
  onSelectParticipant,
  individualEventDate,
  onIndividualEventDateChange,
  groupEventDate,
  jsonLoaded,
}: IndividualViewProps) {
  const [showAnalysis, setShowAnalysis] = useState(true)
  const [individualTimelineView, setIndividualTimelineView] = useState<"full" | "before" | "after">("full")

  const selectedParticipantRecords = useMemo(() => {
    if (!selectedParticipantCode) return []
    return allRecords
      .filter((r) => r.participant_id === selectedParticipantCode)
      .sort((a, b) => a.test_date.localeCompare(b.test_date))
  }, [allRecords, selectedParticipantCode])

  const compositeBeforeAfterStats = useMemo(() => {
    if (!individualEventDate || selectedParticipantRecords.length === 0) {
      return null
    }

    const beforeRecords: TellRecord[] = []
    const afterRecords: TellRecord[] = []

    selectedParticipantRecords.forEach((record) => {
      if (!record.test_date || typeof record.test_date !== "string") {
        return
      }

      const recordDate = record.test_date.slice(0, 10)

      if (recordDate < individualEventDate) {
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
      composite1: calculateStats("composite_1"), // Composite 1
      composite2: calculateStats("composite_2"), // Composite 2
      composite3: calculateStats("composite_3"), // Composite 3
    }
  }, [selectedParticipantRecords, individualEventDate])

  const latestRecord = useMemo(() => {
    if (selectedParticipantRecords.length === 0) return null
    return selectedParticipantRecords[selectedParticipantRecords.length - 1]
  }, [selectedParticipantRecords])

  const participantChartData = useMemo(() => {
    return selectedParticipantRecords.map((record) => {
      const timestamp = new Date(record.test_date).getTime()
      return {
        date: record.test_date,
        timestamp: timestamp,
        composite1: record.composite_1, // Composite 1
        composite2: record.composite_2, // Composite 2
        composite3: record.composite_3, // Composite 3
      }
    })
  }, [selectedParticipantRecords])

  const filteredParticipantChartData = useMemo(() => {
    if (!individualEventDate || individualTimelineView === "full") {
      return participantChartData
    }

    const eventTimestamp = new Date(individualEventDate).getTime()

    if (individualTimelineView === "before") {
      return participantChartData.filter((point) => point.timestamp < eventTimestamp)
    } else if (individualTimelineView === "after") {
      return participantChartData.filter((point) => point.timestamp > eventTimestamp)
    }

    return participantChartData
  }, [participantChartData, individualEventDate, individualTimelineView])

  const availableParticipants = useMemo(() => {
    const uniqueIds = Array.from(new Set(allRecords.map((r) => r.participant_id))).sort()
    return uniqueIds.map((id) => {
      const record = allRecords.find((r) => r.participant_id === id)!
      return { id, record }
    })
  }, [allRecords])

  const individualEventLineInfo = useMemo(() => {
    if (!individualEventDate || participantChartData.length === 0) return null

    const eventTimestamp = new Date(individualEventDate).getTime()
    const minTimestamp = Math.min(...participantChartData.map((d) => d.timestamp))
    const maxTimestamp = Math.max(...participantChartData.map((d) => d.timestamp))

    if (eventTimestamp >= minTimestamp && eventTimestamp <= maxTimestamp) {
      return { timestamp: eventTimestamp, show: true }
    }

    return null
  }, [individualEventDate, participantChartData])

  const formattedIndividualEventDate = useMemo(() => {
    if (!individualEventDate) return null
    return formatDateToDDMMYYYY(individualEventDate)
  }, [individualEventDate])

  const individualXAxisDomain = useMemo(() => {
    if (participantChartData.length === 0) return ["dataMin", "dataMax"]

    const minTimestamp = Math.min(...participantChartData.map((d) => d.timestamp))
    const maxTimestamp = Math.max(...participantChartData.map((d) => d.timestamp))

    if (!individualEventDate || individualTimelineView === "full") {
      return [minTimestamp, maxTimestamp]
    }

    const eventTimestamp = new Date(individualEventDate).getTime()

    if (individualTimelineView === "before") {
      return [minTimestamp, eventTimestamp]
    } else if (individualTimelineView === "after") {
      return [eventTimestamp, maxTimestamp]
    }

    return [minTimestamp, maxTimestamp]
  }, [participantChartData, individualEventDate, individualTimelineView])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0].payload
    const dateStr = data.date || ""

    const formattedDate = formatDateToDDMMYYYY(dateStr)

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">Date: {formattedDate}</p>
        <div className="space-y-1 text-xs">
          <p className="text-blue-900">
            Composite 1: <span className="font-semibold">{data.composite1?.toFixed(1) ?? "—"}</span>
          </p>
          <p className="text-red-600">
            Composite 2: <span className="font-semibold">{data.composite2?.toFixed(1) ?? "—"}</span>
          </p>
          <p className="text-amber-600">
            Composite 3: <span className="font-semibold">{data.composite3?.toFixed(1) ?? "—"}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 h-full flex flex-col pb-0">
      <Card className="flex-shrink-0" style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">Individual Participant View</CardTitle>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium whitespace-nowrap">Event Date (X)</span>
              <Input
                type="date"
                value={individualEventDate || ""}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  onIndividualEventDateChange(selectedDate || null)
                  if (selectedDate) {
                    setIndividualTimelineView("full")
                  }
                }}
                className="w-40 h-8 text-sm"
                placeholder="Select date"
              />
              <div className="w-full flex flex-col items-center gap-1">
                {groupEventDate && jsonLoaded && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      onIndividualEventDateChange(groupEventDate)
                      setIndividualTimelineView("full")
                    }}
                    className="text-xs h-7 px-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sync with group date
                  </Button>
                )}
                {individualEventDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onIndividualEventDateChange(null)
                      setIndividualTimelineView("full")
                    }}
                    className="text-xs h-7 px-2"
                  >
                    Clear Date
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-3">
          <div className="px-6 flex items-center gap-3">
            <label className="text-xs font-medium whitespace-nowrap">Select Participant</label>
            <Select
              value={selectedParticipantCode || "none"}
              onValueChange={(value) => onSelectParticipant(value === "none" ? null : value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select participant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {availableParticipants.length === 0 ? "No participants available" : "None selected"}
                </SelectItem>
                {availableParticipants.map(({ id, record }) => (
                  <SelectItem key={id} value={id}>
                    {id} (Age: {record.age}, Sex: {record.sex}, Role: {record.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 px-6">
            <Card className="rounded-2xl" style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}>
              <CardContent className="p-3 text-center">
                <div className="text-xs font-medium text-gray-600 mb-1">Number of Evaluations</div>
                <div className="text-2xl font-bold">{selectedParticipantRecords.length || "—"}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl" style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}>
              <CardContent className="p-3 text-center">
                <div className="text-xs font-medium text-gray-600 mb-1">Last Evaluation Date</div>
                <div className="text-lg font-bold">
                  {latestRecord ? formatDateToDDMMYYYY(latestRecord.test_date) : "—"}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {compositeBeforeAfterStats && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Event Analysis (Before/After X)</h3>
            <Button variant="outline" size="sm" onClick={() => setShowAnalysis(!showAnalysis)}>
              {showAnalysis ? "Hide analysis" : "Show analysis"}
            </Button>
          </div>
          {showAnalysis && (
            <div className="bg-white rounded-lg overflow-x-auto" style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)" }}>
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

      <Card className="flex-1 flex flex-col min-h-0 mb-0" style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}>
        <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
          <CardTitle className="text-base text-center">
            Evolution over time {selectedParticipantCode ? `(${selectedParticipantCode})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-3 px-4 flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center min-h-0">
            {participantChartData.length === 0 ? (
              <div className="text-sm text-gray-500">Select a participant to view evolution</div>
            ) : filteredParticipantChartData.length === 0 ? (
              <div className="text-sm text-gray-500 text-center">
                No evaluations {individualTimelineView === "before" ? "before" : "after"} this date
              </div>
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
                  <LineChart data={filteredParticipantChartData} margin={{ top: 15, right: 25, left: 5, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={individualXAxisDomain}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(timestamp) => {
                        const date = new Date(timestamp)
                        return formatDateToDDMMYYYY(date)
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} domain={[20, 50]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#94a3b8", strokeWidth: 1 }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />

                    {individualEventLineInfo && (
                      <ReferenceLine
                        x={individualEventLineInfo.timestamp}
                        stroke="#6b7280"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        opacity={0.7}
                        label={{
                          value: `Event Date ${formattedIndividualEventDate}`,
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

          {participantChartData.length > 0 && individualEventDate && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <Button
                variant={individualTimelineView === "before" ? "default" : "outline"}
                size="sm"
                onClick={() => setIndividualTimelineView("before")}
                className="flex-1"
              >
                Before Event X
              </Button>
              <Button
                variant={individualTimelineView === "full" ? "default" : "outline"}
                size="sm"
                onClick={() => setIndividualTimelineView("full")}
                className="flex-1"
              >
                Full Timeline
              </Button>
              <Button
                variant={individualTimelineView === "after" ? "default" : "outline"}
                size="sm"
                onClick={() => setIndividualTimelineView("after")}
                className="flex-1"
              >
                After Event X
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
