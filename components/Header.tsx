"use client"

import { useSourceInfo } from "@/components/withSourceInfo"
import type { ViewType } from "@/app/types"

interface HeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  // Use the source info hook to register this component
  const { ref } = useSourceInfo("Header", "components/Header.tsx")

  return (
    <header ref={ref} className="nes-container is-dark with-title mb-8" data-testid="header">
      <p className="title">NES Todo Quest</p>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl nes-text is-primary">Your Adventure Awaits!</h1>
        <div className="flex flex-wrap gap-2">
          <button
            className={`nes-btn ${currentView === "list" ? "is-primary" : ""}`}
            onClick={() => onViewChange("list")}
            data-testid="view-list-button"
          >
            <span className={`nes-text ${currentView === "list" ? "is-white" : "is-black"}`}>List</span>
          </button>
        </div>
      </div>
    </header>
  )
}
