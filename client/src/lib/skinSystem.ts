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
      red: '#ff1166',
      blue: '#00ffee',
      green: '#33ff88',
      yellow: '#ffee00',
    },
    background: 'radial-gradient(circle at 20% 50%, rgba(0, 255, 238, 0.15) 0%, rgba(13, 13, 13, 1) 50%), radial-gradient(circle at 80% 80%, rgba(255, 17, 102, 0.15) 0%, rgba(13, 13, 13, 1) 50%), #0d0d0d',
    unlocked: true,
    adCost: 0,
  },
  {
    id: 'sunset',
    name: 'Sunset Vibes',
    colors: {
      red: '#ff5566',
      blue: '#66ccff',
      green: '#ffdd44',
      yellow: '#ff88bb',
    },
    background: 'radial-gradient(circle at 20% 30%, rgba(255, 85, 102, 0.2) 0%, rgba(20, 15, 25, 1) 50%), radial-gradient(circle at 80% 70%, rgba(255, 221, 68, 0.2) 0%, rgba(20, 15, 25, 1) 50%), #140f19',
    unlocked: false,
    adCost: 1,
  },
  {
    id: 'ocean',
    name: 'Ocean Depths',
    colors: {
      red: '#ee77ff',
      blue: '#00ddff',
      green: '#00ffaa',
      yellow: '#fff88d',
    },
    background: 'radial-gradient(circle at 30% 40%, rgba(0, 221, 255, 0.2) 0%, rgba(10, 15, 30, 1) 50%), radial-gradient(circle at 70% 60%, rgba(238, 119, 255, 0.2) 0%, rgba(10, 15, 30, 1) 50%), #0a0f1e',
    unlocked: false,
    adCost: 1,
  },
  {
    id: 'fire',
    name: 'Fire Storm',
    colors: {
      red: '#ff3344',
      blue: '#ff8844',
      green: '#ffdd33',
      yellow: '#ffaa22',
    },
    background: 'radial-gradient(circle at 25% 25%, rgba(255, 51, 68, 0.25) 0%, rgba(25, 5, 0, 1) 50%), radial-gradient(circle at 75% 75%, rgba(255, 136, 68, 0.25) 0%, rgba(25, 5, 0, 1) 50%), #190500',
    unlocked: false,
    adCost: 2,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      red: '#ff3377',
      blue: '#00eeff',
      green: '#88ff00',
      yellow: '#ffee44',
    },
    background: 'radial-gradient(circle at 20% 40%, rgba(255, 51, 119, 0.2) 0%, rgba(1, 1, 27, 1) 50%), radial-gradient(circle at 80% 60%, rgba(0, 238, 255, 0.2) 0%, rgba(1, 1, 27, 1) 50%), #01011b',
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
  return new Promise((resolve) => {
    showRewardedAd(() => {
      const skins = getSkins();
      const skinIndex = skins.findIndex(s => s.id === skinId);
      
      if (skinIndex !== -1) {
        skins[skinIndex].unlocked = true;
        setLocalStorage('skins', skins);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
