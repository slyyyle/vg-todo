"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Quest, QuestChain } from "@/app/types"
import { v4 as uuidv4 } from "uuid"
import { X, Plus, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DayPicker } from 'react-day-picker'

import { withSourceInfo, useSourceInfo } from "@/components/withSourceInfo"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import NesDatePicker from "@/components/NesDatePicker"

interface QuestDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (quest: Omit<Quest, "id" | "completed" | "xp" | "createdAt">) => void
  todo: Quest | null
  questChains: QuestChain[]
}

// --- Difficulty Stars Component ---
interface DifficultyStarsProps {
  difficulty: number;
  onChange: (newDifficulty: number) => void;
}

const DifficultyStars: React.FC<DifficultyStarsProps> = ({ difficulty, onChange }) => {
  const stars = [];
  for (let i = 1; i <= 4; i++) {
    const fullValue = i;
    const halfValue = i - 0.5;

    const isHalfSelected = difficulty >= halfValue && difficulty < fullValue;
    const isFullSelected = difficulty >= fullValue;
    const isEmpty = difficulty < halfValue;

    let iconClass = "nes-icon is-medium star";
    if (isHalfSelected) iconClass += " is-half";
    else if (isEmpty) iconClass += " is-empty"; // Use is-empty for unselected/hover

    // Determine classes for hover effect and selection state
    const starClasses = cn(
      iconClass,
      "cursor-pointer transition-opacity duration-150", // Base classes
      i > 1 ? "ml-1" : "", // Changed ml-2 to ml-1
      {
        "opacity-100": isFullSelected || isHalfSelected, // Fully visible if selected
        "opacity-50 hover:opacity-75": isEmpty, // Dimmed if empty, slight brighten on hover
      }
    );

    // Handle click events for setting difficulty
    const handleStarClick = (value: number) => {
      // Allow toggling off a half-star or full star by clicking again
      if (difficulty === value) {
        onChange(value - 0.5); // Go down half a step
      } else {
        onChange(value);
      }
    };

    stars.push(
      <i
        key={i}
        className={starClasses}
        onClick={() => handleStarClick(fullValue)} // Always click for the full star value first
        onMouseEnter={(e) => { /* Optional: enhance hover effect */ }}
        onMouseLeave={(e) => { /* Optional: reset hover effect */ }}
        data-testid={`difficulty-star-${i}`}
      />
    );
  }

  return <div className="flex justify-center items-center py-1">{stars}</div>;
};
// --- End Difficulty Stars Component ---

