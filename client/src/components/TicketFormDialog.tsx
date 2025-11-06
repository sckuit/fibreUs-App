import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertTicketSchema, type Ticket, type Project } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Search } from "lucide-react";

// Form schema - includes projectId when creating from standalone Tickets tab
const ticketFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketFormDialogProps {
  ticket?: Ticket | null;
  projectId?: string; // Optional - when undefined, user selects from projects dropdown
  projects?: Project[]; // Required when projectId is undefined
  isOpen: boolean;
  onClose: () => void;
  technicians?: Array<{ id: string; fullName: string }>;
}

export function TicketFormDialog({ ticket, projectId, projects = [], isOpen, onClose, technicians = [] }: TicketFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!ticket;
  const showProjectSelector = !projectId && !isEditing; // Show dropdown only when creating new ticket without a pre-selected project
  const [projectSearch, setProjectSearch] = useState("");

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      projectId: projectId || ticket?.projectId || "",
      title: ticket?.title || "",
      description: ticket?.description || "",
      status: ticket?.status || "open",
      priority: ticket?.priority || "medium",
      assignedToId: ticket?.assignedToId || "unassigned",
      dueDate: ticket?.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assignedToId: data.assignedToId && data.assignedToId !== "unassigned" ? data.assignedToId : undefined,
      };
      const response = await apiRequest('POST', `/api/projects/${data.projectId}/tickets`, payload);
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Ticket created",
        description: "The ticket has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', variables.projectId, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assignedToId: data.assignedToId && data.assignedToId !== "unassigned" ? data.assignedToId : undefined,
      };
      const response = await apiRequest('PATCH', `/api/tickets/${ticket!.id}`, payload);
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Ticket updated",
        description: "The ticket has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', variables.projectId, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticket!.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    if (isEditing) {
      updateTicketMutation.mutate(data);
    } else {
      createTicketMutation.mutate(data);
    }
  };

  const isPending = createTicketMutation.isPending || updateTicketMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-ticket-form">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">
            {isEditing ? 'Edit Ticket' : 'Create New Ticket'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showProjectSelector && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="flex items-center px-2 pb-2">
                          <Search className="h-4 w-4 text-muted-foreground mr-2" />
                          <Input
                            placeholder="Search projects..."
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                            className="h-8"
                            data-testid="input-project-search"
                          />
                        </div>
                        {projects
                          .filter((p) => {
                            if (!projectSearch.trim()) return true;
                            const search = projectSearch.toLowerCase();
                            return (
                              p.projectName?.toLowerCase().includes(search) ||
                              p.ticketNumber?.toLowerCase().includes(search)
                            );
                          })
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.ticketNumber} - {project.projectName}
                            </SelectItem>
                          ))}
                        {projects.filter((p) => {
                          if (!projectSearch.trim()) return true;
                          const search = projectSearch.toLowerCase();
                          return (
                            p.projectName?.toLowerCase().includes(search) ||
                            p.ticketNumber?.toLowerCase().includes(search)
                          );
                        }).length === 0 && (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No projects found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ticket title" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter ticket description"
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assigned-to">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.fullName}
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
