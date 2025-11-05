import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { Project, ProjectComment } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, User, FileText, DollarSign, Clock, CheckCircle, XCircle, Star, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/schema";

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  technicianName?: string;
}

export function ProjectDetailsModal({ project, isOpen, onClose, clientName, technicianName }: ProjectDetailsModalProps) {
  const { user } = useAuth();
  const typedUser = user as UserType | undefined;
  const { toast } = useToast();
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [commentText, setCommentText] = useState("");

  // Fetch project comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<(ProjectComment & { user: UserType })[]>({
    queryKey: ['/api/projects', project?.id, 'comments'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/projects/${project!.id}/comments`);
      return response.json();
    },
    enabled: !!project?.id && isOpen,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: { feedback: string; rating: number }) => {
      const response = await apiRequest('POST', `/api/projects/${project!.id}/feedback`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setFeedbackText("");
      setRating(0);
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const response = await apiRequest('POST', `/api/projects/${project!.id}/comments`, { comment });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project!.id, 'comments'] });
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

  if (!project) return null;

  const isClient = typedUser?.role === 'client';
  const canSubmitFeedback = isClient && !project.clientFeedback && project.status === 'completed';

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

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim() || rating === 0) {
      toast({
        title: "Missing information",
        description: "Please provide both feedback and a rating.",
        variant: "destructive",
      });
      return;
    }
    submitFeedbackMutation.mutate({ feedback: feedbackText, rating });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'scheduled':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid="dialog-project-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            {project.projectName}
          </DialogTitle>
          <DialogDescription>
            Ticket: {project.ticketNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Service Type */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={getStatusColor(project.status || 'scheduled')}>
              {getStatusLabel(project.status || 'scheduled')}
            </Badge>
            {project.serviceType && (
              <Badge variant="outline">
                {project.serviceType.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            {clientName && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Client</span>
                </div>
                <p className="text-sm font-medium">{clientName}</p>
              </div>
            )}

            {/* Technician */}
            {technicianName && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Assigned Technician</span>
                </div>
                <p className="text-sm font-medium">{technicianName}</p>
              </div>
            )}

            {/* Total Cost */}
            {project.totalCost && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>Total Cost</span>
                </div>
                <p className="text-sm font-medium">{formatCurrency(project.totalCost)}</p>
              </div>
            )}

            {/* Start Date */}
            {project.startDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Start Date</span>
                </div>
                <p className="text-sm font-medium">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
              </div>
            )}

            {/* Estimated Completion */}
            {project.estimatedCompletionDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Est. Completion</span>
                </div>
                <p className="text-sm font-medium">{format(new Date(project.estimatedCompletionDate), 'MMM d, yyyy')}</p>
              </div>
            )}

            {/* Actual Completion */}
            {project.actualCompletionDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed On</span>
                </div>
                <p className="text-sm font-medium">{format(new Date(project.actualCompletionDate), 'MMM d, yyyy')}</p>
              </div>
            )}

            {/* Created Date */}
            {project.createdAt && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Created</span>
                </div>
                <p className="text-sm font-medium">{format(new Date(project.createdAt), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>

          {/* Work Notes - Prominently Displayed */}
          {project.workNotes && (
            <>
              <Separator />
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
                <h4 className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Work Notes
                </h4>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{project.workNotes}</p>
              </div>
            </>
          )}

          {/* Equipment Used */}
          {project.equipmentUsed && Array.isArray(project.equipmentUsed) && (project.equipmentUsed as any[]).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Equipment Used</h4>
                <ul className="list-disc list-inside space-y-1">
                  {(project.equipmentUsed as any[]).map((item: any, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {typeof item === 'string' ? item : item.name || 'Unknown item'}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Project Comments Section */}
          <Separator />
          <div className="space-y-4">
            <h4 className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Comments
            </h4>

            {/* Comments List */}
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No comments yet. Be the first to add one!</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted/30 rounded-lg border" data-testid={`comment-${comment.id}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {comment.user?.firstName} {comment.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {comment.createdAt && format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Form */}
            <div className="space-y-2 p-3 bg-muted/20 rounded-lg border">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                data-testid="textarea-project-comment"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={submitCommentMutation.isPending || !commentText.trim()}
                size="sm"
                data-testid="button-submit-comment"
              >
                {submitCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </div>

          {/* Client Feedback - Display if exists */}
          {project.clientFeedback && (
            <>
              <Separator />
              <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  Client Feedback
                  {project.clientRating && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= project.clientRating!
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </h4>
                <p className="text-sm whitespace-pre-wrap">{project.clientFeedback}</p>
              </div>
            </>
          )}

          {/* Client Feedback Form - Show for clients on completed projects without feedback */}
          {canSubmitFeedback && (
            <>
              <Separator />
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <h4 className="text-base font-semibold">Share Your Feedback</h4>
                
                {/* Star Rating */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate this project</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                        data-testid={`button-rating-${star}`}
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Needs Improvement'}
                    </p>
                  )}
                </div>

                {/* Feedback Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your comments</label>
                  <Textarea
                    placeholder="Tell us about your experience with this project..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    data-testid="textarea-client-feedback"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={submitFeedbackMutation.isPending || !feedbackText.trim() || rating === 0}
                  className="w-full"
                  data-testid="button-submit-feedback"
                >
                  {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
