import { SETTINGS_CONFIG } from '@/lib/settingsConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
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
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          border: '3px solid #00fff7',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 0 30px #00fff7',
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        {/* Header */}
        <h2 style={{
          fontSize: '2rem',
          color: '#00fff7',
          textAlign: 'center',
          marginBottom: '1.5rem',
          textShadow: '0 0 15px #00fff7',
        }}>
          ⚙️ SETTINGS & ABOUT
        </h2>

        {/* About the Game Section */}
        <div style={{
          backgroundColor: '#0d0d0d',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            color: '#ff1166',
            marginBottom: '1rem',
            fontWeight: 'bold',
          }}>
            📖 About the Game
          </h3>
          <p style={{
            color: '#ccc',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            marginBottom: '1rem',
          }}>
            {SETTINGS_CONFIG.gameDescription}
          </p>
          
          <div style={{
            color: '#f5f500',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            marginTop: '1rem',
          }}>
            Version: {SETTINGS_CONFIG.gameVersion}
          </div>
        </div>

        {/* Privacy Policy */}
        <div style={{
          marginBottom: '1.5rem',
        }}>
          <a
            href={SETTINGS_CONFIG.privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textDecoration: 'none',
            }}
          >
            <button
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(135deg, #00ff85 0%, #00d46b 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 255, 133, 0.3)',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 255, 133, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 133, 0.3)';
              }}
            >
              🔒 Privacy Policy
            </button>
          </a>
        </div>

        {/* Contact Section */}
        <div style={{
          backgroundColor: '#0d0d0d',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            color: '#ff9500',
            marginBottom: '0.8rem',
            fontWeight: 'bold',
          }}>
            📧 Contact
          </h3>
          <p style={{
            color: '#888',
            fontSize: '0.85rem',
            marginBottom: '0.8rem',
          }}>
            Questions or feedback? Get in touch!
          </p>
          <a
            href={`mailto:${SETTINGS_CONFIG.contactEmail}`}
            style={{
              color: '#00fff7',
              fontSize: '0.95rem',
              textDecoration: 'underline',
              wordBreak: 'break-word',
            }}
          >
            {SETTINGS_CONFIG.contactEmail}
          </a>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.9rem',
            fontSize: '1.1rem',
            fontFamily: "'Orbitron', sans-serif",
            backgroundColor: '#00fff7',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(0, 255, 247, 0.5)',
            fontWeight: 'bold',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00d4cc';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 247, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00fff7';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 247, 0.5)';
          }}
        >
          CLOSE
        </button>

        {/* Publisher Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <p style={{
            color: '#666',
            fontSize: '0.8rem',
            margin: 0,
          }}>
            Published by <span style={{ color: '#00fff7' }}>{SETTINGS_CONFIG.publisherName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
