"use client"

import { User, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onDownloadSnapshot?: () => void
}

export function Header({ onDownloadSnapshot }: HeaderProps) {
  return (
    <header className="bg-[#1e3a8a] text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/images/descarga-20-281-29.png" alt="TELL Logo" className="w-24 h-24 object-contain" />
            <div className="h-16 w-px bg-white/30"></div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">TELL Results Dashboard</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={onDownloadSnapshot}
            variant="outline"
            className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
          >
            <Download className="w-4 h-4" />
            Download snapshot
          </Button>
          <User className="w-6 h-6" />
        </div>
      </div>
    </header>
  )
}
