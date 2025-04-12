"use client"

import { useSourceInfo } from "@/components/withSourceInfo"

interface QuestManagementProps {
  onAddQuest: () => void
  onManageChains: () => void
  onExportData: () => void
}

export default function QuestManagement({ onAddQuest, onManageChains, onExportData }: QuestManagementProps) {
  // Use the source info hook to register this component
  const { ref } = useSourceInfo("QuestManagement", "components/QuestManagement.tsx")

  return (
    <div ref={ref} className="nes-container is-dark with-title mt-4" data-testid="quest-management">
      <p className="title">Quest Management</p>
      <div className="flex flex-col gap-4">
        <button className="nes-btn is-primary" onClick={onAddQuest} data-testid="add-quest-button">
          <span className="nes-text is-white">Add New Quest</span>
        </button>
        <button className="nes-btn is-primary" onClick={onManageChains} data-testid="manage-chains-button">
          <span className="nes-text is-white">Manage Quest Chains</span>
        </button>
        <button className="nes-btn is-primary" onClick={onExportData} data-testid="export-data-button">
          <span className="nes-text is-white">Export Quest Log</span>
        </button>
      </div>
    </div>
  )
}
