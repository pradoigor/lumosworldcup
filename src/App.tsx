import { useEffect, useMemo, useState } from 'react';
import { getAllScores, saveScore } from './db';
import {
  competitionName,
  formatDate,
  formatMatchTime,
  getDates,
  getGroups,
  getTeamFlag,
  getTeams,
  matches,
  mergeScores,
} from './matches';
import type { MatchScore, MatchWithScore } from './types';

type ScoreDraft = {
  team1Goals: string;
  team2Goals: string;
};

type Filters = {
  group: string;
  date: string;
  team: string;
};

type Phase = 'all' | 'groups' | 'playoffs' | 'bracket';

const timeZones = [
  { value: 'match-local', label: 'Horário do estádio' },
  { value: 'America/Sao_Paulo', label: 'Brasil' },
  { value: 'America/Mexico_City', label: 'México' },
  { value: 'America/New_York', label: 'Leste EUA/Canadá' },
  { value: 'America/Chicago', label: 'Centro EUA' },
  { value: 'America/Los_Angeles', label: 'Pacífico EUA/Canadá' },
];

const pageSize = 12;

const phaseTabs: Array<{ value: Phase; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'groups', label: 'Fase de grupos' },
  { value: 'playoffs', label: 'Playoffs' },
  { value: 'bracket', label: 'Chaveamento' },
];

const emptyFilters: Filters = {
  group: 'all',
  date: 'all',
  team: 'all',
};

