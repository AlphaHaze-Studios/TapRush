import { useEffect, useRef, useState, useCallback } from 'react';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';
import { showAd, showRewardedAd } from '@/lib/adManager';
import { soundManager } from '@/lib/soundManager';
import DailyChallengeModal from './DailyChallengeModal';
import LeaderboardModal from './LeaderboardModal';
import SkinsModal from './SkinsModal';
import SettingsModal from './SettingsModal';
import PauseOverlay from './PauseOverlay';
import RuleBanner from './RuleBanner';
import { getActiveSkin, type ColorScheme, type Skin } from '@/lib/skinSystem';
import type { DailyChallenge } from '@/lib/dailyChallenges';
import { usePause } from '@/hooks/usePause';
import { type ObjectType, type ColorType, getRandomObjectType, getObjectConfig, SHAPE_TYPES, FRUIT_TYPES, EMOJI_TYPES, type ObjectCategory } from '@/lib/objectTypes';
import { type GameMode, getGameModeConfig, GAME_MODES } from '@/lib/gameModes';

interface Shape {
  id: number;
  type: ObjectType;
  color: ColorType;
  x: number;
  y: number;
  speed: number;
  size: number;
  rotation?: number;
}

interface Rule {
  property: 'color' | 'object' | 'category';
  value: ColorType | ObjectType | ObjectCategory;
  text: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface ClickEffect {
  x: number;
  y: number;
  life: number;
  scale: number;
  color: string;
}

const COLOR_TYPES: ColorType[] = ['red', 'blue', 'green', 'yellow'];

// Vibration helper
const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Responsive scaling helper
const getScaleFactor = () => {
  const minDimension = Math.min(window.innerWidth, window.innerHeight);
  return Math.max(0.5, Math.min(1.5, minDimension / 800));
};

export default function TapRush() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [frenzyMode, setFrenzyMode] = useState(false);
  const [frenzyTimer, setFrenzyTimer] = useState(0);
  const [showDailyChallengeModal, setShowDailyChallengeModal] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<DailyChallenge | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSkins, setShowSkins] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSkin, setActiveSkin] = useState<Skin>(getActiveSkin());
  const [scaleFactor, setScaleFactor] = useState(getScaleFactor());
  const [doubleScoreActive, setDoubleScoreActive] = useState(false);
  const [doubleScoreTimer, setDoubleScoreTimer] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [ruleProgress, setRuleProgress] = useState(0);
  const [wrongTapShake, setWrongTapShake] = useState(false);
  
  const { isPaused, showCountdown, countdownValue, pause, resume, unpause } = usePause();
  
  const shapesRef = useRef<Shape[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const clickEffectsRef = useRef<ClickEffect[]>([]);
  const scorePopupsRef = useRef<{id: number, x: number, y: number, points: number, life: number}[]>([]);
  const shapePoolSize = useRef(0);
  const particlePoolSize = useRef(0);
  const effectPoolSize = useRef(0);
  
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const frenzyModeRef = useRef(false);
  const frenzyTimerRef = useRef(0);
  const doubleScoreActiveRef = useRef(false);
  const doubleScoreTimerRef = useRef(0);
  const currentRuleRef = useRef<Rule | null>(null);
  
  const nextShapeId = useRef(0);
  const lastSpawnTime = useRef(0);
  const ruleChangeTimer = useRef(0);
  const animationFrameRef = useRef<number>();
  const lastFrameTime = useRef(Date.now());
  const gameStartTime = useRef(0);
  const lastStateSync = useRef(Date.now());
  const rafScheduled = useRef(false);

  useEffect(() => {
    const savedHighScore = getLocalStorage('tapRushHighScore') || 0;
    setHighScore(savedHighScore);
    
    soundManager.initialize().catch(() => {
      
    });

    const handleResize = () => {
      setScaleFactor(getScaleFactor());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    currentRuleRef.current = currentRule;
  }, [currentRule]);

  const generateRandomRule = useCallback((): Rule => {
    const rand = Math.random();
    if (rand < 0.4) {
      const color = COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)];
      return {
        property: 'color',
        value: color,
        text: `TAP ${color.toUpperCase()} ONLY`
      };
    } else if (rand < 0.7) {
      const category: ObjectCategory = ['shapes', 'fruits', 'emojis'][Math.floor(Math.random() * 3)] as ObjectCategory;
      const categoryName = category === 'shapes' ? 'SHAPES' : category === 'fruits' ? 'FRUITS' : 'EMOJIS';
      return {
        property: 'category',
        value: category,
        text: `TAP ${categoryName} ONLY`
      };
    } else {
      const objectType = getRandomObjectType();
      const config = getObjectConfig(objectType);
      const displayName = config.emoji || objectType.toUpperCase();
      return {
        property: 'object',
        value: objectType,
        text: `TAP ${displayName} ONLY`
      };
    }
  }, []);

  const getProgressiveDifficulty = useCallback(() => {
    const modeConfig = getGameModeConfig(gameMode);
    const elapsed = (Date.now() - gameStartTime.current) / 1000;
    const progress = Math.min(elapsed / 120, 1);
    
    const baseSpawnRate = 1400 * modeConfig.spawnRateMultiplier;
    const minSpawnRate = 450 * modeConfig.spawnRateMultiplier;
    const spawnRate = baseSpawnRate - (baseSpawnRate - minSpawnRate) * progress;
    
    const baseSpeed = 2 * modeConfig.speedMultiplier;
    const maxSpeed = 5 * modeConfig.speedMultiplier;
    const speedMultiplier = baseSpeed + (maxSpeed - baseSpeed) * progress;
    
    const maxShapes = Math.floor(6 + progress * 10);
    
    return { spawnRate, speedMultiplier, maxShapes };
  }, [gameMode]);

  const getRuleAwareObjectAndColor = useCallback((): { type: ObjectType; color: ColorType; isMatch: boolean } => {
    const elapsed = (Date.now() - gameStartTime.current) / 1000;
    const EARLY_MATCH_PROB = 0.45;
    const LATE_MATCH_PROB = 0.25;
    const RAMP_TIME = 30;
    const progress = Math.min(elapsed / RAMP_TIME, 1);
    const MATCH_PROBABILITY = EARLY_MATCH_PROB - (EARLY_MATCH_PROB - LATE_MATCH_PROB) * progress;
    const shouldMatch = Math.random() < MATCH_PROBABILITY;
    const rule = currentRuleRef.current;

    if (!rule) {
      return {
        type: getRandomObjectType(),
        color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
        isMatch: false,
      };
    }

    if (rule.property === 'color') {
      const matchingColor = rule.value as ColorType;
      const nonMatchingColors = COLOR_TYPES.filter(c => c !== matchingColor);
      
      if (shouldMatch) {
        return {
          type: getRandomObjectType(),
          color: matchingColor,
          isMatch: true,
        };
      } else {
        return {
          type: getRandomObjectType(),
          color: nonMatchingColors[Math.floor(Math.random() * nonMatchingColors.length)],
          isMatch: false,
        };
      }
    } else if (rule.property === 'category') {
      const category = rule.value as ObjectCategory;
      const allCategories: ObjectCategory[] = ['shapes', 'fruits', 'emojis'];
      const otherCategories = allCategories.filter(c => c !== category);
      
      if (shouldMatch) {
        return {
          type: getRandomObjectType(category),
          color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
          isMatch: true,
        };
      } else {
        const distractorCategory = otherCategories[Math.floor(Math.random() * otherCategories.length)];
        return {
          type: getRandomObjectType(distractorCategory),
          color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
          isMatch: false,
        };
      }
    } else if (rule.property === 'object') {
      const matchingType = rule.value as ObjectType;
      const config = getObjectConfig(matchingType);
      const category = config.category;
      
      const categoryTypes = category === 'shapes' ? SHAPE_TYPES :
                           category === 'fruits' ? FRUIT_TYPES :
                           EMOJI_TYPES;
      const otherTypes = (categoryTypes as readonly ObjectType[]).filter(t => t !== matchingType);
      
      if (shouldMatch) {
        return {
          type: matchingType,
          color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
          isMatch: true,
        };
      } else {
        if (otherTypes.length === 0) {
          const allCategories: ObjectCategory[] = ['shapes', 'fruits', 'emojis'];
          const otherCategories = allCategories.filter(c => c !== category);
          const distractorCategory = otherCategories[Math.floor(Math.random() * otherCategories.length)];
          return {
            type: getRandomObjectType(distractorCategory),
            color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
            isMatch: false,
          };
        }
        return {
          type: otherTypes[Math.floor(Math.random() * otherTypes.length)],
          color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
          isMatch: false,
        };
      }
    }

    return {
      type: getRandomObjectType(),
      color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
      isMatch: false,
    };
  }, []);

  const spawnShape = useCallback((canvas: HTMLCanvasElement, speedMultiplier: number = 1) => {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;
    
    const baseSize = 40 * scaleFactor;
    const { type: objectType, color: objectColor } = getRuleAwareObjectAndColor();
    
    const newShape = {
      id: nextShapeId.current++,
      type: objectType,
      color: objectColor,
      x: Math.random() * (displayWidth - baseSize * 2) + baseSize,
      y: -baseSize * 2,
      speed: (1.5 + Math.random() * 1.5) * speedMultiplier,
      size: baseSize + Math.random() * (baseSize * 0.4),
      rotation: 0,
    };
    
    if (shapePoolSize.current < shapesRef.current.length) {
      Object.assign(shapesRef.current[shapePoolSize.current], newShape);
    } else {
      shapesRef.current.push(newShape);
    }
    shapePoolSize.current++;
  }, [scaleFactor, getRuleAwareObjectAndColor]);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    const maxParticles = 200;
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      if (particlePoolSize.current >= maxParticles) break;
      
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 4;
      
      if (particlePoolSize.current < particlesRef.current.length) {
        const particle = particlesRef.current[particlePoolSize.current];
        particle.x = x;
        particle.y = y;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.life = 1;
        particle.color = color;
        particle.size = 2 + Math.random() * 3;
      } else {
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
          size: 2 + Math.random() * 3,
        });
      }
      particlePoolSize.current++;
    }
  }, []);

  const createClickEffect = useCallback((x: number, y: number, color: string) => {
    const maxEffects = 20;
    if (effectPoolSize.current >= maxEffects) return;
    
    const newEffect = {
      x,
      y,
      life: 1,
      scale: 0.5,
      color,
    };
    
    if (effectPoolSize.current < clickEffectsRef.current.length) {
      Object.assign(clickEffectsRef.current[effectPoolSize.current], newEffect);
    } else {
      clickEffectsRef.current.push(newEffect);
    }
    effectPoolSize.current++;
  }, []);

  const checkShapeMatch = useCallback((shape: Shape, rule: Rule): boolean => {
    if (rule.property === 'color') {
      const config = getObjectConfig(shape.type);
      if (config.category !== 'shapes') return false;
      return shape.color === rule.value;
    } else if (rule.property === 'object') {
      return shape.type === rule.value;
    } else if (rule.property === 'category') {
      const config = getObjectConfig(shape.type);
      return config.category === rule.value;
    }
    return false;
  }, []);

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    const config = getObjectConfig(shape.type);
    const { x, y, size, type, rotation = 0 } = shape;
    
    if (config.category === 'fruits' || config.category === 'emojis') {
      const emoji = config.emoji || '';
      ctx.font = `${size * 1.2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 10 * scaleFactor;
      ctx.shadowColor = activeSkin.colors[shape.color];
      ctx.fillStyle = '#ffffff';
      ctx.fillText(emoji, x, y);
      ctx.shadowBlur = 0;
    } else {
      const shapeColor = activeSkin.colors[shape.color];
      ctx.fillStyle = shapeColor;
      ctx.strokeStyle = shapeColor;
      ctx.lineWidth = 3 * scaleFactor;
      ctx.shadowBlur = 15 * scaleFactor;
      ctx.shadowColor = shapeColor;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      if (type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'square') {
        ctx.fillRect(-size / 2, -size / 2, size, size);
      } else if (type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
      } else if (type === 'star') {
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = size / 4;
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes - Math.PI / 2;
          const xPos = Math.cos(angle) * radius;
          const yPos = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(xPos, yPos);
          else ctx.lineTo(xPos, yPos);
        }
        ctx.closePath();
        ctx.fill();
      } else if (type === 'heart') {
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
        ctx.bezierCurveTo(-size / 2, (size * 0.3) + topCurveHeight, 0, (size * 0.6) + topCurveHeight, 0, size / 2);
        ctx.bezierCurveTo(0, (size * 0.6) + topCurveHeight, size / 2, (size * 0.3) + topCurveHeight, size / 2, topCurveHeight);
        ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
        ctx.fill();
      }
      
      ctx.restore();
      ctx.shadowBlur = 0;
    }
  };

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !currentRule || !canvasRef.current || isPaused || showCountdown) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    let shapeClicked = false;
    
    for (let i = shapePoolSize.current - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];
      const distance = Math.sqrt(
        Math.pow(clickX - shape.x, 2) + Math.pow(clickY - shape.y, 2)
      );
      
      if (distance < shape.size / 2 + 15 * scaleFactor) {
        shapeClicked = true;
        
        if (checkShapeMatch(shape, currentRule)) {
          let points = frenzyModeRef.current ? 2 : 1;
          if (doubleScoreActiveRef.current) points *= 2;
          scoreRef.current += points;
          comboRef.current++;
          
          setMaxCombo(max => Math.max(max, comboRef.current));
          
          scorePopupsRef.current.push({
            id: Date.now() + Math.random(),
            x: shape.x,
            y: shape.y,
            points: points,
            life: 1
          });
          
          const modeConfig = getGameModeConfig(gameMode);
          if (comboRef.current === modeConfig.comboForFrenzy) {
            frenzyModeRef.current = true;
            frenzyTimerRef.current = modeConfig.frenzyDuration;
          }
          
          createParticles(shape.x, shape.y, activeSkin.colors[shape.color]);
          createClickEffect(shape.x, shape.y, activeSkin.colors[shape.color]);
          
          shapePoolSize.current--;
          if (i < shapePoolSize.current) {
            const temp = shapesRef.current[i];
            shapesRef.current[i] = shapesRef.current[shapePoolSize.current];
            shapesRef.current[shapePoolSize.current] = temp;
          }
          
          const config = getObjectConfig(shape.type);
          const comboVolume = Math.min(0.3 + (comboRef.current * 0.01), 0.6);
          const pitchVar = (Math.random() - 0.5) * 0.1;
          soundManager.play(config.sound as any, comboVolume, pitchVar);
          vibrate(15);
        } else {
          const modeConfig = getGameModeConfig(gameMode);
          soundManager.play('buzz', 0.5);
          vibrate([30, 100, 30, 100, 30]);
          
          setWrongTapShake(true);
          setTimeout(() => setWrongTapShake(false), 400);
          
          if (modeConfig.penaltyEnabled) {
            setGameState('gameover');
            if (scoreRef.current > highScore) {
              setHighScore(scoreRef.current);
              setLocalStorage('tapRushHighScore', scoreRef.current);
            }
          } else {
            comboRef.current = 0;
            shapePoolSize.current--;
            if (i < shapePoolSize.current) {
              const temp = shapesRef.current[i];
              shapesRef.current[i] = shapesRef.current[shapePoolSize.current];
              shapesRef.current[shapePoolSize.current] = temp;
            }
          }
        }
        break;
      }
    }
  }, [gameState, currentRule, checkShapeMatch, frenzyMode, createParticles, createClickEffect, score, highScore, activeSkin, isPaused, showCountdown, scaleFactor]);

  const startGame = useCallback(() => {
    soundManager.resume();
    soundManager.unmute();
    unpause();
    
    const modeConfig = getGameModeConfig(gameMode);
    const isEndlessFrenzy = gameMode === 'frenzy';
    
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setFrenzyMode(isEndlessFrenzy);
    setFrenzyTimer(isEndlessFrenzy ? 999 : 0);
    
    scoreRef.current = 0;
    comboRef.current = 0;
    frenzyModeRef.current = isEndlessFrenzy;
    frenzyTimerRef.current = isEndlessFrenzy ? modeConfig.frenzyDuration : 0;
    doubleScoreActiveRef.current = doubleScoreActive;
    doubleScoreTimerRef.current = doubleScoreTimer;
    
    shapesRef.current = [];
    particlesRef.current = [];
    clickEffectsRef.current = [];
    shapePoolSize.current = 0;
    particlePoolSize.current = 0;
    effectPoolSize.current = 0;
    
    nextShapeId.current = 0;
    lastSpawnTime.current = Date.now();
    ruleChangeTimer.current = Date.now();
    gameStartTime.current = Date.now();
    lastStateSync.current = Date.now();
    setCurrentRule(generateRandomRule());
  }, [generateRandomRule, unpause, doubleScoreActive, doubleScoreTimer, gameMode]);

  const restartGame = useCallback(async () => {
    await showAd();
    startGame();
  }, [startGame]);
  
  const handlePauseResume = useCallback(() => {
    resume();
  }, [resume]);
  
  const handlePauseRestart = useCallback(async () => {
    unpause();
    await showAd();
    startGame();
  }, [unpause, startGame]);
  
  const handlePauseExit = useCallback(() => {
    unpause();
    setGameState('menu');
    shapesRef.current = [];
    particlesRef.current = [];
    clickEffectsRef.current = [];
  }, [unpause]);
  
  useEffect(() => {
    if (isPaused) {
      soundManager.mute();
    } else {
      soundManager.unmute();
    }
  }, [isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gameLoop = () => {
      rafScheduled.current = false;
      const now = Date.now();
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.width / dpr;
      const displayHeight = canvas.height / dpr;

      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      if (gameState === 'playing' && !isPaused && !showCountdown) {
        const { spawnRate, speedMultiplier, maxShapes } = getProgressiveDifficulty();
        
        if (now - lastSpawnTime.current > (frenzyMode ? spawnRate * 0.6 : spawnRate) && 
            shapePoolSize.current < maxShapes) {
          const adjustedSpeed = frenzyMode ? speedMultiplier * 1.3 : speedMultiplier;
          spawnShape(canvas, adjustedSpeed);
          lastSpawnTime.current = now;
        }

        const modeConfig = getGameModeConfig(gameMode);
        const elapsed = now - ruleChangeTimer.current;
        const progress = Math.min(elapsed / modeConfig.ruleChangeInterval, 1);
        setRuleProgress(progress);
        
        if (elapsed > modeConfig.ruleChangeInterval) {
          setCurrentRule(generateRandomRule());
          ruleChangeTimer.current = now;
        }

        if (frenzyModeRef.current) {
          frenzyTimerRef.current -= deltaTime;
          if (frenzyTimerRef.current <= 0) {
            frenzyModeRef.current = false;
            frenzyTimerRef.current = 0;
            comboRef.current = 0;
          }
        }

        if (doubleScoreActiveRef.current) {
          doubleScoreTimerRef.current -= deltaTime;
          if (doubleScoreTimerRef.current <= 0) {
            doubleScoreActiveRef.current = false;
            doubleScoreTimerRef.current = 0;
          }
        }
        
        for (let i = scorePopupsRef.current.length - 1; i >= 0; i--) {
          scorePopupsRef.current[i].life -= deltaTime * 1.5;
          if (scorePopupsRef.current[i].life <= 0) {
            scorePopupsRef.current.splice(i, 1);
          }
        }
        
        if (now - lastStateSync.current > 50) {
          setScore(scoreRef.current);
          setCombo(comboRef.current);
          setFrenzyMode(frenzyModeRef.current);
          setFrenzyTimer(frenzyTimerRef.current);
          setDoubleScoreActive(doubleScoreActiveRef.current);
          setDoubleScoreTimer(doubleScoreTimerRef.current);
          lastStateSync.current = now;
        }

        for (let i = 0; i < shapePoolSize.current; i++) {
          const shape = shapesRef.current[i];
          shape.y += shape.speed;
          
          if (shape.y > displayHeight + 100) {
            shapePoolSize.current--;
            if (i < shapePoolSize.current) {
              const temp = shapesRef.current[i];
              shapesRef.current[i] = shapesRef.current[shapePoolSize.current];
              shapesRef.current[shapePoolSize.current] = temp;
              i--;
            }
          } else {
            drawShape(ctx, shape);
          }
        }

        for (let i = 0; i < particlePoolSize.current; i++) {
          const particle = particlesRef.current[i];
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= deltaTime * 1.5;
          
          if (particle.life <= 0) {
            particlePoolSize.current--;
            if (i < particlePoolSize.current) {
              const temp = particlesRef.current[i];
              particlesRef.current[i] = particlesRef.current[particlePoolSize.current];
              particlesRef.current[particlePoolSize.current] = temp;
              i--;
            }
          } else {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = Math.pow(particle.life, 0.7);
            ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
            ctx.globalAlpha = 1;
          }
        }

        for (let i = 0; i < effectPoolSize.current; i++) {
          const effect = clickEffectsRef.current[i];
          effect.life -= deltaTime * 1.5;
          effect.scale += deltaTime * 1.8;
          
          if (effect.life <= 0) {
            effectPoolSize.current--;
            if (i < effectPoolSize.current) {
              const temp = clickEffectsRef.current[i];
              clickEffectsRef.current[i] = clickEffectsRef.current[effectPoolSize.current];
              clickEffectsRef.current[effectPoolSize.current] = temp;
              i--;
            }
          } else {
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3 * scaleFactor;
            ctx.globalAlpha = Math.pow(effect.life, 0.8);
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 20 * effect.scale * scaleFactor, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      } else if (gameState === 'playing') {
        for (let i = 0; i < shapePoolSize.current; i++) {
          drawShape(ctx, shapesRef.current[i]);
        }
        
        for (let i = 0; i < particlePoolSize.current; i++) {
          const particle = particlesRef.current[i];
          particle.life -= deltaTime * 1.5;
          
          if (particle.life <= 0) {
            particlePoolSize.current--;
            if (i < particlePoolSize.current) {
              const temp = particlesRef.current[i];
              particlesRef.current[i] = particlesRef.current[particlePoolSize.current];
              particlesRef.current[particlePoolSize.current] = temp;
              i--;
            }
          } else {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = Math.pow(particle.life, 0.7);
            ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
            ctx.globalAlpha = 1;
          }
        }
        
        for (let i = 0; i < effectPoolSize.current; i++) {
          const effect = clickEffectsRef.current[i];
          effect.life -= deltaTime * 1.5;
          
          if (effect.life <= 0) {
            effectPoolSize.current--;
            if (i < effectPoolSize.current) {
              const temp = clickEffectsRef.current[i];
              clickEffectsRef.current[i] = clickEffectsRef.current[effectPoolSize.current];
              clickEffectsRef.current[effectPoolSize.current] = temp;
              i--;
            }
          } else {
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3 * scaleFactor;
            ctx.globalAlpha = Math.pow(effect.life, 0.8);
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 20 * effect.scale * scaleFactor, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      if (!rafScheduled.current) {
        rafScheduled.current = true;
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, spawnShape, generateRandomRule, frenzyMode, isPaused, showCountdown, activeSkin, scaleFactor, getProgressiveDifficulty]);

  const responsiveStyle = {
    fontSize: `clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
    padding: `clamp(0.4rem, ${scaleFactor * 0.6}rem, 0.8rem) clamp(1rem, ${scaleFactor * 1.5}rem, 3rem)`,
  };

  const titleStyle = {
    fontSize: `clamp(2rem, ${scaleFactor * 4}rem, 5rem)`,
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      background: activeSkin.background,
      transition: 'background 0.5s ease-in-out',
    }}>
      <div style={{
        animation: wrongTapShake ? 'shake 0.4s ease-in-out' : 'none',
        position: 'relative',
      }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            cursor: gameState === 'playing' ? 'pointer' : 'default',
            touchAction: 'none',
          }}
        />
        {wrongTapShake && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            pointerEvents: 'none',
            animation: 'fadeOut 0.4s ease-out',
          }} />
        )}
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      
      {gameState === 'menu' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#fff',
          fontFamily: "'Orbitron', sans-serif",
          width: '92%',
          maxWidth: '500px',
          padding: '1.5rem',
        }}>
          <h1 style={{
            ...titleStyle,
            marginBottom: '1.5rem',
            textShadow: '0 0 30px #00fff7, 0 0 60px rgba(0, 255, 247, 0.4)',
            color: '#00fff7',
            letterSpacing: '0.1em',
            fontWeight: '900',
          }}>TAP RUSH</h1>
          <div style={{
            display: 'flex',
            gap: `clamp(0.5rem, ${scaleFactor * 0.8}rem, 1rem)`,
            width: '100%',
            marginBottom: `clamp(0.6rem, ${scaleFactor * 0.8}rem, 1rem)`,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <button
              onClick={startGame}
              style={{
                fontSize: `clamp(1.1rem, ${scaleFactor * 1.6}rem, 2rem)`,
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(135deg, #ff004d 0%, #d90042 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 0, 77, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                flex: '1',
                padding: `clamp(0.7rem, ${scaleFactor * 1}rem, 1.2rem) clamp(1.5rem, ${scaleFactor * 2}rem, 3rem)`,
                fontWeight: 'bold',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 0, 77, 0.6), inset 0 -2px 8px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 0, 77, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)';
              }}
            >
              START
            </button>
            <button
              onClick={() => setShowModeSelect(!showModeSelect)}
              style={{
                fontSize: `clamp(1rem, ${scaleFactor * 1.3}rem, 1.6rem)`,
                fontFamily: "'Orbitron', sans-serif",
                background: `linear-gradient(135deg, ${GAME_MODES[gameMode].color} 0%, ${GAME_MODES[gameMode].color}dd 100%)`,
                color: gameMode === 'zen' || gameMode === 'classic' ? '#000' : '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: `0 4px 15px rgba(0, 255, 247, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.2)`,
                transition: 'all 0.3s ease',
                minWidth: `clamp(80px, ${scaleFactor * 110}px, 130px)`,
                padding: `clamp(0.7rem, ${scaleFactor * 1}rem, 1.2rem) clamp(1rem, ${scaleFactor * 1.2}rem, 1.5rem)`,
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 25px ${GAME_MODES[gameMode].color}66, inset 0 -2px 8px rgba(0, 0, 0, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 15px ${GAME_MODES[gameMode].color}44, inset 0 -2px 8px rgba(0, 0, 0, 0.2)`;
              }}
            >
              {GAME_MODES[gameMode].icon}
            </button>
          </div>
          
          {showModeSelect && (
            <div style={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid #00fff7',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
            }}>
              <div style={{
                color: '#00fff7',
                fontSize: `clamp(0.9rem, ${scaleFactor * 1.1}rem, 1.3rem)`,
                marginBottom: '0.8rem',
                textAlign: 'center',
                fontWeight: 'bold',
              }}>
                SELECT MODE
              </div>
              {(Object.keys(GAME_MODES) as GameMode[]).map((mode) => {
                const config = GAME_MODES[mode];
                const isSelected = gameMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      setGameMode(mode);
                      setShowModeSelect(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      marginBottom: '0.5rem',
                      fontSize: `clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
                      fontFamily: "'Orbitron', sans-serif",
                      backgroundColor: isSelected ? config.color : 'rgba(0, 0, 0, 0.5)',
                      color: isSelected && mode === 'zen' ? '#0d0d0d' : '#fff',
                      border: `2px solid ${config.color}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = config.color}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = isSelected ? config.color : 'rgba(0, 0, 0, 0.5)'}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>
                      {config.icon} {config.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {config.description}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={() => setShowDailyChallengeModal(true)}
            style={{
              fontSize: `clamp(0.95rem, ${scaleFactor * 1.2}rem, 1.4rem)`,
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, #00fff7 0%, #00d4cc 100%)',
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 255, 247, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.1)',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              marginTop: `clamp(0.6rem, ${scaleFactor * 0.8}rem, 1rem)`,
              width: '100%',
              padding: `clamp(0.65rem, ${scaleFactor * 0.9}rem, 1.1rem) clamp(1rem, ${scaleFactor * 1.5}rem, 2rem)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 255, 247, 0.6), inset 0 -2px 8px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 247, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            🏆 DAILY CHALLENGE
          </button>
          <button
            onClick={() => {
              showRewardedAd(() => {
                setDoubleScoreActive(true);
                setDoubleScoreTimer(30);
                soundManager.play('whoosh', 0.4);
              });
            }}
            style={{
              fontSize: `clamp(0.85rem, ${scaleFactor * 1.05}rem, 1.25rem)`,
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, #ff9500 0%, #ff7700 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 149, 0, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              marginTop: `clamp(0.6rem, ${scaleFactor * 0.8}rem, 1rem)`,
              width: '100%',
              padding: `clamp(0.6rem, ${scaleFactor * 0.85}rem, 1rem) clamp(1rem, ${scaleFactor * 1.5}rem, 2rem)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 149, 0, 0.6), inset 0 -2px 8px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 149, 0, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)';
            }}
          >
            🎬 2X SCORE POWER-UP
          </button>
          
          <div style={{ 
            display: 'flex', 
            gap: `clamp(0.6rem, ${scaleFactor * 0.8}rem, 1rem)`, 
            marginTop: `clamp(0.6rem, ${scaleFactor * 0.8}rem, 1rem)`, 
            justifyContent: 'center', 
            flexWrap: 'wrap' 
          }}>
            <button
              onClick={() => setShowLeaderboard(true)}
              style={{
                fontSize: `clamp(0.85rem, ${scaleFactor * 1.05}rem, 1.25rem)`,
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(135deg, #f5f500 0%, #d4d400 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245, 245, 0, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.1)',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                flex: '1 1 45%',
                minWidth: `clamp(130px, ${scaleFactor * 150}px, 180px)`,
                padding: `clamp(0.6rem, ${scaleFactor * 0.85}rem, 1rem) clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(245, 245, 0, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 245, 0, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              📊 LEADERBOARD
            </button>
            <button
              onClick={() => setShowSkins(true)}
              style={{
                fontSize: `clamp(0.85rem, ${scaleFactor * 1.05}rem, 1.25rem)`,
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(135deg, #00ff85 0%, #00d46b 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 255, 133, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.1)',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                flex: '1 1 45%',
                minWidth: `clamp(130px, ${scaleFactor * 150}px, 180px)`,
                padding: `clamp(0.6rem, ${scaleFactor * 0.85}rem, 1rem) clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 255, 133, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 133, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              🎨 SKINS
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                fontSize: `clamp(0.85rem, ${scaleFactor * 1.05}rem, 1.25rem)`,
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(135deg, #00fff7 0%, #00d4cc 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 255, 247, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.1)',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                flex: '1 1 45%',
                minWidth: `clamp(130px, ${scaleFactor * 150}px, 180px)`,
                padding: `clamp(0.6rem, ${scaleFactor * 0.85}rem, 1rem) clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 255, 247, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 247, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              ⚙️ SETTINGS
            </button>
          </div>
          <p style={{ 
            marginTop: `clamp(1.2rem, ${scaleFactor * 1.5}rem, 2rem)`, 
            fontSize: `clamp(1rem, ${scaleFactor * 1.3}rem, 1.6rem)`,
            color: '#00ff85',
            fontWeight: 'bold',
            textShadow: '0 0 15px rgba(0, 255, 133, 0.5)',
          }}>
            High Score: {highScore}
          </p>
        </div>
      )}
      
      <DailyChallengeModal 
        isOpen={showDailyChallengeModal}
        onClose={() => setShowDailyChallengeModal(false)}
        onStart={(challenge) => {
          setActiveChallenge(challenge);
          setShowDailyChallengeModal(false);
          startGame();
        }}
      />
      
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentScore={gameState === 'gameover' ? score : undefined}
        currentCombo={gameState === 'gameover' ? maxCombo : undefined}
      />
      
      <SkinsModal
        isOpen={showSkins}
        onClose={() => setShowSkins(false)}
        onSkinChange={(skin) => setActiveSkin(skin)}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          if (gameState === 'playing' && isPaused) {
            resume();
          }
        }}
      />
      
      {gameState === 'playing' && currentRule && (
        <>
          <div style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 20,
            pointerEvents: 'none',
          }}>
            <div style={{
              color: '#fff',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: `clamp(1rem, ${scaleFactor * 1.4}rem, 1.8rem)`,
              fontWeight: 'bold',
              textShadow: `0 0 15px ${frenzyMode ? '#ff004d' : '#00fff7'}`,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: `${scaleFactor * 0.5}rem ${scaleFactor * 1}rem`,
              borderRadius: '8px',
              border: `2px solid ${frenzyMode ? '#ff004d' : '#00fff7'}`,
              marginBottom: '0.5rem',
            }}>
              {currentRule.text}
            </div>
            <div style={{
              width: '200px',
              height: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}>
              <div style={{
                width: `${ruleProgress * 100}%`,
                height: '100%',
                backgroundColor: '#00fff7',
                transition: 'width 0.1s linear',
                boxShadow: '0 0 10px #00fff7',
              }} />
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            color: '#fff',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: `clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
          }}>
            <div style={{ textShadow: '0 0 10px #00fff7', marginBottom: '0.3rem' }}>
              SCORE: {score} {doubleScoreActive && '🔥'}
            </div>
            <div style={{ textShadow: '0 0 10px #f5f500' }}>
              COMBO: {combo}
            </div>
            {doubleScoreActive && (
              <div style={{ 
                textShadow: '0 0 15px #ff9500', 
                color: '#ff9500',
                fontSize: `clamp(0.7rem, ${scaleFactor * 0.9}rem, 1rem)`,
                marginTop: '0.3rem',
                fontWeight: 'bold',
              }}>
                2X SCORE! {doubleScoreTimer.toFixed(1)}s
              </div>
            )}
          </div>
          
          {scorePopupsRef.current.map(popup => (
            <div key={popup.id} style={{
              position: 'absolute',
              left: popup.x,
              top: popup.y - (1 - popup.life) * 50,
              transform: 'translate(-50%, -50%)',
              color: '#f5f500',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: `clamp(1.2rem, ${scaleFactor * 1.8}rem, 2.4rem)`,
              fontWeight: 'bold',
              textShadow: '0 0 20px #f5f500',
              opacity: popup.life,
              pointerEvents: 'none',
              zIndex: 100,
            }}>
              +{popup.points}
            </div>
          ))}
          
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 10,
          }}>
            <button
              onClick={() => {
                pause();
                setShowSettings(true);
              }}
              style={{
                padding: `${scaleFactor * 0.7}rem ${scaleFactor * 1}rem`,
                fontSize: `clamp(1rem, ${scaleFactor * 1.5}rem, 1.8rem)`,
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: 'rgba(0, 255, 247, 0.95)',
                color: '#0d0d0d',
                border: '3px solid #00fff7',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(0, 255, 247, 0.8)',
                transition: 'all 0.2s',
                minWidth: `${scaleFactor * 50}px`,
                minHeight: `${scaleFactor * 50}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ⚙️
            </button>
            <button
              onClick={pause}
              style={{
                padding: `${scaleFactor * 0.8}rem ${scaleFactor * 1.2}rem`,
                fontSize: `clamp(1.2rem, ${scaleFactor * 1.8}rem, 2.2rem)`,
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: 'rgba(255, 215, 0, 0.95)',
                color: '#0d0d0d',
                border: '3px solid #ffd700',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                transition: 'all 0.2s',
                minWidth: `${scaleFactor * 50}px`,
                minHeight: `${scaleFactor * 50}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ⏸
            </button>
          </div>
          
          <RuleBanner
            text={currentRule.text}
            frenzyMode={frenzyMode}
            scaleFactor={scaleFactor}
          />
          
          {frenzyMode && (
            <div style={{
              position: 'absolute',
              top: 'calc(50% + 4rem)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: `clamp(0.9rem, ${scaleFactor * 1.2}rem, 1.6rem)`,
              color: '#ff004d',
              textShadow: '0 0 15px #ff004d',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 'bold',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: `${scaleFactor * 0.5}rem ${scaleFactor * 1}rem`,
              borderRadius: '8px',
              pointerEvents: 'none',
            }}>
              FRENZY! {frenzyTimer.toFixed(1)}s
            </div>
          )}
        </>
      )}
      
      {isPaused && gameState === 'playing' && (
        <PauseOverlay
          onResume={handlePauseResume}
          onRestart={handlePauseRestart}
          onExit={handlePauseExit}
        />
      )}
      
      {showCountdown && gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: `clamp(4rem, ${scaleFactor * 8}rem, 10rem)`,
          fontFamily: "'Orbitron', sans-serif",
          color: '#00fff7',
          textShadow: '0 0 40px #00fff7',
          fontWeight: 'bold',
          zIndex: 100,
        }}>
          {countdownValue > 0 ? countdownValue : 'GO!'}
        </div>
      )}
      
      {gameState === 'gameover' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#fff',
          fontFamily: "'Orbitron', sans-serif",
          width: '90%',
          maxWidth: '500px',
        }}>
          <h1 style={{
            fontSize: `clamp(2rem, ${scaleFactor * 3}rem, 4rem)`,
            marginBottom: '1.5rem',
            textShadow: '0 0 20px #ff004d',
            color: '#ff004d',
          }}>GAME OVER</h1>
          <p style={{ fontSize: `clamp(1rem, ${scaleFactor * 1.5}rem, 2rem)`, marginBottom: '0.5rem' }}>Score: {score}</p>
          <p style={{ fontSize: `clamp(0.9rem, ${scaleFactor * 1.2}rem, 1.5rem)`, marginBottom: '1rem', color: '#f5f500' }}>
            Max Combo: {maxCombo}
          </p>
          <p style={{ fontSize: `clamp(0.9rem, ${scaleFactor * 1.2}rem, 1.5rem)`, marginBottom: '1.5rem', color: '#00ff85' }}>
            High Score: {highScore}
          </p>
          
          <button
            onClick={() => {
              showRewardedAd(() => {
                setGameState('playing');
                comboRef.current = Math.floor(comboRef.current / 2);
                setCombo(comboRef.current);
                soundManager.resume();
                soundManager.play('whoosh', 0.3);
              });
            }}
            style={{
              ...responsiveStyle,
              fontSize: `clamp(0.9rem, ${scaleFactor * 1.2}rem, 1.6rem)`,
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#ff9500',
              color: '#fff',
              border: '3px solid #ffb84d',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px #ff9500',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              width: '100%',
              maxWidth: '300px',
              marginBottom: '0.8rem',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🎬 CONTINUE WITH AD
          </button>
          
          <button
            onClick={restartGame}
            style={{
              ...responsiveStyle,
              fontSize: `clamp(1rem, ${scaleFactor * 1.5}rem, 1.8rem)`,
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#00fff7',
              color: '#0d0d0d',
              border: '3px solid #00fff7',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px #00fff7',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              width: '100%',
              maxWidth: '300px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            RESTART
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            style={{
              ...responsiveStyle,
              fontSize: `clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#f5f500',
              color: '#0d0d0d',
              border: '2px solid #f5f500',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              marginTop: '1rem',
              width: '100%',
              maxWidth: '300px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            VIEW LEADERBOARD
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              ...responsiveStyle,
              fontSize: `clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#00fff7',
              color: '#0d0d0d',
              border: '2px solid #00fff7',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              marginTop: '0.5rem',
              width: '100%',
              maxWidth: '300px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ⚙️ SETTINGS
          </button>
          
          <p style={{
            fontSize: `clamp(0.7rem, ${scaleFactor * 0.9}rem, 1.1rem)`,
            marginTop: '1.5rem',
            color: '#888',
          }}>
            💡 Tip: Watch ads to unlock skins and power-ups!
          </p>
        </div>
      )}
    </div>
  );
}
