import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { parseM3U, getGroups, Channel } from "@/lib/m3u-parser";
import ChannelCard from "@/components/ChannelCard";
import VideoPlayer from "@/components/VideoPlayer";

const Index = () => {
  const { user, isAdmin, isActive, loading: authLoading, signOut } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("Todos");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!user || !isActive) return;

    const fetchPlaylist = async () => {
      setLoadingChannels(true);
      setError("");

      const { data: config } = await supabase
        .from("playlist_config")
        .select("playlist_url")
        .limit(1)
        .maybeSingle();

      if (!config?.playlist_url) {
        setError("Nenhuma playlist configurada. Peça ao administrador para configurar.");
        setLoadingChannels(false);
        return;
      }

      try {
        const res = await fetch(config.playlist_url);
        if (!res.ok) throw new Error("Falha ao carregar playlist");
        const text = await res.text();
        const parsed = parseM3U(text);
        setChannels(parsed);
      } catch {
        setError("Erro ao carregar a playlist. Verifique a URL.");
      }
      setLoadingChannels(false);
    };

    fetchPlaylist();
  }, [user, isActive]);

  const groups = useMemo(() => getGroups(channels), [channels]);

  const filtered = useMemo(() => {
    let result = channels;
    if (activeGroup !== "Todos") {
      result = result.filter((c) => c.group === activeGroup);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q)
      );
    }
    return result;
  }, [channels, activeGroup, search]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-9 h-9 border-3 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">⏰</p>
          <h2 className="font-display font-bold text-xl mb-2">Acesso expirado</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Seu plano expirou. Entre em contato com o administrador para renovar.
          </p>
          <button
            onClick={signOut}
            className="px-6 py-2.5 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <h1 className="font-display font-extrabold text-xl gradient-text">
          📺 IPTV 2025
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
            {channels.length} canais
          </span>
          {isAdmin && (
            <a
              href="/admin"
              className="text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors"
            >
              Admin
            </a>
          )}
          <button
            onClick={signOut}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 sm:p-8 gap-6">
        {/* Search + Tabs */}
        <div className="flex flex-col gap-4">
          <div className="relative max-w-lg">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar canal..."
              className="w-full pl-11 pr-10 py-3 bg-card border border-border rounded-xl text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-secondary rounded-full text-muted-foreground text-xs flex items-center justify-center hover:bg-border transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  activeGroup === group
                    ? "bg-primary border-primary text-primary-foreground font-semibold"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loadingChannels ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-9 h-9 border-3 border-border border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">Carregando lista...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 text-destructive/80 text-sm leading-relaxed">
            ⚠️ {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-muted-foreground text-sm">Nenhum canal encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((channel, i) => (
              <ChannelCard
                key={`${channel.name}-${i}`}
                channel={channel}
                onClick={() => setSelectedChannel(channel)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-muted-foreground text-xs border-t border-border">
        IPTV 2025 — Todos os direitos reservados
      </footer>

      <VideoPlayer
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
      />
    </div>
  );
};

export default Index;
