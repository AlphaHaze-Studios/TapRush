import { getLocalStorage, setLocalStorage } from './utils';
import { showRewardedAd } from './adManager';

export interface ColorScheme {
  red: string;
  blue: string;
  green: string;
  yellow: string;
}

export interface Skin {
  id: string;
  name: string;
  colors: ColorScheme;
  background: string;
  unlocked: boolean;
  adCost: number;
}

export const DEFAULT_SKINS: Skin[] = [
  {
    id: 'default',
    name: 'Neon Classic',
    colors: {
      red: '#ff004d',
      blue: '#00fff7',
      green: '#00ff85',
      yellow: '#f5f500',
    },
    background: 'radial-gradient(circle at 20% 50%, rgba(0, 255, 247, 0.15) 0%, rgba(13, 13, 13, 1) 50%), radial-gradient(circle at 80% 80%, rgba(255, 0, 77, 0.15) 0%, rgba(13, 13, 13, 1) 50%), #0d0d0d',
    unlocked: true,
    adCost: 0,
  },
  {
    id: 'sunset',
    name: 'Sunset Vibes',
    colors: {
      red: '#ff6b6b',
      blue: '#4ecdc4',
      green: '#ffd93d',
      yellow: '#ff9a9e',
    },
    background: 'radial-gradient(circle at 20% 30%, rgba(255, 107, 107, 0.2) 0%, rgba(20, 15, 25, 1) 50%), radial-gradient(circle at 80% 70%, rgba(255, 211, 61, 0.2) 0%, rgba(20, 15, 25, 1) 50%), #140f19',
    unlocked: false,
    adCost: 1,
  },
  {
    id: 'ocean',
    name: 'Ocean Depths',
    colors: {
      red: '#667eea',
      blue: '#00d4ff',
      green: '#06ffa5',
      yellow: '#fffb7d',
    },
    background: 'radial-gradient(circle at 30% 40%, rgba(0, 212, 255, 0.2) 0%, rgba(10, 15, 30, 1) 50%), radial-gradient(circle at 70% 60%, rgba(102, 126, 234, 0.2) 0%, rgba(10, 15, 30, 1) 50%), #0a0f1e',
    unlocked: false,
    adCost: 1,
  },
  {
    id: 'fire',
    name: 'Fire Storm',
    colors: {
      red: '#ff0000',
      blue: '#ff6600',
      green: '#ffcc00',
      yellow: '#ff9900',
    },
    background: 'radial-gradient(circle at 25% 25%, rgba(255, 0, 0, 0.25) 0%, rgba(25, 5, 0, 1) 50%), radial-gradient(circle at 75% 75%, rgba(255, 102, 0, 0.25) 0%, rgba(25, 5, 0, 1) 50%), #190500',
    unlocked: false,
    adCost: 2,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      red: '#ff2a6d',
      blue: '#05d9e8',
      green: '#01012b',
      yellow: '#d1f7ff',
    },
    background: 'radial-gradient(circle at 20% 40%, rgba(255, 42, 109, 0.2) 0%, rgba(1, 1, 27, 1) 50%), radial-gradient(circle at 80% 60%, rgba(5, 217, 232, 0.2) 0%, rgba(1, 1, 27, 1) 50%), #01011b',
    unlocked: false,
    adCost: 2,
  },
];

export function getSkins(): Skin[] {
  const stored = getLocalStorage('skins');
  if (!stored) {
    setLocalStorage('skins', DEFAULT_SKINS);
    return DEFAULT_SKINS;
  }
  return stored;
}

export function getActiveSkin(): Skin {
  const activeSkinId = getLocalStorage('activeSkin') || 'default';
  const skins = getSkins();
  return skins.find(s => s.id === activeSkinId) || skins[0];
}

export function setActiveSkin(skinId: string): void {
  setLocalStorage('activeSkin', skinId);
}

export async function unlockSkinWithAd(skinId: string): Promise<boolean> {
  console.log(`[Skin System] Unlocking skin: ${skinId}`);
  
  return new Promise((resolve) => {
    showRewardedAd(() => {
      const skins = getSkins();
      const skinIndex = skins.findIndex(s => s.id === skinId);
      
      if (skinIndex !== -1) {
        skins[skinIndex].unlocked = true;
        setLocalStorage('skins', skins);
        console.log(`[Skin System] Skin ${skinId} unlocked!`);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
