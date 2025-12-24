/**
 * Trophy ranking system
 * Returns a rank name based on trophy count (one rank per 100 trophies)
 */
export function getTrophyRank(trophies: number): string {
  if (trophies < 100) return 'Bronze';
  if (trophies < 200) return 'Silver';
  if (trophies < 300) return 'Gold';
  if (trophies < 400) return 'Platinum';
  if (trophies < 500) return 'Diamond';
  if (trophies < 600) return 'Master';
  if (trophies < 700) return 'Grandmaster';
  if (trophies < 800) return 'Champion';
  if (trophies < 900) return 'Legend';
  if (trophies < 1000) return 'Elite';
  return 'Supreme';
}

/**
 * Get rank color based on trophy count
 */
export function getRankColor(trophies: number): string {
  if (trophies < 100) return 'text-orange-400'; // Bronze
  if (trophies < 200) return 'text-gray-300'; // Silver
  if (trophies < 300) return 'text-yellow-400'; // Gold
  if (trophies < 400) return 'text-cyan-400'; // Platinum
  if (trophies < 500) return 'text-blue-400'; // Diamond
  if (trophies < 600) return 'text-purple-400'; // Master
  if (trophies < 700) return 'text-pink-400'; // Grandmaster
  if (trophies < 800) return 'text-red-400'; // Champion
  if (trophies < 900) return 'text-indigo-400'; // Legend
  if (trophies < 1000) return 'text-yellow-300'; // Elite
  return 'text-yellow-200'; // Supreme
}

/**
 * Get rank background gradient based on trophy count
 */
export function getRankGradient(trophies: number): string {
  if (trophies < 100) return 'bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-2 border-orange-600/50'; // Bronze
  if (trophies < 200) return 'bg-gradient-to-br from-gray-700/40 to-gray-600/20 border-2 border-gray-500/50'; // Silver
  if (trophies < 300) return 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-600/50'; // Gold
  if (trophies < 400) return 'bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border-2 border-cyan-600/50'; // Platinum
  if (trophies < 500) return 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-2 border-blue-600/50'; // Diamond
  if (trophies < 600) return 'bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-2 border-purple-600/50'; // Master
  if (trophies < 700) return 'bg-gradient-to-br from-pink-900/40 to-pink-800/20 border-2 border-pink-600/50'; // Grandmaster
  if (trophies < 800) return 'bg-gradient-to-br from-red-900/40 to-red-800/20 border-2 border-red-600/50'; // Champion
  if (trophies < 900) return 'bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 border-2 border-indigo-600/50'; // Legend
  if (trophies < 1000) return 'bg-gradient-to-br from-yellow-800/50 to-yellow-700/30 border-2 border-yellow-500/60'; // Elite
  return 'bg-gradient-to-br from-yellow-700/60 to-yellow-600/40 border-2 border-yellow-400/70'; // Supreme
}

