export interface NbaTeam {
  id: number;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  full_name: string;
  name: string;
}

export interface NbaPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: NbaTeam;
}

export interface NbaGame {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: NbaTeam;
  home_team_score: number;
  visitor_team: NbaTeam;
  visitor_team_score: number;
}

export interface NbaPlayerStats {
  id: number;
  min: string;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
  player: NbaPlayer;
  game: NbaGame;
  team: NbaTeam;
}

export interface NbaSeasonAverages {
  games_played: number;
  player_id: number;
  season: number;
  min: string;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
}

// Team display data for map
export interface TeamMapData {
  id: number;
  abbr: string;
  name: string;
  city: string;
  fullName: string;
  x: number;
  y: number;
  color: string;
  conference: "East" | "West";
  standing?: number; // Position in conference standings
  logo: string; // Team logo URL
}

// ESPN CDN for NBA team logos
const ESPN_LOGO_BASE = "https://a.espncdn.com/i/teamlogos/nba/500";

// Get logo URL by team abbreviation
export function getTeamLogo(abbr: string): string {
  // Map abbreviations to ESPN's naming convention
  const logoMap: Record<string, string> = {
    ATL: "atl", BOS: "bos", BKN: "bkn", CHA: "cha", CHI: "chi",
    CLE: "cle", DAL: "dal", DEN: "den", DET: "det", GSW: "gs",
    HOU: "hou", IND: "ind", LAC: "lac", LAL: "lal", MEM: "mem",
    MIA: "mia", MIL: "mil", MIN: "min", NOP: "no", NYK: "ny",
    OKC: "okc", ORL: "orl", PHI: "phi", PHX: "phx", POR: "por",
    SAC: "sac", SAS: "sa", TOR: "tor", UTA: "utah", WAS: "wsh",
  };
  return `${ESPN_LOGO_BASE}/${logoMap[abbr] || abbr.toLowerCase()}.png`;
}

