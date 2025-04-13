import type { Character } from "@/app/types"
import { withSourceInfo, useSourceInfo } from "@/components/withSourceInfo"
import { getTotalXpForLevel } from "@/app/utils/xpUtils"

// Define the list of available avatar keys
const AVAILABLE_AVATARS = [
  "mario",
  "ash",
  "pokeball",
  "bulbasaur",
  "charmander",
  "squirtle",
  "kirby",
  "octocat",
];

interface CharacterPanelProps {
  character: Character;
  // Add prop for handling avatar changes
  onAvatarChange: (newAvatar: string) => void;
}

function CharacterPanel({ character, onAvatarChange }: CharacterPanelProps) {
  // Use the source info hook to register this component
  const { ref } = useSourceInfo("CharacterPanel", "components/CharacterPanel.tsx")

  // Map avatar string to NES.css sprite class (Updated)
  const getAvatarClass = (avatarKey: string) => {
    switch (avatarKey) {
      case "mario":
        return "nes-mario";
      case "ash": // Keep mapping for the original "hero"
        return "nes-ash";
      case "pokeball":
        return "nes-pokeball";
      case "bulbasaur":
        return "nes-bulbasaur";
      case "charmander":
        return "nes-charmander";
      case "squirtle":
        return "nes-squirtle";
      case "kirby":
        return "nes-kirby";
      case "octocat":
        return "nes-octocat";
      // Add mappings for previous keys if needed, or just default
      case "hero": // Explicitly handle old key if it might still exist
        return "nes-ash";
      case "mage":
        return "nes-bulbasaur";
      case "warrior":
        return "nes-charmander";
      case "rogue":
        return "nes-squirtle";
      default:
        return "nes-ash"; // Default case
    }
  }

  // Get the appropriate progress bar class based on progress value
  const getProgressBarClass = (progress: number) => {
    if (progress === 100) return "is-pattern"
    if (progress >= 80) return "is-success"
    if (progress >= 30) return "is-warning"
    return "is-primary"
  }

  // Capitalize the first letter, but treat 'hero' as 'Ash'
  const characterName = character.avatar === 'hero' || character.avatar === 'ash'
    ? 'Ash'
    : character.avatar.charAt(0).toUpperCase() + character.avatar.slice(1);

  // Find current avatar index
  const currentIndex = AVAILABLE_AVATARS.indexOf(character.avatar === 'hero' ? 'ash' : character.avatar);

  // Renamed handler for clarity
  const handleAvatarClick = () => {
    const nextIndex = (currentIndex + 1) % AVAILABLE_AVATARS.length;
    onAvatarChange(AVAILABLE_AVATARS[nextIndex]);
  };

  // Calculate progress based on total XP
  const currentLevel = character.level;
  const totalXp = character.totalXp;
  const xpForCurrentLevelStart = getTotalXpForLevel(currentLevel);
  const xpForNextLevelStart = getTotalXpForLevel(currentLevel + 1);
  const xpNeededThisLevel = xpForNextLevelStart - xpForCurrentLevelStart;
  const xpInCurrentLevel = totalXp - xpForCurrentLevelStart;
  
  let progress = 0;
  if (xpNeededThisLevel > 0) {
    progress = Math.floor((xpInCurrentLevel / xpNeededThisLevel) * 100);
  } else if (totalXp >= xpForCurrentLevelStart) {
    // If XP needed is 0 (maybe max level?), show 100% if XP meets/exceeds current level start
    progress = 100; 
  }
  progress = Math.max(0, Math.min(100, progress)); // Clamp 0-100

  return (
    <div ref={ref} className="nes-container is-dark with-title h-96" data-testid="character-panel">
      <p className="title">Character</p>
      <div className="flex flex-col items-center py-4">
        {/* Container for image - Removed arrows */}
        <div className="flex items-center justify-center mb-4 w-full px-6">
           {/* Removed Previous Button */}
           <i 
             className={`${getAvatarClass(character.avatar)} is-large mx-4 cursor-pointer`} // Added cursor-pointer 
             data-testid="character-avatar"
             onClick={handleAvatarClick} // Added onClick handler
           ></i>
           {/* Removed Next Button */}
        </div>

        {/* Just the character name now */}
        <h2 className="nes-text is-primary text-center mb-6" data-testid="character-name">
          {characterName}
        </h2>

        {/* Container for Level/Title and Progress Bar */}
        <div className="w-full mb-2">
          {/* Combined Level and Title Line */}
          <div>
            <label data-testid="character-level" className="nes-text is-primary">
              Level {character.level}
            </label>
            <span className="nes-text is-white ml-4">Adventurer</span>
          </div>
          <progress 
             className={`nes-progress ${getProgressBarClass(progress)}`} 
             value={progress}
             max="100"
          ></progress>
          {/* XP Text Display (NEW) */}
          <p className="text-xs text-center mt-1 nes-text is-disabled" data-testid="character-xp-display">
            {/* Show XP only if needed for next level is greater than 0 */}
            {xpNeededThisLevel > 0 
              ? `XP: ${xpInCurrentLevel} / ${xpNeededThisLevel}`
              : "XP: MAX"}
          </p>
        </div>
        <p className="text-xs mt-1 text-center nes-text is-error">Complete quests to level up your character!</p>
      </div>
    </div>
  )
}

// Export the component with source information
export default withSourceInfo(CharacterPanel, "components/CharacterPanel.tsx")
