export interface Channel {
  name: string;
  url: string;
  logo: string;
  group: string;
}

export function parseM3U(content: string): Channel[] {
  const lines = content.split("\n");
  const channels: Channel[] = [];
  let current: Partial<Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF")) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const nameMatch = line.match(/,(.+)$/);

      current = {
        logo: logoMatch?.[1] || "",
        group: groupMatch?.[1] || "Sem grupo",
        name: nameMatch?.[1]?.trim() || "Canal desconhecido",
      };
    } else if (line && !line.startsWith("#") && current.name) {
      channels.push({ ...current, url: line } as Channel);
      current = {};
    }
  }

  return channels;
}

export function getGroups(channels: Channel[]): string[] {
  const groups = new Set(channels.map((c) => c.group));
  return ["Todos", ...Array.from(groups).sort()];
}
