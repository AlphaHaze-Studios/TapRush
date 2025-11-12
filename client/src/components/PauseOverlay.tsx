import { Button } from './ui/button';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export default function PauseOverlay({ onResume, onRestart, onExit }: PauseOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500 rounded-2xl p-8 shadow-2xl shadow-cyan-500/50 max-w-sm w-full mx-4">
        <h2 className="text-4xl font-bold text-center mb-8 text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          PAUSED
        </h2>
        
        <div className="space-y-4">
          <Button
            onClick={onResume}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 text-xl rounded-xl shadow-lg shadow-green-500/50 transition-all duration-200 hover:scale-105"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            RESUME
          </Button>
          
          <Button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-6 text-xl rounded-xl shadow-lg shadow-yellow-500/50 transition-all duration-200 hover:scale-105"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            RESTART
          </Button>
          
          <Button
            onClick={onExit}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-6 text-xl rounded-xl shadow-lg shadow-red-500/50 transition-all duration-200 hover:scale-105"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            EXIT TO MENU
          </Button>
        </div>
        
        <p className="text-center text-gray-400 mt-6 text-sm">
          Press ESC to toggle pause
        </p>
      </div>
    </div>
  );
}
