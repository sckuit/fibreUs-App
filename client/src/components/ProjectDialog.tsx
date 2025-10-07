import { useState, useEffect } from "react";
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
import type { ServiceRequest, User } from "@shared/schema";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (projectData: any) => void;
  isPending: boolean;
  serviceRequests: ServiceRequest[];
  users: User[];
}

export function ProjectDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isPending, 
  serviceRequests,
  users 
}: ProjectDialogProps) {
  const [formData, setFormData] = useState({
    serviceRequestId: "",
    projectName: "",
    assignedTechnicianId: "",
    status: "scheduled",
    startDate: "",
    estimatedCompletionDate: "",
    totalCost: "",
    workNotes: "",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        serviceRequestId: "",
        projectName: "",
        assignedTechnicianId: "",
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
    
    const submitData: any = {
      serviceRequestId: formData.serviceRequestId,
      projectName: formData.projectName,
      status: formData.status,
    };

    if (formData.assignedTechnicianId) {
      submitData.assignedTechnicianId = formData.assignedTechnicianId;
    }
    if (formData.startDate) {
      submitData.startDate = new Date(formData.startDate).toISOString();
    }
    if (formData.estimatedCompletionDate) {
      submitData.estimatedCompletionDate = new Date(formData.estimatedCompletionDate).toISOString();
    }
    if (formData.totalCost) {
      submitData.totalCost = parseFloat(formData.totalCost);
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
              Create a new project from a service request
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serviceRequestId" className="text-right">
                Service Request
              </Label>
              <Select
                value={formData.serviceRequestId}
                onValueChange={(value) => handleChange("serviceRequestId", value)}
                required
              >
                <SelectTrigger className="col-span-3" data-testid="select-service-request">
                  <SelectValue placeholder="Select a service request" />
                </SelectTrigger>
                <SelectContent>
                  {serviceRequests.map((sr) => (
                    <SelectItem key={sr.id} value={sr.id}>
                      {sr.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectName" className="text-right">
                Project Name
              </Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => handleChange("projectName", e.target.value)}
                className="col-span-3"
                required
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
                  <SelectItem value="">None</SelectItem>
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
            <Button type="submit" disabled={isPending} data-testid="button-submit-project">
              {isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
