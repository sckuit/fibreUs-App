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
import type { Lead } from "@shared/schema";

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (leadData: any) => void;
  isPending: boolean;
  lead?: Lead;
}

export function LeadDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isPending,
  lead,
}: LeadDialogProps) {
  const isEditMode = !!lead;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    serviceType: "",
    address: "",
    status: "new",
    source: "manual",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      if (lead) {
        setFormData({
          name: lead.name || "",
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          serviceType: lead.serviceType || "",
          address: lead.address || "",
          status: lead.status || "new",
          source: lead.source || "manual",
          notes: lead.notes || "",
        });
      } else {
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          serviceType: "",
          address: "",
          status: "new",
          source: "manual",
          notes: "",
        });
      }
    }
  }, [open, lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      return;
    }
    
    const submitData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      source: formData.source,
    };

    if (formData.company) submitData.company = formData.company;
    if (formData.serviceType) submitData.serviceType = formData.serviceType;
    if (formData.address) submitData.address = formData.address;
    if (formData.notes) submitData.notes = formData.notes;
    
    if (isEditMode && lead) {
      submitData.id = lead.id;
    }
    
    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-lead">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Lead" : "Create New Lead"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update lead information" : "Add a new lead to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                data-testid="input-lead-name"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="col-span-3"
                data-testid="input-lead-email"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="col-span-3"
                data-testid="input-lead-phone"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                className="col-span-3"
                data-testid="input-lead-company"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serviceType" className="text-right">
                Service Type
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => handleChange("serviceType", value)}
              >
                <SelectTrigger className="col-span-3" data-testid="select-service-type">
                  <SelectValue placeholder="Select service (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cctv">CCTV</SelectItem>
                  <SelectItem value="alarm">Alarm System</SelectItem>
                  <SelectItem value="access_control">Access Control</SelectItem>
                  <SelectItem value="intercom">Intercom System</SelectItem>
                  <SelectItem value="cloud_storage">Cloud Storage</SelectItem>
                  <SelectItem value="monitoring">Monitoring Service</SelectItem>
                  <SelectItem value="fiber_installation">Fiber Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
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
                <SelectTrigger className="col-span-3" data-testid="select-lead-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="source" className="text-right">
                Source
              </Label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleChange("source", value)}
              >
                <SelectTrigger className="col-span-3" data-testid="select-lead-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="col-span-3"
                rows={2}
                data-testid="input-lead-address"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="col-span-3"
                rows={3}
                data-testid="input-lead-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-lead">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !formData.name || !formData.email || !formData.phone} 
              data-testid="button-submit-lead"
            >
              {isPending 
                ? (isEditMode ? "Updating..." : "Creating...") 
                : (isEditMode ? "Update Lead" : "Create Lead")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
