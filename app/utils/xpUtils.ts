export const getXpForNextLevel = (level: number): number => {
  const baseXP = 15; // XP needed for level 1 -> 2
  const power = 1.2;
  // Use Math.max to ensure level 1 still requires baseXP
  return Math.floor(baseXP * Math.pow(Math.max(1, level), power));
};

export const getTotalXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  // This calculates the XP needed to *reach* the start of this level
  // We need the sum of XP required for all previous levels
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += getXpForNextLevel(i);
  }
  return totalXp;
};

export const getLevelFromXp = (totalXp: number): number => {
  let level = 1;
  let xpNeeded = getTotalXpForLevel(level + 1);
  // Ensure xpNeeded is calculated correctly for the loop condition
  while (totalXp >= xpNeeded && xpNeeded > getTotalXpForLevel(level)) {
    level++;
    xpNeeded = getTotalXpForLevel(level + 1);
    // Simplified loop break: if xpNeeded isn't increasing, stop
    if (xpNeeded <= getTotalXpForLevel(level)) break; 
  }
  return level;
}; 