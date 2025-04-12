"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Quest, QuestChain, Character, ViewType, SortOption, FilterOption } from "./types"
import { v4 as uuidv4 } from "uuid"
import ListView from "@/components/views/ListView"
import QuestDialog from "@/components/QuestDialog"
import CharacterPanel from "@/components/CharacterPanel"
import QuestChainManager from "@/components/QuestChainManager"
import Header from "@/components/Header"
import EmptyState from "@/components/EmptyState"
import QuestManagement from "@/components/QuestManagement"
import CalendarPanel from "@/components/CalendarPanel";
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { useSourceInfo } from "@/components/withSourceInfo"
import { loadData, saveData } from './actions'; // Import server actions
import { format, parseISO } from 'date-fns'; // Import parseISO if needed for initial dates

// Import the debug utilities
import { exposeDebugUtils } from "./utils/debugUtils"
import { analyzeCodeStructure } from "./utils/codeAnalyzer"

// Define the default character creation date (consistent with actions.ts)
const defaultCharacterCreationDate = new Date('2025-04-05T12:00:00');

// Add this inside the Home component, at the beginning of the function
export default function Home() {
  // Register this component with source info
  const { ref } = useSourceInfo("HomePage", "app/page.tsx")

  // State management
  const [todos, setTodos] = useState<Quest[]>([])
  const [questChains, setQuestChains] = useState<QuestChain[]>([])
  const [character, setCharacter] = useState<Character>({
    level: 1,
    title: "Novice Adventurer",
    avatar: "hero",
    progress: 0, // Start progress at 0
    createdAt: defaultCharacterCreationDate // Initialize with default date
  })
  const [currentView, setCurrentView] = useState<ViewType>("list")
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false)
  const [isChainManagerOpen, setIsChainManagerOpen] = useState(false)
  const [currentTodo, setCurrentTodo] = useState<Quest | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("difficulty")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(true); // Added loading state

  // Load data from file using Server Action on initial mount
  useEffect(() => {
    async function fetchData() {
      console.log("Fetching initial data...");
      setIsLoading(true);
      const initialData = await loadData(); // This now returns data with parsed Dates
      console.log("Data received:", initialData);

      // REVERTED: Set state directly, assuming loadData parsed dates
      setTodos(initialData.quests || []);
      setQuestChains(initialData.questChains || []);
      setCharacter(initialData.character);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  // Save data to file using Server Action whenever data changes
  useEffect(() => {
    // Prevent saving during the initial load potentially causing race condition
    if (isLoading) return; 
    
    console.log("Data changed, attempting to save...");
    saveData({ quests: todos, questChains, character }); // Use correct key 'quests'
  }, [todos, questChains, character, isLoading]); // Added isLoading dependency

  // Todo CRUD operations
  const addTodo = (newTodo: Quest) => {
    setTodos([...todos, newTodo])
  }

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((quest) => { 
        if (quest.id === id) {
          const isChecking = !quest.completed; // Check the *new* intended state
          return {
            ...quest,
            completed: isChecking, 
            // If checking, complete all objectives; if unchecking, clear all objectives
            objectives: quest.objectives.map((obj) => ({ ...obj, completed: isChecking })),
            completedAt: isChecking ? new Date() : null, // Set/clear completedAt
          };
        }
        return quest;
      }),
    );
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  // Ensure the editTodo function properly updates the todo with all its properties
  const editTodo = (updatedTodo: Quest) => {
    setTodos(todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)))
  }

  // Ensure the toggleObjective function properly updates the objectives
  const toggleObjective = (todoId: string, objectiveId: string) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === todoId) {
          const updatedObjectives = todo.objectives.map((obj) =>
            obj.id === objectiveId ? { ...obj, completed: !obj.completed } : obj,
          )

          // Check if all objectives are completed
          const allCompleted = updatedObjectives.length > 0 && updatedObjectives.every((obj) => obj.completed)

          return {
            ...todo,
            objectives: updatedObjectives,
            // Parent quest completion now directly reflects objective completion
            completed: allCompleted,
            // ADDED: Set completedAt based on objective completion
            completedAt: allCompleted ? (todo.completedAt ?? new Date()) : null, 
          }
        }
        return todo
      }),
    )
  }

  // Quest Chain CRUD operations
  const addQuestChain = (name: string, difficulty: number, value: number, dueDate: Date | null) => {
    const newChain: QuestChain = {
      id: uuidv4(),
      name,
      difficulty,
      value,
      createdAt: new Date(),
      dueDate,
    }
    setQuestChains([...questChains, newChain])
  }

  const editQuestChainName = (id: string, newName: string, difficulty: number, value: number, dueDate: Date | null) => {
    setQuestChains(
      questChains.map((chain) =>
        chain.id === id
          ? { ...chain, name: newName, difficulty, value, dueDate }
          : chain
      )
    )
  }

  const deleteQuestChain = (id: string) => {
    // Remove chain
    setQuestChains(questChains.filter((chain) => chain.id !== id))

    // Reset chainId for todos that were in this chain
    setTodos(todos.map((quest) => (quest.chainId === id ? { ...quest, chainId: undefined } : quest)))
  }

  // Filtering and sorting
  const filteredTodos = todos.filter((quest) => {
    switch (filterBy) {
      case "completed":
        return quest.completed
      case "active":
        return !quest.completed
      case "chained":
        return quest.chainId !== undefined && quest.chainId !== '';
      case "side":
        return quest.chainId === undefined || quest.chainId === '';
      case "extra":
        return quest.questType === "extra"
      default:
        return true
    }
  })

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    switch (sortBy) {
      case "difficulty":
        return b.difficulty - a.difficulty
      case "dueDate":
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.getTime() - b.dueDate.getTime()
      case "questType":
        const typeOrder = { main: 0, side: 1, extra: 2 }
        return typeOrder[a.questType] - typeOrder[b.questType]
      default:
        return 0
    }
  })

  // Add handler for changing character avatar
  const handleAvatarChange = (newAvatar: string) => {
    setCharacter((prevCharacter) => ({
      ...prevCharacter,
      avatar: newAvatar,
    }));
  };

  // Export data function
  const exportData = () => {
    const data = {
      todos,
      questChains,
      character,
    }

    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `nes-todo-export-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Handle Add New Quest button click
  const handleAddNewQuest = () => {
    setCurrentTodo(null)
    setIsQuestDialogOpen(true)
  }

  // Handle view change
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
  }

  // Handle manage chains button click
  const handleManageChains = () => {
    setIsChainManagerOpen(true)
  }

  // Handle export data button click
  const handleExportData = () => {
    exportData()
  }

  // Render the appropriate view (conditionally based on loading state)
  const renderCurrentView = () => {
    // Render loading state first
    if (isLoading) {
        return <p className="nes-text is-primary p-4 text-center">Loading quests...</p>; 
    }
    // Updated condition: Show EmptyState only if NO todos AND NO defined chains exist
    if (todos.length === 0 && questChains.length === 0) {
      return (
        <EmptyState
          onAddQuest={() => {
            setCurrentTodo(null)
            setIsQuestDialogOpen(true)
          }}
          onManageChains={() => setIsChainManagerOpen(true)}
        />
      )
    }

    switch (currentView) {
      case "list":
        return (
          <ListView
            todos={sortedTodos}
            questChains={questChains}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
            onEditTodo={(todo: Quest) => {
              setCurrentTodo(todo)
              setIsQuestDialogOpen(true)
            }}
            onToggleObjective={toggleObjective}
            characterCreatedAt={character.createdAt}
          />
        )
      default:
        return null
    }
  }

  const handleAddQuest = (newQuestData: Omit<Quest, "id" | "completed" | "xp" | "createdAt">) => {
    const newQuest: Quest = {
      ...newQuestData,
      id: uuidv4(),
      completed: false,
      xp: calculateXP(newQuestData),
      createdAt: new Date(), // Set creation timestamp
    };
    addTodo(newQuest);
    setIsQuestDialogOpen(false);
    setCurrentTodo(null);
  };

  const handleEditQuest = (updatedQuestData: Omit<Quest, "id" | "completed" | "xp" | "createdAt">) => {
    if (currentTodo) {
      // Combine existing data (including original createdAt) with updates
      const updatedQuest: Quest = {
        ...currentTodo, // Includes original createdAt
        ...updatedQuestData, // Overwrites fields except id, completed, xp, createdAt
        xp: calculateXP(updatedQuestData), // Recalculate XP if needed
      };
      editTodo(updatedQuest);
      setIsQuestDialogOpen(false);
      setCurrentTodo(null);
    }
  };

  // Update handleSaveQuest signature to reflect new Omit
  const handleSaveQuest = (questData: Omit<Quest, "id" | "completed" | "xp" | "createdAt">) => {
    if (currentTodo) {
      handleEditQuest(questData);
    } else {
      handleAddQuest(questData);
    }
  };

  // Update calculateXP signature to reflect new Omit
  const calculateXP = (questData: Omit<Quest, "id" | "completed" | "xp" | "createdAt">): number => {
    // Simplified XP: Flat 10 XP per quest, value and objectives removed for now.
    let calculatedXp = 10; 
    
    // Removed objective bonus calculation:
    // if (questData.objectives && questData.objectives.length > 0) {
    //     calculatedXp += questData.objectives.length * 2;
    // }
    
    // Removed value bonus calculation:
    // const valueBonus = [0, 2, 5, 10, 15];
    // calculatedXp += valueBonus[questData.value ?? 0]; 
    
    // Maybe add difficulty bonus back in as well?
    // calculatedXp += Math.ceil(questData.difficulty * 1); 

    return calculatedXp;
  };

  return (
    <main ref={ref} className="min-h-screen p-4 md:p-8" data-testid="main-page">
      <div className="max-w-7xl mx-auto">
        <Header currentView={currentView} onViewChange={handleViewChange} />

        {/* Spacer element reduced in height */}
        <div className="h-4" aria-hidden="true"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Character Panel - Left Column on medium+ screens */}
          <div className="md:col-span-1 space-y-6">
            <CharacterPanel 
              character={character} 
              onAvatarChange={handleAvatarChange}
            />

            {/* Use the new CalendarPanel component */}
            <CalendarPanel 
              selected={selectedCalendarDay}
              onSelect={setSelectedCalendarDay} 
            />

            <QuestManagement
              onAddQuest={handleAddNewQuest}
              onManageChains={handleManageChains}
              onExportData={handleExportData}
            />
          </div>

          {/* Main Content - Middle and Right Columns on medium+ screens */}
          <div className="md:col-span-2">
            {/* Filters remain visible even during load */}
            {!isLoading && ( // Show filters only when not loading
              <div className="nes-container is-dark with-title mb-4">
                <p className="title">Filters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 nes-text is-primary">Sort By:</label>
                    <div className="nes-select">
                      <select
                        id="sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="nes-text is-black"
                      >
                        <option value="difficulty" className="nes-text is-black">
                          Difficulty
                        </option>
                        <option value="dueDate" className="nes-text is-black">
                          Due Date
                        </option>
                        <option value="questType" className="nes-text is-black">
                          Quest Type
                        </option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 nes-text is-primary">Filter By:</label>
                    <div className="nes-select">
                      <select
                        id="filter-by"
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                        className="nes-text is-black"
                      >
                        <option value="all" className="nes-text is-black">
                          All Quests
                        </option>
                        <option value="active" className="nes-text is-black">
                          Active Quests
                        </option>
                        <option value="completed" className="nes-text is-black">
                          Completed Quests
                        </option>
                        <option value="chained" className="nes-text is-black">
                          Quest Chains
                        </option>
                        <option value="side" className="nes-text is-black">
                          Side Quests
                        </option>
                        <option value="extra" className="nes-text is-black">
                          Extra Quests
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              {renderCurrentView()} {/* This now handles loading state */}
            </div>
          </div>
        </div>
      </div>

      {/* Quest Dialog */}
      <QuestDialog
        isOpen={isQuestDialogOpen}
        onClose={() => {
          setIsQuestDialogOpen(false);
          setCurrentTodo(null);
        }}
        onSave={handleSaveQuest}
        todo={currentTodo}
        questChains={questChains}
      />

      {/* Quest Chain Manager Dialog */}
      <QuestChainManager
        isOpen={isChainManagerOpen}
        onClose={() => setIsChainManagerOpen(false)}
        questChains={questChains}
        onAddChain={addQuestChain}
        onEditChain={editQuestChainName}
        onDeleteChain={deleteQuestChain}
      />
    </main>
  )
}
