import TeamHub from "@/components/TeamHub";
import { getTeamById, NBA_TEAMS } from "@/types/nba";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface TeamPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { teamId } = await params;
  const team = getTeamById(parseInt(teamId, 10));

  if (!team) {
    return {
      title: "Team Not Found",
    };
  }

  return {
    title: `${team.fullName} | DRIFT`,
    description: `View ${team.fullName} games, roster, and stats`,
  };
}

export function generateStaticParams() {
  return NBA_TEAMS.map((team) => ({
    teamId: team.id.toString(),
  }));
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params;
  const teamIdNum = parseInt(teamId, 10);

  if (isNaN(teamIdNum) || !getTeamById(teamIdNum)) {
    notFound();
  }

  return <TeamHub teamId={teamIdNum} />;
}
