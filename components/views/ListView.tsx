"use client"

import { useState, useEffect, useRef } from "react"
import type { Quest, QuestChain } from "@/app/types"
import { format, isToday, isPast, startOfDay, differenceInCalendarDays, differenceInMilliseconds, isValid } from "date-fns"
import { Trash, Edit, Plus, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { useSourceInfo } from "@/components/withSourceInfo"
import { getProgressBarClass } from "@/app/utils/progressUtils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ListViewProps {
  todos: Quest[]
  questChains: QuestChain[]
  onToggleTodo: (id: string) => void
  onDeleteTodo: (id: string) => void
  onEditTodo: (todo: Quest) => void
  onToggleObjective: (todoId: string, objectiveId: string) => void
  characterCreatedAt: Date | null
  filterLabel: string
  onCompletionDialogClose?: () => void
}

// Helper function to format duration
function formatDuration(ms: number): string {
  if (ms < 0) ms = 0; // Ensure non-negative

  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`; 
  return `${seconds}s`; // Only seconds if less than a minute
}

function ListView({ todos, questChains, onToggleTodo, onDeleteTodo, onEditTodo, onToggleObjective, characterCreatedAt, filterLabel, onCompletionDialogClose }: ListViewProps) {
  const { ref } = useSourceInfo("ListView", "components/views/ListView.tsx")

  /* ADD START */
  // --- Determine ALL chains to display (Moved Up for Initial State) --- 
  const chainDataMapForInitial = new Map<string, QuestChain>();
  questChains.forEach(chain => {
      chainDataMapForInitial.set(chain.id, chain);
  });
  let hasSideQuestsInitial = false;
  todos.forEach(quest => {
      if (!quest.chainId) hasSideQuestsInitial = true;
  });
  const initialChainIds = new Set<string>(questChains.map(chain => chain.id));
  if (hasSideQuestsInitial) {
      initialChainIds.add('side-quests');
  }
  const initialSortedChainIds = Array.from(initialChainIds).sort((a, b) => {
    if (a === 'side-quests') return -1;
    if (b === 'side-quests') return 1;
    const nameA = chainDataMapForInitial.get(a)?.name ?? '';
    const nameB = chainDataMapForInitial.get(b)?.name ?? '';
    return nameA.localeCompare(nameB);
  });
  /* ADD END */

  // State for adding new objectives directly from the list
  const [newObjectiveTexts, setNewObjectiveTexts] = useState<Record<string, string>>({})
  const [showAddObjective, setShowAddObjective] = useState<Record<string, boolean>>({})
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [completedTodoText, setCompletedTodoText] = useState("")
  const [lastXpGained, setLastXpGained] = useState<number>(0);

  const prevTodosRef = useRef<Quest[] | null>(null)

  // State for delete confirmation
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [confirmSelection, setConfirmSelection] = useState<"yes" | "no">("no");

  // State for the elapsed time string
  const [elapsedTimeString, setElapsedTimeString] = useState<string>("...");

  /* ADD START */
  // State to track collapsed chains { [chainId]: boolean } - Initialized with default
  const [collapsedChains, setCollapsedChains] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    initialSortedChainIds.forEach(id => { state[id] = true; });
    return state;
  });
  /* ADD END */

  // Effect to detect completion changes and show dialog
  useEffect(() => {
    const previousTodos = prevTodosRef.current;
    if (previousTodos) {
      todos.forEach((currentTodo) => {
        const previousTodo = previousTodos.find(t => t.id === currentTodo.id);
        if (previousTodo && !previousTodo.completed && currentTodo.completed) {
          setCompletedTodoText(currentTodo.text);

          // Calculate XP gained for this specific quest
          const value = currentTodo.value ?? 0;
          const difficulty = currentTodo.difficulty ?? 0;
          const xpGained = (value + difficulty) * difficulty;
          setLastXpGained(xpGained);

          setShowCompletionDialog(true);
        }
      });
    }
    prevTodosRef.current = todos;
  }, [todos]);

  // Effect for the elapsed time counter
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // Check if characterCreatedAt is a valid Date object
    if (characterCreatedAt instanceof Date && isValid(characterCreatedAt)) {
      const creationTime = characterCreatedAt.getTime();
      
      // Initial calculation
      const nowInitial = Date.now();
      const durationMsInitial = differenceInMilliseconds(nowInitial, creationTime);
      setElapsedTimeString(formatDuration(durationMsInitial));

      // Set interval
      intervalId = setInterval(() => {
        const now = Date.now();
        const durationMs = differenceInMilliseconds(now, creationTime);
        setElapsedTimeString(formatDuration(durationMs));
      }, 1000);
    } else {
      // If createdAt is null or invalid, show ERROR
      setElapsedTimeString("ERROR");
    }

    // Cleanup interval on component unmount or if prop changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [characterCreatedAt]); // Re-run effect if characterCreatedAt changes

  // Calculate objective progress
  const getObjectiveProgress = (objectives: { completed: boolean }[]) => {
    if (objectives.length === 0) return 0
    return Math.round((objectives.filter((obj) => obj.completed).length / objectives.length) * 100)
  }

  // Handle adding a new objective directly from the list
  const handleAddObjective = (todoId: string) => {
    const text = newObjectiveTexts[todoId] || ""
    if (text.trim()) {
      const newObjective = {
        id: uuidv4(),
        text: text.trim(),
        completed: false,
      }

      // Find the todo and add the new objective
      const todo = todos.find((t) => t.id === todoId)
      if (todo) {
        const updatedTodo = {
          ...todo,
          objectives: [...todo.objectives, newObjective],
        }
        onEditTodo(updatedTodo)

        // Clear the input
        setNewObjectiveTexts({
          ...newObjectiveTexts,
          [todoId]: "",
        })
      }
    }
  }

  // Toggle showing the add objective input for a specific todo
  const toggleAddObjectiveInput = (todoId: string) => {
    setShowAddObjective((prev) => {
      const newState = { ...prev }
      newState[todoId] = !prev[todoId]

      // Initialize the input value when showing the input
      if (!prev[todoId]) {
        setNewObjectiveTexts((prevTexts) => ({
          ...prevTexts,
          [todoId]: "",
        }))
      }

      return newState
    })
  }

  // Simplified: Just calls the prop function
  const handleToggleTodo = (todoId: string) => {
    onToggleTodo(todoId);
    // Dialog showing logic is now handled by useEffect
  }

  const closeCompletionDialog = () => {
    setShowCompletionDialog(false);
    onCompletionDialogClose?.();
  }

  // Effect to auto-close dialog after 3 seconds
  useEffect(() => {
    if (showCompletionDialog) {
      const timer = setTimeout(() => {
        closeCompletionDialog();
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showCompletionDialog])

  // --- Delete Confirmation Handlers ---
  const handleDeleteClick = (id: string) => {
    setDeletingTodoId(id);
    setConfirmSelection("no"); // Reset selection on open
    setIsConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeletingTodoId(null);
    setConfirmSelection("no");
  };

  const handleConfirmDelete = () => {
    if (confirmSelection === "yes" && deletingTodoId) {
      onDeleteTodo(deletingTodoId);
    }
    handleCancelDelete(); // Close dialog regardless of choice
  };
  // --- End Delete Confirmation Handlers ---

  // --- Group Todos by Chain (Refactored) --- 
  const todosByChain: Record<string, { name: string; todos: Quest[] }> = {};
  
  // Create a map for quick chain name lookup AND store full chain data
  const chainDataMap = new Map<string, QuestChain>();
  questChains.forEach(chain => {
      chainDataMap.set(chain.id, chain);
  });

  // Group todos like before, but use chainDataMap for name consistency
  let hasSideQuests = false;
  todos.forEach(quest => {
    const chainId = quest.chainId ?? 'side-quests'; 
    if (chainId === 'side-quests') hasSideQuests = true;

    // Get chain name from map if available, otherwise default
    const chainName = chainDataMap.get(chainId)?.name ?? 'Side Quests'; 

    if (!todosByChain[chainId]) {
      todosByChain[chainId] = { name: chainName, todos: [] };
    }
    todosByChain[chainId].todos.push(quest);
  });

  // --- Delete the moved calculation logic --- 
  /* DELETE START */
  // --- Determine ALL chains to display --- (NEW LOGIC)
  // const allChainIds = new Set<string>(questChains.map(chain => chain.id));
  // if (hasSideQuests) {
  //   allChainIds.add('side-quests');
  // }

  // --- Sort ALL chain IDs --- (NEW LOGIC)
  // const sortedDisplayChainIds = Array.from(allChainIds).sort((a, b) => {
  //   if (a === 'side-quests') return -1;
  //   if (b === 'side-quests') return 1;
  //   // Use chainDataMap for sorting by name
  //   const nameA = chainDataMap.get(a)?.name ?? '';
  //   const nameB = chainDataMap.get(b)?.name ?? '';
  //   return nameA.localeCompare(nameB);
  // });
  // --- End Sorting --- 
  /* DELETE END */

  /* DELETE START */
  // Use the pre-calculated sorted IDs
  // const sortedDisplayChainIds = initialSortedChainIds;
  /* DELETE END */

  const todayStart = startOfDay(new Date());

  // Handler to toggle the collapsed state for a specific chain
  const toggleChainCollapse = (chainId: string) => {
    setCollapsedChains(prev => ({
      ...prev,
      [chainId]: !prev[chainId] // Toggle the boolean value
    }));
  };

  // Calculate total value of all quests
  const totalValue = todos.reduce((sum, todo) => sum + (todo.value ?? 0), 0);

  // Calculate overall average difficulty
  const allQuestsWithDifficulty = todos.filter(todo => todo.difficulty !== undefined && todo.difficulty !== null);
  const overallTotalDifficulty = allQuestsWithDifficulty.reduce((sum, todo) => sum + (todo.difficulty ?? 0), 0);
  const overallAverageDifficulty = allQuestsWithDifficulty.length > 0 ? overallTotalDifficulty / allQuestsWithDifficulty.length : 0;
  const formattedOverallAverageDifficulty = overallAverageDifficulty.toFixed(1);

  // Calculate overall progress
  const totalOverallQuests = todos.length;
  const completedOverallQuests = todos.filter(q => q.completed).length;
  const overallProgressPercent = totalOverallQuests > 0 ? Math.round((completedOverallQuests / totalOverallQuests) * 100) : 0;

  return (
    <div ref={ref} data-testid="list-view" className="space-y-4">
      {/* --- Start: Overall Summary --- */}
      <div className="nes-container is-dark with-title">
        <p className="title">{`Summary - ${filterLabel}`}</p>
        {/* Use Flexbox for two columns */}
        <div className="p-2 flex flex-row gap-x-6">
          {/* Column 1 (Originally Column 2) */}
          <div className="flex flex-col space-y-1 w-1/2">
            {/* Overall Progress Row */}
            <div className="flex items-center gap-x-2">
              <span className="nes-text is-disabled">Progress:</span>
              <span className="nes-text is-white">
                {`${completedOverallQuests} / ${totalOverallQuests} (${overallProgressPercent}%)`}
              </span>
            </div>
            {/* Quests Completed Row */}
            <div className="flex items-center gap-x-2">
              <span className="nes-text is-disabled">Quests Completed:</span>
              <span className="nes-text is-white">
                {completedOverallQuests}
              </span>
            </div>
            {/* Quests Accepted Row */}
            <div className="flex items-center gap-x-2">
              <span className="nes-text is-disabled">Quests Accepted:</span>
              <span className="nes-text is-white">
                {totalOverallQuests}
              </span>
            </div>
          </div>
          {/* Column 2 (Originally Column 1) */}
          <div className="flex flex-col space-y-1 w-1/2">
            {/* Total Value Row */}
            <div className="flex items-center gap-x-2">
              <span className="nes-text is-disabled">Total Value:</span>
              <span className="nes-text is-white">{totalValue}</span>
              <i className="nes-icon coin is-small"></i>
            </div>
            {/* Overall Difficulty Row */}
            {allQuestsWithDifficulty.length > 0 && (
              <div className="flex items-center gap-x-2">
                <span className="nes-text is-disabled">Avg Difficulty:</span>
                <span className="nes-text is-white">{formattedOverallAverageDifficulty}</span>
                <i className="nes-icon star is-small"></i>
              </div>
            )}
            {/* Time Played Row (MOVED HERE) */}
            <div className="flex items-center gap-x-2">
              <span className="nes-text is-disabled">Time Played:</span>
              <span className={`nes-text ${elapsedTimeString === 'ERROR' ? 'is-error' : 'is-white'}`}>
                {elapsedTimeString}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* --- End: Overall Summary --- */}

      {/* Render each chain group (using sortedDisplayChainIds) */}
      {initialSortedChainIds.map(chainId => {
        // Find chainData using the map
        const chainData = chainId === 'side-quests' ? undefined : chainDataMap.get(chainId);
        // Get todos for this chain (might be undefined or empty)
        const chainTodosGroup = todosByChain[chainId]; 
        const chainTodos = chainTodosGroup?.todos ?? []; // Default to empty array
        // Determine chain name
        const chainName = chainData?.name ?? 'Side Quests';

        // Calculate counts based on actual todos found
        const totalQuests = chainTodos.length;
        const completedQuests = chainTodos.filter(q => q.completed).length;

        // Calculate Progress Percentage
        const progressPercent = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

        // Calculate Total Value for this chain's quests
        const chainValue = chainTodos.reduce((sum, todo) => sum + (todo.value ?? 0), 0);

        // Calculate Average Difficulty for this chain's quests
        const questsWithDifficulty = chainTodos.filter(todo => todo.difficulty !== undefined && todo.difficulty !== null);
        const totalDifficulty = questsWithDifficulty.reduce((sum, todo) => sum + (todo.difficulty ?? 0), 0);
        const averageDifficulty = questsWithDifficulty.length > 0 ? totalDifficulty / questsWithDifficulty.length : 0;
        const formattedAverageDifficulty = averageDifficulty.toFixed(1); // Format to one decimal place

        // Calculate Time Status
        let timeStatus = "Free Play!";
        let timeStatusClass = "nes-text is-white";
        if (chainData?.dueDate) {
          const today = startOfDay(new Date());
          const dueDate = startOfDay(chainData.dueDate);
          const daysDiff = differenceInCalendarDays(dueDate, today);

          if (daysDiff < 0) {
            timeStatus = `${Math.abs(daysDiff)} days overdue`;
            timeStatusClass = "nes-text is-error";
          } else if (daysDiff === 0) {
            timeStatus = "Due today";
            timeStatusClass = "nes-text is-warning";
          } else {
            timeStatus = `${daysDiff} days remaining`;
            timeStatusClass = "nes-text is-white";
          } 
        }

        // Skip rendering if chainData is somehow missing for a non-side-quest ID (safety check)
        if (chainId !== 'side-quests' && !chainData) {
            console.warn(`Chain data not found for ID: ${chainId}`);
            return null;
        }

        return (
          <div key={chainId} className="nes-container is-dark with-title" data-chain-id={chainId}>
            {/* Title (always shows name and count) */}
            <p className="title">
              {chainName !== 'Side Quests' ? 'Chain: ' : ''}
              {chainName}
            </p>

            {/* Placeholder Button - Now toggles collapse state */}
            <div className="text-right -mt-2 mb-2"> 
              <button 
                type="button" 
                className="nes-btn is-primary is-small"
                onClick={() => toggleChainCollapse(chainId)}
              >
                {collapsedChains[chainId] ? "Show Quests" : "Hide Quests"}
              </button>
            </div>

            {/* Chain Info Pane (Renders based on chainData OR if totalQuests > 0) */}
            { (totalQuests > 0 || (chainData && ( (chainData.difficulty !== undefined && chainData.difficulty !== null) || (chainData.value !== undefined && chainData.value !== null && chainData.value > 0) || chainData.createdAt || chainData.dueDate ))) && (
              <div className="p-2 mb-4 bg-zinc-600 border border-zinc-600 flex flex-row items-start gap-x-4 text-xs rounded-sm">
                
                {/* Left Column: Use Grid for alignment */}
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 w-1/2 items-center">
                  {/* Progress Section (Modified for Side Quests) */}
                  {totalQuests > 0 && (
                     <>
                      {chainId === 'side-quests' ? (
                        <>
                          {/* Active Count for Side Quests */}
                          <span className="nes-text is-disabled">Active:</span>
                          <span className="nes-text is-white">{totalQuests - completedQuests}</span>
                          {/* Completed Count for Side Quests */}
                          <span className="nes-text is-disabled">Completed:</span>
                          <span className="nes-text is-white">{completedQuests}</span>
                        </>
                      ) : (
                        <>
                          {/* Original Progress for Normal Chains */}
                          <span className="nes-text is-disabled">Progress:</span>
                          <span className="nes-text is-white">{`${completedQuests} / ${totalQuests} (${progressPercent}%)`}</span>
                        </>
                      )}
                     </>
                  )}
                  {/* Created At Section */}
                  {chainData?.createdAt && (
                    <>
                      <span className="nes-text is-disabled">Created:</span>
                      <span className="nes-text is-white">{format(new Date(chainData.createdAt), "MMM d, yyyy")}</span>
                    </>
                  )}
                  {/* Due Date Section */}
                  {chainData?.dueDate && (
                    <>
                      <span className="nes-text is-disabled">Due:</span>
                      <span className="nes-text is-white">{format(new Date(chainData.dueDate), "MMM d, yyyy")}</span>
                    </>
                  )}
                </div>

                {/* Right Column: Use Grid for alignment */}
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 w-1/2 items-center">
                  {/* Time Status Section */}
                  {chainId === 'side-quests' ? (
                    <>
                      {/* REMOVED Time Played display from here */}
                    </>
                  ) : (
                    // Show Due Date Info for Normal Chains
                    <>
                      <span className="nes-text is-disabled">Time:</span>
                      <span className={timeStatusClass}>{timeStatus}</span>
                    </>
                  )}
                  {/* Total Quest Value Section (Renamed to Value:) */}
                  {chainValue > 0 && (
                    <>
                      <span className="nes-text is-disabled">Value:</span>
                      <span className="flex items-center">
                        <span className="nes-text is-white mr-1">{chainValue}</span>
                        <i className="nes-icon coin is-small"></i>
                      </span>
                    </>
                  )}
                  {/* Average Quest Difficulty Section (Simplified) */}
                  {questsWithDifficulty.length > 0 && (
                    <>
                      <span className="nes-text is-disabled">Difficulty:</span>
                      <span className="flex items-center">
                        {/* Display formatted numerical average */}
                        <span className="nes-text is-white mr-1">{formattedAverageDifficulty}</span>
                        {/* Display a single star icon */}
                        <i className="nes-icon star is-small"></i>
                      </span>
                    </>
                  )}
                </div>

              </div>
            )}
            {/* --- End Chain Info Pane --- */}

            {/* Conditionally render quest list based on collapsed state */}
            {!collapsedChains[chainId] && (
        <div className="space-y-2">
                {/* Conditionally render todos OR an empty state message */}
                {chainTodos.length > 0 ? (
                  chainTodos.map((todo, index) => {
                    // --- Determine Due Date Class --- 
                    let dueDateClass = "nes-text is-disabled"; // Default
                    if (todo.completed) {
                      dueDateClass = "nes-text is-success line-through";
                    } else if (todo.dueDate) {
                      const dueDateStart = startOfDay(todo.dueDate); // Ensure comparing day only
                      if (isPast(dueDateStart) && !isToday(dueDateStart)) { // isPast includes today
                        dueDateClass = "nes-text is-error"; // Overdue
                      } else if (isToday(dueDateStart)) {
                        dueDateClass = "nes-text is-warning"; // Due today
                      }
                      // If future, keep default is-disabled
                    }
                    
                    // --- Determine Created At Class --- (NEW)
                    let createdAtClass = "nes-text is-disabled"; // Default
                    if (todo.completed) {
                       createdAtClass = "nes-text is-success line-through";
                    } else {
                       // If not completed, check if due date exists
                       if (todo.dueDate) {
                           // Mirror the due date's calculated class
                           createdAtClass = dueDateClass; 
                       } else {
                           // No due date, keep it disabled
                           createdAtClass = "nes-text is-disabled";
                       }
                    }
                    // --- End Determine Classes --- 

                    // --- Calculate Relative Due Date String ---
                    let dayDiffString = "";
                    if (todo.dueDate) {
                      const today = startOfDay(new Date());
                      const dueDateStart = startOfDay(todo.dueDate);
                      const diff = differenceInCalendarDays(dueDateStart, today);

                      if (diff < 0) {
                        dayDiffString = ` (${Math.abs(diff)} days ago)`;
                      } else if (diff === 0) {
                        dayDiffString = ` (Today)`;
                      } else {
                        dayDiffString = ` (in ${diff} days)`;
                      }
                    }
                    // --- End Calculate Relative Due Date String ---

                    return (
              <div
                key={todo.id}
                        className={`relative p-3 border-b border-zinc-600 bg-zinc-600 group ${todo.completed ? "bg-opacity-40 bg-gray-800" : ""}`}
              >
                        {/* --- Start: Individual Todo Rendering --- */}
                <div className="flex justify-between items-start">
                           {/* Quest checkbox and text */}
                  <div className="flex items-center">
                    <label>
                      <input
                        type="checkbox"
                        className="nes-checkbox is-dark"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo.id)}
                      />
                               <span className={`ml-2 ${todo.completed ? "nes-text is-success" : "nes-text is-white"}`}>{todo.text}</span>
                    </label>
                           </div>
                        </div>
                        {/* Objectives Section */}
                        <div className="mt-2 ml-8">
                           <div className="flex justify-between items-end text-xs mb-1">
                              <span className="nes-text is-primary">
                                 {todo.objectives.length === 0
                                    ? `Objectives: ${todo.completed ? 1 : 0}/1`
                                    : `Objectives: ${todo.objectives.filter((obj) => obj.completed).length}/${todo.objectives.length}`}
                        </span>
                              <div className="flex items-end space-x-2">
                                 {/* New container for STACKING Stars and Coins */}
                                 <div className="flex flex-col items-start space-y-1 mr-1">
                                    {/* Difficulty Stars (Moved Here) */}
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4].map(starIndex => (
                                        <i key={starIndex} className={cn(
                                          "nes-icon is-small star",
                                          { "is-half": (todo.difficulty ?? 0) >= starIndex - 0.5 && (todo.difficulty ?? 0) < starIndex },
                                          { "is-empty": (todo.difficulty ?? 0) < starIndex - 0.5 },
                                          starIndex > 1 ? "ml-px" : ""
                                        )}></i>
                                      ))}
                                    </div>
                                    {/* Value Coins (Moved Here) */}
                                    <div className="flex items-center">
                                      {[...Array(todo.value ?? 0)].map((_, i) => (
                                        <i key={`coin-${i}`} className={`nes-icon coin is-small${i > 0 ? ' ml-px' : ''}`}></i>
                                      ))}
                      </div>
                    </div>
                                 {/* Buttons - Ensure they are here */}
                                 <button className="nes-btn is-primary is-small" onClick={() => onEditTodo(todo)}>
                      <Edit className="h-4 w-4" />
                    </button>
                                 <button className="nes-btn is-error is-small" onClick={() => handleDeleteClick(todo.id)}>
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                    </div>
                    <progress
                              // Conditional Progress Bar Value & Class
                              className={`nes-progress ${todo.objectives.length === 0
                                    ? getProgressBarClass(todo.completed ? 100 : 0)
                                    : getProgressBarClass(getObjectiveProgress(todo.objectives))}`}
                              value={todo.objectives.length === 0
                                    ? (todo.completed ? 100 : 0)
                                    : getObjectiveProgress(todo.objectives)}
                      max="100"
                    ></progress>
                           {/* Objective List */}
                           {todo.objectives.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {todo.objectives.map((objective) => (
                        <li key={objective.id} className="flex items-center">
                          <label>
                                          <input type="checkbox" className="nes-checkbox is-dark" checked={objective.completed} onChange={() => onToggleObjective(todo.id, objective.id)} />
                                          <span className={`ml-2 text-xs ${objective.completed ? "nes-text is-success" : "nes-text is-white"}`}>{objective.text}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                           )}
                        </div>
                        {/* --- End: Individual Todo Rendering --- */}
                        
                        {/* Timestamp Container */}
                        <div className="flex justify-center items-baseline mt-2 text-[0.65rem]">
                          {/* Created At - Apply NEW conditional class */}
                          <span className={cn("", createdAtClass)}> 
                            Created: {format(todo.createdAt, "MMM d, yyyy")}
                          </span>
                          <span className="nes-text is-disabled mx-2">|</span>
                          {/* Due Date - Uses its own conditional class */}
                          <span className={cn("", dueDateClass)}> 
                            {/* Conditionally render OVERDUE prefix */}
                            {!todo.completed && todo.dueDate && isPast(startOfDay(todo.dueDate)) && !isToday(startOfDay(todo.dueDate))
                              ? `OVERDUE: ${format(todo.dueDate, "MMM d, yyyy")}`
                              : (todo.dueDate ? `Due: ${format(todo.dueDate, "MMM d, yyyy")}` : "No Due Date")
                            }
                            {/* Append the relative day difference */}
                            {!todo.completed && todo.dueDate ? dayDiffString : ""}
                          </span>
                          {/* Completed At */}
                          {todo.completed && todo.completedAt && (
                            <>
                              <span className="nes-text is-disabled mx-2">|</span>
                              <span className="nes-text is-success"> 
                                Completed: {format(todo.completedAt, "MMM d, yyyy")}
                              </span>
                            </>
                          )}
                        </div>
                  </div>
                    )
                  })
                ) : (
                  <p className="text-center text-sm nes-text is-disabled p-4">No quests in this chain yet.</p>
                )}
              </div>
          )}
        </div>
        )
      })}

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={(open) => !open && closeCompletionDialog()}>
        <DialogContent 
          className={cn(
            "!rounded-none max-w-[500px] w-[90vw] p-0 shadow-lg",
            "bg-[var(--background)] border-4",
            "!border-white",
            "is-dark"
          )}
        >
          <DialogHeader className="p-6 pb-4 text-center">
            <DialogTitle className="nes-text is-success mb-2 text-lg">
              Quest Complete!
            </DialogTitle>
            <DialogDescription className="nes-text is-white">
              You've completed the quest: <span className="nes-text is-success">{completedTodoText}</span>
            </DialogDescription>
            <p className="mt-4 nes-text is-primary">+{lastXpGained} XP gained!</p>
          </DialogHeader>
          <DialogFooter className="p-6 pt-2 flex justify-center">
            <button type="button" className="nes-btn is-primary" onClick={closeCompletionDialog}>
              <span className="nes-text is-white">Continue</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent
          className={cn(
            "!rounded-none max-w-[500px] w-[90vw] p-0 shadow-lg",
            "bg-[var(--background)] border-4 border-[var(--foreground)]",
            "is-dark"
          )}
        >
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="nes-text is-primary !text-center !text-xl">Abandon Quest?</DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-2 pb-4 text-center">
            <DialogDescription className="nes-text is-error mb-4">
              (Cannot be undone!)
            </DialogDescription>

            <div className="flex justify-center space-x-8">
              <label>
                <input
                  type="radio"
                  className="nes-radio is-dark"
                  name="confirm-delete"
                  value="no"
                  checked={confirmSelection === "no"}
                  onChange={() => setConfirmSelection("no")}
                />
                <span className="nes-text is-white ml-2">No</span>
              </label>
              <label>
                <input
                  type="radio"
                  className="nes-radio is-dark"
                  name="confirm-delete"
                  value="yes"
                  checked={confirmSelection === "yes"}
                  onChange={() => setConfirmSelection("yes")}
                />
                <span className="nes-text is-white ml-2">Yes</span>
              </label>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 flex justify-center sm:justify-center space-x-4">
            <button type="button" className="nes-btn" onClick={handleCancelDelete}>
              <span className="nes-text is-black">Cancel</span>
            </button>
            <button
              type="button"
              className={`nes-btn ${confirmSelection === 'yes' ? 'is-error' : 'is-disabled'}`}
              onClick={handleConfirmDelete}
              disabled={confirmSelection === 'no'}
            >
              <span className={`nes-text ${confirmSelection === 'yes' ? 'is-white' : 'is-black'}`}>Confirm</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ListView
