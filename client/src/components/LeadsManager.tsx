import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Mail, Phone, Building, MapPin, TrendingUp, AlertCircle } from "lucide-react";
import { insertLeadSchema, type Lead, type Inquiry, type InsertLeadType } from "@shared/schema";

export default function LeadsManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const form = useForm<InsertLeadType>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      source: "manual",
      name: "",
      email: "",
      phone: "",
      company: "",
      serviceType: "",
      address: "",
      status: "new",
      notes: "",
    },
  });

  const createLead = useMutation({
    mutationFn: async (data: InsertLeadType) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Lead Created",
        description: "New lead has been added successfully.",
      });
    },
  });

  const convertInquiry = useMutation({
    mutationFn: async (inquiryId: string) => {
      const response = await fetch(`/api/leads/convert-from-inquiry/${inquiryId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to convert inquiry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Inquiry Converted",
        description: "Inquiry has been converted to a lead successfully.",
      });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Updated",
        description: "Lead status has been updated successfully.",
      });
    },
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-purple-100 text-purple-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case "inquiry":
        return "bg-indigo-100 text-indigo-800";
      case "manual":
        return "bg-slate-100 text-slate-800";
      case "referral":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatServiceType = (type?: string) => {
    if (!type) return "N/A";
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredLeads = leads.filter((lead) => {
    if (filterStatus === "all") return true;
    return lead.status === filterStatus;
  });

  const suggestedLeads = inquiries.filter(
    (inquiry) => inquiry.status === "new" || inquiry.status === "contacted"
  );

  const onSubmit = (data: InsertLeadType) => {
    createLead.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current" data-testid="tab-current-leads">
            Current Leads
          </TabsTrigger>
          <TabsTrigger value="suggested" data-testid="tab-suggested-leads">
            Suggested Leads
            {suggestedLeads.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {suggestedLeads.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Leads Management</CardTitle>
                <CardDescription>Track and manage potential clients</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40" data-testid="select-filter-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leads</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-lead">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Lead</DialogTitle>
                      <DialogDescription>
                        Manually add a new potential client to your leads pipeline.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-lead-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} data-testid="input-lead-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-lead-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-lead-company" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="serviceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Type</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="e.g., CCTV, Fiber Installation" data-testid="input-lead-service-type" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} data-testid="input-lead-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} rows={3} data-testid="textarea-lead-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                            data-testid="button-cancel-lead"
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createLead.isPending} data-testid="button-submit-lead">
                            {createLead.isPending ? "Adding..." : "Add Lead"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <p className="text-sm text-muted-foreground">Loading leads...</p>
              ) : filteredLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leads found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium" data-testid={`text-lead-name-${lead.id}`}>{lead.name}</p>
                            {lead.company && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {lead.company}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSourceColor(lead.source)}>
                            {lead.source}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatServiceType(lead.serviceType)}</TableCell>
                        <TableCell>
                          <Select
                            value={lead.status || "new"}
                            onValueChange={(value) =>
                              updateLead.mutate({ id: lead.id, updates: { status: value as any } })
                            }
                          >
                            <SelectTrigger className="w-32" data-testid={`select-lead-status-${lead.id}`}>
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
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={lead.status === "converted"}
                            data-testid={`button-convert-lead-${lead.id}`}
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Convert to Client
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggested" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Suggested Leads from Inquiries
              </CardTitle>
              <CardDescription>
                Convert website inquiries into leads to start nurturing potential clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inquiriesLoading ? (
                <p className="text-sm text-muted-foreground">Loading inquiries...</p>
              ) : suggestedLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No new inquiries to convert</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestedLeads.map((inquiry) => (
                      <TableRow key={inquiry.id} data-testid={`row-inquiry-${inquiry.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium" data-testid={`text-inquiry-name-${inquiry.id}`}>{inquiry.name}</p>
                            {inquiry.company && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {inquiry.company}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {inquiry.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {inquiry.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {inquiry.type === "quote" ? "Quote Request" : "Appointment"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatServiceType(inquiry.serviceType)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {inquiry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => convertInquiry.mutate(inquiry.id)}
                            disabled={convertInquiry.isPending || !!inquiry.convertedLeadId}
                            data-testid={`button-convert-inquiry-${inquiry.id}`}
                          >
                            {inquiry.convertedLeadId ? "Already Converted" : "Convert to Lead"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
