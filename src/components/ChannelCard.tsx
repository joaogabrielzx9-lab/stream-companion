import { Channel } from "@/lib/m3u-parser";

interface ChannelCardProps {
  channel: Channel;
  onClick: () => void;
}

const ChannelCard = ({ channel, onClick }: ChannelCardProps) => {
  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary hover:-translate-y-1 hover:shadow-[0_12px_28px_hsl(var(--primary)/0.15)]"
    >
      <div className="h-28 bg-secondary flex items-center justify-center p-3.5 border-b border-border relative">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="max-w-full max-h-20 object-contain"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <span className={`text-muted-foreground text-3xl ${channel.logo ? "hidden" : ""}`}>
          📺
        </span>
        <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-0 group-hover:opacity-100 transition-opacity bg-primary/30">
          ▶
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug mb-1.5">
          {channel.name}
        </p>
        <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md inline-block">
          {channel.group}
        </span>
      </div>
    </div>
  );
};

export default ChannelCard;
