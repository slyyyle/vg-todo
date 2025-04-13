"use server"; // Mark this module as server-side only

import fs from 'fs/promises';
import path from 'path';
import type { Quest, QuestChain, Character, Idea } from './types'; // Changed Todo to Quest, added Idea type

interface AppData {
    quests: Quest[]; // Changed todos to quests
    questChains: QuestChain[];
    character: Character;
    ideas: Idea[]; // Add ideas array
}

const dataFilePath = path.join(process.cwd(), 'data.json');

// Default data structure if file doesn't exist or is invalid
const defaultData: AppData = {
    quests: [], // Changed todos to quests
    questChains: [],
    character: {
        level: 1,
        title: "Novice Adventurer",
        avatar: "hero",
        progress: 0,
        createdAt: null // Default to null
    },
    ideas: [] // Initialize ideas as empty
};

// Action to load data from the JSON file
export async function loadData(): Promise<AppData> {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        const rawData = JSON.parse(fileContent); // Parse raw first

        // Create a working copy, merging defaults early for structure safety
        const data: AppData = {
            quests: rawData.quests ?? [],
            questChains: rawData.questChains ?? [],
            // Merge character deeply to preserve existing fields if possible
            character: { ...defaultData.character, ...(rawData.character ?? {}) }, // Note: createdAt might be string here initially
            ideas: rawData.ideas ?? []
        };

        // --- IMPORTANT: Convert string dates back to Date objects ---
        if (data.quests) { // Changed todos to quests
            data.quests.forEach((quest: Quest) => { // Changed todo to quest
                // Check if dueDate exists and is a string before parsing
                if (quest.dueDate && typeof quest.dueDate === 'string') { // Changed todo to quest
                    try {
                        const parsedDate = new Date(quest.dueDate);
                        // Check if the parsed date is valid
                        if (!isNaN(parsedDate.getTime())) {
                            quest.dueDate = parsedDate;
                        } else {
                             console.warn(`Invalid date string encountered for quest ${quest.id}: ${quest.dueDate}`); // Changed todo to quest
                            quest.dueDate = null; // Set to null or handle as needed
                        }
                    } catch (e) {
                        console.error(`Error parsing dueDate for quest ${quest.id}:`, e); // Changed todo to quest
                        quest.dueDate = null; // Set to null on error
                    }
                } else if (quest.dueDate !== null && quest.dueDate !== undefined && !(quest.dueDate instanceof Date)) {
                     // Handle cases where dueDate might be something else unexpected (e.g., a number)
                     console.warn(`Unexpected type for dueDate on quest ${quest.id}: ${typeof quest.dueDate}`); // Changed todo to quest
                     quest.dueDate = null;
                }

                // Parse createdAt (NEW)
                if (quest.createdAt && typeof quest.createdAt === 'string') {
                    try {
                        const parsedDate = new Date(quest.createdAt);
                        if (!isNaN(parsedDate.getTime())) {
                            quest.createdAt = parsedDate;
                        } else {
                             console.warn(`Invalid createdAt string encountered for quest ${quest.id}: ${quest.createdAt}`);
                             // Assign a default? Or handle differently?
                             quest.createdAt = new Date(0); // Assign epoch as fallback 
                        }
                    } catch (e) {
                        console.error(`Error parsing createdAt for quest ${quest.id}:`, e);
                        quest.createdAt = new Date(0); // Assign epoch as fallback
                    }
                } else if (!quest.createdAt) {
                    // Handle quests saved before createdAt existed
                    console.warn(`Missing createdAt for quest ${quest.id}, assigning epoch.`);
                    quest.createdAt = new Date(0); // Assign epoch as fallback
                } else if (!(quest.createdAt instanceof Date)) {
                     // Handle unexpected createdAt type
                     console.warn(`Unexpected type for createdAt on quest ${quest.id}: ${typeof quest.createdAt}`);
                     quest.createdAt = new Date(0); // Assign epoch as fallback
                }

                // Parse completedAt (NEW)
                if (quest.completedAt && typeof quest.completedAt === 'string') {
                    try {
                        const parsedDate = new Date(quest.completedAt);
                        if (!isNaN(parsedDate.getTime())) {
                            quest.completedAt = parsedDate;
                        } else {
                            console.warn(`Invalid completedAt string encountered for quest ${quest.id}: ${quest.completedAt}`);
                            quest.completedAt = null; // Assign null as fallback
                        }
                    } catch (e) {
                        console.error(`Error parsing completedAt for quest ${quest.id}:`, e);
                        quest.completedAt = null; // Assign null as fallback
                    }
                } else if (quest.completedAt !== null && quest.completedAt !== undefined && !(quest.completedAt instanceof Date)) {
                     // Handle unexpected completedAt type
                     console.warn(`Unexpected type for completedAt on quest ${quest.id}: ${typeof quest.completedAt}`);
                     quest.completedAt = null;
                } else if (quest.completed === false && quest.completedAt) {
                    // Data consistency check: If quest is not completed, completedAt should be null
                    console.warn(`Quest ${quest.id} is not completed but has completedAt date. Setting completedAt to null.`);
                    quest.completedAt = null;
                }
            });
        }
        // --- End Date Conversion ---

        // --- Process QuestChain Dates ---
        if (data.questChains) {
             data.questChains.forEach((chain: QuestChain) => {
                // Parse chain.createdAt
                if (chain.createdAt && typeof chain.createdAt === 'string') {
                    try {
                        const parsedDate = new Date(chain.createdAt);
                        chain.createdAt = !isNaN(parsedDate.getTime()) ? parsedDate : new Date(); // Default to now if invalid
                    } catch (e) { chain.createdAt = new Date(); }
                } else if (!chain.createdAt || !(chain.createdAt instanceof Date)) {
                    chain.createdAt = new Date(); // Default to now if missing/wrong type
                }
                 // Parse chain.dueDate
                 if (chain.dueDate && typeof chain.dueDate === 'string') {
                    try {
                        const parsedDate = new Date(chain.dueDate);
                        chain.dueDate = !isNaN(parsedDate.getTime()) ? parsedDate : null;
                    } catch (e) { chain.dueDate = null; }
                 } else if (chain.dueDate !== null && chain.dueDate !== undefined && !(chain.dueDate instanceof Date)) {
                     chain.dueDate = null;
                 }
             });
        }
         // --- End QuestChain Date Processing ---

        // --- Process Character Creation Date (Return Null on Failure) ---
        if (data.character) {
            let parsedDate: Date | null = null; // Default to null
            const rawCreatedAt = rawData.character?.createdAt;

            if (rawCreatedAt && typeof rawCreatedAt === 'string') {
                try {
                    const tempDate = new Date(rawCreatedAt);
                    if (!isNaN(tempDate.getTime())) {
                        parsedDate = tempDate; // Use parsed date if valid
                    } else {
                        console.warn(`Invalid date string for character.createdAt: ${rawCreatedAt}. Returning null.`);
                    }
                } catch (e) {
                    console.error(`Error parsing character.createdAt string: ${rawCreatedAt}. Returning null.`, e);
                }
            } else if (rawCreatedAt) {
                 // Existed in raw data but wasn't a string
                 console.warn(`Invalid type for character.createdAt: ${typeof rawCreatedAt}. Returning null.`);
            }
            // Assign the parsed date or null
            data.character.createdAt = parsedDate;
        }
        // --- End Character Date Processing ---

        // --- Process Idea Dates --- 
        if (data.ideas) {
          data.ideas.forEach((idea: Idea) => {
            if (idea.createdAt && typeof idea.createdAt === 'string') {
              try {
                const parsedDate = new Date(idea.createdAt);
                idea.createdAt = !isNaN(parsedDate.getTime()) ? parsedDate : new Date(); // Default to now if invalid
              } catch (e) {
                console.error(`Error parsing createdAt for idea ${idea.id}:`, e);
                idea.createdAt = new Date();
              }
            } else if (!idea.createdAt || !(idea.createdAt instanceof Date)) {
              console.warn(`Missing or invalid createdAt for idea ${idea.id}. Assigning default.`);
              idea.createdAt = new Date(); // Default to now if missing/wrong type
            }
          });
        }
        // --- End Idea Date Processing ---

        return data; // Return data 

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log("Data file not found. Returning default data (with null createdAt) and creating file.");
            // Create the file with default data 
            const dataToSave = { ...defaultData }; // defaultData already has createdAt: null and ideas: []
            await saveData(dataToSave);
            // Return a deep copy of default data
            return JSON.parse(JSON.stringify(dataToSave));
        } else {
             console.error("Error reading or parsing data file:", error);
             // Return default data on other errors, ensuring createdAt is null and ideas is array
             const safeDefault = JSON.parse(JSON.stringify(defaultData));
             safeDefault.character.createdAt = null; // Ensure null in error return
             safeDefault.ideas = safeDefault.ideas ?? []; // Ensure ideas is an array
             return safeDefault;
        }
    }
}

// Action to save data to the JSON file
export async function saveData(data: AppData): Promise<void> {
    try {
        // Ensure data exists before stringifying
        const dataToSave: AppData = {
             quests: data.quests ?? [], 
             questChains: data.questChains ?? [],
             character: data.character ?? defaultData.character,
             ideas: data.ideas ?? [] // Include ideas in saved data
        };
        const dataString = JSON.stringify(dataToSave, null, 2); // Pretty print JSON
        await fs.writeFile(dataFilePath, dataString, 'utf-8');
        // console.log("Data saved successfully."); // Optional log
    } catch (error) {
        console.error("Error writing data file:", error);
        // Handle potential errors (e.g., permissions)
    }
} 