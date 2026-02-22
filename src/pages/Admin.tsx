import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  expires_at: string | null;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState<"week" | "month">("month");
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchUsers();
    fetchPlaylistUrl();
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as UserProfile[]) || []);
    setLoadingUsers(false);
  };

  const fetchPlaylistUrl = async () => {
    const { data } = await supabase.from("playlist_config").select("playlist_url").limit(1).maybeSingle();
    if (data) setPlaylistUrl(data.playlist_url);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormMsg("");

    const now = new Date();
    const expiresAt = new Date(now);
    if (newDuration === "week") expiresAt.setDate(expiresAt.getDate() + 7);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        email: newEmail,
        password: newPassword,
        display_name: newName || newEmail.split("@")[0],
        expires_at: expiresAt.toISOString(),
      },
    });

    if (error || data?.error) {
      setFormMsg(`Erro: ${data?.error || error?.message}`);
    } else {
      setFormMsg("Usuário criado com sucesso!");
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      fetchUsers();
    }
    setCreating(false);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: userId },
    });
    if (!error && !data?.error) fetchUsers();
  };

  const updateExpiration = async (userId: string, duration: "week" | "month") => {
    const now = new Date();
    const expiresAt = new Date(now);
    if (duration === "week") expiresAt.setDate(expiresAt.getDate() + 7);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    await supabase
      .from("profiles")
      .update({ expires_at: expiresAt.toISOString() })
      .eq("user_id", userId);
    fetchUsers();
  };

  const savePlaylistUrl = async () => {
    setSavingUrl(true);
    const { data: existing } = await supabase.from("playlist_config").select("id").limit(1).maybeSingle();
    if (existing) {
      await supabase.from("playlist_config").update({ playlist_url: playlistUrl, updated_by: user!.id }).eq("id", existing.id);
    } else {
      await supabase.from("playlist_config").insert({ playlist_url: playlistUrl, updated_by: user!.id });
    }
    setSavingUrl(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-9 h-9 border-3 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Sem limite";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <h1 className="font-display font-extrabold text-xl gradient-text">
          ⚙️ Painel Admin
        </h1>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            Voltar
          </a>
          <button onClick={signOut} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Playlist URL */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">📡 URL da Playlist</h2>
          <div className="flex gap-3">
            <input
              type="url"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://exemplo.com/playlist.m3u"
              className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground"
            />
            <button
              onClick={savePlaylistUrl}
              disabled={savingUrl}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
            >
              {savingUrl ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </section>

        {/* Create User */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">➕ Criar Usuário</h2>
          <form onSubmit={createUser} className="grid sm:grid-cols-2 gap-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="Email"
              className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Senha (mín. 6 caracteres)"
              className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome (opcional)"
              className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground"
            />
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value as "week" | "month")}
              className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="week">1 Semana</option>
              <option value="month">1 Mês</option>
            </select>
            <div className="sm:col-span-2 flex items-center gap-4">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {creating ? "Criando..." : "Criar Usuário"}
              </button>
              {formMsg && (
                <span className={`text-sm ${formMsg.includes("Erro") ? "text-destructive" : "text-cast"}`}>
                  {formMsg}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Users List */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">👥 Usuários ({users.length})</h2>
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum usuário cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.user_id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-secondary border rounded-lg ${
                    isExpired(u.expires_at) ? "border-destructive/30" : "border-border"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {u.display_name || u.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    <p className={`text-xs mt-1 ${isExpired(u.expires_at) ? "text-destructive" : "text-cast"}`}>
                      {isExpired(u.expires_at) ? "⛔ Expirado" : "✅ Ativo"} — Expira: {formatDate(u.expires_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateExpiration(u.user_id, "week")}
                      className="px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-md text-xs font-medium hover:bg-accent/20 transition-colors"
                    >
                      +1 Semana
                    </button>
                    <button
                      onClick={() => updateExpiration(u.user_id, "month")}
                      className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-md text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      +1 Mês
                    </button>
                    <button
                      onClick={() => deleteUser(u.user_id)}
                      className="px-3 py-1.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-xs font-medium hover:bg-destructive/20 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Admin;
