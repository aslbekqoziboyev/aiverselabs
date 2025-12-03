import { useEffect, useRef, useState } from "react";

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onSeek?: (time: number) => void;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

export function WaveformVisualizer({ 
  audioUrl, 
  isPlaying, 
  onTimeUpdate,
  onSeek,
  audioRef 
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const prog = (audio.currentTime / audio.duration) * 100;
        setProgress(prog);
        setDuration(audio.duration);
        onTimeUpdate?.(audio.currentTime, audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audioRef, onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio || !canvasRef.current) return;

    // Create audio context only once
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvas) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'hsl(280, 90%, 65%)');
        gradient.addColorStop(1, 'hsl(220, 90%, 55%)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        // Mirror effect (reflection)
        ctx.fillStyle = 'hsla(280, 90%, 65%, 0.2)';
        ctx.fillRect(x, canvas.height, barWidth - 2, barHeight * 0.3);

        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioRef]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef?.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    const newTime = (newProgress / 100) * duration;
    
    audio.currentTime = newTime;
    onSeek?.(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="relative h-32 bg-background/50 rounded-lg overflow-hidden border">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={128}
          className="w-full h-full"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-end gap-1 h-16">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-primary to-accent rounded-full opacity-40"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div 
        className="relative h-2 bg-muted rounded-full cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div 
          className="absolute h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatTime((progress / 100) * duration)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
