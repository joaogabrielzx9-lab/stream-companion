import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Channel } from "@/lib/m3u-parser";

interface VideoPlayerProps {
  channel: Channel | null;
  onClose: () => void;
}

const VideoPlayer = ({ channel, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!channel || !videoRef.current) return;
    setError(false);

    const video = videoRef.current;
    const url = channel.url;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError(true);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
    } else {
      video.src = url;
      video.play().catch(() => setError(true));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel]);

  if (!channel) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/97 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-card border-b border-border flex-wrap">
        <h2 className="font-display font-bold text-base flex-1 min-w-0 truncate">
          {channel.name}
        </h2>
        <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-xl whitespace-nowrap">
          {channel.group}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(channel.url);
          }}
          className="px-3.5 py-2 bg-cast/10 border border-cast/30 text-cast rounded-lg text-sm font-semibold transition-all hover:bg-cast/20 whitespace-nowrap"
        >
          🔗 Copiar link
        </button>
        <button
          onClick={onClose}
          className="px-3.5 py-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm font-medium transition-all hover:bg-destructive/20 whitespace-nowrap"
        >
          ✕ Fechar
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center bg-background overflow-hidden">
        {error ? (
          <div className="text-center p-10">
            <p className="text-5xl mb-3">📡</p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Não foi possível reproduzir no navegador.<br />
              O stream pode estar offline ou usar protocolo não suportado.
            </p>
            <a
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              ↗ Abrir link externo
            </a>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            playsInline
          />
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
