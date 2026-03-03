import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.balldontlie.io/v1";

// Mock roster data when API key not available
function getMockRoster(teamId: number) {
  const teams: Record<number, { name: string; abbr: string; city: string }> = {
    1: { name: "Hawks", abbr: "ATL", city: "Atlanta" },
    2: { name: "Celtics", abbr: "BOS", city: "Boston" },
    3: { name: "Nets", abbr: "BKN", city: "Brooklyn" },
    4: { name: "Hornets", abbr: "CHA", city: "Charlotte" },
    5: { name: "Bulls", abbr: "CHI", city: "Chicago" },
    6: { name: "Cavaliers", abbr: "CLE", city: "Cleveland" },
    7: { name: "Mavericks", abbr: "DAL", city: "Dallas" },
    8: { name: "Nuggets", abbr: "DEN", city: "Denver" },
    9: { name: "Pistons", abbr: "DET", city: "Detroit" },
    10: { name: "Warriors", abbr: "GSW", city: "Golden State" },
    11: { name: "Rockets", abbr: "HOU", city: "Houston" },
    12: { name: "Pacers", abbr: "IND", city: "Indiana" },
    13: { name: "Clippers", abbr: "LAC", city: "LA" },
    14: { name: "Lakers", abbr: "LAL", city: "Los Angeles" },
    15: { name: "Grizzlies", abbr: "MEM", city: "Memphis" },
    16: { name: "Heat", abbr: "MIA", city: "Miami" },
    17: { name: "Bucks", abbr: "MIL", city: "Milwaukee" },
    18: { name: "Timberwolves", abbr: "MIN", city: "Minnesota" },
    19: { name: "Pelicans", abbr: "NOP", city: "New Orleans" },
    20: { name: "Knicks", abbr: "NYK", city: "New York" },
    21: { name: "Thunder", abbr: "OKC", city: "Oklahoma City" },
    22: { name: "Magic", abbr: "ORL", city: "Orlando" },
    23: { name: "76ers", abbr: "PHI", city: "Philadelphia" },
    24: { name: "Suns", abbr: "PHX", city: "Phoenix" },
    25: { name: "Trail Blazers", abbr: "POR", city: "Portland" },
    26: { name: "Kings", abbr: "SAC", city: "Sacramento" },
    27: { name: "Spurs", abbr: "SAS", city: "San Antonio" },
    28: { name: "Raptors", abbr: "TOR", city: "Toronto" },
    29: { name: "Jazz", abbr: "UTA", city: "Utah" },
    30: { name: "Wizards", abbr: "WAS", city: "Washington" },
  };

  const team = teams[teamId] || teams[1];
  const positions = ["G", "G", "F", "F", "C", "G", "G", "F", "F", "C", "G", "F"];
  const firstNames = ["James", "Anthony", "Kevin", "Stephen", "LeBron", "Jayson", "Luka", "Giannis", "Joel", "Nikola", "Ja", "Devin"];
  const lastNames = ["Williams", "Davis", "Johnson", "Brown", "Smith", "Jones", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas"];

  return firstNames.map((firstName, i) => ({
    id: teamId * 100 + i,
    first_name: firstName,
    last_name: lastNames[i],
    position: positions[i],
    height: `6-${3 + (i % 6)}`,
    weight: String(180 + i * 5),
    jersey_number: String(i + 1),
    country: "USA",
    draft_year: 2018 + (i % 6),
    draft_round: 1,
    draft_number: 1 + i,
    team: {
      id: teamId,
      abbreviation: team.abbr,
      city: team.city,
      name: team.name,
      full_name: `${team.city} ${team.name}`,
      conference: teamId <= 15 ? "West" : "East",
      division: "",
    },
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get("teamId");

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
  }

  const API_KEY = process.env.BALLDONTLIE_API_KEY;

  // No API key - return mock data silently
  if (!API_KEY) {
    return NextResponse.json({ data: getMockRoster(parseInt(teamId)) });
  }

  try {
    const url = `${API_BASE}/players?team_ids[]=${teamId}&per_page=25`;

    const response = await fetch(url, {
      headers: { Authorization: API_KEY },
      cache: "no-store",
    });

    if (!response.ok) {
      // Fallback to mock data on API error
      return NextResponse.json({ data: getMockRoster(parseInt(teamId)) });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    // Fallback to mock data on any error
    return NextResponse.json({ data: getMockRoster(parseInt(teamId)) });
  }
}
