export interface TeamInfo {
  id: string | null;
  name: string | null;
  abbreviation: string | null;
  logo: string | null;
  color: string | null;
}

export interface GameStatus {
  clock: string;
  period: number;
  state: string; // "pre" | "in" | "post"
  completed: boolean;
  description: string;
  detail: string;
}

export interface Game {
  id: string;
  name: string;
  shortName: string;
  status: GameStatus;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number;
  awayScore: number;
}

export interface ExpectedPoints {
  before: number | null;
  after: number | null;
  added: number | null;
}

export interface WinProbability {
  before: number | null;
  after: number | null;
  added: number | null;
}

export interface PlayTeam {
  id: number | string | null;
  name: string | null;
}

export interface PlayState {
  team?: { id: string | number | null };
  pos_team?: PlayTeam;
  def_pos_team?: PlayTeam;
  distance?: number | null;
  yardLine?: number | null;
  down?: number | null;
  yardsToEndzone?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  pos_team_score?: number | null;
  def_pos_team_score?: number | null;
  pos_score_diff?: number | null;
  posTeamTimeouts?: number | null;
  defTeamTimeouts?: number | null;
  shortDownDistanceText?: string | null;
  possessionText?: string | null;
  downDistanceText?: string | null;
}

export interface PlayDetail {
  id?: string | null;
  text?: string | null;
  period?: number | null;
  clock?: {
    displayValue: string;
    minutes: string | number;
    seconds: string | number;
  };
  type?: {
    id: string;
    text: string;
    abbreviation: string;
  };
  expectedPoints?: ExpectedPoints;
  winProbability?: WinProbability;
  start?: PlayState;
  end?: PlayState;
  modelInputs?: Record<string, unknown>;
  statYardage?: number | null;
  scoringPlay?: boolean | null;
}

export interface EspnWinProbEntry {
  homeWinPercentage: number;
  tiePercentage?: number;
  playId: string;
  secondHalf?: boolean;
}

export interface GameDetail {
  id: string;
  count: number;
  plays: PlayDetail[];
  box_score: Record<string, unknown> | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  drives: Record<string, unknown> | null;
  scoringPlays: Record<string, unknown>[];
  winprobability: EspnWinProbEntry[];
  boxScore: Record<string, unknown> | null;
  header: {
    competitions: Array<{
      competitors: Array<{
        team: TeamInfo & { displayName: string };
        homeAway: string;
        score: string;
      }>;
      status: {
        type: {
          completed: boolean;
          state: string;
          description: string;
        };
        displayClock: string;
        period: number;
      };
    }>;
  } | null;
  broadcasts: Record<string, unknown>[];
  pickcenter: Record<string, unknown>[];
  standings: Record<string, unknown> | null;
  gameInfo: unknown[] | null;
}

export interface TeamListItem {
  team_abbr: string;
  team_name: string;
  team_logo_espn: string | null;
  team_color: string | null;
  team_color2: string | null;
}

export interface TeamSeasonStats {
  off_epa_per_play: number | null;
  def_epa_per_play: number | null;
  off_success_rate: number | null;
  def_success_rate: number | null;
  pass_epa_per_play: number | null;
  rush_epa_per_play: number | null;
  total_off_plays: number;
  total_def_plays: number;
}

export interface RecentGame {
  gameday: string;
  opponent: string;
  home_away: string;
  team_score: number;
  opp_score: number;
  result: string;
}

export interface TeamProfile {
  team: Record<string, unknown>;
  stats: TeamSeasonStats | null;
  recent_games: RecentGame[];
}

export interface PlayerLeaderboardEntry {
  rank: number;
  player_id: string;
  player_display_name: string;
  headshot_url: string | null;
  recent_team: string;
  position: string;
  stat_value: number;
  stat_name: string;
  [key: string]: unknown;
}

export interface ScatterTeam {
  team_abbr: string;
  team_name: string;
  team_logo_espn: string | null;
  team_color: string | null;
  off_epa_per_play: number | null;
  def_epa_per_play: number | null;
}
