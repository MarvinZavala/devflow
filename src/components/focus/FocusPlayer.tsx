"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Music2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Radio, 
  Waves, 
  Play, 
  Pause, 
  Disc3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAudioNoise } from "@/hooks/use-audio-noise";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

import { toast } from "sonner";

const STATIONS = [
  { 
    id: "lofi", 
    name: "Lofi Girl", 
    label: "Chill Beats",
    // Using a 10-hour video instead of livestream for stability
    url: "https://www.youtube.com/watch?v=n61ULEU7CO0" 
  },
  { 
    id: "synth", 
    name: "Synthwave", 
    label: "Cyberpunk Focus",
    // Verified working static mix
    url: "https://www.youtube.com/watch?v=MVPTGNGiI-4" 
  },
  { 
    id: "ambient", 
    name: "Space", 
    label: "Deep Ambient",
    // Static long ambient video
    url: "https://www.youtube.com/watch?v=xQ6xgDI7Whc" 
  }
];

// Build a YouTube embed URL (with enablejsapi for control) from common share/watch links
function getEmbedUrl(url: string, { autoplay = false, origin }: { autoplay?: boolean; origin?: string } = {}) {
  try {
    const parsed = new URL(url);
    const isYouTube = parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be");
    if (!isYouTube) return url;

    let videoId = "";
    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/").pop() || "";
    } else {
      videoId = parsed.searchParams.get("v") || "";
    }

    if (!videoId) return url;

    const params = new URLSearchParams(parsed.search);
    params.delete("v"); // v goes in the path for embeds
    params.set("enablejsapi", "1");
    params.set("playsinline", "1");
    params.set("rel", "0");
    params.set("controls", "0");
    params.set("autoplay", autoplay ? "1" : "0");
    if (origin) params.set("origin", origin);
    const query = params.toString();

    return `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ""}`;
  } catch {
    return url;
  }
}

