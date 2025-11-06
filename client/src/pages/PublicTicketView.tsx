import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Clock, User, MessageSquare, AlertTriangle } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { Ticket, TicketComment, User as UserType, SystemConfig } from "@shared/schema";
import { format } from "date-fns";

interface PublicTicketResponse {
  ticket: Ticket;
  comments: (TicketComment & { user: UserType })[];
  projectName: string;
  systemConfig: SystemConfig;
}

export default function PublicTicketView() {
  const [match, params] = useRoute("/ticket/:ticketNumber/:token");

  const { data: response, isLoading, error } = useQuery<PublicTicketResponse>({
    queryKey: ["/api/public/ticket", params?.ticketNumber, params?.token],
    enabled: !!params?.token && !!params?.ticketNumber && !!match,
  });

  const { data: currentUser } = useQuery<UserType | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const ticket = response?.ticket;
  const comments = response?.comments || [];
  const systemConfig = response?.systemConfig;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error ? "This ticket link may have expired or is invalid." : "Unable to load ticket details."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header with company branding */}
      <div className="bg-primary text-primary-foreground py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">
            {systemConfig?.companyName || 'FibreUS'}
          </h1>
          <p className="text-sm opacity-90 mt-1">Ticket Details</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Ticket header */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{ticket.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status ? ticket.status.replace('_', ' ') : 'unknown'}
                  </Badge>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority || 'medium'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Ticket #{ticket.ticketNumber}
                  </span>
                </div>
              </div>
            </div>

            {ticket.description && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Ticket metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {response.projectName && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Project</h3>
                  <p className="text-sm">{response.projectName}</p>
                </div>
              )}

              {ticket.createdAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    {format(new Date(ticket.createdAt), 'MMM dd, yyyy h:mm a')}
                  </div>
                </div>
              )}

              {ticket.dueDate && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    {format(new Date(ticket.dueDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Comments section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </h3>

          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {comment.user.firstName && comment.user.lastName 
                          ? `${comment.user.firstName} ${comment.user.lastName}`
                          : comment.user.email || 'Unknown User'}
                      </span>
                    </div>
                    {comment.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'MMM dd, yyyy h:mm a')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

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
