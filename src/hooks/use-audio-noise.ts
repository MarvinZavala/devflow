import { useEffect, useRef, useState, useCallback } from 'react';

type NoiseType = 'brown' | 'white';

export function useAudioNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.05); // Default lower volume for background
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize Audio Context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Create Gain Node for volume control
      const gainNode = audioContextRef.current.createGain();
      gainNode.connect(audioContextRef.current.destination);
      gainNodeRef.current = gainNode;
    }
  }, []);

  // Generate Brown Noise Buffer
  const createBrownNoiseBuffer = useCallback(() => {
    if (!audioContextRef.current) return null;

    const ctx = audioContextRef.current;
    const bufferSize = 2 * ctx.sampleRate; // 2 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      
      // Brown noise: integration of white noise
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for gain reduction
    }
    return buffer;
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying]);

  const play = useCallback(async () => {
    initAudio();
    if (!audioContextRef.current || !gainNodeRef.current) return;

    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Stop existing source if any
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
    }

    const buffer = createBrownNoiseBuffer();
    if (!buffer) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNodeRef.current);
    source.start();
    
    sourceNodeRef.current = source;
    setIsPlaying(true);
    
    // Apply current volume
    gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
  }, [createBrownNoiseBuffer, initAudio, volume]);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const updateVolume = useCallback((val: number) => {
    setVolume(val);
    if (gainNodeRef.current && audioContextRef.current) {
      // Smooth volume transition
      gainNodeRef.current.gain.setTargetAtTime(val, audioContextRef.current.currentTime, 0.1);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying,
    togglePlay,
    volume,
    setVolume: updateVolume
  };
}