// All 30 NBA teams with map coordinates and conference standings
export const NBA_TEAMS: TeamMapData[] = [
  // Eastern Conference
  { id: 1, abbr: "ATL", name: "Hawks", city: "Atlanta", fullName: "Atlanta Hawks", x: 79, y: 60, color: "#E03A3E", conference: "East", standing: 10, logo: getTeamLogo("ATL") },
  { id: 2, abbr: "BOS", name: "Celtics", city: "Boston", fullName: "Boston Celtics", x: 93, y: 28, color: "#007A33", conference: "East", standing: 2, logo: getTeamLogo("BOS") },
  { id: 3, abbr: "BKN", name: "Nets", city: "Brooklyn", fullName: "Brooklyn Nets", x: 90, y: 32, color: "#000000", conference: "East", standing: 13, logo: getTeamLogo("BKN") },
  { id: 4, abbr: "CHA", name: "Hornets", city: "Charlotte", fullName: "Charlotte Hornets", x: 82, y: 55, color: "#1D1160", conference: "East", standing: 14, logo: getTeamLogo("CHA") },
  { id: 5, abbr: "CHI", name: "Bulls", city: "Chicago", fullName: "Chicago Bulls", x: 68, y: 36, color: "#CE1141", conference: "East", standing: 9, logo: getTeamLogo("CHI") },
  { id: 6, abbr: "CLE", name: "Cavaliers", city: "Cleveland", fullName: "Cleveland Cavaliers", x: 77, y: 36, color: "#860038", conference: "East", standing: 1, logo: getTeamLogo("CLE") },
  { id: 9, abbr: "DET", name: "Pistons", city: "Detroit", fullName: "Detroit Pistons", x: 75, y: 32, color: "#C8102E", conference: "East", standing: 11, logo: getTeamLogo("DET") },
  { id: 12, abbr: "IND", name: "Pacers", city: "Indiana", fullName: "Indiana Pacers", x: 72, y: 40, color: "#002D62", conference: "East", standing: 5, logo: getTeamLogo("IND") },
  { id: 16, abbr: "MIA", name: "Heat", city: "Miami", fullName: "Miami Heat", x: 85, y: 82, color: "#98002E", conference: "East", standing: 7, logo: getTeamLogo("MIA") },
  { id: 17, abbr: "MIL", name: "Bucks", city: "Milwaukee", fullName: "Milwaukee Bucks", x: 68, y: 32, color: "#00471B", conference: "East", standing: 4, logo: getTeamLogo("MIL") },
  { id: 20, abbr: "NYK", name: "Knicks", city: "New York", fullName: "New York Knicks", x: 88, y: 30, color: "#F58426", conference: "East", standing: 3, logo: getTeamLogo("NYK") },
  { id: 22, abbr: "ORL", name: "Magic", city: "Orlando", fullName: "Orlando Magic", x: 82, y: 75, color: "#0077C0", conference: "East", standing: 6, logo: getTeamLogo("ORL") },
  { id: 23, abbr: "PHI", name: "76ers", city: "Philadelphia", fullName: "Philadelphia 76ers", x: 87, y: 35, color: "#006BB6", conference: "East", standing: 8, logo: getTeamLogo("PHI") },
  { id: 28, abbr: "TOR", name: "Raptors", city: "Toronto", fullName: "Toronto Raptors", x: 80, y: 20, color: "#CE1141", conference: "East", standing: 12, logo: getTeamLogo("TOR") },
  { id: 30, abbr: "WAS", name: "Wizards", city: "Washington", fullName: "Washington Wizards", x: 84, y: 42, color: "#002B5C", conference: "East", standing: 15, logo: getTeamLogo("WAS") },
  // Western Conference
  { id: 7, abbr: "DAL", name: "Mavericks", city: "Dallas", fullName: "Dallas Mavericks", x: 50, y: 65, color: "#00538C", conference: "West", standing: 5, logo: getTeamLogo("DAL") },
  { id: 8, abbr: "DEN", name: "Nuggets", city: "Denver", fullName: "Denver Nuggets", x: 35, y: 42, color: "#0E2240", conference: "West", standing: 4, logo: getTeamLogo("DEN") },
  { id: 10, abbr: "GSW", name: "Warriors", city: "Golden State", fullName: "Golden State Warriors", x: 8, y: 42, color: "#1D428A", conference: "West", standing: 9, logo: getTeamLogo("GSW") },
  { id: 11, abbr: "HOU", name: "Rockets", city: "Houston", fullName: "Houston Rockets", x: 52, y: 72, color: "#CE1141", conference: "West", standing: 3, logo: getTeamLogo("HOU") },
  { id: 13, abbr: "LAC", name: "Clippers", city: "Los Angeles", fullName: "LA Clippers", x: 10, y: 55, color: "#C8102E", conference: "West", standing: 10, logo: getTeamLogo("LAC") },
  { id: 14, abbr: "LAL", name: "Lakers", city: "Los Angeles", fullName: "Los Angeles Lakers", x: 12, y: 52, color: "#552583", conference: "West", standing: 6, logo: getTeamLogo("LAL") },
  { id: 15, abbr: "MEM", name: "Grizzlies", city: "Memphis", fullName: "Memphis Grizzlies", x: 62, y: 56, color: "#5D76A9", conference: "West", standing: 2, logo: getTeamLogo("MEM") },
  { id: 18, abbr: "MIN", name: "Timberwolves", city: "Minnesota", fullName: "Minnesota Timberwolves", x: 55, y: 22, color: "#0C2340", conference: "West", standing: 7, logo: getTeamLogo("MIN") },
  { id: 19, abbr: "NOP", name: "Pelicans", city: "New Orleans", fullName: "New Orleans Pelicans", x: 60, y: 70, color: "#0C2340", conference: "West", standing: 12, logo: getTeamLogo("NOP") },
  { id: 21, abbr: "OKC", name: "Thunder", city: "Oklahoma City", fullName: "Oklahoma City Thunder", x: 48, y: 52, color: "#007AC1", conference: "West", standing: 1, logo: getTeamLogo("OKC") },
  { id: 24, abbr: "PHX", name: "Suns", city: "Phoenix", fullName: "Phoenix Suns", x: 22, y: 58, color: "#1D1160", conference: "West", standing: 8, logo: getTeamLogo("PHX") },
  { id: 25, abbr: "POR", name: "Trail Blazers", city: "Portland", fullName: "Portland Trail Blazers", x: 8, y: 20, color: "#E03A3E", conference: "West", standing: 13, logo: getTeamLogo("POR") },
  { id: 26, abbr: "SAC", name: "Kings", city: "Sacramento", fullName: "Sacramento Kings", x: 8, y: 38, color: "#5A2D81", conference: "West", standing: 11, logo: getTeamLogo("SAC") },
  { id: 27, abbr: "SAS", name: "Spurs", city: "San Antonio", fullName: "San Antonio Spurs", x: 45, y: 75, color: "#C4CED4", conference: "West", standing: 14, logo: getTeamLogo("SAS") },
  { id: 29, abbr: "UTA", name: "Jazz", city: "Utah", fullName: "Utah Jazz", x: 25, y: 38, color: "#002B5C", conference: "West", standing: 15, logo: getTeamLogo("UTA") },
];

// Helper to get team by ID
export function getTeamById(id: number): TeamMapData | undefined {
  return NBA_TEAMS.find((t) => t.id === id);
}

// Helper to get team by abbreviation
export function getTeamByAbbr(abbr: string): TeamMapData | undefined {
  return NBA_TEAMS.find((t) => t.abbr === abbr.toUpperCase());
}
