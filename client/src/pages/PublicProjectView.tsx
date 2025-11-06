import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calendar, CheckCircle, Clock, DollarSign, FileText, User, AlertTriangle, Ticket as TicketIcon } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { Project, User as UserType, Ticket, SystemConfig } from "@shared/schema";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PublicProjectResponse {
  project: Project;
  clientName?: string;
  technicianName?: string;
  systemConfig: SystemConfig;
  tickets: Ticket[];
}

export default function PublicProjectView() {
  const [match, params] = useRoute("/project/:projectNumber/:token");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const { data: response, isLoading, error } = useQuery<PublicProjectResponse>({
    queryKey: ["/api/public/project", params?.projectNumber, params?.token],
    enabled: !!params?.token && !!params?.projectNumber && !!match,
  });

  const { data: currentUser } = useQuery<UserType | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const project = response?.project;
  const systemConfig = response?.systemConfig;
  const tickets = response?.tickets || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error ? "This project link may have expired or is invalid." : "Unable to load project details."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTicketStatusColor = (status: string | null) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with company branding */}
      <div className="bg-primary text-primary-foreground py-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">
            {systemConfig?.companyName || 'FibreUS'}
          </h1>
          <p className="text-sm opacity-90 mt-1">Project Details</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Project header */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{project.projectName}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status || 'Unknown'}
                  </Badge>
                  {project.priority && (
                    <Badge variant={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Project #{project.projectNumber}
                  </span>
                </div>
              </div>
            </div>

            {project.description && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Project details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {response.clientName && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="w-4 h-4" />
                <span>Client</span>
              </div>
              <p className="text-sm font-medium">{response.clientName}</p>
            </Card>
          )}

          {response.technicianName && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="w-4 h-4" />
                <span>Assigned Technician</span>
              </div>
              <p className="text-sm font-medium">{response.technicianName}</p>
            </Card>
          )}

          {project.totalCost && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Total Cost</span>
              </div>
              <p className="text-sm font-medium">{formatCurrency(project.totalCost)}</p>
            </Card>
          )}

          {project.estimatedCompletionDate && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span>Est. Completion</span>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(project.estimatedCompletionDate), 'MMM d, yyyy')}
              </p>
            </Card>
          )}

          {project.actualCompletionDate && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>Completed On</span>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(project.actualCompletionDate), 'MMM d, yyyy')}
              </p>
            </Card>
          )}

          {project.createdAt && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span>Created</span>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(project.createdAt), 'MMM d, yyyy')}
              </p>
            </Card>
          )}
        </div>

        {/* Work notes */}
        {project.workNotes && (
          <Card className="p-6">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              Work Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{project.workNotes}</p>
          </Card>
        )}

        {/* Tickets section */}
        {tickets.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
              <TicketIcon className="w-4 h-4 text-primary" />
              Project Tickets ({tickets.length})
            </h3>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{ticket.title}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={getTicketStatusColor(ticket.status)} className="text-xs">
                          {ticket.status ? ticket.status.replace('_', ' ') : 'unknown'}
                        </Badge>
                        <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                          {ticket.priority || 'medium'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          #{ticket.ticketNumber}
                        </span>
                      </div>
                    </div>
                    {ticket.createdAt && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-muted-foreground mt-2">{ticket.description}</p>
                  )}
                  {ticket.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <AlertTriangle className="h-3 w-3" />
                      Due: {format(new Date(ticket.dueDate), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Footer with contact info */}
        <Card className="p-6 bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            {currentUser 
              ? `Logged in as ${currentUser.email}`
              : `Need help? Contact ${systemConfig?.companyName || 'us'} for assistance.`
            }
          </p>
        </Card>
      </div>
    </div>
  );
}