export function FocusPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("noise"); // 'noise' | 'music'
  
  // Noise State
  const { isPlaying: isNoisePlaying, togglePlay: toggleNoise, volume: noiseVolume, setVolume: setNoiseVolume } = useAudioNoise();
  
  // Music State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [currentStation, setCurrentStation] = useState(STATIONS[0]);
  const [playerReady, setPlayerReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const musicVolumeRef = useRef(musicVolume);
  const isMusicPlayingRef = useRef(isMusicPlaying);

  useEffect(() => {
    musicVolumeRef.current = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    isMusicPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  const sendMessage = (func: string, args: unknown[] = []) => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    target.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  };

  const postPlayerCommand = (func: string, args: unknown[] = []) => {
    if (!iframeRef.current || !playerReady) return;
    sendMessage(func, args);
  };

  // Apply volume to the YouTube player whenever it is ready
  useEffect(() => {
    if (!playerReady) return;
    postPlayerCommand("setVolume", [Math.round(musicVolume * 100)]);
  }, [musicVolume, playerReady]);

  // Play/Pause commands to the YouTube player
  useEffect(() => {
    if (!playerReady) return;
    if (isMusicPlaying) postPlayerCommand("playVideo");
    else postPlayerCommand("pauseVideo");
  }, [isMusicPlaying, playerReady]);

  // Detect when the YouTube iframe reports ready (postMessage API)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      if (event.origin && !event.origin.includes("youtube.com")) return;
      try {
        const data = JSON.parse(event.data);
        if (data?.event === "onReady") {
          setPlayerReady(true);
          const vol = Math.round(musicVolumeRef.current * 100);
          sendMessage("setVolume", [vol]);
          if (isMusicPlayingRef.current) sendMessage("playVideo");
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // 🔊 Audio Unlocker Mechanism
  // We need to detect a user interaction before we can truly play audio
  useEffect(() => {
    const unlockAudio = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      ctx.resume().then(() => {
        console.log("[FocusPlayer] 🔓 Audio Context Unlocked");
        // Create a silent oscillator to "warm up" the audio engine
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.001; // Barely audible
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        setTimeout(() => osc.stop(), 100);
      });
      
      // Remove listeners once unlocked
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Toggle Expanded
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  // Handle Music Toggle
  const toggleMusic = () => {
    const nextState = !isMusicPlaying;
    
    // Optimistic update
    setIsMusicPlaying(nextState);

    // If music starts, stop noise for clarity (optional, but good for focus)
    if (nextState && isNoisePlaying) {
      toggleNoise();
    }
  };

  // Handle Station Change
  const changeStation = (station: typeof STATIONS[0]) => {
    if (currentStation.id === station.id) {
      // If clicking same station, just toggle play
      toggleMusic();
      return;
    }
    
    setPlayerReady(false);
    setCurrentStation(station);
    setIsMusicPlaying(true);
    
    if (isNoisePlaying) toggleNoise();
  };

  // Handle Noise Toggle
  const handleNoiseToggle = () => {
    // If noise starts, stop music
    if (!isNoisePlaying && isMusicPlaying) {
      setIsMusicPlaying(false);
    }
    toggleNoise();
  };

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out",
      isExpanded ? "w-80" : "w-auto"
    )}>
      {/* Reproductor oculto mediante iframe con la API de YouTube; solo audio */}
      <iframe
        key={currentStation.id}
        ref={iframeRef}
        src={getEmbedUrl(currentStation.url, { autoplay: false, origin: typeof window !== "undefined" ? window.location.origin : undefined })}
        title="Hidden audio player"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        onLoad={() => {
          // Give the iframe a tick to be ready for postMessage commands
          setPlayerReady(true);
          setTimeout(() => {
            postPlayerCommand("setVolume", [Math.round(musicVolume * 100)]);
            if (isMusicPlaying) postPlayerCommand("playVideo");
          }, 100);
        }}
        onError={() => {
          setIsMusicPlaying(false);
          toast.error("No se pudo cargar el audio. Prueba otra estación.");
        }}
      />

      {/* UI contenedor */}
      
      <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-md shadow-2xl overflow-hidden">
        {/* Header / Minimized View */}
        <div className="flex items-center justify-between p-3 bg-zinc-900/50 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              (isNoisePlaying || isMusicPlaying) ? "bg-emerald-500" : "bg-zinc-600"
            )} />
            <span className="text-sm font-medium text-zinc-200">
              {isExpanded ? "Focus Audio" : (
                isNoisePlaying ? "Brown Noise" : (isMusicPlaying ? currentStation.name : "Audio Off")
              )}
            </span>
          </div>
          <div className="flex items-center gap-1">
             {/* Quick Play/Pause when minimized */}
             {!isExpanded && (
               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                 e.stopPropagation();
                 if (isMusicPlaying) toggleMusic();
                 else toggleNoise();
               }}>
                 {(isNoisePlaying || isMusicPlaying) ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
               </Button>
             )}
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleExpanded}>
               {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
             </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
                <TabsTrigger value="noise" className="data-[state=active]:bg-zinc-800">
                  <Waves className="w-4 h-4 mr-2" /> Noise
                </TabsTrigger>
                <TabsTrigger value="music" className="data-[state=active]:bg-zinc-800">
                  <Radio className="w-4 h-4 mr-2" /> Music
                </TabsTrigger>
              </TabsList>
              
              {/* Noise Controls */}
              <TabsContent value="noise" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Brown Noise (Deep Focus)</span>
                  <Button 
                    size="sm"
                    variant={isNoisePlaying ? "default" : "outline"}
                    className={cn(
                      "h-8 px-4 transition-all",
                      isNoisePlaying ? "bg-emerald-600 hover:bg-emerald-700 border-transparent" : "border-zinc-700"
                    )}
                    onClick={handleNoiseToggle}
                  >
                    {isNoisePlaying ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                    {isNoisePlaying ? "Active" : "Start"}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <VolumeX className="w-3 h-3" />
                    <Volume2 className="w-3 h-3" />
                  </div>
                  <Slider 
                    value={[noiseVolume]} 
                    max={1} 
                    step={0.01} 
                    onValueChange={([val]) => setNoiseVolume(val)}
                    className="cursor-pointer"
                  />
                </div>
              </TabsContent>
              
              {/* Music Controls */}
              <TabsContent value="music" className="space-y-4 mt-4">
                <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
                    <Music2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex flex-col text-sm text-zinc-300">
                    <span className="font-semibold text-emerald-400">Audio en segundo plano</span>
                    <span className="text-xs text-zinc-500">El video de YouTube se reproduce oculto; solo escuchas el audio.</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {STATIONS.map(station => (
                    <button
                      key={station.id}
                      onClick={() => changeStation(station)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-md border transition-all text-center gap-1",
                        currentStation.id === station.id 
                          ? "bg-zinc-800 border-emerald-500/50 text-emerald-400" 
                          : "bg-zinc-900/50 border-transparent hover:bg-zinc-800 text-zinc-400"
                      )}
                    >
                      <Disc3 className={cn("w-4 h-4", currentStation.id === station.id && "animate-spin-slow")} />
                      <span className="text-[10px] font-medium">{station.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div className="text-xs text-zinc-400 flex flex-col">
                      <span>Now Playing:</span>
                      <span className="text-emerald-400 font-medium">{currentStation.label}</span>
                   </div>
                   <Button 
                    size="icon"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 rounded-full border-zinc-700",
                      isMusicPlaying && "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                    )}
                    onClick={toggleMusic}
                  >
                    {isMusicPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Slider 
                    value={[musicVolume]} 
                    max={1} 
                    step={0.01} 
                    onValueChange={([val]) => setMusicVolume(val)}
                    className="cursor-pointer"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Card>
    </div>
  );
}
