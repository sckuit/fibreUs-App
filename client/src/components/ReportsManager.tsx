import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema, updateReportSchema, type Report, type User, type Task, type Project } from "@shared/schema";
import type { z } from "zod";
import { Plus, FileText, CheckCircle, XCircle, Clock, Edit, Trash2, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/exportUtils";

type ReportsManagerProps = {
  role: 'employee' | 'manager' | 'admin';
  userId: string;
};

export default function ReportsManager({ role, userId }: ReportsManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [approvingReport, setApprovingReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const { toast } = useToast();

  // Fetch reports based on role
  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
  });

  // Fetch tasks for linking reports to tasks (all roles can see tasks)
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: true,
  });

  // Fetch projects for linking reports to projects (all roles can see projects)
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: true,
  });

  // Fetch users for display names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: role !== 'employee',
  });

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter reports based on search term
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;

    const lowerSearch = searchTerm.toLowerCase();
    
    return reports.filter((report) => {
      // Get related data
      const submittedByUser = users.find(u => u.id === report.submittedById);
      const linkedProject = projects.find(p => p.id === report.projectId);
      const submittedByName = submittedByUser ? `${submittedByUser.firstName || ''} ${submittedByUser.lastName || ''}`.trim() : '';
      const projectName = linkedProject?.projectName || '';

      return (
        (report.title?.toLowerCase() || '').includes(lowerSearch) ||
        (report.content?.toLowerCase() || '').includes(lowerSearch) ||
        (report.status?.toLowerCase() || '').includes(lowerSearch) ||
        projectName.toLowerCase().includes(lowerSearch) ||
        submittedByName.toLowerCase().includes(lowerSearch)
      );
    });
  }, [reports, searchTerm, users, projects]);

  // Paginate filtered reports
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReports.slice(startIndex, endIndex);
  }, [filteredReports, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startResult = filteredReports.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, filteredReports.length);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const createForm = useForm<z.infer<typeof insertReportSchema>>({
    resolver: zodResolver(insertReportSchema),
    defaultValues: {
      title: "",
      content: "",
      status: 'submitted',
      taskId: undefined,
      projectId: undefined,
    },
  });

  const editForm = useForm<z.infer<typeof updateReportSchema>>({
    resolver: zodResolver(updateReportSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertReportSchema>) =>
      apiRequest("POST", "/api/reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Report created",
        description: "Your report has been submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create report",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof updateReportSchema> }) =>
      apiRequest("PUT", `/api/reports/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setEditingReport(null);
      toast({
        title: "Report updated",
        description: "Your report has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "Report deleted",
        description: "The report has been deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved, rejectionReason }: { id: string; approved: boolean; rejectionReason?: string }) =>
      apiRequest("POST", `/api/reports/${id}/approve`, { approved, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setApprovingReport(null);
      toast({
        title: "Report processed",
        description: "The report has been processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process report",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: z.infer<typeof insertReportSchema>) => {
    createMutation.mutate({ ...data, status: 'submitted' });
  };

  const onUpdateSubmit = (data: z.infer<typeof updateReportSchema>) => {
    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, data });
    }
  };

  const startEdit = (report: Report) => {
    editForm.reset({
      title: report.title,
      content: report.content,
      taskId: report.taskId ?? undefined,
      projectId: report.projectId ?? undefined,
    });
    setEditingReport(report);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" data-testid="badge-status-draft"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'submitted':
        return <Badge variant="secondary" data-testid="badge-status-submitted"><Clock className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid="badge-status-approved"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" data-testid="badge-status-rejected"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

  if (reportsLoading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div>
          <h3 className="text-lg font-medium">Work Reports</h3>
          <p className="text-sm text-muted-foreground">
            {role === 'employee' ? 'Submit and manage your work reports' : 'Review and approve team work reports'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => exportToCSV(reports, 'reports')} 
            data-testid="button-export-reports"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-report">
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Work Report</DialogTitle>
              <DialogDescription>
                Submit a report for completed work
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Report title" data-testid="input-title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the work performed, hours worked, materials used, etc." 
                          data-testid="input-content" 
                          rows={8}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Include details about work performed, hours, materials, and any relevant notes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Task</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task">
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              <span className="font-mono text-xs mr-2">{task.ticketNumber}</span>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select either a task or a project (at least one is required)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project">
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <span className="font-mono text-xs mr-2">{project.ticketNumber}</span>
                              {project.projectName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select either a project or a task (at least one is required)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-report">
                    {createMutation.isPending ? "Creating..." : "Create Report"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, description, status, project, or submitted by..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="input-search-reports"
        />
      </div>

      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? "No reports found matching your search" : "No reports found"}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedReports.map((report) => {
            const linkedTask = tasks.find(t => t.id === report.taskId);
            const linkedProject = projects.find(p => p.id === report.projectId);
            
            return (
            <Card key={report.id} data-testid={`card-report-${report.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs" data-testid={`badge-ticket-${report.ticketNumber}`}>
                        {report.ticketNumber}
                      </Badge>
                    </div>
                    <CardDescription>
                      {role !== 'employee' && `Submitted by ${getUserName(report.submittedById)} • `}
                      {report.createdAt && format(new Date(report.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                    {(linkedTask || linkedProject) && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                        {linkedTask && (
                          <div className="flex items-center gap-1">
                            <span>Task:</span>
                            <Badge variant="outline" className="font-mono text-xs">{linkedTask.ticketNumber}</Badge>
                            <span className="text-xs">{linkedTask.title}</span>
                          </div>
                        )}
                        {linkedProject && (
                          <div className="flex items-center gap-1">
                            <span>Project:</span>
                            <Badge variant="outline" className="font-mono text-xs">{linkedProject.ticketNumber}</Badge>
                            <span className="text-xs">{linkedProject.projectName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(report.status)}
                    {role === 'employee' && (report.status === 'draft' || report.status === 'submitted') && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(report)} data-testid={`button-edit-${report.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this report?')) {
                              deleteMutation.mutate(report.id);
                            }
                          }}
                          data-testid={`button-delete-${report.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {['manager', 'admin'].includes(role) && report.status === 'submitted' && (
                      <Button onClick={() => setApprovingReport(report)} size="sm" data-testid={`button-approve-${report.id}`}>
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">Work Details</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.content}</p>
                </div>
                {report.status === 'rejected' && report.rejectionReason && (
                  <div className="mt-2 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                    <p className="text-sm text-destructive">{report.rejectionReason}</p>
                  </div>
                )}
                {report.approvedById && report.approvedAt && (
                  <div className="text-xs text-muted-foreground">
                    {report.status === 'approved' ? 'Approved' : 'Rejected'} by {role !== 'employee' ? getUserName(report.approvedById) : 'Manager'} on {format(new Date(report.approvedAt), 'MMM d, yyyy')}
                  </div>
                )}
              </CardContent>
            </Card>
          );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-muted-foreground">
            Showing {startResult}-{endResult} of {filteredReports.length} results
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[120px]" data-testid="select-items-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </>
      )}

      {/* Edit Dialog */}
      {editingReport && (
        <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Report</DialogTitle>
              <DialogDescription>
                Update your work report
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Report title" data-testid="input-edit-title" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the work performed" 
                          data-testid="input-edit-content" 
                          rows={8}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingReport(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-report">
                    {updateMutation.isPending ? "Updating..." : "Update Report"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Dialog */}
      {approvingReport && (
        <Dialog open={!!approvingReport} onOpenChange={() => setApprovingReport(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Report</DialogTitle>
              <DialogDescription>
                Approve or reject this work report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Title</p>
                <p className="text-sm">{approvingReport.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Work Details</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{approvingReport.content}</p>
              </div>
              <Textarea 
                placeholder="Rejection reason (optional)" 
                id="rejection-reason"
                data-testid="input-rejection-reason"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setApprovingReport(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const reason = (document.getElementById('rejection-reason') as HTMLTextAreaElement)?.value;
                  approveMutation.mutate({ 
                    id: approvingReport.id, 
                    approved: false, 
                    rejectionReason: reason 
                  });
                }}
                disabled={approveMutation.isPending}
                data-testid="button-reject-report"
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  approveMutation.mutate({ 
                    id: approvingReport.id, 
                    approved: true 
                  });
                }}
                disabled={approveMutation.isPending}
                data-testid="button-approve-report"
              >
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
