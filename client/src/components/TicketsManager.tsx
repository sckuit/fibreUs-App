import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ChevronLeft, ChevronRight, AlertCircle, Eye, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Ticket, User, Project } from "@shared/schema";
import { TicketDetailsModal } from "@/components/TicketDetailsModal";
import { TicketFormDialog } from "@/components/TicketFormDialog";

type TicketsManagerProps = {
  role: 'employee' | 'sales' | 'project_manager' | 'manager' | 'admin';
  userId: string;
};

export function TicketsManager({ role, userId }: TicketsManagerProps) {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, projectFilter]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((ticket) => {
        const assignedUser = users.find(u => u.id === ticket.assignedToId);
        const project = projects.find(p => p.id === ticket.projectId);
        const assignedUserName = assignedUser ? `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() : '';
        const projectName = project?.projectName || '';

        return (
          (ticket.title?.toLowerCase() || '').includes(lowerSearch) ||
          (ticket.description?.toLowerCase() || '').includes(lowerSearch) ||
          (ticket.ticketNumber?.toLowerCase() || '').includes(lowerSearch) ||
          projectName.toLowerCase().includes(lowerSearch) ||
          assignedUserName.toLowerCase().includes(lowerSearch)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(ticket => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter(ticket => ticket.priority === priorityFilter);
    }

    // Project filter
    if (projectFilter !== "all") {
      result = result.filter(ticket => ticket.projectId === projectFilter);
    }

    return result;
  }, [tickets, searchTerm, statusFilter, priorityFilter, projectFilter, users, projects]);

  // Paginate filtered tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, currentPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startResult = filteredTickets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, filteredTickets.length);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'open': return <Badge variant="destructive" data-testid={`badge-status-${status}`}>Open</Badge>;
      case 'in_progress': return <Badge variant="default" data-testid={`badge-status-${status}`}>In Progress</Badge>;
      case 'resolved': return <Badge variant="secondary" data-testid={`badge-status-${status}`}>Resolved</Badge>;
      case 'closed': return <Badge variant="outline" data-testid={`badge-status-${status}`}>Closed</Badge>;
      default: return <Badge variant="outline" data-testid="badge-status-unknown">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive" data-testid={`badge-priority-${priority}`}>Urgent</Badge>;
      case 'high': return <Badge variant="default" data-testid={`badge-priority-${priority}`}>High</Badge>;
      case 'medium': return <Badge variant="secondary" data-testid={`badge-priority-${priority}`}>Medium</Badge>;
      case 'low': return <Badge variant="outline" data-testid={`badge-priority-${priority}`}>Low</Badge>;
      default: return <Badge variant="outline" data-testid="badge-priority-unknown">-</Badge>;
    }
  };

  const canCreateTickets = ['manager', 'admin', 'project_manager'].includes(role);
  const canEditTickets = ['manager', 'admin', 'project_manager'].includes(role);
  const canDeleteTickets = ['manager', 'admin'].includes(role);

  const deleteTicketMutation = useMutation({
    mutationFn: (ticketId: string) => apiRequest('DELETE', `/api/tickets/${ticketId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tickets</CardTitle>
              <CardDescription>
                Manage project tickets and track issues
              </CardDescription>
            </div>
            {canCreateTickets && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={projects.length === 0}
                data-testid="button-create-ticket"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-tickets"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger data-testid="select-priority-filter">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger data-testid="select-project-filter">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectName || `Project #${project.ticketNumber}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tickets Table */}
          {ticketsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading tickets...</p>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all"
                  ? "No tickets match your filters"
                  : "No tickets found"}
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.map((ticket: any) => {
                      const assignedUser = users.find(u => u.id === ticket.assignedToId);
                      const projectName = ticket.project?.projectName || ticket.project?.ticketNumber || '-';
                      
                      return (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedTicket(ticket)}
                          data-testid={`row-ticket-${ticket.id}`}
                        >
                          <TableCell className="font-mono text-sm">
                            #{ticket.ticketNumber}
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate">
                            {ticket.title}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {projectName}
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>
                            {assignedUser
                              ? `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() || assignedUser.email
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {ticket.dueDate ? format(new Date(ticket.dueDate), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedTicket(ticket)}
                                data-testid={`button-view-ticket-${ticket.id}`}
                                title="View ticket"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEditTickets && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingTicket(ticket)}
                                  data-testid={`button-edit-ticket-${ticket.id}`}
                                  title="Edit ticket"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDeleteTickets && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ticket #${ticket.ticketNumber}?`)) {
                                      deleteTicketMutation.mutate(ticket.id);
                                    }
                                  }}
                                  disabled={deleteTicketMutation.isPending}
                                  data-testid={`button-delete-ticket-${ticket.id}`}
                                  title="Delete ticket"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {startResult} to {endResult} of {filteredTickets.length} tickets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Create Ticket Dialog */}
      {showCreateDialog && (
        <TicketFormDialog
          projects={projects}
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          technicians={users
            .filter(u => ['employee', 'sales', 'project_manager', 'manager', 'admin'].includes(u.role || ''))
            .map(u => ({
              id: u.id,
              fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown'
            }))
          }
        />
      )}

      {/* Edit Ticket Dialog */}
      {editingTicket && !usersLoading && (
        <TicketFormDialog
          ticket={editingTicket}
          projectId={editingTicket.projectId}
          projects={projects}
          isOpen={!!editingTicket}
          onClose={() => setEditingTicket(null)}
          technicians={users
            .filter(u => ['employee', 'sales', 'project_manager', 'manager', 'admin'].includes(u.role || ''))
            .map(u => ({
              id: u.id,
              fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown'
            }))
          }
        />
      )}
    </>
  );
}
