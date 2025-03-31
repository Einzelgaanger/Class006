import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Assignment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";
import StatCard from "@/components/StatCard";
import { CheckCircle, Clock, FileText, Trophy, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: stats } = useQuery<{
    assignmentsCount: number;
    notesCount: number;
    pastPapersCount: number;
    rank: number;
    overdue: number;
    pending: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/activities"],
  });

  const { data: deadlines } = useQuery<Assignment[]>({
    queryKey: ["/api/dashboard/deadlines"],
  });

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Effect to handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        toggleMobileMenu={toggleMobileMenu} 
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="md:hidden p-4 flex items-center">
          <Button 
            variant="ghost" 
            onClick={toggleMobileMenu} 
            className="text-gray-700 focus:outline-none p-2 mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard
              title="Assignments"
              value={stats?.assignmentsCount ?? 0}
              icon={<CheckCircle className="h-6 w-6 text-primary" />}
              color="blue"
              badges={[
                {
                  text: `${stats?.overdue ?? 0} overdue`,
                  color: "red"
                },
                {
                  text: `${stats?.pending ?? 0} pending`,
                  color: "amber"
                }
              ]}
            />
            
            <StatCard
              title="Notes"
              value={stats?.notesCount ?? 0}
              icon={<FileText className="h-6 w-6 text-green-500" />}
              color="green"
              badges={(stats?.notesCount ?? 0) > 0 ? [
                {
                  text: `${stats?.notesCount ?? 0} unread`,
                  color: "blue"
                }
              ] : [
                {
                  text: "No new notes",
                  color: "gray"
                }
              ]}
            />
            
            <StatCard
              title="Past Papers"
              value={stats?.pastPapersCount ?? 0}
              icon={<FileText className="h-6 w-6 text-purple-500" />}
              color="purple"
              badges={(stats?.pastPapersCount ?? 0) > 0 ? [
                {
                  text: `${stats?.pastPapersCount ?? 0} unread`,
                  color: "blue"
                }
              ] : [
                {
                  text: "All viewed",
                  color: "gray"
                }
              ]}
            />
            
            <StatCard
              title="Your Rank"
              value={`#${stats?.rank ?? "-"}`}
              icon={<Trophy className="h-6 w-6 text-amber-500" />}
              color="amber"
              badges={[
                {
                  text: "Top 5%",
                  color: "purple"
                }
              ]}
            />
          </div>

          {/* Recent Activity */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                )}
                {activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'assignment' ? 'bg-blue-100 text-primary' :
                      activity.type === 'note' ? 'bg-green-100 text-green-600' :
                      activity.type === 'pastpaper' ? 'bg-purple-100 text-purple-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {activity.type === 'assignment' && <CheckCircle className="h-5 w-5" />}
                      {activity.type === 'note' && <FileText className="h-5 w-5" />}
                      {activity.type === 'pastpaper' && <FileText className="h-5 w-5" />}
                      {activity.type === 'rank' && <Trophy className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {activity.unitCode} • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deadlines?.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          No upcoming deadlines
                        </td>
                      </tr>
                    )}
                    {deadlines?.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{assignment.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{assignment.unitCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${new Date(assignment.deadline) < new Date() ? 'text-red-500 font-medium' : ''}`}>
                            {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assignment.completed ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
