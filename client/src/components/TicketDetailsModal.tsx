import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { Ticket, TicketComment, User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { Clock, User, MessageSquare, Share2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { hasPermission } from "@shared/permissions";

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function TicketDetailsModal({ ticket, isOpen, onClose, onEdit }: TicketDetailsModalProps) {
  const { user } = useAuth();
  const typedUser = user as UserType | undefined;
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  // Fetch ticket comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<(TicketComment & { user: UserType })[]>({
    queryKey: ['/api/tickets', ticket?.id, 'comments'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tickets/${ticket!.id}/comments`);
      return response.json();
    },
    enabled: !!ticket?.id && isOpen,
  });

  const submitCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const response = await apiRequest('POST', `/api/tickets/${ticket!.id}/comments`, { comment });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticket!.id, 'comments'] });
      setCommentText("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateShareLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/tickets/${ticket!.id}/share`, {});
      return response.json();
    },
    onSuccess: (data: any) => {
      const shareUrl = `${window.location.origin}/ticket/${data.ticketNumber}/${data.token}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied to clipboard!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate share link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!ticket) return null;

  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      toast({
        title: "Missing comment",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }
    submitCommentMutation.mutate(commentText);
  };

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return 'default';
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string | null) => {
    if (!priority) return 'default';
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const canEdit = typedUser && typedUser.role && (
    hasPermission(typedUser.role, 'manageAllProjects') ||
    hasPermission(typedUser.role, 'manageOwnProjects')
  );

  const canShare = typedUser && typedUser.role && (
    hasPermission(typedUser.role, 'manageAllProjects') ||
    hasPermission(typedUser.role, 'manageOwnProjects')
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-ticket-details">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl" data-testid="text-ticket-title">{ticket.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusBadgeVariant(ticket.status)} data-testid={`badge-status-${ticket.status}`}>
                  {ticket.status ? ticket.status.replace('_', ' ') : 'unknown'}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(ticket.priority)} data-testid={`badge-priority-${ticket.priority}`}>
                  {ticket.priority}
                </Badge>
                <span className="text-sm text-muted-foreground" data-testid="text-ticket-number">
                  #{ticket.ticketNumber}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && onEdit && (
                <Button onClick={onEdit} variant="outline" size="sm" data-testid="button-edit-ticket">
                  Edit
                </Button>
              )}
              {canShare && (
                <Button
                  onClick={() => generateShareLinkMutation.mutate()}
                  disabled={generateShareLinkMutation.isPending}
                  size="sm"
                  data-testid="button-share-ticket"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ticket Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm whitespace-pre-wrap" data-testid="text-ticket-description">
                {ticket.description || "No description provided"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                <div className="flex items-center gap-2 text-sm" data-testid="text-ticket-created">
                  <Clock className="h-4 w-4" />
                  {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM dd, yyyy h:mm a')}
                </div>
              </div>
              {ticket.dueDate && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h3>
                  <div className="flex items-center gap-2 text-sm" data-testid="text-ticket-due-date">
                    <AlertCircle className="h-4 w-4" />
                    {format(new Date(ticket.dueDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Comments</h3>
              <span className="text-sm text-muted-foreground">({comments.length})</span>
            </div>

            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-muted/50 rounded-lg p-4" data-testid={`comment-${comment.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium" data-testid={`text-comment-author-${comment.id}`}>
                          {comment.user.firstName && comment.user.lastName 
                            ? `${comment.user.firstName} ${comment.user.lastName}`
                            : comment.user.email || 'Unknown User'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground" data-testid={`text-comment-date-${comment.id}`}>
                        {comment.createdAt && format(new Date(comment.createdAt), 'MMM dd, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" data-testid={`text-comment-content-${comment.id}`}>
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            {typedUser && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-comment"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submitCommentMutation.isPending || !commentText.trim()}
                    data-testid="button-submit-comment"
                  >
                    {submitCommentMutation.isPending ? "Adding..." : "Add Comment"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
