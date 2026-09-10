// National-team flag emoji + FIFA codes, keyed by API-Football team name.
// Ported from the app's sticker catalog (constants/stickers.ts). `aliases`
// absorb the name variants API-Football returns (e.g. "Korea Republic",
// "Czechia", "Türkiye", "Congo DR"). Group letters are the seeded draw and not
// used by the bracket engine (which reads live standings) — kept only as a hint.

interface WCTeam {
  code: string;
  name: string;
  flag: string;
  aliases?: string[];
}

const TEAMS: WCTeam[] = [
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'RSA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', aliases: ['Korea Republic'] },
  { code: 'CZE', name: 'Czech Republic', flag: '🇨🇿', aliases: ['Czechia'] },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'BIH', name: 'Bosnia & Herzegovina', flag: '🇧🇦', aliases: ['Bosnia and Herzegovina'] },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦' },
  { code: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MAR', name: 'Morocco', flag: '🇲🇦' },
  { code: 'HAI', name: 'Haiti', flag: '🇭🇹' },
  { code: 'SCO', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'USA', name: 'United States', flag: '🇺🇸', aliases: ['USA'] },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', aliases: ['Türkiye', 'Turkiye'] },
  { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  { code: 'CUW', name: 'Curaçao', flag: '🇨🇼', aliases: ['Curacao'] },
  { code: 'CIV', name: 'Ivory Coast', flag: '🇨🇮', aliases: ["Côte d'Ivoire"] },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'TUN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'BEL', name: 'Belgium', flag: '🇧🇪' },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬' },
  { code: 'IRN', name: 'Iran', flag: '🇮🇷', aliases: ['IR Iran'] },
  { code: 'NZL', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
  { code: 'CPV', name: 'Cape Verde', flag: '🇨🇻', aliases: ['Cape Verde Islands', 'Cabo Verde'] },
  { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'FRA', name: 'France', flag: '🇫🇷' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'IRQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'NOR', name: 'Norway', flag: '🇳🇴' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { code: 'ALG', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  { code: 'JOR', name: 'Jordan', flag: '🇯🇴' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { code: 'COD', name: 'DR Congo', flag: '🇨🇩', aliases: ['Congo DR', 'Congo-Kinshasa'] },
  { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'CRO', name: 'Croatia', flag: '🇭🇷' },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭' },
  { code: 'PAN', name: 'Panama', flag: '🇵🇦' },
];

const byName = new Map<string, WCTeam>();
for (const t of TEAMS) {
  byName.set(t.name, t);
  for (const a of t.aliases ?? []) byName.set(a, t);
}

/** Flag emoji for an API team name (empty string when unknown). */
export function getTeamFlagByName(name: string): string {
  return byName.get(name)?.flag ?? '';
}

/** 3-letter FIFA code for a team name; falls back to first 3 letters. */
export function getTeamCodeByName(name: string): string {
  return byName.get(name)?.code ?? name.slice(0, 3).toUpperCase();
}
