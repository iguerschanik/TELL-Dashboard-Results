"use client"

import type React from "react"

import { Upload, Trash2, RotateCcw, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRef } from "react"

type SidebarProps = {
  sexFilter: "all" | "male" | "female" | "blank"
  onSexFilterChange: (value: "all" | "male" | "female" | "blank") => void
  ageMinFilter: number
  ageMaxFilter: number
  onAgeMinFilterChange: (value: number) => void
  onAgeMaxFilterChange: (value: number) => void
  roleFilter: string
  onRoleFilterChange: (value: string) => void
  jsonLoaded: boolean
  recordsLoaded: number
  jsonError: string | null
  onLoadJson: (file: File) => void
  onClearData: () => void
  onResetFilters: () => void
  uniqueRoles: string[]
  eventDate: string | null
  onEventDateChange: (value: string | null) => void
  hasBlankSex: boolean
}

export function Sidebar({
  sexFilter,
  onSexFilterChange,
  ageMinFilter,
  ageMaxFilter,
  onAgeMinFilterChange,
  onAgeMaxFilterChange,
  roleFilter,
  onRoleFilterChange,
  jsonLoaded,
  recordsLoaded,
  jsonError,
  onLoadJson,
  onClearData,
  onResetFilters,
  uniqueRoles,
  eventDate,
  onEventDateChange,
  hasBlankSex,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onLoadJson(file)
    }
  }

  const handleAgeMinChange = (value: number) => {
    if (value <= ageMaxFilter) {
      onAgeMinFilterChange(value)
    } else {
      onAgeMinFilterChange(ageMaxFilter)
    }
  }

  const handleAgeMaxChange = (value: number) => {
    if (value >= ageMinFilter) {
      onAgeMaxFilterChange(value)
    } else {
      onAgeMaxFilterChange(ageMinFilter)
    }
  }

  return (
    <aside className="w-full h-full bg-white border-r border-gray-200 p-6 flex-shrink-0 overflow-auto">
      <div className="space-y-6">
        {/* DATA Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">DATA</h2>
          <div className="space-y-3">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            <Button
              className="w-full bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Load JSON
            </Button>
            <Button variant="destructive" className="w-full" onClick={onClearData}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          </div>
          {jsonError ? (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-3">
              <p className="text-sm text-red-800">{jsonError}</p>
            </div>
          ) : jsonLoaded ? (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-3">
              <p className="text-sm text-green-800">JSON loaded successfully – Records loaded: {recordsLoaded}</p>
            </div>
          ) : (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-3">
              <p className="text-sm text-gray-600">No data loaded yet</p>
            </div>
          )}
        </div>

        {/* FILTERS Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">FILTERS</h2>
          <div className="space-y-4">
            {/* Sex Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sex</label>
              <Select value={sexFilter} onValueChange={onSexFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  {hasBlankSex && <SelectItem value="blank">Blank (no data)</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Age Range Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Age Range</label>
              <div className="px-2">
                <Slider
                  min={18}
                  max={120}
                  step={1}
                  value={[ageMinFilter, ageMaxFilter]}
                  onValueChange={([min, max]) => {
                    onAgeMinFilterChange(min)
                    onAgeMaxFilterChange(max)
                  }}
                  className="mb-4"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Min: {ageMinFilter}</label>
                  <Input
                    type="number"
                    value={ageMinFilter}
                    onChange={(e) => handleAgeMinChange(Number.parseInt(e.target.value) || 18)}
                    className="h-9"
                    min={18}
                    max={120}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Max: {ageMaxFilter}</label>
                  <Input
                    type="number"
                    value={ageMaxFilter}
                    onChange={(e) => handleAgeMaxChange(Number.parseInt(e.target.value) || 120)}
                    className="h-9"
                    min={18}
                    max={120}
                  />
                </div>
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Roles">All Roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role === "Blank" ? "Blank (no data)" : role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Date Filter */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="text-sm font-medium">Event Date (X)</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-sm">
                        Seleccioná una fecha clave (evento X) para analizar cómo evolucionan los puntajes antes y
                        después de esa fecha. No afecta los KPIs ni los filtros, solo la visualización temporal del
                        gráfico.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={eventDate || ""}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    if (selectedDate) {
                      onEventDateChange(selectedDate)
                    } else {
                      onEventDateChange(null)
                    }
                  }}
                  className="w-full"
                  placeholder="Select event date"
                />
                {eventDate && (
                  <Button variant="ghost" size="sm" onClick={() => onEventDateChange(null)} className="w-full text-xs">
                    Clear Date
                  </Button>
                )}
              </div>
            </div>

            {/* Reset Button */}
            <Button variant="outline" className="w-full mt-2 bg-transparent" onClick={onResetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
