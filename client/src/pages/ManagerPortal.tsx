import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Briefcase, TrendingUp, DollarSign, Eye } from "lucide-react";
import type { User, Visitor } from "@shared/schema";
import ReportsManager from "@/components/ReportsManager";
import { TasksManager } from "@/components/TasksManager";
import { TicketsManager } from "@/components/TicketsManager";

export default function ManagerPortal() {
  const [activeTab, setActiveTab] = useState("team");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: visitors = [], isLoading: visitorsLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/analytics/recent-visitors"],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manager Portal</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName}
            </p>
          </div>
          <Badge variant="secondary" data-testid="badge-role">
            {user?.role}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setActiveTab("team")}
            data-testid="card-team-members"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                8 active, 4 on assignment
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setActiveTab("projects")}
            data-testid="card-active-projects"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                3 behind schedule
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setActiveTab("analytics")}
            data-testid="card-monthly-revenue"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setActiveTab("analytics")}
            data-testid="card-performance"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">
                Team efficiency
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="team" data-testid="tab-team">
              Team Management
            </TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">
              Projects
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">
              Service Requests
            </TabsTrigger>
            <TabsTrigger value="visitors" data-testid="tab-visitors">
              Visitor Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              Reports
            </TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="tickets" data-testid="tab-tickets">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Overview</CardTitle>
                <CardDescription>
                  Manage your team members and their assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Team management features coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
                <CardDescription>
                  Monitor and manage all ongoing projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No projects to display
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Requests</CardTitle>
                <CardDescription>
                  Review and approve service requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No pending requests
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Analytics</CardTitle>
                <CardDescription>
                  Website visitors for marketing follow-up
                </CardDescription>
              </CardHeader>
              <CardContent>
                {visitorsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading visitors...</p>
                ) : visitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No visitors tracked yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Browser</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Landing Page</TableHead>
                        <TableHead>Visit Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.slice(0, 15).map((visitor, idx) => (
                        <TableRow key={visitor.id || idx} data-testid={`row-visitor-${idx}`}>
                          <TableCell className="font-mono text-xs">
                            {visitor.ipAddress}
                          </TableCell>
                          <TableCell>
                            {visitor.city && visitor.country
                              ? `${visitor.city}, ${visitor.country}`
                              : visitor.country || "-"}
                          </TableCell>
                          <TableCell>{visitor.browser || "-"}</TableCell>
                          <TableCell>{visitor.device || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {visitor.landingPage || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {visitor.visitedAt
                              ? new Date(visitor.visitedAt).toLocaleString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {user && <ReportsManager role="manager" userId={user.id} />}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {user && <TasksManager role="manager" userId={user.id} />}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {user && <TicketsManager role="manager" userId={user.id} />}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Track team and project performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analytics dashboard coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
