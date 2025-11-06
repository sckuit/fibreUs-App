import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { User } from "@shared/schema";
import ReportsManager from "@/components/ReportsManager";
import { TicketsManager } from "@/components/TicketsManager";

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState("tasks");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employee Portal</h1>
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
            onClick={() => setActiveTab("tasks")}
            data-testid="card-assigned-tasks"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                3 due this week
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setActiveTab("tasks")}
            data-testid="card-in-progress"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                2 installations, 1 maintenance
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setActiveTab("reports")}
            data-testid="card-completed"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setActiveTab("tasks")}
            data-testid="card-urgent"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              Work Reports
            </TabsTrigger>
            <TabsTrigger value="tickets" data-testid="tab-tickets">
              Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>
                  Your assigned work for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No tasks scheduled for today
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Work Schedule</CardTitle>
                <CardDescription>
                  Upcoming installations and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No scheduled work
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {user && <ReportsManager role="employee" userId={user.id} />}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {user && <TicketsManager role="employee" userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
