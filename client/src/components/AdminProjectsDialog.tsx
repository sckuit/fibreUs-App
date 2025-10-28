import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { Project, User } from "@shared/schema";
import { Settings } from "lucide-react";

const projectUpdateSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'on_hold']),
  assignedTechnicianId: z.string().optional(),
  workNotes: z.string().optional(),
  totalCost: z.string().optional(),
});

type ProjectUpdateForm = z.infer<typeof projectUpdateSchema>;

interface AdminProjectsDialogProps {
  project: Project;
  onSuccess: () => void;
}

export default function AdminProjectsDialog({ project, onSuccess }: AdminProjectsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: technicians } = useQuery<User[]>({
    queryKey: ['/api/technicians'],
    enabled: open,
  });

  const form = useForm<ProjectUpdateForm>({
    resolver: zodResolver(projectUpdateSchema),
    defaultValues: {
      status: project.status || 'scheduled',
      assignedTechnicianId: project.assignedTechnicianId || '',
      workNotes: project.workNotes || '',
      totalCost: project.totalCost?.toString() || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectUpdateForm) => {
      const updateData = {
        status: data.status,
        workNotes: data.workNotes,
        ...(data.assignedTechnicianId && { assignedTechnicianId: data.assignedTechnicianId }),
        ...(data.totalCost && { totalCost: parseFloat(data.totalCost) }),
      };
      
      return apiRequest('PUT', `/api/projects/${project.id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Project updated successfully",
        description: "The project details have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/admin'] });
      setOpen(false);
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectUpdateForm) => {
    updateMutation.mutate(data);
  };

  const statusColors = {
    scheduled: 'text-blue-600 bg-blue-50',
    in_progress: 'text-orange-600 bg-orange-50',
    completed: 'text-green-600 bg-green-50',
    on_hold: 'text-yellow-600 bg-yellow-50',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-manage-project">
          <Settings className="w-4 h-4 mr-2" />
          Manage Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Project</DialogTitle>
          <DialogDescription>
            Update project status, assign technicians, and manage project details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Info */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Project Information</h4>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Name:</strong> {project.projectName}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Current Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${statusColors[project.status] || 'text-gray-600 bg-gray-50'}`}>
                  {project.status?.replace('_', ' ')}
                </span>
              </p>
            </div>

            {/* Status Update */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-project-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Technician Assignment */}
            <FormField
              control={form.control}
              name="assignedTechnicianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Technician (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-technician">
                        <SelectValue placeholder="Select technician (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {technicians?.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.firstName} {tech.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total Cost */}
            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cost</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        data-testid="input-project-cost"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Work Notes */}
            <FormField
              control={form.control}
              name="workNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add work notes, progress updates, or technical details..."
                      className="min-h-[100px]"
                      data-testid="textarea-work-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-project-update"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-project-update"
              >
                {updateMutation.isPending ? "Updating..." : "Update Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}