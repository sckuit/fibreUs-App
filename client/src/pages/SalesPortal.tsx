import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, TrendingUp, Users, Briefcase, Eye, Plus, Edit, Trash2, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/exportUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSalesRecordSchema, salesRecords, users, projects, tasks, type InsertSalesRecord } from "@shared/schema";
import type { User, Visitor } from "@shared/schema";
import { format } from "date-fns";
import MessagesManager from "@/components/MessagesManager";
import LeadsManager from "@/components/LeadsManager";
import ClientsManager from "@/components/ClientsManager";
import { TicketsManager } from "@/components/TicketsManager";

type SelectSalesRecord = typeof salesRecords.$inferSelect;
type SelectUser = typeof users.$inferSelect;
type SelectProject = typeof projects.$inferSelect;
type SelectTask = typeof tasks.$inferSelect;

export default function SalesPortal() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("deals");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSalesRecord, setEditingSalesRecord] = useState<SelectSalesRecord | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: salesRecordsData = [], isLoading: salesLoading } = useQuery<SelectSalesRecord[]>({
    queryKey: ["/api/sales"],
  });

  const { data: usersData = [] } = useQuery<SelectUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: projectsData = [] } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasksData = [] } = useQuery<SelectTask[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: visitors = [], isLoading: visitorsLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/analytics/recent-visitors"],
  });

  const clients = usersData.filter(u => u.role === "client");

  const form = useForm<InsertSalesRecord>({
    resolver: zodResolver(insertSalesRecordSchema),
    defaultValues: {
      clientId: "",
      projectId: undefined,
      taskId: undefined,
      salesRepId: user?.id || "",
      dealValue: "",
      commission: undefined,
      notes: "",
      status: "prospecting",
      closedAt: undefined,
    },
  });

  const createSalesRecordMutation = useMutation({
    mutationFn: async (data: InsertSalesRecord) => {
      return await apiRequest("POST", "/api/sales", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Success",
        description: "Sales record created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingSalesRecord(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sales record",
        variant: "destructive",
      });
    },
  });

  const updateSalesRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSalesRecord> }) => {
      return await apiRequest("PUT", `/api/sales/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Success",
        description: "Sales record updated successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingSalesRecord(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sales record",
        variant: "destructive",
      });
    },
  });

  const deleteSalesRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Success",
        description: "Sales record deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sales record",
        variant: "destructive",
      });
    },
  });

  const handleCreateDeal = () => {
    setEditingSalesRecord(null);
    form.reset({
      clientId: "",
      projectId: undefined,
      salesRepId: user?.id || "",
      dealValue: "",
      commission: undefined,
      notes: "",
      status: "prospecting",
      closedAt: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleEditDeal = (record: SelectSalesRecord) => {
    setEditingSalesRecord(record);
    form.reset({
      clientId: record.clientId,
      projectId: record.projectId || undefined,
      taskId: record.taskId || undefined,
      salesRepId: record.salesRepId,
      dealValue: record.dealValue,
      commission: record.commission || undefined,
      notes: record.notes || "",
      status: record.status || "prospecting",
      closedAt: record.closedAt || undefined,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertSalesRecord) => {
    if (editingSalesRecord) {
      updateSalesRecordMutation.mutate({ id: editingSalesRecord.id, data });
    } else {
      createSalesRecordMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "closed_won":
        return "default";
      case "negotiation":
        return "secondary";
      case "closed_lost":
        return "destructive";
      default:
        return "outline";
    }
  };

  const totalDeals = salesRecordsData.length;
  const closedWon = salesRecordsData.filter(r => r.status === "closed_won").length;
  const totalRevenue = salesRecordsData
    .filter(r => r.status === "closed_won")
    .reduce((sum, r) => sum + parseFloat(r.dealValue || "0"), 0);
  const totalCommission = salesRecordsData
    .filter(r => r.status === "closed_won")
    .reduce((sum, r) => sum + parseFloat(r.commission || "0"), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Portal</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName}
            </p>
          </div>
          <Badge variant="secondary" data-testid="badge-role">
            {user?.role}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeals}</div>
              <p className="text-xs text-muted-foreground">
                {closedWon} closed won
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From closed deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">
                Total client base
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="deals" data-testid="tab-deals">
              Sales Deals
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">
              Leads
            </TabsTrigger>
            <TabsTrigger value="clients" data-testid="tab-clients">
              Clients
            </TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">
              Projects
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">
              Messages
            </TabsTrigger>
            <TabsTrigger value="tickets" data-testid="tab-tickets">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="visitors" data-testid="tab-visitors">
              Lead Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deals" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
                <div>
                  <CardTitle>Sales Deals</CardTitle>
                  <CardDescription>
                    Manage your sales pipeline and deals
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => exportToCSV(salesRecordsData, 'sales-records')} 
                    data-testid="button-export-sales"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={handleCreateDeal} data-testid="button-create-deal">
                    <Plus className="w-4 h-4 mr-2" />
                    New Deal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading sales records...</p>
                ) : salesRecordsData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales records yet. Create one to get started.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Project / Task</TableHead>
                        <TableHead>Deal Value</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesRecordsData.map((record) => {
                        const client = usersData.find(u => u.id === record.clientId);
                        const project = projectsData.find(p => p.id === record.projectId);
                        const task = tasksData.find(t => t.id === record.taskId);
                        
                        return (
                          <TableRow key={record.id} data-testid={`row-deal-${record.id}`}>
                            <TableCell className="font-medium">
                              {client ? `${client.firstName} ${client.lastName}` : "Unknown"}
                            </TableCell>
                            <TableCell>
                              {project ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs">{project.ticketNumber}</Badge>
                                  <span className="text-sm">{project.projectName}</span>
                                </div>
                              ) : task ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs">{task.ticketNumber}</Badge>
                                  <span className="text-sm">{task.title}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">No link</span>
                              )}
                            </TableCell>
                            <TableCell>
                              ${parseFloat(record.dealValue || "0").toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {record.commission ? `$${parseFloat(record.commission).toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(record.status)} data-testid={`badge-status-${record.id}`}>
                                {(record.status || "prospecting").replace("_", " ").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditDeal(record)}
                                  data-testid={`button-edit-deal-${record.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSalesRecordMutation.mutate(record.id)}
                                  data-testid={`button-delete-deal-${record.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <LeadsManager />
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <ClientsManager />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Projects Overview</CardTitle>
                <CardDescription>
                  View all projects and their details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectsData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Est. Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectsData.map((project) => (
                        <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                          <TableCell className="font-medium">{project.projectName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {(project.status || "scheduled").replace("_", " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {project.totalCost ? `$${parseFloat(project.totalCost).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            {project.startDate ? format(new Date(project.startDate), "MMM dd, yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            {project.estimatedCompletionDate ? format(new Date(project.estimatedCompletionDate), "MMM dd, yyyy") : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <MessagesManager />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {user && <TicketsManager role="sales" userId={user.id} />}
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Analytics</CardTitle>
                <CardDescription>
                  Recent website visitors for potential lead generation
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
                      {visitors.slice(0, 20).map((visitor, idx) => (
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
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSalesRecord ? "Edit Sales Deal" : "Create New Sales Deal"}
            </DialogTitle>
            <DialogDescription>
              {editingSalesRecord
                ? "Update the sales deal information"
                : "Create a new sales opportunity"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.firstName} {client.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Project (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-project">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projectsData.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <span className="font-mono text-xs mr-2">{project.ticketNumber}</span>
                            {project.projectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Associate this deal with a project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Task (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-task">
                          <SelectValue placeholder="Select a task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {tasksData.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            <span className="font-mono text-xs mr-2">{task.ticketNumber}</span>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Associate this deal with a task
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dealValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-deal-value"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-commission"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="prospecting">Prospecting</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes or details"
                        className="min-h-[100px]"
                        data-testid="input-notes"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                    setEditingSalesRecord(null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSalesRecordMutation.isPending || updateSalesRecordMutation.isPending}
                  data-testid="button-submit-deal"
                >
                  {editingSalesRecord ? "Update Deal" : "Create Deal"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
