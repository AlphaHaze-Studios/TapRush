export interface DailyChallenge {
  id: string;
  date: string;
  challengeType: string;
  targetScore: number;
  reward: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  timestamp: number;
}

export interface Skin {
  id: string;
  name: string;
  colors: {
    red: string;
    blue: string;
    green: string;
    yellow: string;
  };
  unlocked: boolean;
  adCost: number;
}

export async function getDailyChallenge(): Promise<DailyChallenge | null> {
  console.log('[Daily Challenges] Feature not yet implemented');
  return null;
}

export async function submitScore(score: number): Promise<void> {
  console.log('[Global Leaderboard] Score submission not yet implemented:', score);
}

export async function getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  console.log('[Global Leaderboard] Fetching leaderboard not yet implemented');
  return [];
}

export async function unlockSkinWithAd(skinId: string): Promise<boolean> {
  console.log('[Skins/Themes] Unlock skin feature not yet implemented:', skinId);
  return false;
}
