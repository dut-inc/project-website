// lib/sports/teamService.ts
//
// Data-access boundary for the Seattle Sports Dashboard.
//
//   React components  →  TeamService  →  Mock data
//                     →  TeamService  →  GET /api/teams  →  providers (now)
//
// The UI only ever talks to `TeamService`. Today `httpTeamService` fetches
// the backend endpoint `GET /api/teams` (server-side provider layer in
// lib/backend/). If the backend is unreachable, it degrades gracefully to
// `mockTeamService` so the page still works. The service contract is async,
// so the eventual Supabase-backed service drops in with zero component
// changes.

import { useEffect, useState } from "react";
import type { Team } from "./types";
import { mockTeams } from "./mockTeams";

export interface DashboardMetadata {
  /** ISO date the data snapshot reflects. */
  asOf: string;
  source: "mock" | "live";
  note?: string;
}

export interface TeamService {
  /** All teams, in the default presentation order. */
  getTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  /** Snapshot info for the page header badge. */
  getMetadata(): Promise<DashboardMetadata>;
}

export const mockTeamService: TeamService = {
  async getTeams() {
    return mockTeams;
  },
  async getTeam(id) {
    return mockTeams.find((t) => t.id === id);
  },
  async getMetadata() {
    return {
      asOf: "2026-08-04",
      source: "mock",
      note: "Sample data while the Supabase backend is in development.",
    };
  },
};

/**
 * Live backend service: GET /api/teams → the server-side provider layer.
 * All external sports APIs are called server-side; the browser only ever
 * talks to this one endpoint.
 */
export const httpTeamService: TeamService = {
  async getTeams() {
    const res = await fetch("/api/teams", { cache: "no-store" });
    if (!res.ok) throw new Error(`Dashboard API responded ${res.status}`);
    const data: { teams?: Team[]; metadata?: DashboardMetadata } = await res.json();
    if (!Array.isArray(data.teams)) throw new Error("Dashboard API returned no teams");
    return data.teams;
  },
  async getTeam(id) {
    const teams = await this.getTeams();
    return teams.find((t) => t.id === id);
  },
  async getMetadata() {
    const res = await fetch("/api/teams", { cache: "no-store" });
    if (!res.ok) throw new Error(`Dashboard API responded ${res.status}`);
    const data: { metadata?: DashboardMetadata } = await res.json();
    if (!data.metadata) throw new Error("Dashboard API returned no metadata");
    return data.metadata;
  },
};

/**
 * Resilient default: use live backend data, fall back to the mock snapshot
 * if the API is unavailable (offline dev, backend not deployed yet).
 */
export const defaultTeamService: TeamService = {
  async getTeams() {
    try {
      return await httpTeamService.getTeams();
    } catch {
      return mockTeamService.getTeams();
    }
  },
  async getTeam(id) {
    try {
      return await httpTeamService.getTeam(id);
    } catch {
      return mockTeamService.getTeam(id);
    }
  },
  async getMetadata() {
    try {
      return await httpTeamService.getMetadata();
    } catch {
      return mockTeamService.getMetadata();
    }
  },
};

export function useTeams(service: TeamService = defaultTeamService) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [metadata, setMetadata] = useState<DashboardMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([service.getTeams(), service.getMetadata()]).then(([teamData, meta]) => {
      if (cancelled) return;
      setTeams(teamData);
      setMetadata(meta);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [service]);

  return { teams, metadata, loading };
}
