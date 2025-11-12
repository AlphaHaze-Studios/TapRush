import { useEffect, useRef, useState, useCallback } from 'react';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';
import { showAd } from '@/lib/adManager';
import { soundManager } from '@/lib/soundManager';
import DailyChallengeModal from './DailyChallengeModal';
import LeaderboardModal from './LeaderboardModal';
import SkinsModal from './SkinsModal';
import { getActiveSkin, type ColorScheme } from '@/lib/skinSystem';
import type { DailyChallenge } from '@/lib/dailyChallenges';

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
}

const DEFAULT_COLORS = {
  red: '#ff004d',
  blue: '#00fff7',
  green: '#00ff85',
  yellow: '#f5f500',
};

const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle'];
const COLOR_TYPES: ColorType[] = ['red', 'blue', 'green', 'yellow'];

export default function TapRush() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [frenzyMode, setFrenzyMode] = useState(false);
  const [frenzyTimer, setFrenzyTimer] = useState(0);
  const [showDailyChallengeModal, setShowDailyChallengeModal] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<DailyChallenge | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSkins, setShowSkins] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(getActiveSkin().colors);
  
  const shapesRef = useRef<Shape[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextShapeId = useRef(0);
  const lastSpawnTime = useRef(0);
  const ruleChangeTimer = useRef(0);
  const animationFrameRef = useRef<number>();
  const lastFrameTime = useRef(Date.now());

  useEffect(() => {
    const savedHighScore = getLocalStorage('tapRushHighScore') || 0;
    setHighScore(savedHighScore);
    
    soundManager.initialize().catch(error => {
      console.error('[TapRush] Failed to initialize sound manager:', error);
    });
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

  const spawnShape = useCallback((canvas: HTMLCanvasElement, speedMultiplier: number = 1) => {
    const shape: Shape = {
      id: nextShapeId.current++,
      type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
      color: COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)],
      x: Math.random() * (canvas.width - 80) + 40,
      y: -60,
      speed: (2 + Math.random() * 2) * speedMultiplier,
      size: 35 + Math.random() * 15,
    };
    shapesRef.current.push(shape);
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
      });
    }
  }, []);

  const checkShapeMatch = useCallback((shape: Shape, rule: Rule): boolean => {
    if (rule.property === 'color') {
      return shape.color === rule.value;
    } else {
      return shape.type === rule.value;
    }
  }, []);

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    const shapeColor = colorScheme[shape.color];
    ctx.fillStyle = shapeColor;
    ctx.strokeStyle = shapeColor;
    ctx.lineWidth = 3;
    
    const { x, y, size, type } = shape;
    
    ctx.shadowBlur = 15;
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
    if (gameState !== 'playing' || !currentRule || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    let shapeClicked = false;
    
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];
      const distance = Math.sqrt(
        Math.pow(clickX - shape.x, 2) + Math.pow(clickY - shape.y, 2)
      );
      
      if (distance < shape.size / 2 + 10) {
        shapeClicked = true;
        
        if (checkShapeMatch(shape, currentRule)) {
          const points = frenzyMode ? 2 : 1;
          setScore(prev => prev + points);
          setCombo(prev => {
            const newCombo = prev + 1;
            if (newCombo === 20) {
              setFrenzyMode(true);
              setFrenzyTimer(5);
            }
            return newCombo;
          });
          
          createParticles(shape.x, shape.y, colorScheme[shape.color]);
          shapesRef.current.splice(i, 1);
          
          soundManager.play('pop', 0.4);
        } else {
          soundManager.play('buzz', 0.5);
          
          setGameState('gameover');
          if (score > highScore) {
            setHighScore(score);
            setLocalStorage('tapRushHighScore', score);
          }
        }
        break;
      }
    }
  }, [gameState, currentRule, checkShapeMatch, frenzyMode, createParticles, score, highScore]);

  const startGame = useCallback(() => {
    soundManager.resume();
    
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setFrenzyMode(false);
    setFrenzyTimer(0);
    shapesRef.current = [];
    particlesRef.current = [];
    nextShapeId.current = 0;
    lastSpawnTime.current = Date.now();
    ruleChangeTimer.current = Date.now();
    setCurrentRule(generateRandomRule());
  }, [generateRandomRule]);

  const restartGame = useCallback(async () => {
    await showAd();
    startGame();
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;

      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState === 'playing') {
        const spawnRate = frenzyMode ? 800 : 1200;
        if (now - lastSpawnTime.current > spawnRate) {
          const speedMultiplier = frenzyMode ? 1.3 : 1;
          spawnShape(canvas, speedMultiplier);
          lastSpawnTime.current = now;
        }

        if (now - ruleChangeTimer.current > 10000) {
          setCurrentRule(generateRandomRule());
          ruleChangeTimer.current = now;
          
          soundManager.play('whoosh', 0.3);
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
          
          if (shape.y > canvas.height + 100) {
            shapesRef.current.splice(i, 1);
          } else {
            drawShape(ctx, shape);
          }
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
            ctx.fillRect(particle.x - 3, particle.y - 3, 6, 6);
            ctx.globalAlpha = 1;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, spawnShape, generateRandomRule, frenzyMode]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
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
        }}>
          <h1 style={{
            fontSize: '4rem',
            marginBottom: '2rem',
            textShadow: '0 0 20px #00fff7',
            color: '#00fff7',
          }}>TAP RUSH</h1>
          <button
            onClick={startGame}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.5rem',
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#ff004d',
              color: '#fff',
              border: '3px solid #ff004d',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px #ff004d',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            START GAME
          </button>
          <button
            onClick={() => setShowDailyChallengeModal(true)}
            style={{
              padding: '0.8rem 2.5rem',
              fontSize: '1.2rem',
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
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            DAILY CHALLENGE
          </button>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => setShowLeaderboard(true)}
              style={{
                flex: 1,
                padding: '0.6rem',
                fontSize: '1rem',
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: '#f5f500',
                color: '#0d0d0d',
                border: '2px solid #f5f500',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              LEADERBOARD
            </button>
            <button
              onClick={() => setShowSkins(true)}
              style={{
                flex: 1,
                padding: '0.6rem',
                fontSize: '1rem',
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: '#00ff85',
                color: '#0d0d0d',
                border: '2px solid #00ff85',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              SKINS
            </button>
          </div>
          <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: '#00ff85' }}>
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
      />
      
      <SkinsModal
        isOpen={showSkins}
        onClose={() => setShowSkins(false)}
        onSkinChange={(skin) => setColorScheme(skin.colors)}
      />
      
      {gameState === 'playing' && currentRule && (
        <>
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            color: '#fff',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '1.2rem',
          }}>
            <div style={{ textShadow: '0 0 10px #00fff7', marginBottom: '0.5rem' }}>
              SCORE: {score}
            </div>
            <div style={{ textShadow: '0 0 10px #f5f500' }}>
              COMBO: {combo}
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: '#fff',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '1.5rem',
            textAlign: 'right',
            padding: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            border: `3px solid ${frenzyMode ? '#ff004d' : '#00fff7'}`,
            boxShadow: `0 0 20px ${frenzyMode ? '#ff004d' : '#00fff7'}`,
          }}>
            <div style={{ textShadow: `0 0 10px ${frenzyMode ? '#ff004d' : '#00fff7'}` }}>
              {currentRule.text}
            </div>
            {frenzyMode && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '1rem',
                color: '#ff004d',
                textShadow: '0 0 10px #ff004d',
              }}>
                FRENZY MODE! {frenzyTimer.toFixed(1)}s
              </div>
            )}
          </div>
        </>
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
        }}>
          <h1 style={{
            fontSize: '3rem',
            marginBottom: '2rem',
            textShadow: '0 0 20px #ff004d',
            color: '#ff004d',
          }}>GAME OVER</h1>
          <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Score: {score}</p>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#00ff85' }}>
            High Score: {highScore}
          </p>
          <button
            onClick={restartGame}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.5rem',
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#00fff7',
              color: '#0d0d0d',
              border: '3px solid #00fff7',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px #00fff7',
              fontWeight: 'bold',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            RESTART
          </button>
        </div>
      )}
    </div>
  );
}
