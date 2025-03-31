import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ranking } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { Trophy, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type RankingTableProps = {
  unitCode: string;
};

export default function RankingTable({ unitCode }: RankingTableProps) {
  const { user } = useAuth();
  const { data: rankings, isLoading } = useQuery<Ranking[]>({
    queryKey: [`/api/units/${unitCode}/rankings`],
  });

  if (isLoading) {
    return (
      <div className="text-center p-10">
        Loading rankings...
      </div>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Rankings Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Rankings will appear once students complete assignments in this unit.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Function to get badge for position
  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <Badge className="bg-amber-200 text-amber-800 flex items-center gap-1">
          <Trophy className="h-3 w-3" /> Gold
        </Badge>
      );
    } else if (position === 2 || position === 3) {
      return (
        <Badge className="bg-purple-200 text-purple-800 flex items-center gap-1">
          <Trophy className="h-3 w-3" /> Purple
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Rankings for {unitCode}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500 mb-4">
          <p>Rankings are based on how quickly students complete assignments. Faster completion times result in higher rankings.</p>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Average Completion Time</TableHead>
                <TableHead className="text-right">Completed Assignments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((ranking) => (
                <TableRow 
                  key={ranking.userId}
                  className={user?.id === ranking.userId ? "bg-blue-50" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      #{ranking.position}
                      {getPositionBadge(ranking.position)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <img 
                          src={ranking.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(ranking.name)}`} 
                          alt={ranking.name} 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="absolute -top-1 -right-1 bg-white rounded-full text-xs font-semibold px-1 text-primary border border-primary">
                          #{ranking.overallRank}
                        </span>
                      </div>
                      <span>{ranking.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{ranking.averageCompletionTime}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{ranking.completedAssignments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Assignment Completions</h3>
          {rankings.length > 0 && rankings[0].recentCompletions?.length > 0 ? (
            <div className="space-y-2">
              {rankings.flatMap(rank => 
                rank.recentCompletions?.map((completion, idx) => (
                  <div key={`${rank.userId}-${idx}`} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      <img 
                        src={rank.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rank.name)}`} 
                        alt={rank.name} 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {rank.name} completed "{completion.title}"
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(completion.completedAt).toLocaleString()} · 
                          {completion.completionTime} after posting
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent completions recorded.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
