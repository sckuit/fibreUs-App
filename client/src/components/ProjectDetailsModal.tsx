import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Project } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, User, FileText, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  technicianName?: string;
}

export function ProjectDetailsModal({ project, isOpen, onClose, clientName, technicianName }: ProjectDetailsModalProps) {
  if (!project) return null;

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

          {/* Work Notes */}
          {project.workNotes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Work Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.workNotes}</p>
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

          {/* Client Feedback */}
          {project.clientFeedback && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  Client Feedback
                  {project.clientRating && (
                    <span className="text-yellow-500">
                      {'⭐'.repeat(project.clientRating)}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.clientFeedback}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
