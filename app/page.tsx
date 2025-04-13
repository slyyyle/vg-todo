"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Quest, QuestChain, Character, Idea, ViewType, SortOption, FilterOption } from "./types"
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
import IdeaDialog from "@/components/IdeaDialog"; // Import the new dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog" // Import Alert Dialog components
import { cn } from '@/lib/utils'; // Ensure cn is imported if not already

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
  const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false); // State for Idea Dialog
  const [ideas, setIdeas] = useState<Idea[]>([]); // State for ideas
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null); // State for editing idea
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null); // State for deleting idea ID
  const [isIdeaDeleteConfirmOpen, setIsIdeaDeleteConfirmOpen] = useState(false); // State for delete confirm dialog

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
      setIdeas(initialData.ideas || []);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  // Save data to file using Server Action whenever data changes
  useEffect(() => {
    // Prevent saving during the initial load potentially causing race condition
    if (isLoading) return; 
    
    console.log("Data changed, attempting to save...");
    saveData({ quests: todos, questChains, character, ideas }); // Use correct key 'quests'
  }, [todos, questChains, character, ideas, isLoading]); // Added isLoading dependency

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

  // Handle Add New Idea button click
  const handleAddNewIdea = () => {
    // TODO: Clear any currentIdea state if implementing editing later
    setIsIdeaDialogOpen(true);
  };

  // Handler for saving a new idea (placeholder for now)
  const handleSaveIdea = (ideaData: { name: string, description: string }) => {
    const newIdea: Idea = {
      ...ideaData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    setIdeas([...ideas, newIdea]); // Add new idea to state
    setIsIdeaDialogOpen(false); // Close dialog
  };

  // Edit Idea function
  const editIdea = (updatedIdeaData: { name: string, description: string }) => {
    if (!editingIdea) return;
    setIdeas(ideas.map(idea => 
      idea.id === editingIdea.id 
        ? { ...idea, ...updatedIdeaData } // Update existing idea
        : idea
    ));
    setEditingIdea(null); // Reset editing state
    setIsIdeaDialogOpen(false); // Close dialog
  };

  // Handle Edit Idea button click
  const handleEditIdeaClick = (idea: Idea) => {
    setEditingIdea(idea);
    setIsIdeaDialogOpen(true);
  };

  // Handle Delete Idea button click
  const handleDeleteIdeaClick = (ideaId: string) => {
    setDeletingIdeaId(ideaId);
    setIsIdeaDeleteConfirmOpen(true);
  };

  // Confirm deletion
  const confirmDeleteIdea = () => {
    if (deletingIdeaId) {
      setIdeas(ideas.filter(idea => idea.id !== deletingIdeaId));
    }
    setDeletingIdeaId(null);
    setIsIdeaDeleteConfirmOpen(false);
  };

  // Cancel deletion
  const cancelDeleteIdea = () => {
    setDeletingIdeaId(null);
    setIsIdeaDeleteConfirmOpen(false);
  };

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
      case "ideas":
        return (
          <div className="space-y-4">
            {ideas.length === 0 ? (
              <div className="nes-container is-dark p-4 text-center">
                <p className="nes-text is-disabled">No ideas captured yet. Add one!</p>
              </div>
            ) : (
              ideas.map((idea) => (
                <div key={idea.id} className="nes-container is-dark with-title">
                  <p className="title !-mt-2.5">{idea.name}</p>
                  <div className="p-3 pt-1"> {/* Match chain manager padding */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-grow">
                        <p className="nes-text break-words mb-2 text-sm">{idea.description || "(No description)"}</p>
                        <p className="nes-text is-disabled text-xs">
                          Created: {format(new Date(idea.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button 
                          type="button" 
                          className="nes-btn is-primary is-small" 
                          onClick={() => handleEditIdeaClick(idea)}
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          className="nes-btn is-error is-small" 
                          onClick={() => handleDeleteIdeaClick(idea.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );
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

            {/* Conditionally render management panels based on view */}
            {currentView === 'list' && (
              <QuestManagement
                onAddQuest={handleAddNewQuest}
                onManageChains={handleManageChains}
                onExportData={handleExportData}
              />
            )}

            {currentView === 'ideas' && (
              <div className="nes-container is-dark with-title">
                <p className="title">Idea Management</p>
                <button 
                  type="button" 
                  className="nes-btn is-primary w-full"
                  onClick={handleAddNewIdea}
                >
                  Add New Idea
                </button>
              </div>
            )}
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

      {/* Idea Dialog */}
      <IdeaDialog
        isOpen={isIdeaDialogOpen}
        onClose={() => {
          setIsIdeaDialogOpen(false);
          setEditingIdea(null);
        }}
        onSave={editingIdea ? editIdea : handleSaveIdea}
        idea={editingIdea}
      />

      {/* Idea Delete Confirmation Dialog */}
      <AlertDialog open={isIdeaDeleteConfirmOpen} onOpenChange={(open) => !open && cancelDeleteIdea()}> 
        <AlertDialogContent className={cn("nes-dialog is-dark !rounded-none max-w-[400px] w-[90vw]")}>
          <AlertDialogHeader> 
            <AlertDialogTitle className="nes-text is-warning">Confirm Delete</AlertDialogTitle> 
            <AlertDialogDescription className="nes-text is-disabled"> 
              Are you sure you want to delete this idea? This cannot be undone. 
            </AlertDialogDescription> 
          </AlertDialogHeader> 
          <AlertDialogFooter className="flex justify-end space-x-4 mt-4"> 
            <AlertDialogCancel asChild>
              <button className="nes-btn" onClick={cancelDeleteIdea}>Cancel</button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button className="nes-btn is-error" onClick={confirmDeleteIdea}>Delete</button>
            </AlertDialogAction>
          </AlertDialogFooter> 
        </AlertDialogContent> 
      </AlertDialog>
    </main>
  )
}
