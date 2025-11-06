import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket as TicketIcon, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Ticket, User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@shared/permissions";
import { TicketDetailsModal } from "./TicketDetailsModal";
import { TicketFormDialog } from "./TicketFormDialog";

interface ProjectTicketsTabProps {
  projectId: string;
}

export function ProjectTicketsTab({ projectId }: ProjectTicketsTabProps) {
  const { user } = useAuth();
  const typedUser = user as UserType | undefined;
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Fetch tickets for this project
  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/projects', projectId, 'tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/projects/${projectId}/tickets`);
      return response.json();
    },
  });

  // Fetch technicians for assignment
  const { data: techniciansData = [] } = useQuery<UserType[]>({
    queryKey: ['/api/technicians'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/technicians');
      return response.json();
    },
  });

  // Map technicians to include fullName
  const technicians = techniciansData.map(tech => ({
    id: tech.id,
    fullName: tech.firstName && tech.lastName 
      ? `${tech.firstName} ${tech.lastName}`
      : tech.email || 'Unknown',
  }));

  const canCreate = typedUser && typedUser.role && (
    hasPermission(typedUser.role, 'manageAllProjects') ||
    hasPermission(typedUser.role, 'manageOwnProjects')
  );

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  const handleEditTicket = () => {
    setEditingTicket(selectedTicket);
    setShowTicketDetails(false);
    setShowTicketForm(true);
  };

  const handleCloseTicketForm = () => {
    setShowTicketForm(false);
    setEditingTicket(null);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketIcon className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Tickets</h3>
          <Badge variant="secondary" data-testid="badge-ticket-count">{tickets.length}</Badge>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowTicketForm(true)}
            size="sm"
            data-testid="button-create-ticket"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <TicketIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No tickets yet.</p>
            {canCreate && (
              <p className="text-xs mt-2">Create your first ticket to track issues and tasks.</p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-4 hover-elevate cursor-pointer"
              onClick={() => handleTicketClick(ticket)}
              data-testid={`ticket-card-${ticket.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate" data-testid={`text-ticket-title-${ticket.id}`}>
                      {ticket.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-ticket-number-${ticket.id}`}>
                      #{ticket.ticketNumber}
                    </span>
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2" data-testid={`text-ticket-description-${ticket.id}`}>
                      {ticket.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={getStatusBadgeVariant(ticket.status)}
                      data-testid={`badge-status-${ticket.id}`}
                    >
                      {ticket.status ? ticket.status.replace('_', ' ') : 'unknown'}
                    </Badge>
                    <Badge
                      variant={getPriorityBadgeVariant(ticket.priority)}
                      data-testid={`badge-priority-${ticket.id}`}
                    >
                      {ticket.priority}
                    </Badge>
                    {ticket.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-due-date-${ticket.id}`}>
                        <AlertCircle className="h-3 w-3" />
                        Due: {format(new Date(ticket.dueDate), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-created-date-${ticket.id}`}>
                  {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={showTicketDetails}
        onClose={() => {
          setShowTicketDetails(false);
          setSelectedTicket(null);
        }}
        onEdit={canCreate ? handleEditTicket : undefined}
      />

      <TicketFormDialog
        ticket={editingTicket}
        projectId={projectId}
        isOpen={showTicketForm}
        onClose={handleCloseTicketForm}
        technicians={technicians}
      />
    </div>
  );
}