export default function App() {
  const [matchesWithScores, setMatchesWithScores] = useState<MatchWithScore[]>(matches);
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [phase, setPhase] = useState<Phase>('all');
  const [page, setPage] = useState(1);
  const [timeZone, setTimeZone] = useState('match-local');
  const [savedMatchId, setSavedMatchId] = useState<string | null>(null);
  const [isLoadingScores, setIsLoadingScores] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getAllScores()
      .then((scores) => {
        if (!isMounted) {
          return;
        }

        const mergedMatches = mergeScores(matches, scores);
        setMatchesWithScores(mergedMatches);
        setDrafts(createDrafts(mergedMatches));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingScores(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!savedMatchId) {
      return;
    }

    const timeout = window.setTimeout(() => setSavedMatchId(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [savedMatchId]);

  const groups = useMemo(() => getGroups(matches), []);
  const dates = useMemo(() => getDates(matches), []);
  const minDate = dates[0] ?? '';
  const maxDate = dates[dates.length - 1] ?? '';
  const teams = useMemo(() => getTeams(matches), []);

  const filteredMatches = useMemo(() => {
    return matchesWithScores.filter((match) => {
      const phaseMatches =
        phase === 'all' ||
        phase === 'bracket' ||
        (phase === 'groups' && match.group) ||
        (phase === 'playoffs' && !match.group);
      const groupMatches = filters.group === 'all' || match.group === filters.group;
      const dateMatches = filters.date === 'all' || match.date === filters.date;
      const teamMatches =
        filters.team === 'all' || match.team1 === filters.team || match.team2 === filters.team;

      return phaseMatches && groupMatches && dateMatches && teamMatches;
    });
  }, [filters, matchesWithScores, phase]);

  const hasFilters = filters.group !== 'all' || filters.date !== 'all' || filters.team !== 'all';
  const shouldPaginate = !hasFilters && phase !== 'bracket' && filteredMatches.length > pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / pageSize));
  const visibleMatches = shouldPaginate
    ? filteredMatches.slice((page - 1) * pageSize, page * pageSize)
    : filteredMatches;
  const bracketRounds = useMemo(() => getBracketRounds(matchesWithScores), [matchesWithScores]);

  useEffect(() => {
    setPage(1);
  }, [filters, phase]);

  function updateFilter(field: keyof Filters, value: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  }

  function updatePhase(nextPhase: Phase) {
    setPhase(nextPhase);
  }

  function updateDraft(matchId: string, field: keyof ScoreDraft, value: string) {
    if (!isValidScoreInput(value)) {
      return;
    }

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [matchId]: {
        ...currentDrafts[matchId],
        [field]: value,
      },
    }));
  }

  async function handleSave(match: MatchWithScore) {
    const draft = drafts[match.matchId] ?? { team1Goals: '', team2Goals: '' };
    const score: MatchScore = {
      matchId: match.matchId,
      team1Goals: parseScoreValue(draft.team1Goals),
      team2Goals: parseScoreValue(draft.team2Goals),
      updatedAt: new Date().toISOString(),
    };

    await saveScore(score);

    setMatchesWithScores((currentMatches) =>
      currentMatches.map((currentMatch) =>
        currentMatch.matchId === match.matchId ? { ...currentMatch, score } : currentMatch,
      ),
    );
    setSavedMatchId(match.matchId);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="main-panel">
          <p className="eyebrow">Palpites</p>
          <h1>{competitionName}</h1>
        </div>
        <div className="summary">
          <strong>{phase === 'bracket' ? bracketRounds.flatMap((round) => round.matches).length : filteredMatches.length}</strong>
          <span>{filteredMatches.length === 1 ? 'jogo' : 'jogos'}</span>
        </div>
      </header>

      <div className="content-grid">
        <aside className="left-panel">
          <section className="filters" aria-label="Filtros">
            <label>
              <span>Grupo</span>
              <select
                value={filters.group}
                onChange={(event) => updateFilter('group', event.target.value)}
              >
                <option value="all">Todos</option>
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Dia</span>
              <div className="date-filter">
                <input
                  aria-label="Dia"
                  max={maxDate}
                  min={minDate}
                  type="date"
                  value={filters.date === 'all' ? '' : filters.date}
                  onChange={(event) => updateFilter('date', event.target.value || 'all')}
                  onInput={(event) => updateFilter('date', event.currentTarget.value || 'all')}
                />
                <button type="button" onClick={() => updateFilter('date', 'all')}>
                  Todos
                </button>
              </div>
            </label>

            <label>
              <span>Seleção</span>
              <select value={filters.team} onChange={(event) => updateFilter('team', event.target.value)}>
                <option value="all">Todas</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Horário</span>
              <select value={timeZone} onChange={(event) => setTimeZone(event.target.value)}>
                {timeZones.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </aside>

        <div>
          {isLoadingScores ? <p className="status-line">Carregando palpites salvos...</p> : null}

          {phase === 'bracket' ? (
            <BracketView rounds={bracketRounds} />
          ) : (
            <>
              <section className="match-list" aria-label="Jogos">
                {visibleMatches.map((match) => (
                  <MatchCard
                    draft={drafts[match.matchId] ?? { team1Goals: '', team2Goals: '' }}
                    isSaved={savedMatchId === match.matchId}
                    key={match.matchId}
                    match={match}
                    timeZone={timeZone}
                    onSave={handleSave}
                    onUpdateDraft={updateDraft}
                  />
                ))}
              </section>

              {shouldPaginate ? (
                <nav className="pagination" aria-label="Paginação">
                  <button
                    disabled={page === 1}
                    type="button"
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    type="button"
                    onClick={() =>
                      setPage((currentPage) => Math.min(totalPages, currentPage + 1))
                    }
                  >
                    Próxima
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </div>

        <nav className="phase-tabs" aria-label="Fases">
          {phaseTabs.map((tab) => (
            <button
              aria-pressed={phase === tab.value}
              className={phase === tab.value ? 'active' : ''}
              key={tab.value}
              type="button"
              onClick={() => updatePhase(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

function MatchCard({
  draft,
  isSaved,
  match,
  timeZone,
  onSave,
  onUpdateDraft,
}: {
  draft: ScoreDraft;
  isSaved: boolean;
  match: MatchWithScore;
  timeZone: string;
  onSave: (match: MatchWithScore) => Promise<void>;
  onUpdateDraft: (matchId: string, field: keyof ScoreDraft, value: string) => void;
}) {
  return (
    <article className="match-card">
      <div className="match-meta">
        <span>{formatDate(match.date)}</span>
        <span>{formatMatchTime(match.date, match.time, timeZone)}</span>
        <span>{match.group ?? match.round}</span>
      </div>

      <div className="match-body">
        <div className="team-row">
          <TeamName team={match.team1} />
          <input
            aria-label={`Placar de ${match.team1}`}
            inputMode="numeric"
            max={99}
            min={0}
            type="number"
            value={draft.team1Goals}
            onChange={(event) => onUpdateDraft(match.matchId, 'team1Goals', event.target.value)}
          />
        </div>

        <span className="versus">x</span>

        <div className="team-row team-row-reverse">
          <input
            aria-label={`Placar de ${match.team2}`}
            inputMode="numeric"
            max={99}
            min={0}
            type="number"
            value={draft.team2Goals}
            onChange={(event) => onUpdateDraft(match.matchId, 'team2Goals', event.target.value)}
          />
          <TeamName team={match.team2} />
        </div>
      </div>

      <footer className="match-footer">
        <span>{match.ground}</span>
        <button type="button" onClick={() => void onSave(match)}>
          {isSaved ? 'Salvo' : 'Salvar'}
        </button>
      </footer>
    </article>
  );
}

function BracketView({
  rounds,
}: {
  rounds: Array<{ round: string; matches: MatchWithScore[] }>;
}) {
  return (
    <section className="bracket" aria-label="Chaveamento">
      {rounds.map((round, index) => (
        <div className="bracket-round" data-round-index={index} key={round.round}>
          <h2>{formatRoundName(round.round)}</h2>
          <div className="bracket-matches">
            {round.matches.map((match) => (
              <article className="bracket-card" key={match.matchId}>
                <TeamName team={match.team1} />
                <span className="bracket-versus">x</span>
                <TeamName team={match.team2} />
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function createDrafts(sourceMatches: MatchWithScore[]) {
  return sourceMatches.reduce<Record<string, ScoreDraft>>((drafts, match) => {
    drafts[match.matchId] = {
      team1Goals: match.score?.team1Goals == null ? '' : String(match.score.team1Goals),
      team2Goals: match.score?.team2Goals == null ? '' : String(match.score.team2Goals),
    };

    return drafts;
  }, {});
}

function isValidScoreInput(value: string) {
  return value === '' || (/^\d{1,2}$/.test(value) && Number(value) <= 99);
}

function parseScoreValue(value: string) {
  return value === '' ? null : Number(value);
}

function TeamName({ team }: { team: string }) {
  return (
    <span className="team-name">
      <TeamFlag team={team} />
      {team}
    </span>
  );
}

function TeamFlag({ team }: { team: string }) {
  const flag = getTeamFlag(team);

  if (!flag) {
    return null;
  }

  return (
    <span aria-hidden="true" className="team-flag">
      {flag}
    </span>
  );
}

function getBracketRounds(sourceMatches: MatchWithScore[]) {
  const roundOrder = [
    'Round of 32',
    'Round of 16',
    'Quarter-final',
    'Semi-final',
    'Match for third place',
    'Final',
  ];

  return roundOrder
    .map((round) => ({
      round,
      matches: sourceMatches.filter((match) => match.round === round),
    }))
    .filter((round) => round.matches.length > 0);
}

function formatRoundName(round: string) {
  const names: Record<string, string> = {
    'Round of 32': '32 avos',
    'Round of 16': 'Oitavas',
    'Quarter-final': 'Quartas',
    'Semi-final': 'Semifinais',
    'Match for third place': '3o lugar',
    Final: 'Final',
  };

  return names[round] ?? round;
}
