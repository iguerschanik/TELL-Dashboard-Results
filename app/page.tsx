"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { GroupOverview } from "@/components/group-overview"
import { IndividualView } from "@/components/individual-view"
import { useState, useMemo } from "react"
import type { TellRecord, CompositeScoreField } from "@/types/tell-record"
import { useBeforeAfterStats } from "@/hooks/use-before-after-stats"
import html2canvas from "html2canvas-pro"

const DEFAULT_MIN_AGE = 18
const DEFAULT_MAX_AGE = 120

type RiskBucket = {
  count: number
  percentage: number
}

type RiskBuckets = {
  normal: RiskBucket
  atRisk: RiskBucket
  highRisk: RiskBucket
}

function getRiskBucketsForMetric(records: TellRecord[], metricKey: CompositeScoreField): RiskBuckets {
  // Filter records with valid numeric values for the metric
  const validRecords = records.filter((record) => typeof record[metricKey] === "number")

  // If no valid values, return zeros
  if (validRecords.length === 0) {
    return {
      normal: { count: 0, percentage: 0 },
      atRisk: { count: 0, percentage: 0 },
      highRisk: { count: 0, percentage: 0 },
    }
  }

  const scores = validRecords.map((record) => record[metricKey] as number)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)

  // If all scores are the same, classify all as normal
  if (minScore === maxScore) {
    return {
      normal: { count: validRecords.length, percentage: 100.0 },
      atRisk: { count: 0, percentage: 0 },
      highRisk: { count: 0, percentage: 0 },
    }
  }

  // Calculate tercile cutoffs
  const range = maxScore - minScore
  const lowCut = minScore + range / 3
  const highCut = minScore + (2 * range) / 3

  // Classify each score
  let highRiskCount = 0
  let atRiskCount = 0
  let normalCount = 0

  scores.forEach((score) => {
    if (score < lowCut) {
      highRiskCount++
    } else if (score < highCut) {
      atRiskCount++
    } else {
      normalCount++
    }
  })

  const total = validRecords.length

  return {
    normal: {
      count: normalCount,
      percentage: Number.parseFloat(((normalCount / total) * 100).toFixed(1)),
    },
    atRisk: {
      count: atRiskCount,
      percentage: Number.parseFloat(((atRiskCount / total) * 100).toFixed(1)),
    },
    highRisk: {
      count: highRiskCount,
      percentage: Number.parseFloat(((highRiskCount / total) * 100).toFixed(1)),
    },
  }
}

