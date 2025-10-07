import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Client, User } from "@shared/schema";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (projectData: any) => void;
  isPending: boolean;
}

export function ProjectDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isPending,
}: ProjectDialogProps) {
  const [formData, setFormData] = useState({
    clientId: undefined as string | undefined,
    serviceType: undefined as string | undefined,
    projectName: "",
    assignedTechnicianId: undefined as string | undefined,
    status: "scheduled",
    startDate: "",
    estimatedCompletionDate: "",
    totalCost: "",
    workNotes: "",
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: open,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        clientId: undefined,
        serviceType: undefined,
        projectName: "",
        assignedTechnicianId: undefined,
        status: "scheduled",
        startDate: "",
        estimatedCompletionDate: "",
        totalCost: "",
        workNotes: "",
      });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.serviceType || !formData.projectName) {
      return;
    }
    
    const submitData: any = {
      clientId: formData.clientId,
      serviceType: formData.serviceType,
      projectName: formData.projectName,
      status: formData.status,
    };

    if (formData.assignedTechnicianId) {
      submitData.assignedTechnicianId = formData.assignedTechnicianId;
    }
    if (formData.startDate) {
      submitData.startDate = new Date(formData.startDate);
    }
    if (formData.estimatedCompletionDate) {
      submitData.estimatedCompletionDate = new Date(formData.estimatedCompletionDate);
    }
    if (formData.totalCost) {
      submitData.totalCost = formData.totalCost;
    }
    if (formData.workNotes) {
      submitData.workNotes = formData.workNotes;
    }
    
    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const technicians = users.filter(u => u.role === 'employee');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-project">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project for a client
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientId" className="text-right">
                Client *
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => handleChange("clientId", value)}
              >
                <SelectTrigger className="col-span-3" data-testid="select-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serviceType" className="text-right">
                Service Type *
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => handleChange("serviceType", value)}
              >
                <SelectTrigger className="col-span-3" data-testid="select-service-type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cctv">CCTV Installation</SelectItem>
                  <SelectItem value="alarm">Alarm System</SelectItem>
                  <SelectItem value="access_control">Access Control</SelectItem>
                  <SelectItem value="intercom">Intercom System</SelectItem>
                  <SelectItem value="cloud_storage">Cloud Storage</SelectItem>
                  <SelectItem value="monitoring">Remote Monitoring</SelectItem>
                  <SelectItem value="fiber_installation">Fiber Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectName" className="text-right">
                Project Name *
              </Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => handleChange("projectName", e.target.value)}
                className="col-span-3"
                data-testid="input-project-name"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTechnicianId" className="text-right">
                Assign Technician
              </Label>
              <Select
                value={formData.assignedTechnicianId}
                onValueChange={(value) => handleChange("assignedTechnicianId", value)}
              >
                <SelectTrigger className="col-span-3" data-testid="select-technician">
                  <SelectValue placeholder="Select technician (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName} ({tech.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger className="col-span-3" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="col-span-3"
                data-testid="input-start-date"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estimatedCompletionDate" className="text-right">
                Est. Completion
              </Label>
              <Input
                id="estimatedCompletionDate"
                type="date"
                value={formData.estimatedCompletionDate}
                onChange={(e) => handleChange("estimatedCompletionDate", e.target.value)}
                className="col-span-3"
                data-testid="input-est-completion"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalCost" className="text-right">
                Total Cost ($)
              </Label>
              <Input
                id="totalCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalCost}
                onChange={(e) => handleChange("totalCost", e.target.value)}
                className="col-span-3"
                data-testid="input-total-cost"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workNotes" className="text-right">
                Work Notes
              </Label>
              <Textarea
                id="workNotes"
                value={formData.workNotes}
                onChange={(e) => handleChange("workNotes", e.target.value)}
                className="col-span-3"
                rows={3}
                data-testid="input-work-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !formData.clientId || !formData.serviceType || !formData.projectName} 
              data-testid="button-submit-project"
            >
              {isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
