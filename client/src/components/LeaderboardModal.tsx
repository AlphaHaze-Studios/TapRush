import { useState, useEffect } from 'react';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  combo: number;
  date: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
}

export default function LeaderboardModal({ isOpen, onClose, currentScore }: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
      if (currentScore && currentScore > 0) {
        setShowNameInput(true);
      }
    }
  }, [isOpen, currentScore]);

  const loadLeaderboard = () => {
    const stored = getLocalStorage('leaderboard') || [];
    const sorted = stored
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10)
      .map((entry: any, index: number) => ({ ...entry, rank: index + 1 }));
    setLeaderboard(sorted);
  };

  const submitScore = () => {
    if (!playerName.trim() || !currentScore) return;

    const stored = getLocalStorage('leaderboard') || [];
    const newEntry = {
      name: playerName.trim(),
      score: currentScore,
      combo: 0,
      date: new Date().toISOString(),
    };
    
    stored.push(newEntry);
    setLocalStorage('leaderboard', stored);
    
    loadLeaderboard();
    setShowNameInput(false);
    setPlayerName('');
  };

  if (!isOpen) return null;

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
        border: '3px solid #f5f500',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 0 30px #f5f500',
        fontFamily: "'Orbitron', sans-serif",
      }}>
        <h2 style={{
          fontSize: '2rem',
          color: '#f5f500',
          textAlign: 'center',
          marginBottom: '1.5rem',
          textShadow: '0 0 15px #f5f500',
        }}>
          🏆 LEADERBOARD
        </h2>

        {showNameInput && (
          <div style={{
            backgroundColor: '#0d0d0d',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '2px solid #00ff85',
          }}>
            <div style={{ color: '#00ff85', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Your Score: {currentScore}
            </div>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: '#222',
                color: '#fff',
                border: '2px solid #00ff85',
                borderRadius: '4px',
                marginBottom: '0.5rem',
              }}
            />
            <button
              onClick={submitScore}
              disabled={!playerName.trim()}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: playerName.trim() ? '#00ff85' : '#444',
                color: playerName.trim() ? '#0d0d0d' : '#888',
                border: 'none',
                borderRadius: '4px',
                cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              SUBMIT
            </button>
          </div>
        )}

        <div style={{
          backgroundColor: '#0d0d0d',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {leaderboard.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#888',
              fontSize: '0.9rem',
            }}>
              No scores yet. Be the first!
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: entry.rank < leaderboard.length ? '1px solid #333' : 'none',
                  backgroundColor: entry.rank <= 3 ? 'rgba(245, 245, 0, 0.1)' : 'transparent',
                }}
              >
                <div style={{
                  width: '40px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : '#888',
                }}>
                  #{entry.rank}
                </div>
                <div style={{
                  flex: 1,
                  color: '#fff',
                  fontSize: '1rem',
                }}>
                  {entry.name}
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#00fff7',
                }}>
                  {entry.score}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '1.5rem',
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
      </div>
    </div>
  );
}
