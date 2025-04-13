"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { DayPicker } from "react-day-picker"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as CalendarIcon, X, Edit, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import type { QuestChain } from "@/app/types"
import { withSourceInfo, useSourceInfo } from "@/components/withSourceInfo"
import { cn } from "@/lib/utils"
import NesDatePicker from "@/components/NesDatePicker"

// --- New Difficulty Stars Component Implementation ---
interface DifficultyStarsProps {
  difficulty: number;
  onChange: (newDifficulty: number) => void;
}

const DifficultyStars: React.FC<DifficultyStarsProps> = ({ difficulty, onChange }) => {
  const handleStarClick = (starIndex: number) => {
    const clickedValue = starIndex; // 1, 2, 3, 4
    let newValue: number;

    // If clicking the star that represents the current full value, decrease by half
    // If clicking a star below the current value, decrease by half from that star's value
    if (difficulty >= clickedValue) {
      newValue = clickedValue - 0.5;
    } else {
      // Otherwise, set to the full value of the clicked star
      newValue = clickedValue;
    }
    // Ensure value doesn't go below 0 if the first star is clicked when difficulty is 0.5
    onChange(Math.max(0, newValue)); 
  };

  return (
    <div className="flex justify-center items-center py-1">
      {[1, 2, 3, 4].map((starIndex) => {
        const isFull = difficulty >= starIndex;
        const isHalf = difficulty >= starIndex - 0.5 && difficulty < starIndex;
        const isEmpty = difficulty < starIndex - 0.5;

        const starClasses = cn(
          "nes-icon is-medium star",
          { "is-half": isHalf },
          { "is-empty": isEmpty },
        );

        return (
          <button
            key={starIndex}
            type="button"
            className={cn(
              "p-0 border-none bg-transparent cursor-pointer",
              starIndex > 1 ? "ml-1" : ""
            )}
            onMouseDown={() => handleStarClick(starIndex)}
            aria-label={`Set difficulty to ${starIndex - 0.5} or ${starIndex} stars`}
            data-testid={`difficulty-star-button-${starIndex}`}
          >
            <i
              className={starClasses}
            />
          </button>
        );
      })}
    </div>
  );
};
// --- End Difficulty Stars Component ---

interface QuestChainManagerProps {
  isOpen: boolean
  onClose: () => void
  questChains: QuestChain[]
  onAddChain: (name: string, difficulty: number, value: number, dueDate: Date | null) => void
  onEditChain: (id: string, name: string, difficulty: number, value: number, dueDate: Date | null) => void
  onDeleteChain: (id: string) => void
}

