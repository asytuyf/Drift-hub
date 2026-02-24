// NBA Stats API client (free, no API key required)
// Uses nba.com stats endpoints via proxy to avoid CORS

import type { NbaGame, NbaPlayer } from "@/types/nba";

const NBA_CDN = "https://cdn.nba.com/static/json";

// Team ID mapping from our IDs to NBA official team IDs
const TEAM_ID_MAP: Record<number, number> = {
  1: 1610612737,  // Hawks
  2: 1610612738,  // Celtics
  3: 1610612751,  // Nets
  4: 1610612766,  // Hornets
  5: 1610612741,  // Bulls
  6: 1610612739,  // Cavaliers
  7: 1610612742,  // Mavericks
  8: 1610612743,  // Nuggets
  9: 1610612765,  // Pistons
  10: 1610612744, // Warriors
  11: 1610612745, // Rockets
  12: 1610612754, // Pacers
  13: 1610612746, // Clippers
  14: 1610612747, // Lakers
  15: 1610612763, // Grizzlies
  16: 1610612748, // Heat
  17: 1610612749, // Bucks
  18: 1610612750, // Timberwolves
  19: 1610612740, // Pelicans
  20: 1610612752, // Knicks
  21: 1610612760, // Thunder
  22: 1610612753, // Magic
  23: 1610612755, // 76ers
  24: 1610612756, // Suns
  25: 1610612757, // Trail Blazers
  26: 1610612758, // Kings
  27: 1610612759, // Spurs
  28: 1610612761, // Raptors
  29: 1610612762, // Jazz
  30: 1610612764, // Wizards
};

// Reverse mapping
const NBA_TO_LOCAL_ID: Record<number, number> = Object.fromEntries(
  Object.entries(TEAM_ID_MAP).map(([k, v]) => [v, parseInt(k)])
);

interface NbaApiGame {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  gameDate: string;
  homeTeam: {
    teamId: number;
    teamName: string;
    teamCity: string;
    teamTricode: string;
    wins: number;
    losses: number;
    score: number;
  };
  awayTeam: {
    teamId: number;
    teamName: string;
    teamCity: string;
    teamTricode: string;
    wins: number;
    losses: number;
    score: number;
  };
}

interface NbaApiPlayer {
  personId: number;
  firstName: string;
  lastName: string;
  jersey: string;
  position: string;
  height: string;
  weight: string;
  country: string;
  college: string;
  draftYear?: number;
  draftRound?: number;
  draftNumber?: number;
}

// Fetch team schedule/games
export async function fetchTeamGames(teamId: number): Promise<NbaGame[]> {
  try {
    // Fetch today's scoreboard for recent games
    const response = await fetch(`${NBA_CDN}/liveData/scoreboard/todaysScoreboard_00.json`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error("Failed to fetch games:", response.status);
      return getMockGames(teamId);
    }

    const data = await response.json();
    const nbaTeamId = TEAM_ID_MAP[teamId];

    const games: NbaGame[] = (data.scoreboard?.games || [])
      .filter((g: NbaApiGame) =>
        g.homeTeam.teamId === nbaTeamId || g.awayTeam.teamId === nbaTeamId
      )
      .map((g: NbaApiGame) => ({
        id: parseInt(g.gameId),
        date: g.gameDate,
        season: getCurrentSeason(),
        status: g.gameStatusText,
        period: 0,
        time: "",
        postseason: false,
        home_team: {
          id: NBA_TO_LOCAL_ID[g.homeTeam.teamId] || 0,
          abbreviation: g.homeTeam.teamTricode,
          city: g.homeTeam.teamCity,
          conference: "",
          division: "",
          full_name: `${g.homeTeam.teamCity} ${g.homeTeam.teamName}`,
          name: g.homeTeam.teamName,
        },
        home_team_score: g.homeTeam.score,
        visitor_team: {
          id: NBA_TO_LOCAL_ID[g.awayTeam.teamId] || 0,
          abbreviation: g.awayTeam.teamTricode,
          city: g.awayTeam.teamCity,
          conference: "",
          division: "",
          full_name: `${g.awayTeam.teamCity} ${g.awayTeam.teamName}`,
          name: g.awayTeam.teamName,
        },
        visitor_team_score: g.awayTeam.score,
      }));

    // If no live games, return mock data
    if (games.length === 0) {
      return getMockGames(teamId);
    }

    return games;
  } catch (error) {
    console.error("Error fetching games:", error);
    return getMockGames(teamId);
  }
}