export default function Home() {
  const [originalRecords, setOriginalRecords] = useState<TellRecord[]>([])
  const [sexFilter, setSexFilter] = useState<"all" | "male" | "female" | "blank">("all")
  const [ageMinFilter, setAgeMinFilter] = useState(DEFAULT_MIN_AGE)
  const [ageMaxFilter, setAgeMaxFilter] = useState(DEFAULT_MAX_AGE)
  const [roleFilter, setRoleFilter] = useState<"All Roles" | "Blank" | string>("All Roles")
  const [jsonLoaded, setJsonLoaded] = useState(false)
  const [selectedParticipantCode, setSelectedParticipantCode] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [eventDate, setEventDate] = useState<string | null>(null)
  const [individualEventDate, setIndividualEventDate] = useState<string | null>(null)
  const [timelineViewMode, setTimelineViewMode] = useState<"full" | "before" | "after">("full")

  const filteredRecords = useMemo(() => {
    const isDefaultAgeRange = ageMinFilter === DEFAULT_MIN_AGE && ageMaxFilter === DEFAULT_MAX_AGE

    return originalRecords.filter((record) => {
      if (sexFilter !== "all") {
        if (sexFilter === "blank") {
          if (record.sex && record.sex.trim() !== "") {
            return false
          }
        } else {
          const recordSex = record.sex?.toUpperCase()
          const filterSex = sexFilter === "male" ? "M" : "F"
          if (recordSex !== filterSex) {
            return false
          }
        }
      }

      if (!isDefaultAgeRange) {
        // Age filter is active: exclude records without age and check range
        if (record.age === undefined || record.age === null) {
          return false
        }

        if (record.age < ageMinFilter || record.age > ageMaxFilter) {
          return false
        }
      }
      // If age filter is at default range, don't filter by age at all

      if (roleFilter !== "All Roles") {
        if (roleFilter === "Blank") {
          if (record.role && record.role.trim() !== "") {
            return false
          }
        } else {
          if (record.role !== roleFilter) {
            return false
          }
        }
      }

      return true
    })
  }, [originalRecords, sexFilter, ageMinFilter, ageMaxFilter, roleFilter])

  const composite2Buckets = useMemo(() => {
    return getRiskBucketsForMetric(filteredRecords, "composite_2")
  }, [filteredRecords])

  const composite3Buckets = useMemo(() => {
    return getRiskBucketsForMetric(filteredRecords, "composite_3")
  }, [filteredRecords])

  const composite1Buckets = useMemo(() => {
    return getRiskBucketsForMetric(filteredRecords, "composite_1")
  }, [filteredRecords])

  const kpis = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        avgComposite1: "—",
        avgComposite2: "—",
        avgComposite3: "—",
        totalRecords: 0,
      }
    }

    const avgComposite1 = filteredRecords.reduce((sum, r) => sum + (r.composite_1 || 0), 0) / filteredRecords.length // From composite_1
    const avgComposite2 = filteredRecords.reduce((sum, r) => sum + (r.composite_2 || 0), 0) / filteredRecords.length // From composite_2
    const avgComposite3 = filteredRecords.reduce((sum, r) => sum + (r.composite_3 || 0), 0) / filteredRecords.length // From composite_3

    return {
      avgComposite1: avgComposite1.toFixed(1),
      avgComposite2: avgComposite2.toFixed(1),
      avgComposite3: avgComposite3.toFixed(1),
      totalRecords: filteredRecords.length,
    }
  }, [filteredRecords])

  const filterSummary = useMemo(() => {
    if (!jsonLoaded || originalRecords.length === 0) {
      return "No records to display. Adjust filters or load a JSON file."
    }

    const sexText =
      sexFilter === "all" ? "All" : sexFilter === "blank" ? "Blank (no data)" : sexFilter === "male" ? "Male" : "Female"
    const roleText = roleFilter === "Blank" ? "Blank (no data)" : roleFilter

    return `Showing data for ${filteredRecords.length} records. Age ${ageMinFilter}–${ageMaxFilter}. Sex: ${sexText}. Role: ${roleText}.`
  }, [filteredRecords.length, ageMinFilter, ageMaxFilter, sexFilter, roleFilter, jsonLoaded, originalRecords.length])

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>()
    let hasBlankRole = false

    originalRecords.forEach((record) => {
      if (record.role && record.role.trim() !== "") {
        roles.add(record.role)
      } else {
        hasBlankRole = true
      }
    })

    const rolesArray = Array.from(roles).sort()

    if (hasBlankRole) {
      rolesArray.unshift("Blank")
    }

    return rolesArray
  }, [originalRecords])

  const hasBlankSex = useMemo(() => {
    return originalRecords.some((record) => !record.sex || record.sex.trim() === "")
  }, [originalRecords])

  const beforeAfterStats = useBeforeAfterStats(filteredRecords, eventDate)

  const handleLoadJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)

        if (!Array.isArray(parsed)) {
          setJsonError("Invalid JSON: Expected an array of objects")
          return
        }

        setOriginalRecords(parsed as TellRecord[])
        setJsonLoaded(true)
        setJsonError(null)

        setSexFilter("all")
        setAgeMinFilter(DEFAULT_MIN_AGE)
        setAgeMaxFilter(DEFAULT_MAX_AGE)
        setRoleFilter("All Roles")
        setSelectedParticipantCode(null)
        setEventDate(null)
        setIndividualEventDate(null)
        setTimelineViewMode("full")
      } catch (error) {
        setJsonError("Invalid JSON file format")
      }
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    setOriginalRecords([])
    setJsonLoaded(false)
    setJsonError(null)
    setSexFilter("all")
    setAgeMinFilter(DEFAULT_MIN_AGE)
    setAgeMaxFilter(DEFAULT_MAX_AGE)
    setRoleFilter("All Roles")
    setSelectedParticipantCode(null)
    setEventDate(null)
    setIndividualEventDate(null)
    setTimelineViewMode("full")
  }

  const handleResetFilters = () => {
    setSexFilter("all")
    setAgeMinFilter(DEFAULT_MIN_AGE)
    setAgeMaxFilter(DEFAULT_MAX_AGE)
    setRoleFilter("All Roles")
  }

  const handleEventDateChange = (newDate: string | null) => {
    setEventDate(newDate)
    setTimelineViewMode("full")
  }

  const handleDownloadSnapshot = async () => {
    const dashboardElement = document.getElementById("dashboard-root")
    if (!dashboardElement) {
      console.error("Dashboard root element not found")
      return
    }

    try {
      const canvas = await html2canvas(dashboardElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: dashboardElement.scrollWidth,
        windowHeight: dashboardElement.scrollHeight,
      })

      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const today = new Date().toISOString().split("T")[0]
        link.download = `tell-dashboard-snapshot-${today}.png`
        link.href = url
        link.click()

        URL.revokeObjectURL(url)
      })
    } catch (error) {
      console.error("Error capturing screenshot:", error)
    }
  }

  return (
    <div id="dashboard-root" className="min-h-screen flex flex-col bg-gray-50">
      <Header onDownloadSnapshot={handleDownloadSnapshot} />
      <div className="flex flex-1">
        <div className="w-1/5">
          <Sidebar
            sexFilter={sexFilter}
            onSexFilterChange={setSexFilter}
            ageMinFilter={ageMinFilter}
            ageMaxFilter={ageMaxFilter}
            onAgeMinFilterChange={setAgeMinFilter}
            onAgeMaxFilterChange={setAgeMaxFilter}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            jsonLoaded={jsonLoaded}
            recordsLoaded={originalRecords.length}
            jsonError={jsonError}
            onLoadJson={handleLoadJson}
            onClearData={handleClearData}
            onResetFilters={handleResetFilters}
            uniqueRoles={uniqueRoles}
            eventDate={eventDate}
            onEventDateChange={handleEventDateChange}
            hasBlankSex={hasBlankSex}
          />
        </div>
        <main className="w-4/5 p-4 bg-gray-100">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Group Overview</h1>

            <div className="grid grid-cols-4 gap-3">
              <div
                className="bg-white rounded-2xl p-3 text-center"
                style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}
              >
                <div className="text-xs font-medium text-gray-600 uppercase mb-1">AVG. COMPOSITE 1</div>
                <div className="text-3xl font-bold">{kpis.avgComposite1}</div>
              </div>
              <div
                className="bg-white rounded-2xl p-3 text-center"
                style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}
              >
                <div className="text-xs font-medium text-gray-600 uppercase mb-1">AVG. COMPOSITE 2</div>
                <div className="text-3xl font-bold">{kpis.avgComposite2}</div>
              </div>
              <div
                className="bg-white rounded-2xl p-3 text-center"
                style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}
              >
                <div className="text-xs font-medium text-gray-600 uppercase mb-1">AVG. COMPOSITE 3</div>
                <div className="text-3xl font-bold">{kpis.avgComposite3}</div>
              </div>
              <div
                className="bg-white rounded-2xl p-3 text-center"
                style={{ boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)" }}
              >
                <div className="text-xs font-medium text-gray-600 uppercase mb-1">TOTAL RECORDS</div>
                <div className="text-3xl font-bold">{kpis.totalRecords}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 h-[calc(100vh-280px)]">
              <div className="space-y-3 h-full flex flex-col">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Filtered Group Overview:</span> {filterSummary}
                </p>
                <div className="flex-1 min-h-0">
                  <GroupOverview
                    filteredRecords={filteredRecords}
                    beforeAfterStats={beforeAfterStats}
                    eventDate={eventDate}
                    timelineViewMode={timelineViewMode}
                    onTimelineViewModeChange={setTimelineViewMode}
                    composite1Buckets={composite1Buckets}
                    composite2Buckets={composite2Buckets}
                    composite3Buckets={composite3Buckets}
                  />
                </div>
              </div>

              <div className="space-y-3 h-full flex flex-col">
                <div className="text-sm invisible" aria-hidden="true">
                  Placeholder
                </div>
                <div className="flex-1 min-h-0">
                  <IndividualView
                    allRecords={originalRecords}
                    filteredRecords={filteredRecords}
                    selectedParticipantCode={selectedParticipantCode}
                    onSelectParticipant={setSelectedParticipantCode}
                    beforeAfterStats={beforeAfterStats}
                    timelineViewMode={timelineViewMode}
                    individualEventDate={individualEventDate}
                    onIndividualEventDateChange={setIndividualEventDate}
                    groupEventDate={eventDate}
                    jsonLoaded={jsonLoaded}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
