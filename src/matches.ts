import worldCupData from '../worldcup.json';
import type { MatchScore, MatchWithScore, WorldCupData, WorldCupMatch } from './types';

const data = worldCupData as WorldCupData;

export const competitionName = data.name;

export const matches: MatchWithScore[] = data.matches
  .map((match) => ({
    ...match,
    matchId: createMatchId(match),
    score: null,
  }))
  .sort(compareMatches);

export function createMatchId(match: WorldCupMatch) {
  return [
    match.date,
    match.time,
    match.group,
    match.team1,
    match.team2,
    match.ground,
  ]
    .join('|')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function mergeScores(
  sourceMatches: MatchWithScore[],
  scores: MatchScore[],
): MatchWithScore[] {
  const scoresByMatch = new Map(scores.map((score) => [score.matchId, score]));

  return sourceMatches.map((match) => ({
    ...match,
    score: scoresByMatch.get(match.matchId) ?? null,
  }));
}

export function getGroups(sourceMatches: MatchWithScore[]) {
  return uniqueSorted(
    sourceMatches
      .map((match) => match.group)
      .filter((group): group is string => Boolean(group)),
    compareGroups,
  );
}

export function getDates(sourceMatches: MatchWithScore[]) {
  return uniqueSorted(sourceMatches.map((match) => match.date));
}

export function getTeams(sourceMatches: MatchWithScore[]) {
  return uniqueSorted(sourceMatches.flatMap((match) => [match.team1, match.team2]).filter(isTeamName));
}

export function formatDate(date: string, timeZone = 'UTC') {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatMatchTime(date: string, time: string, timeZone: string) {
  if (timeZone === 'match-local') {
    return time;
  }

  const matchDate = createMatchDate(date, time);

  if (!matchDate) {
    return time;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(matchDate);
}

export function getTeamFlag(team: string) {
  return teamFlags[team] ?? null;
}

function createMatchDate(date: string, time: string) {
  const match = time.match(/^(\d{2}):(\d{2}) UTC([+-]\d{1,2})$/);

  if (!match) {
    return null;
  }

  const [, hour, minute, offset] = match;
  const offsetSign = offset.startsWith('-') ? '-' : '+';
  const offsetHour = offset.replace(/[+-]/, '').padStart(2, '0');
  const normalizedOffset = `${offsetSign}${offsetHour}:00`;
  return new Date(`${date}T${hour}:${minute}:00${normalizedOffset}`);
}

function isTeamName(team: string) {
  return !/^(?:[123][A-L]|W\d+|L\d+|3[A-L/]+)$/.test(team);
}

const teamFlags: Record<string, string> = {
  Algeria: '🇩🇿',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  'Bosnia & Herzegovina': '🇧🇦',
  Brazil: '🇧🇷',
  Canada: '🇨🇦',
  'Cape Verde': '🇨🇻',
  Colombia: '🇨🇴',
  Croatia: '🇭🇷',
  'Curaçao': '🇨🇼',
  'Czech Republic': '🇨🇿',
  'DR Congo': '🇨🇩',
  Ecuador: '🇪🇨',
  Egypt: '🇪🇬',
  England: '🏴',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Ghana: '🇬🇭',
  Haiti: '🇭🇹',
  Iran: '🇮🇷',
  Iraq: '🇮🇶',
  'Ivory Coast': '🇨🇮',
  Japan: '🇯🇵',
  Jordan: '🇯🇴',
  Mexico: '🇲🇽',
  Morocco: '🇲🇦',
  Netherlands: '🇳🇱',
  'New Zealand': '🇳🇿',
  Norway: '🇳🇴',
  Panama: '🇵🇦',
  Paraguay: '🇵🇾',
  Portugal: '🇵🇹',
  Qatar: '🇶🇦',
  'Saudi Arabia': '🇸🇦',
  Scotland: '🏴',
  Senegal: '🇸🇳',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Tunisia: '🇹🇳',
  Turkey: '🇹🇷',
  USA: '🇺🇸',
  Uruguay: '🇺🇾',
  Uzbekistan: '🇺🇿',
};

function compareMatches(a: MatchWithScore, b: MatchWithScore) {
  return `${a.date} ${timeSortKey(a.time)}`.localeCompare(`${b.date} ${timeSortKey(b.time)}`);
}

function timeSortKey(time: string) {
  const [clock] = time.split(' ');
  return clock;
}

function compareGroups(a: string, b: string) {
  const groupA = a.replace('Group ', '');
  const groupB = b.replace('Group ', '');
  return groupA.localeCompare(groupB, 'en-US', { numeric: true });
}

function uniqueSorted(values: string[], compareFn?: (a: string, b: string) => number) {
  return [...new Set(values)].sort(compareFn);
}
