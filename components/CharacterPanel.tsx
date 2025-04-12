import type { Character } from "@/app/types"
import { withSourceInfo, useSourceInfo } from "@/components/withSourceInfo"

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

  // Use progress from props or default to 0
  const progress = character.progress || 0

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
        <h2 className="nes-text is-primary text-center mb-1" data-testid="character-name">
          {characterName}
        </h2>

        <h3 className="nes-text text-center mb-4" data-testid="character-title">
          {character.title}
        </h3>
        <div className="w-full mb-2">
          <label data-testid="character-level" className="nes-text is-primary">
            Level {character.level}
          </label>
          <progress className={`nes-progress ${getProgressBarClass(progress)}`} value={progress} max="100"></progress>
        </div>
        <p className="text-xs mt-2 text-center nes-text is-error">Complete quests to level up your character!</p>
      </div>
    </div>
  )
}

// Export the component with source information
export default withSourceInfo(CharacterPanel, "components/CharacterPanel.tsx")
