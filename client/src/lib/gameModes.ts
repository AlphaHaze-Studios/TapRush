export type GameMode = 'classic' | 'blitz' | 'zen' | 'frenzy';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  color: string;
  icon: string;
  spawnRateMultiplier: number;
  speedMultiplier: number;
  penaltyEnabled: boolean;
  ruleChangeInterval: number;
  comboForFrenzy: number;
  frenzyDuration: number;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  classic: {
    id: 'classic',
    name: 'CLASSIC',
    description: 'Standard mode with progressive difficulty',
    color: '#00fff7',
    icon: '🎯',
    spawnRateMultiplier: 1,
    speedMultiplier: 1,
    penaltyEnabled: true,
    ruleChangeInterval: 10000,
    comboForFrenzy: 20,
    frenzyDuration: 5,
  },
  blitz: {
    id: 'blitz',
    name: 'BLITZ',
    description: 'Fast-paced action! Double speed, quick rules',
    color: '#ff004d',
    icon: '⚡',
    spawnRateMultiplier: 0.5,
    speedMultiplier: 1.8,
    penaltyEnabled: true,
    ruleChangeInterval: 6000,
    comboForFrenzy: 15,
    frenzyDuration: 4,
  },
  zen: {
    id: 'zen',
    name: 'ZEN',
    description: 'Relaxing mode with no penalties',
    color: '#00ff85',
    icon: '🧘',
    spawnRateMultiplier: 1.5,
    speedMultiplier: 0.7,
    penaltyEnabled: false,
    ruleChangeInterval: 15000,
    comboForFrenzy: 30,
    frenzyDuration: 6,
  },
  frenzy: {
    id: 'frenzy',
    name: 'ENDLESS FRENZY',
    description: 'Always in frenzy mode! Maximum chaos',
    color: '#ff9500',
    icon: '🔥',
    spawnRateMultiplier: 0.4,
    speedMultiplier: 1.5,
    penaltyEnabled: true,
    ruleChangeInterval: 8000,
    comboForFrenzy: 999,
    frenzyDuration: 999,
  },
};

export function getGameModeConfig(mode: GameMode): GameModeConfig {
  return GAME_MODES[mode];
}
