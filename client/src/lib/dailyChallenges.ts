import { getLocalStorage, setLocalStorage } from './utils';

export interface DailyChallenge {
  id: string;
  date: string;
  targetScore: number;
  targetCombo: number;
  timeLimit: number;
  specialRule: string;
  reward: number;
  completed: boolean;
}

const CHALLENGE_TEMPLATES = [
  {
    specialRule: 'TAP ONLY CIRCLES',
    targetScore: 50,
    targetCombo: 15,
    timeLimit: 60,
    reward: 100,
  },
  {
    specialRule: 'TAP ONLY SQUARES',
    targetScore: 60,
    targetCombo: 20,
    timeLimit: 90,
    reward: 150,
  },
  {
    specialRule: 'TAP ONLY TRIANGLES',
    targetScore: 45,
    targetCombo: 12,
    timeLimit: 60,
    reward: 100,
  },
  {
    specialRule: 'TAP ONLY RED',
    targetScore: 40,
    targetCombo: 10,
    timeLimit: 45,
    reward: 80,
  },
  {
    specialRule: 'TAP ONLY BLUE',
    targetScore: 55,
    targetCombo: 18,
    timeLimit: 75,
    reward: 120,
  },
  {
    specialRule: 'HIGH COMBO CHALLENGE',
    targetScore: 100,
    targetCombo: 30,
    timeLimit: 120,
    reward: 250,
  },
];

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function generateDailyChallengeForDate(dateString: string): DailyChallenge {
  const hash = dateString.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const templateIndex = hash % CHALLENGE_TEMPLATES.length;
  const template = CHALLENGE_TEMPLATES[templateIndex];
  
  return {
    id: `challenge-${dateString}`,
    date: dateString,
    ...template,
    completed: false,
  };
}

export function getTodaysChallenge(): DailyChallenge {
  const todayString = getTodayString();
  const storedChallenges = getLocalStorage('dailyChallenges') || {};
  
  if (storedChallenges[todayString]) {
    return storedChallenges[todayString];
  }
  
  const newChallenge = generateDailyChallengeForDate(todayString);
  storedChallenges[todayString] = newChallenge;
  setLocalStorage('dailyChallenges', storedChallenges);
  
  return newChallenge;
}

export function completeDailyChallenge(): void {
  const todayString = getTodayString();
  const storedChallenges = getLocalStorage('dailyChallenges') || {};
  
  if (storedChallenges[todayString]) {
    storedChallenges[todayString].completed = true;
    setLocalStorage('dailyChallenges', storedChallenges);
    
    const totalPoints = getLocalStorage('challengePoints') || 0;
    setLocalStorage('challengePoints', totalPoints + storedChallenges[todayString].reward);
  }
}

export function getChallengeProgress(): { completed: number; totalPoints: number } {
  const storedChallenges = getLocalStorage('dailyChallenges') || {};
  const completed = Object.values(storedChallenges).filter((c: any) => c.completed).length;
  const totalPoints = getLocalStorage('challengePoints') || 0;
  
  return { completed, totalPoints };
}
