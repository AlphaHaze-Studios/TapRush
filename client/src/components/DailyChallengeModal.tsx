import { useState, useEffect } from 'react';
import { getTodaysChallenge, getChallengeProgress, type DailyChallenge } from '@/lib/dailyChallenges';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (challenge: DailyChallenge) => void;
}

export default function DailyChallengeModal({ isOpen, onClose, onStart }: DailyChallengeModalProps) {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [progress, setProgress] = useState({ completed: 0, totalPoints: 0 });

  useEffect(() => {
    if (isOpen) {
      const todaysChallenge = getTodaysChallenge();
      setChallenge(todaysChallenge);
      setProgress(getChallengeProgress());
    }
  }, [isOpen]);

  if (!isOpen || !challenge) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '3px solid #00fff7',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 0 30px #00fff7',
        fontFamily: "'Orbitron', sans-serif",
      }}>
        <h2 style={{
          fontSize: '2rem',
          color: '#00fff7',
          textAlign: 'center',
          marginBottom: '1.5rem',
          textShadow: '0 0 15px #00fff7',
        }}>
          {challenge.completed ? '✓ ' : ''}DAILY CHALLENGE
        </h2>

        <div style={{
          backgroundColor: '#0d0d0d',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ color: '#f5f500', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {challenge.specialRule}
            </div>
          </div>

          <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Target Score:</span>
              <span style={{ color: '#00ff85', fontWeight: 'bold' }}>{challenge.targetScore}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Target Combo:</span>
              <span style={{ color: '#00ff85', fontWeight: 'bold' }}>{challenge.targetCombo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Time Limit:</span>
              <span style={{ color: '#ff004d', fontWeight: 'bold' }}>{challenge.timeLimit}s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Reward:</span>
              <span style={{ color: '#f5f500', fontWeight: 'bold' }}>{challenge.reward} pts</span>
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '0.85rem',
          color: '#888',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}>
          Challenges Completed: {progress.completed} | Total Points: {progress.totalPoints}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.8rem',
              fontSize: '1rem',
              fontFamily: "'Orbitron', sans-serif",
              backgroundColor: '#444',
              color: '#fff',
              border: '2px solid #666',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#444'}
          >
            CLOSE
          </button>
          {!challenge.completed && (
            <button
              onClick={() => onStart(challenge)}
              style={{
                flex: 2,
                padding: '0.8rem',
                fontSize: '1.2rem',
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: '#00fff7',
                color: '#0d0d0d',
                border: '3px solid #00fff7',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 0 15px #00fff7',
                transition: 'all 0.3s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              START CHALLENGE
            </button>
          )}
          {challenge.completed && (
            <div style={{
              flex: 2,
              padding: '0.8rem',
              fontSize: '1rem',
              textAlign: 'center',
              color: '#00ff85',
              border: '2px solid #00ff85',
              borderRadius: '8px',
              backgroundColor: '#0d0d0d',
            }}>
              ✓ COMPLETED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
