"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { TellRecord } from "@/types/tell-record"

type RiskBucket = {
  count: number
  percentage: number
}

type RiskBuckets = {
  normal: RiskBucket
  atRisk: RiskBucket
  highRisk: RiskBucket
}

type DiagnosisChartsProps = {
  filteredRecords: TellRecord[]
  composite1Buckets: RiskBuckets // Composite 1 (from composite_1)
  composite2Buckets: RiskBuckets // Composite 2 (from composite_2)
  composite3Buckets: RiskBuckets // Composite 3 (from composite_3)
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    // Calculate percentage rounded to nearest integer
    const percentageRounded = Math.round(data.percentage)
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold" style={{ color: data.fill }}>
          {data.name} – {data.value} participants ({percentageRounded}%)
        </p>
      </div>
    )
  }
  return null
}

function DonutChart({
  data,
  title,
}: { data: Array<{ name: string; key: string; value: number; percentage: number; fill: string }>; title: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const hasData = total > 0

  return (
    <Card className="flex flex-col h-full" style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}>
      <CardHeader className="pb-0.5 pt-2 px-3 h-[40px] flex-shrink-0">
        <CardTitle className="text-sm text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-1 pb-2 px-3 flex-1 flex flex-col items-center justify-center min-h-0">
        {!hasData ? (
          <div className="text-xs text-gray-400">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={120}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function DiagnosisCharts({
  filteredRecords,
  composite1Buckets,
  composite2Buckets,
  composite3Buckets,
}: DiagnosisChartsProps) {
  const diagnosisColorMap: Record<string, string> = {
    Unconcerning: "#4CAF50", // Clear, reassuring green - low risk
    Monitor: "#FFC107", // Warm, warning yellow/orange - moderate risk
    Check: "#D32F2F", // Strong, alert red - high risk
  }

  const condition1Data = [
    {
      name: "Unconcerning",
      key: "normal",
      value: composite1Buckets.normal.count,
      percentage: composite1Buckets.normal.percentage,
      fill: diagnosisColorMap.Unconcerning,
    },
    {
      name: "Monitor",
      key: "atRisk",
      value: composite1Buckets.atRisk.count,
      percentage: composite1Buckets.atRisk.percentage,
      fill: diagnosisColorMap.Monitor,
    },
    {
      name: "Check",
      key: "highRisk",
      value: composite1Buckets.highRisk.count,
      percentage: composite1Buckets.highRisk.percentage,
      fill: diagnosisColorMap.Check,
    },
  ]

  const condition2Data = [
    {
      name: "Unconcerning",
      key: "normal",
      value: composite2Buckets.normal.count,
      percentage: composite2Buckets.normal.percentage,
      fill: diagnosisColorMap.Unconcerning,
    },
    {
      name: "Monitor",
      key: "atRisk",
      value: composite2Buckets.atRisk.count,
      percentage: composite2Buckets.atRisk.percentage,
      fill: diagnosisColorMap.Monitor,
    },
    {
      name: "Check",
      key: "highRisk",
      value: composite2Buckets.highRisk.count,
      percentage: composite2Buckets.highRisk.percentage,
      fill: diagnosisColorMap.Check,
    },
  ]

  const overallData = [
    {
      name: "Unconcerning",
      key: "normal",
      value: composite3Buckets.normal.count,
      percentage: composite3Buckets.normal.percentage,
      fill: diagnosisColorMap.Unconcerning,
    },
    {
      name: "Monitor",
      key: "atRisk",
      value: composite3Buckets.atRisk.count,
      percentage: composite3Buckets.atRisk.percentage,
      fill: diagnosisColorMap.Monitor,
    },
    {
      name: "Check",
      key: "highRisk",
      value: composite3Buckets.highRisk.count,
      percentage: composite3Buckets.highRisk.percentage,
      fill: diagnosisColorMap.Check,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 h-full">
      <DonutChart data={condition1Data} title="Parkinson" />
      <DonutChart data={condition2Data} title="Alzheimer" />
      <DonutChart data={overallData} title="Overall Severity Level" />
    </div>
  )
}
