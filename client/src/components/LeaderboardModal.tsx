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
  currentCombo?: number;
}

export default function LeaderboardModal({ isOpen, onClose, currentScore, currentCombo = 0 }: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
      if (currentScore && currentScore > 0 && !scoreSubmitted) {
        setShowNameInput(true);
      }
    } else {
      setScoreSubmitted(false);
      setShowNameInput(false);
      setPlayerName('');
    }
  }, [isOpen, currentScore, scoreSubmitted]);

  const loadLeaderboard = () => {
    try {
      const stored = getLocalStorage('leaderboard') || [];
      const validEntries = stored.filter((entry: any) => 
        entry && typeof entry.score === 'number' && entry.name
      );
      
      const sorted = validEntries
        .map((entry: any) => ({
          ...entry,
          combo: entry.combo || 0
        }))
        .sort((a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.combo - a.combo;
        })
        .slice(0, 10)
        .map((entry: any, index: number) => ({ ...entry, rank: index + 1 }));
      setLeaderboard(sorted);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const submitScore = () => {
    if (!playerName.trim() || !currentScore) return;

    const stored = getLocalStorage('leaderboard') || [];
    const newEntry = {
      name: playerName.trim(),
      score: currentScore,
      combo: currentCombo || 0,
      date: new Date().toISOString(),
    };
    
    stored.push(newEntry);
    setLocalStorage('leaderboard', stored);
    
    setScoreSubmitted(true);
    loadLeaderboard();
    setShowNameInput(false);
    setPlayerName('');
  };

  const clearLeaderboard = () => {
    setLocalStorage('leaderboard', []);
    setLeaderboard([]);
    setShowConfirmClear(false);
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
            <div style={{ color: '#00fff7', marginBottom: '0.3rem', fontSize: '1rem', fontWeight: 'bold' }}>
              Score: {currentScore}
            </div>
            <div style={{ color: '#f5f500', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Max Combo: {currentCombo}
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
                  justifyContent: 'space-between',
                  padding: 'clamp(0.6rem, 1rem, 1.2rem)',
                  borderBottom: entry.rank < leaderboard.length ? '1px solid #333' : 'none',
                  backgroundColor: entry.rank <= 3 ? 'rgba(245, 245, 0, 0.1)' : 'transparent',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: '1 1 auto',
                  minWidth: '150px',
                }}>
                  <div style={{
                    width: 'clamp(30px, 40px, 50px)',
                    fontSize: 'clamp(1rem, 1.2rem, 1.4rem)',
                    fontWeight: 'bold',
                    color: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : '#888',
                  }}>
                    #{entry.rank}
                  </div>
                  <div style={{
                    flex: 1,
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 1rem, 1.1rem)',
                  }}>
                    {entry.name}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <div style={{
                    textAlign: 'right',
                  }}>
                    <div style={{
                      fontSize: 'clamp(1rem, 1.2rem, 1.4rem)',
                      fontWeight: 'bold',
                      color: '#00fff7',
                    }}>
                      {entry.score}
                    </div>
                    {entry.combo > 0 && (
                      <div style={{
                        fontSize: 'clamp(0.7rem, 0.8rem, 0.9rem)',
                        color: '#f5f500',
                      }}>
                        ×{entry.combo}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {leaderboard.length > 0 && !showConfirmClear && (
            <button
              onClick={() => setShowConfirmClear(true)}
              style={{
                flex: '1',
                padding: '0.8rem',
                fontSize: '0.9rem',
                fontFamily: "'Orbitron', sans-serif",
                backgroundColor: '#ff004d',
                color: '#fff',
                border: '2px solid #ff004d',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: 'bold',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cc0040'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff004d'}
            >
              CLEAR ALL
            </button>
          )}
          
          <button
            onClick={onClose}
            style={{
              flex: '1',
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
        
        {showConfirmClear && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#1a1a1a',
            border: '3px solid #ff004d',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 0 40px #ff004d',
            maxWidth: '300px',
            width: '90%',
            zIndex: 10,
          }}>
            <div style={{
              color: '#fff',
              fontSize: '1.1rem',
              marginBottom: '1rem',
              textAlign: 'center',
            }}>
              Clear all leaderboard scores?
            </div>
            <div style={{
              color: '#ff004d',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              This cannot be undone!
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => setShowConfirmClear(false)}
                style={{
                  flex: '1',
                  padding: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: "'Orbitron', sans-serif",
                  backgroundColor: '#444',
                  color: '#fff',
                  border: '2px solid #666',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={clearLeaderboard}
                style={{
                  flex: '1',
                  padding: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: "'Orbitron', sans-serif",
                  backgroundColor: '#ff004d',
                  color: '#fff',
                  border: '2px solid #ff004d',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                YES, CLEAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
