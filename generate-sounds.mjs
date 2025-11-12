import fs from 'fs';
import path from 'path';

function generateWAV(frequency, duration, type = 'sine', outputPath) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // WAV Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Generate samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample;

    if (type === 'sine') {
      sample = Math.sin(2 * Math.PI * frequency * t);
    } else if (type === 'square') {
      sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
    } else if (type === 'sweep') {
      // Sweep from frequency to frequency*2
      const freq = frequency + (frequency * t / duration);
      sample = Math.sin(2 * Math.PI * freq * t);
    }

    // Apply envelope (fade out)
    const envelope = Math.max(0, 1 - (t / duration));
    sample *= envelope * 0.3; // Volume adjustment

    // Convert to 16-bit PCM
    const pcm = Math.floor(sample * 32767);
    buffer.writeInt16LE(pcm, 44 + i * 2);
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated ${path.basename(outputPath)}`);
}

console.log('Generating sound effects...\n');

// Pop - high pitch, short burst (success)
generateWAV(800, 0.15, 'sine', 'client/public/sounds/pop.wav');

// Buzz - low harsh tone (error)
generateWAV(150, 0.25, 'square', 'client/public/sounds/buzz.wav');

// Whoosh - sweeping tone (mode change)
generateWAV(400, 0.35, 'sweep', 'client/public/sounds/whoosh.wav');

console.log('\n✓ All sounds generated successfully!');
console.log('Note: These are WAV files. Update soundManager.ts to use .wav instead of .mp3\n');
