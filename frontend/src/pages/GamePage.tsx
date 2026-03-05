import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/hooks/useGame";
import { WinProbabilityChart } from "@/components/game/WinProbabilityChart";
import { PlayByPlayTable } from "@/components/game/PlayByPlayTable";
import { BoxScore } from "@/components/game/BoxScore";
import { ScoringSummary } from "@/components/game/ScoringSummary";
import { DriveChart } from "@/components/game/DriveChart";
import { KeyPlays } from "@/components/game/KeyPlays";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const { data: game, isLoading, error } = useGame(id!);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">
          Loading game data (may take 15-20s on first load)...
        </span>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive mb-4">Failed to load game data.</p>
        <Link to="/" className="text-primary underline">
          Back to scoreboard
        </Link>
      </div>
    );
  }

  // Extract team info from header
  const competition = game.header?.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const homeComp = competitors.find((c) => c.homeAway === "home");
  const awayComp = competitors.find((c) => c.homeAway === "away");

  const homeAbbr = homeComp?.team?.abbreviation ?? "HOME";
  const awayAbbr = awayComp?.team?.abbreviation ?? "AWAY";
  const homeColor = homeComp?.team?.color ? `#${homeComp.team.color}` : "#3b82f6";
  const awayColor = awayComp?.team?.color ? `#${awayComp.team.color}` : "#ef4444";
  const homeScore = homeComp?.score ?? "0";
  const awayScore = awayComp?.score ?? "0";

  const status = competition?.status;
  const isCompleted = status?.type?.completed ?? false;
  const statusText = status?.type?.description ?? "Unknown";

  // Extract drives array
  const drivesArray =
    (game.drives as { previous?: unknown[] } | null)?.previous ?? [];

  return (
    <div>
      {/* Back link */}
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Scoreboard
      </Link>

      {/* Game header */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-center gap-8">
          {/* Away */}
          <div className="text-center">
            {awayComp?.team?.logo && (
              <img
                src={awayComp.team.logo as string}
                alt={awayAbbr}
                className="mx-auto mb-2 h-12 w-12"
              />
            )}
            <Link to={`/team/${awayAbbr}`} className="font-bold text-lg hover:underline">
              {awayAbbr}
            </Link>
            <div className="font-mono text-3xl font-bold">{awayScore}</div>
          </div>

          {/* Status */}
          <div className="text-center">
            <Badge variant={isCompleted ? "secondary" : "destructive"}>
              {statusText}
            </Badge>
            {!isCompleted && status && (
              <div className="mt-1 text-xs text-muted-foreground">
                Q{status.period} {status.displayClock}
              </div>
            )}
          </div>

          {/* Home */}
          <div className="text-center">
            {homeComp?.team?.logo && (
              <img
                src={homeComp.team.logo as string}
                alt={homeAbbr}
                className="mx-auto mb-2 h-12 w-12"
              />
            )}
            <Link to={`/team/${homeAbbr}`} className="font-bold text-lg hover:underline">
              {homeAbbr}
            </Link>
            <div className="font-mono text-3xl font-bold">{homeScore}</div>
          </div>
        </div>
      </div>

      {/* Scoring Summary — above tabs */}
      <ScoringSummary
        scoringPlays={game.scoringPlays as never[]}
        homeAbbr={homeAbbr}
        awayAbbr={awayAbbr}
      />

      <Separator className="mb-6" />

      {/* Tabs */}
      <Tabs defaultValue="summary">
        <TabsList className="mb-4 overflow-x-auto max-w-full">
          <TabsTrigger value="summary">Win Probability</TabsTrigger>
          <TabsTrigger value="plays">
            Plays ({game.count})
          </TabsTrigger>
          <TabsTrigger value="boxscore">Box Score</TabsTrigger>
          <TabsTrigger value="drives">Drives</TabsTrigger>
          <TabsTrigger value="keyplays">Key Plays</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <WinProbabilityChart
            plays={game.plays}
            espnWP={game.winprobability}
            homeAbbr={homeAbbr}
            awayAbbr={awayAbbr}
            homeColor={homeColor}
            awayColor={awayColor}
          />
        </TabsContent>

        <TabsContent value="plays">
          <PlayByPlayTable plays={game.plays} />
        </TabsContent>

        <TabsContent value="boxscore">
          <BoxScore
            plays={game.plays}
            homeTeamId={game.homeTeamId ?? ""}
            awayTeamId={game.awayTeamId ?? ""}
            homeAbbr={homeAbbr}
            awayAbbr={awayAbbr}
          />
        </TabsContent>

        <TabsContent value="drives">
          <DriveChart
            drives={drivesArray as never[]}
            homeAbbr={homeAbbr}
            awayAbbr={awayAbbr}
            homeColor={homeColor}
            awayColor={awayColor}
          />
        </TabsContent>

        <TabsContent value="keyplays">
          <KeyPlays plays={game.plays} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
