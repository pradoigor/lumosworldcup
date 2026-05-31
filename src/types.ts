export type WorldCupMatch = {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group: string | null;
  ground: string;
};

export type WorldCupData = {
  name: string;
  matches: WorldCupMatch[];
};

export type MatchScore = {
  matchId: string;
  team1Goals: number | null;
  team2Goals: number | null;
  updatedAt: string;
};

export type MatchWithScore = WorldCupMatch & {
  matchId: string;
  score: MatchScore | null;
};
