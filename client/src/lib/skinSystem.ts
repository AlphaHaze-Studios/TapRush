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
