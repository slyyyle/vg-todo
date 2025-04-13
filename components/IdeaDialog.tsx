"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  // Assuming DialogBody is not needed or defined elsewhere, use div
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { withSourceInfo, useSourceInfo } from "@/components/withSourceInfo"
import type { Idea } from "@/app/types"

// Simple type for now
interface IdeaData {
  name: string
  description: string
}

interface IdeaDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (ideaData: { name: string, description: string }) => void
  idea: Idea | null
}

function IdeaDialogComponent({ isOpen, onClose, onSave, idea }: IdeaDialogProps) {
  const { ref } = useSourceInfo("IdeaDialog", "components/IdeaDialog.tsx")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Reset state when dialog opens/closes or idea changes
  useEffect(() => {
    if (isOpen) {
       setName(idea?.name || "")
       setDescription(idea?.description || "")
    }
  }, [isOpen, idea])


  const handleSave = () => {
    if (name.trim()) {
      onSave({ name: name.trim(), description: description.trim() })
    }
  }

  // Close handler
  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        ref={ref}
        className={cn(
          "!rounded-none max-w-[500px] w-[90vw] p-0 shadow-lg", // Style similar to QuestDialog
          "bg-[var(--background)] border-4",
          "!border-white", // Assuming white border like Quest Completion Dialog
          "is-dark"
        )}
        data-testid="idea-dialog"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="nes-text is-primary mb-2 text-lg">
            {idea ? "Edit Idea" : "Add New Idea"}
          </DialogTitle>
          <DialogDescription className="nes-text is-disabled">
            {idea ? "Update the details of your idea." : "Capture your brilliant thoughts!"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 pt-0 pb-6"> {/* Using div instead of DialogBody for simplicity */}
          {/* Name Field */}
          <div className="nes-field">
            <label htmlFor="idea-name" className="nes-text is-disabled text-xs">Name</label>
            <input
              type="text"
              id="idea-name"
              className="nes-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Idea title..."
              data-testid="idea-name-input"
            />
          </div>

          {/* Description Field */}
          <div className="nes-field">
            <label htmlFor="idea-description" className="nes-text is-disabled text-xs">Description</label>
            <textarea
              id="idea-description"
              className="nes-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea..."
              data-testid="idea-description-input"
            ></textarea>
          </div>
        </div>

        <DialogFooter className="p-4 flex justify-end space-x-2 border-t border-gray-700">
          <button type="button" className="nes-btn" onClick={handleClose}>Cancel</button>
          <button
            type="button"
            className={`nes-btn ${name.trim() ? 'is-primary' : 'is-disabled'}`}
            onClick={handleSave}
            disabled={!name.trim()}
            data-testid="save-idea-button"
          >
            {idea ? "Update Idea" : "Save Idea"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const IdeaDialog = withSourceInfo(IdeaDialogComponent, "components/IdeaDialog.tsx")
export default IdeaDialog 