function QuestChainManager({
  isOpen,
  onClose,
  questChains,
  onAddChain,
  onEditChain,
  onDeleteChain,
}: QuestChainManagerProps) {
  const { ref } = useSourceInfo("QuestChainManager", "components/QuestChainManager.tsx")

  const [newChainName, setNewChainName] = useState("")
  const [newChainDifficulty, setNewChainDifficulty] = useState<number>(2.5)
  const [newChainValue, setNewChainValue] = useState<number>(2)
  const [newChainDueDate, setNewChainDueDate] = useState<Date | undefined>(undefined)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingDifficulty, setEditingDifficulty] = useState<number>(2.5)
  const [editingValue, setEditingValue] = useState<number>(2)
  const [editingDueDate, setEditingDueDate] = useState<Date | undefined>(undefined)

  const [isAddingChain, setIsAddingChain] = useState(false)
  const [addConfirmSelection, setAddConfirmSelection] = useState<"yes" | "no">("no")

  const handleAddChain = () => {
    if (addConfirmSelection === "yes" && newChainName.trim()) {
      onAddChain(newChainName, newChainDifficulty, newChainValue, newChainDueDate || null)
      setNewChainName("")
      setNewChainDifficulty(2.5)
      setNewChainValue(2)
      setNewChainDueDate(undefined)
      setIsAddingChain(false)
      setAddConfirmSelection("no")
    }
  }

  const handleCancelAdd = () => {
    setNewChainName("")
    setNewChainDifficulty(2.5)
    setNewChainValue(2)
    setNewChainDueDate(undefined)
    setIsAddingChain(false)
    setAddConfirmSelection("no")
  }

  const startEditing = (chain: QuestChain) => {
    setEditingId(chain.id)
    setEditingName(chain.name)
    setEditingDifficulty(chain.difficulty ?? 2.5)
    setEditingValue(chain.value ?? 2)
    setEditingDueDate(chain.dueDate ? new Date(chain.dueDate) : undefined)
  }

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      onEditChain(editingId, editingName, editingDifficulty, editingValue, editingDueDate || null)
      setEditingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleClose = () => {
    setEditingId(null)
    onClose()
  }

  return (
    <div ref={ref} data-testid="quest-chain-manager">
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent 
          className={cn(
            "!rounded-none max-w-[700px] w-[80vw] lg:w-[40vw] p-0 shadow-lg",
            "bg-[var(--background)] border-4",
            "border-[var(--foreground)]",
            "is-dark"
          )}
        >
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="nes-text is-primary mb-2 text-lg">Quest Chain Manager</DialogTitle>
            <DialogDescription className="nes-text is-warning">
              Create and manage your quest chains. Quest chains group related quests together.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 pt-0 pb-0.5">
            {isAddingChain ? (
              <div className="grid gap-4 p-6 pt-0 border-b-4 border-dashed border-gray-600 pb-6 mb-6">
                <div className="nes-field mb-2 mt-4">
                  <label htmlFor="new-chain-name" className="nes-text is-disabled text-xs">Quest Chain Name</label>
              <input
                    id="new-chain-name"
                type="text"
                    className="nes-input"
                value={newChainName}
                onChange={(e) => setNewChainName(e.target.value)}
                    placeholder="Enter new chain name"
                    data-testid="new-chain-input"
                onKeyDown={(e) => {
                      if (e.key === "Enter" && newChainName.trim()) {
                    handleAddChain()
                  }
                }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div className="nes-container is-dark with-title !mb-0 !pb-2 !pt-1">
                    <p className="title !-mt-2 !-ml-5">Difficulty</p>
                    <DifficultyStars difficulty={newChainDifficulty} onChange={setNewChainDifficulty} />
                  </div>
                  <div className="nes-container is-dark with-title !mb-0 !pb-2 !pt-1">
                    <p className="title !-mt-2 !-ml-5">Value</p>
                    <div className="flex items-center justify-center py-1 space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="4"
                        step="1"
                        value={newChainValue}
                        onChange={(e) => setNewChainValue(parseInt(e.target.value, 10))}
                        className="w-3/5"
                        data-testid="new-chain-value"
                      />
                      <div className="flex items-center">
                        <span className="nes-text is-white w-4 text-right">{newChainValue}</span>
                        <i className="nes-icon coin is-medium ml-2"></i>
                      </div>
                    </div>
                  </div>
                  <div className="nes-container is-dark with-title !mb-0 !pb-2 sm:col-span-2">
                    <p className="title">Due Date</p>
                    <NesDatePicker 
                      selectedDate={newChainDueDate} 
                      onDateChange={(day) => setNewChainDueDate(day)} 
                      containerClassName="sm:col-span-2"
                      testIdPrefix="new-chain-due-date"
                    />
                  </div>
                </div>
                <div style={{backgroundColor:"#212529", padding: "1rem 0"}} className="mt-4 text-center">
                  <p className="mb-2 nes-text is-warning">Embark on new quest chain?</p>
                  <label className="mr-4">
                    <input 
                      type="radio" 
                      className="nes-radio is-dark" 
                      name="add-confirm-dark" 
                      value="yes"
                      checked={addConfirmSelection === "yes"} 
                      onChange={() => setAddConfirmSelection("yes")}
                    />
                    <span className="nes-text is-white ml-2">Yes</span>
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      className="nes-radio is-dark" 
                      name="add-confirm-dark" 
                      value="no"
                      checked={addConfirmSelection === "no"} 
                      onChange={() => setAddConfirmSelection("no")}
                    />
                    <span className="nes-text is-white ml-2">No</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    className="nes-btn"
                    onClick={handleCancelAdd}
                    data-testid="cancel-add-chain-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`nes-btn ${addConfirmSelection === 'yes' && newChainName.trim() ? 'is-primary' : 'is-disabled'}`}
                    onClick={handleAddChain}
                    disabled={addConfirmSelection === 'no' || !newChainName.trim()}
                    data-testid="confirm-add-chain-button"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="nes-btn is-primary mb-6"
                onClick={() => setIsAddingChain(true)}
                data-testid="create-quest-chain-button"
              >
                Create Quest Chain
              </button>
            )}

            {!isAddingChain && (
              <div className="mt-2">
                <p className="mb-4 nes-text is-primary">Quest Chains</p>
            {questChains.length === 0 ? (
              <p className="text-sm nes-text is-warning">No quest chains yet. Add one above!</p>
            ) : (
                  <ul className="space-y-4">
                {questChains.map((chain) => (
                  <li
                    key={chain.id}
                    className="nes-container is-dark with-title !p-0"
                    data-testid={`chain-item-${chain.id}`}
                  >
                    {editingId === chain.id ? (
                          <div className="space-y-3 p-3">
                            <div className="nes-field">
                              <label htmlFor={`edit-chain-name-${chain.id}`} className="nes-text is-disabled text-xs">Name</label>
                        <input
                                id={`edit-chain-name-${chain.id}`}
                          type="text"
                                className="nes-input"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          data-testid={`edit-chain-input-${chain.id}`}
                        />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                              <div className="nes-container is-dark with-title !mb-0 !pb-2 !pt-1">
                                <p className="title !-mt-2 !-ml-5">Difficulty</p>
                                <DifficultyStars difficulty={editingDifficulty} onChange={setEditingDifficulty} />
                              </div>
                              <div className="nes-container is-dark with-title !mb-0 !pb-2 !pt-1">
                                <p className="title !-mt-2 !-ml-5">Value</p>
                                <div className="flex items-center justify-center py-1 space-x-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(parseInt(e.target.value, 10))}
                                    className="w-3/5"
                                    data-testid={`edit-chain-value-${chain.id}`}
                                  />
                                  <div className="flex items-center">
                                    <span className="nes-text is-white w-4 text-right">{editingValue}</span>
                                    <i className="nes-icon coin is-medium ml-2"></i>
                                  </div>
                                </div>
                              </div>
                              <div className="nes-container is-dark with-title !mb-0 !pb-2 sm:col-span-2">
                                <p className="title">Due Date</p>
                                <NesDatePicker 
                                  selectedDate={editingDueDate} 
                                  onDateChange={(day) => setEditingDueDate(day)} 
                                  containerClassName="sm:col-span-2"
                                  testIdPrefix={`edit-chain-due-date-${chain.id}`}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-2">
                          <button
                            type="button"
                            className="nes-btn is-success"
                            onClick={saveEdit}
                                disabled={!editingName.trim()}
                            data-testid={`save-chain-edit-${chain.id}`}
                          >
                                <Check className="h-4 w-4 mr-1" /> Save
                          </button>
                          <button
                            type="button"
                                className="nes-btn is-error"
                            onClick={cancelEdit}
                            data-testid={`cancel-chain-edit-${chain.id}`}
                          >
                                <X className="h-4 w-4 mr-1" /> Cancel
                          </button>
                        </div>
                          </div>
                        ) : (
                          <>
                          <p className="title">{chain.name}</p>
                          <div className="flex items-center justify-between p-3">
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center space-x-4 text-sm mb-2">
                                <div className="flex items-center">
                                  <span className="nes-text is-disabled text-xs">Diff:</span>
                                  {[1, 2, 3, 4].map((starIndex) => {
                                    const isFull = (chain.difficulty ?? 0) >= starIndex;
                                    const isHalf = (chain.difficulty ?? 0) >= starIndex - 0.5 && (chain.difficulty ?? 0) < starIndex;
                                    const isEmpty = (chain.difficulty ?? 0) < starIndex - 0.5;
                                    const starClasses = cn(
                                      "nes-icon is-small star",
                                      { "is-half": isHalf },
                                      { "is-empty": isEmpty },
                                      starIndex > 1 ? "ml-px" : ""
                                    );
                                    return <i key={`disp-star-${starIndex}`} className={starClasses}></i>;
                                  })}
                                </div>
                                <div className="flex items-center">
                                  <span className="nes-text is-disabled text-xs">Val:</span>
                                  {[...Array(chain.value ?? 0)].map((_, i) => (
                                    <i key={`disp-coin-${i}`} className={`nes-icon coin is-small${i > 0 ? ' ml-px' : ''}`}></i>
                                  ))}
                                  {[...Array(Math.max(0, 4 - (chain.value ?? 0)))].map((_, i) => (
                                    <i key={`disp-placeholder-${i}`} className={`nes-icon coin is-small opacity-25${i > 0 || (chain.value ?? 0) > 0 ? ' ml-px' : ''}`}></i>
                                  ))}
                                </div>
                              </div>
                              {/* Created Date Display (NEW) */}
                              {chain.createdAt && (
                                <div className="text-xs nes-text is-disabled mt-1">
                                  Created: {format(new Date(chain.createdAt), "MMM d, yyyy")}
                                </div>
                              )}
                              {/* Always display Due Date line */}
                              <div className={cn(
                                "text-xs",
                                chain.dueDate ? "nes-text is-disabled" : "nes-text is-success",
                                "mt-2"
                              )}>
                                Due Date: {chain.dueDate 
                                  ? format(new Date(chain.dueDate), "MMM d, yyyy") 
                                  : "Free Play!"}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                          <button
                            type="button"
                                className="nes-btn is-primary is-small"
                            onClick={() => startEditing(chain)}
                            data-testid={`edit-chain-button-${chain.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                                className="nes-btn is-error is-small"
                            onClick={() => onDeleteChain(chain.id)}
                            data-testid={`delete-chain-button-${chain.id}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                          </div>
                        </>
                    )}
                  </li>
                ))}
              </ul>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-4 flex justify-between items-center sm:justify-between">
            <div></div>
            <div>
            <button type="button" className="nes-btn" onClick={handleClose} data-testid="close-chain-manager-button">
              <span className="nes-text is-black">Close</span>
            </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withSourceInfo(QuestChainManager, "components/QuestChainManager.tsx")