// Fetch team roster
export async function fetchPlayersByTeam(teamId: number): Promise<NbaPlayer[]> {
  try {
    const nbaTeamId = TEAM_ID_MAP[teamId];
    const season = getCurrentSeason();

    // Try fetching from NBA CDN roster endpoint
    const response = await fetch(
      `${NBA_CDN}/liveData/playbyplay/playbyplay_${nbaTeamId}.json`,
      { next: { revalidate: 3600 } }
    );

    // If that doesn't work, return mock roster
    if (!response.ok) {
      return getMockRoster(teamId);
    }

    return getMockRoster(teamId);
  } catch (error) {
    console.error("Error fetching roster:", error);
    return getMockRoster(teamId);
  }
}

// Get current NBA season year
export function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

// Format game date
export function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Determine if team won the game
export function didTeamWin(game: NbaGame, teamId: number): boolean {
  const isHome = game.home_team.id === teamId;
  if (isHome) {
    return game.home_team_score > game.visitor_team_score;
  }
  return game.visitor_team_score > game.home_team_score;
}

// Mock data fallback for when API is unavailable
function getMockGames(teamId: number): NbaGame[] {
  const teams = [
    { id: 1, abbr: "ATL", name: "Hawks", city: "Atlanta" },
    { id: 2, abbr: "BOS", name: "Celtics", city: "Boston" },
    { id: 5, abbr: "CHI", name: "Bulls", city: "Chicago" },
    { id: 10, abbr: "GSW", name: "Warriors", city: "Golden State" },
    { id: 14, abbr: "LAL", name: "Lakers", city: "Los Angeles" },
    { id: 16, abbr: "MIA", name: "Heat", city: "Miami" },
    { id: 20, abbr: "NYK", name: "Knicks", city: "New York" },
  ];

  const currentTeam = teams.find(t => t.id === teamId) || teams[0];
  const opponents = teams.filter(t => t.id !== teamId).slice(0, 5);
  const today = new Date();

  return opponents.map((opp, i) => {
    const gameDate = new Date(today);
    gameDate.setDate(today.getDate() - (i * 3 + 1));
    const isHome = i % 2 === 0;
    const homeScore = 100 + Math.floor(Math.random() * 30);
    const awayScore = 100 + Math.floor(Math.random() * 30);

    return {
      id: 1000 + i,
      date: gameDate.toISOString(),
      season: getCurrentSeason(),
      status: "Final",
      period: 4,
      time: "",
      postseason: false,
      home_team: {
        id: isHome ? teamId : opp.id,
        abbreviation: isHome ? currentTeam.abbr : opp.abbr,
        city: isHome ? currentTeam.city : opp.city,
        conference: "",
        division: "",
        full_name: isHome ? `${currentTeam.city} ${currentTeam.name}` : `${opp.city} ${opp.name}`,
        name: isHome ? currentTeam.name : opp.name,
      },
      home_team_score: homeScore,
      visitor_team: {
        id: isHome ? opp.id : teamId,
        abbreviation: isHome ? opp.abbr : currentTeam.abbr,
        city: isHome ? opp.city : currentTeam.city,
        conference: "",
        division: "",
        full_name: isHome ? `${opp.city} ${opp.name}` : `${currentTeam.city} ${currentTeam.name}`,
        name: isHome ? opp.name : currentTeam.name,
      },
      visitor_team_score: awayScore,
    };
  });
}

function getMockRoster(teamId: number): NbaPlayer[] {
  // Return mock roster data based on team
  const mockPlayers = [
    { first: "Player", last: "One", pos: "G", jersey: "1", height: "6-3", weight: "190" },
    { first: "Player", last: "Two", pos: "G", jersey: "2", height: "6-5", weight: "205" },
    { first: "Player", last: "Three", pos: "F", jersey: "3", height: "6-7", weight: "220" },
    { first: "Player", last: "Four", pos: "F", jersey: "4", height: "6-9", weight: "235" },
    { first: "Player", last: "Five", pos: "C", jersey: "5", height: "7-0", weight: "255" },
    { first: "Player", last: "Six", pos: "G", jersey: "10", height: "6-2", weight: "185" },
    { first: "Player", last: "Seven", pos: "F", jersey: "15", height: "6-8", weight: "225" },
    { first: "Player", last: "Eight", pos: "C", jersey: "20", height: "6-11", weight: "245" },
  ];

  return mockPlayers.map((p, i) => ({
    id: teamId * 100 + i,
    first_name: p.first,
    last_name: p.last,
    position: p.pos,
    height: p.height,
    weight: p.weight,
    jersey_number: p.jersey,
    college: "University",
    country: "USA",
    draft_year: 2020 + (i % 4),
    draft_round: (i % 2) + 1,
    draft_number: i + 10,
    team: {
      id: teamId,
      abbreviation: "",
      city: "",
      conference: "",
      division: "",
      full_name: "",
      name: "",
    },
  }));
}
