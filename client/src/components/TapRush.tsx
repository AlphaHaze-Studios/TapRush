import { useEffect, useRef, useState, useCallback } from 'react';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';
import { showAd } from '@/lib/adManager';
import { soundManager } from '@/lib/soundManager';
import DailyChallengeModal from './DailyChallengeModal';
import LeaderboardModal from './LeaderboardModal';
import SkinsModal from './SkinsModal';
import PauseOverlay from './PauseOverlay';
import { getActiveSkin, type ColorScheme, type Skin } from '@/lib/skinSystem';
import type { DailyChallenge } from '@/lib/dailyChallenges';
import { usePause } from '@/hooks/usePause';

type ShapeType = 'circle' | 'square' | 'triangle';
type ColorType = 'red' | 'blue' | 'green' | 'yellow';

interface Shape {
  id: number;
  type: ShapeType;
  color: ColorType;
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface Rule {
  property: 'color' | 'shape';
  value: ColorType | ShapeType;
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

const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle'];
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
  const [activeSkin, setActiveSkin] = useState<Skin>(getActiveSkin());
  const [scaleFactor, setScaleFactor] = useState(getScaleFactor());
  
  const { isPaused, showCountdown, countdownValue, pause, resume, unpause } = usePause();
  
  const shapesRef = useRef<Shape[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const clickEffectsRef = useRef<ClickEffect[]>([]);
  const nextShapeId = useRef(0);
  const lastSpawnTime = useRef(0);
  const ruleChangeTimer = useRef(0);
  const animationFrameRef = useRef<number>();
  const lastFrameTime = useRef(Date.now());
  const gameStartTime = useRef(0);
  const rafScheduled = useRef(false);

  useEffect(() => {
    const savedHighScore = getLocalStorage('tapRushHighScore') || 0;
    setHighScore(savedHighScore);
    
    soundManager.initialize().catch(error => {
      console.error('[TapRush] Failed to initialize sound manager:', error);
    });

    const handleResize = () => {
      setScaleFactor(getScaleFactor());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateRandomRule = useCallback((): Rule => {
    const property = Math.random() > 0.5 ? 'color' : 'shape';
    if (property === 'color') {
      const color = COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)];
      return {
        property: 'color',
        value: color,
        text: `TAP ${color.toUpperCase()} ONLY`
      };
    } else {
      const shape = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
      return {
        property: 'shape',
        value: shape,
        text: `TAP ${shape.toUpperCase()}S ONLY`
      };
    }
  }, []);

  const getProgressiveDifficulty = useCallback(() => {
    const elapsed = (Date.now() - gameStartTime.current) / 1000;
    const progress = Math.min(elapsed / 120, 1);
    
    const baseSpawnRate = 1400;
    const minSpawnRate = 450;
    const spawnRate = baseSpawnRate - (baseSpawnRate - minSpawnRate) * progress;
    
    const baseSpeed = 2;
    const maxSpeed = 5;
    const speedMultiplier = baseSpeed + (maxSpeed - baseSpeed) * progress;
    
    const maxShapes = Math.floor(6 + progress * 10);
    
    return { spawnRate, speedMultiplier, maxShapes };
  }, []);

  const spawnShape = useCallback((canvas: HTMLCanvasElement, speedMultiplier: number = 1) => {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;
    
    const baseSize = 40 * scaleFactor;
    
    const shape: Shape = {
      id: nextShapeId.current++,
      type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
      color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
      x: Math.random() * (displayWidth - baseSize * 2) + baseSize,
      y: -baseSize * 2,
      speed: (1.5 + Math.random() * 1.5) * speedMultiplier,
      size: baseSize + Math.random() * (baseSize * 0.4),
    };
    shapesRef.current.push(shape);
  }, [scaleFactor]);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 4;
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
  }, []);

  const createClickEffect = useCallback((x: number, y: number, color: string) => {
    clickEffectsRef.current.push({
      x,
      y,
      life: 1,
      scale: 0.5,
      color,
    });
  }, []);

  const checkShapeMatch = useCallback((shape: Shape, rule: Rule): boolean => {
    if (rule.property === 'color') {
      return shape.color === rule.value;
    } else {
      return shape.type === rule.value;
    }
  }, []);

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    const shapeColor = activeSkin.colors[shape.color];
    ctx.fillStyle = shapeColor;
    ctx.strokeStyle = shapeColor;
    ctx.lineWidth = 3 * scaleFactor;
    
    const { x, y, size, type } = shape;
    
    ctx.shadowBlur = 15 * scaleFactor;
    ctx.shadowColor = shapeColor;
    
    if (type === 'circle') {
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'square') {
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    } else if (type === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.shadowBlur = 0;
  };

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !currentRule || !canvasRef.current || isPaused || showCountdown) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    let shapeClicked = false;
    
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];
      const distance = Math.sqrt(
        Math.pow(clickX - shape.x, 2) + Math.pow(clickY - shape.y, 2)
      );
      
      if (distance < shape.size / 2 + 15 * scaleFactor) {
        shapeClicked = true;
        
        if (checkShapeMatch(shape, currentRule)) {
          const points = frenzyMode ? 2 : 1;
          setScore(prev => prev + points);
          setCombo(prev => {
            const newCombo = prev + 1;
            setMaxCombo(max => Math.max(max, newCombo));
            if (newCombo === 20) {
              setFrenzyMode(true);
              setFrenzyTimer(5);
            }
            return newCombo;
          });
          
          createParticles(shape.x, shape.y, activeSkin.colors[shape.color]);
          createClickEffect(shape.x, shape.y, activeSkin.colors[shape.color]);
          shapesRef.current.splice(i, 1);
          
          soundManager.play('pop', 0.4);
          vibrate(15);
        } else {
          soundManager.play('buzz', 0.5);
          vibrate([30, 100, 30, 100, 30]);
          
          setGameState('gameover');
          if (score > highScore) {
            setHighScore(score);
            setLocalStorage('tapRushHighScore', score);
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
    
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setFrenzyMode(false);
    setFrenzyTimer(0);
    shapesRef.current = [];
    particlesRef.current = [];
    clickEffectsRef.current = [];
    nextShapeId.current = 0;
    lastSpawnTime.current = Date.now();
    ruleChangeTimer.current = Date.now();
    gameStartTime.current = Date.now();
    setCurrentRule(generateRandomRule());
  }, [generateRandomRule, unpause]);

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
            shapesRef.current.length < maxShapes) {
          const adjustedSpeed = frenzyMode ? speedMultiplier * 1.3 : speedMultiplier;
          spawnShape(canvas, adjustedSpeed);
          lastSpawnTime.current = now;
        }

        if (now - ruleChangeTimer.current > 10000) {
          setCurrentRule(generateRandomRule());
          ruleChangeTimer.current = now;
          soundManager.play('whoosh', 0.2);
        }

        if (frenzyMode) {
          setFrenzyTimer(prev => {
            const newTimer = prev - deltaTime;
            if (newTimer <= 0) {
              setFrenzyMode(false);
              setCombo(0);
              return 0;
            }
            return newTimer;
          });
        }

        for (let i = shapesRef.current.length - 1; i >= 0; i--) {
          const shape = shapesRef.current[i];
          shape.y += shape.speed;
          
          if (shape.y > displayHeight + 100) {
            shapesRef.current.splice(i, 1);
          } else {
            drawShape(ctx, shape);
          }
        }

        // Cap particles at 200
        if (particlesRef.current.length > 200) {
          particlesRef.current = particlesRef.current.slice(-200);
        }

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const particle = particlesRef.current[i];
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= deltaTime * 2;
          
          if (particle.life <= 0) {
            particlesRef.current.splice(i, 1);
          } else {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life;
            ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
            ctx.globalAlpha = 1;
          }
        }

        // Click effects
        for (let i = clickEffectsRef.current.length - 1; i >= 0; i--) {
          const effect = clickEffectsRef.current[i];
          effect.life -= deltaTime * 2;
          effect.scale += deltaTime * 2;
          
          if (effect.life <= 0) {
            clickEffectsRef.current.splice(i, 1);
          } else {
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3 * scaleFactor;
            ctx.globalAlpha = effect.life;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 20 * effect.scale * scaleFactor, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      } else if (gameState === 'playing') {
        for (const shape of shapesRef.current) {
          drawShape(ctx, shape);
        }
        
        for (const particle of particlesRef.current) {
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.life;
          ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
          ctx.globalAlpha = 1;
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
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          display: 'block',
          cursor: gameState === 'playing' ? 'pointer' : 'default',
          touchAction: 'none',
        }}
      />
      
      {gameState === 'menu' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#fff',
          fontFamily: "'Orbitron', sans-serif",
          width: '90%',
          maxWidth: '600px',
        }}>
          <h1 style={{
            ...titleStyle,
            marginBottom: '2rem',
            textShadow: '0 0 20px #00fff7',
            color: '#00fff7',
          }}>TAP RUSH</h1>
          <button
            onClick={startGame}
            style={{
              ...responsiveStyle,
              fontSize: `clamp(1rem, ${scaleFactor * 1.5}rem, 1.8rem)`,
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#ff004d',
              color: '#fff',
              border: '3px solid #ff004d',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px #ff004d',
              transition: 'all 0.3s',
              width: '100%',
              maxWidth: '400px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            START GAME
          </button>
          <button
            onClick={() => setShowDailyChallengeModal(true)}
            style={{
              ...responsiveStyle,
              fontSize: `clamp(0.9rem, ${scaleFactor * 1.2}rem, 1.4rem)`,
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#00fff7',
              color: '#0d0d0d',
              border: '3px solid #00fff7',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px #00fff7',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              marginTop: '1rem',
              width: '100%',
              maxWidth: '400px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            DAILY CHALLENGE
          </button>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                flex: '1 1 45%',
                minWidth: '150px',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              LEADERBOARD
            </button>
            <button
              onClick={() => setShowSkins(true)}
              style={{
                ...responsiveStyle,
                fontSize: `clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: '#00ff85',
                color: '#0d0d0d',
                border: '2px solid #00ff85',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                flex: '1 1 45%',
                minWidth: '150px',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              SKINS
            </button>
          </div>
          <p style={{ 
            marginTop: '2rem', 
            fontSize: `clamp(0.9rem, ${scaleFactor * 1.2}rem, 1.5rem)`,
            color: '#00ff85' 
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
      
      {gameState === 'playing' && currentRule && (
        <>
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            color: '#fff',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: `clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
          }}>
            <div style={{ textShadow: '0 0 10px #00fff7', marginBottom: '0.3rem' }}>
              SCORE: {score}
            </div>
            <div style={{ textShadow: '0 0 10px #f5f500' }}>
              COMBO: {combo}
            </div>
          </div>
          
          <button
            onClick={pause}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: `${scaleFactor * 0.5}rem ${scaleFactor * 1}rem`,
              fontSize: `clamp(0.8rem, ${scaleFactor * 1}rem, 1.2rem)`,
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: 'rgba(255, 215, 0, 0.9)',
              color: '#0d0d0d',
              border: '2px solid #ffd700',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
              transition: 'all 0.2s',
              zIndex: 10,
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ⏸
          </button>
          
          <div style={{
            position: 'absolute',
            top: `${scaleFactor * 70}px`,
            right: '10px',
            color: '#fff',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: `clamp(0.9rem, ${scaleFactor * 1.2}rem, 1.5rem)`,
            textAlign: 'right',
            padding: `${scaleFactor * 0.8}rem`,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            border: `3px solid ${frenzyMode ? '#ff004d' : '#00fff7'}`,
            boxShadow: `0 0 20px ${frenzyMode ? '#ff004d' : '#00fff7'}`,
            maxWidth: '70%',
          }}>
            <div style={{ textShadow: `0 0 10px ${frenzyMode ? '#ff004d' : '#00fff7'}` }}>
              {currentRule.text}
            </div>
            {frenzyMode && (
              <div style={{
                marginTop: '0.3rem',
                fontSize: `clamp(0.7rem, ${scaleFactor * 0.9}rem, 1.1rem)`,
                color: '#ff004d',
                textShadow: '0 0 10px #ff004d',
              }}>
                FRENZY! {frenzyTimer.toFixed(1)}s
              </div>
            )}
          </div>
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
        </div>
      )}
    </div>
  );
}
