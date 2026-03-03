// NBA API client using balldontlie.io via local API routes
// Get your free API key at: https://www.balldontlie.io

import type { NbaGame, NbaPlayer } from "@/types/nba";

// Use local API routes (API key is kept server-side)
const API_BASE = "/api/nba";

// Balldontlie team IDs (different from NBA official IDs)
const TEAM_ID_MAP: Record<number, number> = {
  1: 1,   // Hawks
  2: 2,   // Celtics
  3: 3,   // Nets
  4: 4,   // Hornets
  5: 5,   // Bulls
  6: 6,   // Cavaliers
  7: 7,   // Mavericks
  8: 8,   // Nuggets
  9: 9,   // Pistons
  10: 10, // Warriors
  11: 11, // Rockets
  12: 12, // Pacers
  13: 13, // Clippers
  14: 14, // Lakers
  15: 15, // Grizzlies
  16: 16, // Heat
  17: 17, // Bucks
  18: 18, // Timberwolves
  19: 19, // Pelicans
  20: 20, // Knicks
  21: 21, // Thunder
  22: 22, // Magic
  23: 23, // 76ers
  24: 24, // Suns
  25: 25, // Trail Blazers
  26: 26, // Kings
  27: 27, // Spurs
  28: 28, // Raptors
  29: 29, // Jazz
  30: 30, // Wizards
};

// Get current NBA season
export function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

// Fetch team games via local API route
export async function fetchTeamGames(teamId: number): Promise<NbaGame[]> {
  const bdlTeamId = TEAM_ID_MAP[teamId];
  if (!bdlTeamId) return [];

  try {
    const response = await fetch(`${API_BASE}/games?teamId=${bdlTeamId}`);

    if (!response.ok) {
      return getFallbackGames(teamId);
    }

    const data = await response.json();

    if (data.error) {
      return getFallbackGames(teamId);
    }

    if (!data.data || data.data.length === 0) {
      return getFallbackGames(teamId);
    }

    // Take most recent games (already sorted by API route)
    // Include all finished games, not just "Final" status
    return data.data
      .filter((game: any) => game.home_team_score > 0 || game.visitor_team_score > 0)
      .slice(0, 10)
      .map((game: any) => ({
        id: game.id,
        date: game.date,
        season: game.season,
        status: game.status,
        period: game.period || 4,
        time: game.time || "",
        postseason: game.postseason || false,
        home_team: {
          id: game.home_team.id,
          abbreviation: game.home_team.abbreviation,
          city: game.home_team.city,
          conference: game.home_team.conference,
          division: game.home_team.division,
          full_name: game.home_team.full_name,
          name: game.home_team.name,
        },
        home_team_score: game.home_team_score,
        visitor_team: {
          id: game.visitor_team.id,
          abbreviation: game.visitor_team.abbreviation,
          city: game.visitor_team.city,
          conference: game.visitor_team.conference,
          division: game.visitor_team.division,
          full_name: game.visitor_team.full_name,
          name: game.visitor_team.name,
        },
        visitor_team_score: game.visitor_team_score,
      }));
  } catch {
    return getFallbackGames(teamId);
  }
}

// Fetch team roster via local API route
export async function fetchPlayersByTeam(teamId: number): Promise<NbaPlayer[]> {
  const bdlTeamId = TEAM_ID_MAP[teamId];
  if (!bdlTeamId) return [];

  try {
    const response = await fetch(`${API_BASE}/roster?teamId=${bdlTeamId}`);

    if (!response.ok) {
      return getFallbackRoster(teamId);
    }

    const data = await response.json();

    if (data.error) {
      return getFallbackRoster(teamId);
    }

    if (!data.data || data.data.length === 0) {
      return getFallbackRoster(teamId);
    }

    return data.data.map((player: any) => ({
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      position: player.position || "",
      height: player.height || "",
      weight: player.weight || "",
      jersey_number: player.jersey_number || "",
      college: "", // Not showing per user request
      country: player.country || "",
      draft_year: player.draft_year,
      draft_round: player.draft_round,
      draft_number: player.draft_number,
      team: {
        id: player.team.id,
        abbreviation: player.team.abbreviation,
        city: player.team.city,
        conference: player.team.conference,
        division: player.team.division,
        full_name: player.team.full_name,
        name: player.team.name,
      },
    }));
  } catch {
    return getFallbackRoster(teamId);
  }
}

// Format game date (European format)
export function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Determine if team won
export function didTeamWin(game: NbaGame, teamId: number): boolean {
  const isHome = game.home_team.id === teamId;
  if (isHome) {
    return game.home_team_score > game.visitor_team_score;
  }
  return game.visitor_team_score > game.home_team_score;
}

// Fallback games when API unavailable - shows "No API key" message
function getFallbackGames(teamId: number): NbaGame[] {
  // Return empty array - UI will show "No games found" or prompt for API key
  return [];
}

// No fallback roster - only use live API data to avoid outdated information
function getFallbackRoster(teamId: number): NbaPlayer[] {
  // Return empty - UI will show "No roster data" message prompting API key setup
  return [];
}
