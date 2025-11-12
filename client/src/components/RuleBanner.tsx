import { useEffect, useState } from 'react';
import { soundManager } from '@/lib/soundManager';

interface RuleBannerProps {
  text: string;
  frenzyMode: boolean;
  scaleFactor: number;
  onRuleChange?: () => void;
}

export default function RuleBanner({ text, frenzyMode, scaleFactor, onRuleChange }: RuleBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [prevText, setPrevText] = useState(text);

  useEffect(() => {
    if (text !== prevText) {
      setIsVisible(true);
      soundManager.play('sparkle', 0.6);
      setPrevText(text);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      
      if (onRuleChange) {
        onRuleChange();
      }
      
      return () => clearTimeout(timer);
    }
  }, [text, prevText, onRuleChange]);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#fff',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: `clamp(1.2rem, ${scaleFactor * 1.8}rem, 2.5rem)`,
        textAlign: 'center',
        padding: `${scaleFactor * 0.6}rem ${scaleFactor * 1.2}rem`,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '12px',
        border: `3px solid ${frenzyMode ? '#ff004d' : '#00fff7'}`,
        boxShadow: `0 0 25px ${frenzyMode ? '#ff004d' : '#00fff7'}`,
        pointerEvents: 'none',
        maxWidth: '85%',
        opacity: isVisible ? 1 : 0,
        transition: isVisible ? 'opacity 0.2s ease-out' : 'opacity 2s ease-in-out',
        zIndex: 50,
      }}
    >
      <div style={{ textShadow: `0 0 15px ${frenzyMode ? '#ff004d' : '#00fff7'}`, fontWeight: 'bold' }}>
        {text}
      </div>
      {frenzyMode && (
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: `clamp(0.9rem, ${scaleFactor * 1.2}rem, 1.6rem)`,
            color: '#ff004d',
            textShadow: '0 0 15px #ff004d',
          }}
        >
          FRENZY MODE!
        </div>
      )}
    </div>
  );
}
