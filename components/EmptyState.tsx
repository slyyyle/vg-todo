"use client"

import { useSourceInfo } from "@/components/withSourceInfo"

interface EmptyStateProps {
  onAddQuest: () => void
  onManageChains: () => void
}

export default function EmptyState({ onAddQuest, onManageChains }: EmptyStateProps) {
  // Use the source info hook to register this component
  const { ref } = useSourceInfo("EmptyState", "components/EmptyState.tsx")

  return (
    <div ref={ref} className="nes-container is-dark with-title h-96" data-testid="empty-state">
      <p className="title">Your Adventure Awaits</p>
      <div className="text-center py-4">
        <i className="nes-octocat animate mb-4"></i>
        <p className="mb-4 nes-text is-error">You have no quests or quest chains yet!</p>
        <p className="mb-6 nes-text is-primary">Start your adventure by creating a new quest or quest chain.</p>
        <div className="flex justify-center gap-4">
          <button className="nes-btn is-primary" onClick={onAddQuest}>
            <span className="nes-text is-white">Add Quest</span>
          </button>
          <button className="nes-btn is-primary" onClick={onManageChains}>
            <span className="nes-text is-white">Add Chain</span>
          </button>
        </div>
      </div>
    </div>
  )
}
