import { useState, useMemo, useEffect } from "react";
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
import { UserPlus, Mail, Phone, Building, MapPin, TrendingUp, AlertCircle, Send, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { insertLeadSchema, type Lead, type Inquiry, type InsertLeadType } from "@shared/schema";
import { LeadDialog } from "@/components/LeadDialog";
import { apiRequest } from "@/lib/queryClient";
import FlyerBuilder from "./FlyerBuilder";

export default function LeadsManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Suggested leads search and pagination
  const [suggestedSearchTerm, setSuggestedSearchTerm] = useState('');
  const [suggestedCurrentPage, setSuggestedCurrentPage] = useState(1);
  const [suggestedItemsPerPage, setSuggestedItemsPerPage] = useState(20);
  
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

  const createLeadMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsAddDialogOpen(false);
      setEditingLead(undefined);
      form.reset();
      toast({
        title: "Lead Created",
        description: "New lead has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create lead", variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const { id, ...updates } = leadData;
      return apiRequest("PATCH", `/api/leads/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsAddDialogOpen(false);
      setEditingLead(undefined);
      toast({
        title: "Lead Updated",
        description: "Lead information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update lead", variant: "destructive" });
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

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      return apiRequest("PATCH", `/api/leads/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Updated",
        description: "Lead status has been updated successfully.",
      });
    },
  });

  const convertToClient = useMutation({
    mutationFn: async (leadId: string) => {
      return apiRequest("POST", `/api/clients/convert-from-lead/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Lead Converted",
        description: "Lead has been converted to a client successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert lead to client",
        variant: "destructive",
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

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter leads based on status and search term
  const filteredLeads = useMemo(() => {
    let filtered = leads.filter((lead) => {
      if (filterStatus === "all") return true;
      return lead.status === filterStatus;
    });

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => {
        const name = (lead.name || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const company = (lead.company || '').toLowerCase();
        const source = (lead.source || '').toLowerCase();
        const status = (lead.status || '').toLowerCase();
        
        return name.includes(search) ||
               email.includes(search) ||
               phone.includes(search) ||
               company.includes(search) ||
               source.includes(search) ||
               status.includes(search);
      });
    }
    
    return filtered;
  }, [leads, filterStatus, searchTerm]);

  // Paginate filtered leads
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  // Filter suggested leads based on search
  const suggestedLeads = useMemo(() => {
    return inquiries.filter(
      (inquiry) => inquiry.status === "new" || inquiry.status === "contacted"
    );
  }, [inquiries]);

  // Reset to first page when suggested search term changes
  useEffect(() => {
    setSuggestedCurrentPage(1);
  }, [suggestedSearchTerm]);

  // Filtered suggested leads based on search
  const filteredSuggestedLeads = useMemo(() => {
    if (!suggestedSearchTerm.trim()) return suggestedLeads;
    
    const search = suggestedSearchTerm.toLowerCase();
    return suggestedLeads.filter((inquiry) => {
      const name = (inquiry.name || '').toLowerCase();
      const email = (inquiry.email || '').toLowerCase();
      const phone = (inquiry.phone || '').toLowerCase();
      const company = (inquiry.company || '').toLowerCase();
      const serviceType = (inquiry.serviceType || '').toLowerCase();
      const type = (inquiry.type || '').toLowerCase();
      const status = (inquiry.status || '').toLowerCase();
      
      return name.includes(search) ||
             email.includes(search) ||
             phone.includes(search) ||
             company.includes(search) ||
             serviceType.includes(search) ||
             type.includes(search) ||
             status.includes(search);
    });
  }, [suggestedLeads, suggestedSearchTerm]);

  // Paginated suggested leads
  const paginatedSuggestedLeads = useMemo(() => {
    const startIndex = (suggestedCurrentPage - 1) * suggestedItemsPerPage;
    const endIndex = startIndex + suggestedItemsPerPage;
    return filteredSuggestedLeads.slice(startIndex, endIndex);
  }, [filteredSuggestedLeads, suggestedCurrentPage, suggestedItemsPerPage]);

  const suggestedTotalPages = Math.ceil(filteredSuggestedLeads.length / suggestedItemsPerPage);
  const suggestedStartResult = filteredSuggestedLeads.length === 0 ? 0 : (suggestedCurrentPage - 1) * suggestedItemsPerPage + 1;
  const suggestedEndResult = Math.min(suggestedCurrentPage * suggestedItemsPerPage, filteredSuggestedLeads.length);

  const handleLeadSubmit = (leadData: any) => {
    if (leadData.id) {
      updateLeadMutation.mutate(leadData);
    } else {
      createLeadMutation.mutate(leadData);
    }
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsAddDialogOpen(true);
  };

  const handleCreateClick = () => {
    setEditingLead(undefined);
    setIsAddDialogOpen(true);
  };

  const onSubmit = (data: InsertLeadType) => {
    createLeadMutation.mutate(data);
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
          <TabsTrigger value="reachout" data-testid="tab-reach-out">
            <Send className="w-4 h-4 mr-2" />
            Reach Out
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
              <div>
                <CardTitle>Leads Management</CardTitle>
                <CardDescription>Track and manage potential clients</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
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

                <Button onClick={handleCreateClick} data-testid="button-add-lead">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, phone, company, source, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-leads"
                />
              </div>

              {leadsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No results found{searchTerm ? ` matching "${searchTerm}"` : filterStatus !== "all" ? ` with status "${filterStatus}"` : ""}.
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
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
                        {paginatedLeads.map((lead) => (
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
                        <TableCell>{formatServiceType(lead.serviceType || undefined)}</TableCell>
                        <TableCell>
                          <Select
                            value={lead.status || "new"}
                            onValueChange={(value) =>
                              updateLeadStatus.mutate({ id: lead.id, updates: { status: value as any } })
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
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(lead)}
                              data-testid={`button-edit-lead-${lead.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={lead.status === "converted" || convertToClient.isPending}
                              onClick={() => convertToClient.mutate(lead.id)}
                              data-testid={`button-convert-lead-${lead.id}`}
                            >
                              <TrendingUp className="w-4 h-4 mr-1" />
                              {convertToClient.isPending ? "Converting..." : "Convert to Client"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredLeads.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} results
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger className="w-[80px]" data-testid="select-items-per-page">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
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
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, phone, company, service type..."
                  value={suggestedSearchTerm}
                  onChange={(e) => setSuggestedSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-suggested-leads"
                />
              </div>

              {inquiriesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading inquiries...</div>
              ) : filteredSuggestedLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {suggestedSearchTerm ? `No inquiries found matching "${suggestedSearchTerm}"` : "No new inquiries to convert"}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
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
                        {paginatedSuggestedLeads.map((inquiry) => (
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
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {suggestedStartResult} to {suggestedEndResult} of {filteredSuggestedLeads.length} inquiries
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Items per page:</span>
                        <Select
                          value={String(suggestedItemsPerPage)}
                          onValueChange={(value) => {
                            setSuggestedItemsPerPage(Number(value));
                            setSuggestedCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20" data-testid="select-suggested-items-per-page">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSuggestedCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={suggestedCurrentPage === 1}
                          data-testid="button-suggested-prev-page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {suggestedCurrentPage} of {suggestedTotalPages || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSuggestedCurrentPage(prev => Math.min(suggestedTotalPages, prev + 1))}
                          disabled={suggestedCurrentPage === suggestedTotalPages || suggestedTotalPages === 0}
                          data-testid="button-suggested-next-page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reachout" className="space-y-4">
          <FlyerBuilder />
        </TabsContent>
      </Tabs>

      <LeadDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleLeadSubmit}
        isPending={createLeadMutation.isPending || updateLeadMutation.isPending}
        lead={editingLead}
      />
    </div>
  );
}
