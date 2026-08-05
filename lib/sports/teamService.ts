// lib/sports/teamService.ts
//
// Data-access boundary for the Seattle Sports Dashboard.
//
//   React components  →  TeamService  →  Mock data (for now)
//                     →  TeamService  →  Supabase / backend (later)
//
// The UI only ever talks to `TeamService`. Today `mockTeamService` returns
// static data; when the Supabase/backend layer is ready, swap the default
// below for a `SupabaseTeamService` implementing the same interface and no
// component needs to change. The service contract is intentionally async
// from day one so a real network round-trip drops in without refactoring.

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

/** Swap this default for the real implementation once the backend exists. */
export const defaultTeamService: TeamService = mockTeamService;

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
