import { useState, useEffect } from 'react';
import { getSkins, getActiveSkin, setActiveSkin, unlockSkinWithAd, type Skin } from '@/lib/skinSystem';

interface SkinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkinChange?: (skin: Skin) => void;
}

export default function SkinsModal({ isOpen, onClose, onSkinChange }: SkinsModalProps) {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [activeSkin, setActiveSkinState] = useState<Skin | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSkins();
    }
  }, [isOpen]);

  const loadSkins = () => {
    setSkins(getSkins());
    setActiveSkinState(getActiveSkin());
  };

  const handleSelectSkin = (skin: Skin) => {
    if (skin.unlocked) {
      setActiveSkin(skin.id);
      setActiveSkinState(skin);
      if (onSkinChange) {
        onSkinChange(skin);
      }
    }
  };

  const handleUnlockSkin = async (skin: Skin) => {
    const unlocked = await unlockSkinWithAd(skin.id);
    if (unlocked) {
      loadSkins();
    }
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
        border: '3px solid #ff004d',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 0 30px #ff004d',
        fontFamily: "'Orbitron', sans-serif",
      }}>
        <h2 style={{
          fontSize: '2rem',
          color: '#ff004d',
          textAlign: 'center',
          marginBottom: '1.5rem',
          textShadow: '0 0 15px #ff004d',
        }}>
          🎨 SKINS
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {skins.map((skin) => (
            <div
              key={skin.id}
              style={{
                backgroundColor: '#0d0d0d',
                border: activeSkin?.id === skin.id ? '3px solid #00ff85' : '2px solid #333',
                borderRadius: '12px',
                padding: '1rem',
                cursor: skin.unlocked ? 'pointer' : 'default',
                transition: 'all 0.3s',
                opacity: skin.unlocked ? 1 : 0.6,
              }}
              onClick={() => skin.unlocked && handleSelectSkin(skin)}
            >
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '0.8rem',
                textAlign: 'center',
              }}>
                {skin.name}
                {activeSkin?.id === skin.id && (
                  <span style={{ color: '#00ff85', marginLeft: '0.5rem' }}>✓</span>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}>
                <div style={{
                  backgroundColor: skin.colors.red,
                  height: '40px',
                  borderRadius: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}></div>
                <div style={{
                  backgroundColor: skin.colors.blue,
                  height: '40px',
                  borderRadius: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}></div>
                <div style={{
                  backgroundColor: skin.colors.green,
                  height: '40px',
                  borderRadius: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}></div>
                <div style={{
                  backgroundColor: skin.colors.yellow,
                  height: '40px',
                  borderRadius: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}></div>
              </div>

              {!skin.unlocked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnlockSkin(skin);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.9rem',
                    fontFamily: "'Orbitron', sans-serif",
                    backgroundColor: '#ff004d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  UNLOCK ({skin.adCost} AD{skin.adCost > 1 ? 'S' : ''})
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
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
