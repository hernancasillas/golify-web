// Minimal API-Football v3 type shims used by the World Cup bracket engine.
// Mirror (subset) of the shapes the app's engine consumes so the bracket code
// ports verbatim. Only the fields the engine reads are kept.

export interface APIFootballFixture {
  fixture: {
    id: number;
    timezone: string;
    date: string;
    timestamp?: number;
    venue?: { id: number | null; name: string | null; city: string | null };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

export interface APIFootballStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home?: unknown;
  away?: unknown;
  update?: string;
}