function QuestDialog({ isOpen, onClose, onSave, todo, questChains }: QuestDialogProps) {
  const [text, setText] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [difficulty, setDifficulty] = useState<number>(2.5);
  const [value, setValue] = useState<number>(2);
  const [questType, setQuestType] = useState<"main" | "side" | "extra">("side")
  const [objectives, setObjectives] = useState<{ id: string; text: string; completed: boolean }[]>([])
  const [chainId, setChainId] = useState<string | undefined>(undefined)
  const [newObjective, setNewObjective] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (todo) {
      setText(todo.text)
      setDueDate(todo.dueDate ? new Date(todo.dueDate) : undefined)
      setDifficulty(todo.difficulty)
      setValue(todo.value ?? 2);
      setQuestType(todo.questType)
      setObjectives(todo.objectives ? [...todo.objectives] : [])
      setChainId(todo.chainId)
    } else {
      setText("")
      setDueDate(undefined)
      setDifficulty(2.5)
      setValue(2);
      setQuestType("side")
      setObjectives([])
      
      setChainId(undefined);
    }
  }, [todo, isOpen, questChains])

  const handleSave = () => {
    setErrorMessage(null)

    if (!text.trim()) {
      setErrorMessage("Quest name is required!")
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    const finalObjectives = [...objectives]
    if (newObjective.trim()) {
      finalObjectives.push({
        id: uuidv4(),
        text: newObjective.trim(),
        completed: false,
      })
    }

    onSave({
      text,
      dueDate: dueDate || null,
      difficulty,
      value,
      questType,
      objectives: finalObjectives,
      chainId,
    })
  }

  const addObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, { id: uuidv4(), text: newObjective, completed: false }])
      setNewObjective("")
    }
  }

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter((obj) => obj.id !== id))
  }

  const handleChainChange = (selectedChainId: string) => {
    setChainId(selectedChainId);
  }

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
    if (errorMessage) {
      setErrorMessage(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "!rounded-none max-w-[600px] w-[90vw] p-0 shadow-lg",
          "bg-[var(--background)] border-4",
          "!border-[var(--foreground)]",
          "is-dark"
        )}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="nes-text is-primary mb-2 text-lg">{todo ? "Edit Quest" : "New Quest"}</DialogTitle>
            <DialogDescription className="nes-text is-warning">
              {todo ? "Update your quest details below." : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-6 pt-0">
            {/* Quest Name Container */}
            <div className="nes-container is-dark with-title !mb-0 !pb-2">
              <p className="title">Quest Name</p>
              <div className="nes-field mb-0">
                <input
                  id="quest-name"
                  type="text"
                  className="nes-input"
                  value={text}
                  onChange={handleNameInputChange}
                  placeholder="Enter quest name"
                  data-testid="quest-name-input"
                />
              </div>
            </div>

            {/* Difficulty, Value, and Quest Chain Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Difficulty Container */}
              <div className="nes-container is-dark with-title !mb-0 !pb-2 !pt-1">
                <p className="title !-mt-2">Difficulty</p>
                <DifficultyStars difficulty={difficulty} onChange={setDifficulty} />
              </div>

              {/* Value Container - Changed to Slider */}
              <div className="nes-container is-dark with-title !mb-0 !pb-2 !pt-1">
                <p className="title !-mt-2">Value</p>
                <div className="flex items-center justify-center py-1 space-x-2">
                  <input 
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value, 10))}
                    className="w-3/5"
                  />
                  {/* Display numeric value and coin icon */}
                  <div className="flex items-center">
                    <span className="nes-text is-white w-4 text-right">{value}</span>
                    <i className="nes-icon coin is-medium ml-2"></i>
                  </div>
                </div>
              </div>

              {/* Quest Chain Container */}
              <div className="nes-container is-dark with-title !mb-0 !pb-2 sm:col-span-2">
                <p className="title">Quest Chain</p>
                <div className="nes-select">
                  <select
                    id="quest-chain"
                    value={chainId || ""}
                    onChange={(e) => handleChainChange(e.target.value)}
                    data-testid="quest-chain-select"
                    className="nes-text is-black"
                  >
                    <option value="" className="nes-text is-black">
                      Side Quests
                    </option>
                    {questChains.map((chain) => (
                      <option key={chain.id} value={chain.id} className="nes-text is-black">
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <NesDatePicker 
              selectedDate={dueDate} 
              onDateChange={(day) => setDueDate(day)} 
              containerClassName="sm:col-span-2"
              testIdPrefix="quest-dialog-due-date"
            />

            <div className="nes-container is-dark with-title !mb-0 !pb-2 !pt-1">
              <p className="title !-mt-2">Objectives</p>
              <div className="p-2">
                {objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center mb-1">
                    <span
                      className={`nes-text flex-grow ${obj.completed ? "is-success" : "is-white"}`}
                    >
                      {obj.text}
                    </span>
                    <button
                      type="button"
                      className="nes-btn is-error is-small ml-2"
                      onClick={() => removeObjective(obj.id)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="nes-input flex-grow"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add new objective"
                />
                <button
                  type="button"
                  className="nes-btn is-primary ml-2"
                  onClick={addObjective}
                  disabled={!newObjective.trim()}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="px-6 pb-4">
              <p className="nes-balloon from-left nes-pointer is-error nes-text is-black">
                {errorMessage}
              </p>
            </div>
          )}

          <DialogFooter className="p-6 pt-4 flex justify-between items-center sm:justify-between space-x-2">
            {errorMessage && <i className="nes-octocat animate !-mt-2"></i>}
            {!errorMessage && <div></div>}
            <div>
              <button type="button" className="nes-btn" onClick={onClose} data-testid="cancel-button">
                <span className="nes-text is-black">Cancel</span>
              </button>
              <button type="submit" className="nes-btn is-primary ml-2" data-testid="save-quest-button">
                <span className="nes-text is-white">Save Quest</span>
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default withSourceInfo(QuestDialog, "components/QuestDialog.tsx")
