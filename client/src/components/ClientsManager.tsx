import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Phone, MapPin, Calendar, FileText, ExternalLink, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Client } from "@shared/schema";
import { ClientDialog } from "@/components/ClientDialog";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@shared/permissions";
import type { User } from "@shared/schema";

export default function ClientsManager() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const { toast } = useToast();
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  const userRole = typedUser?.role || 'client';

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createClientMutation = useMutation({
    mutationFn: (clientData: any) => apiRequest("POST", "/api/clients", clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsClientDialogOpen(false);
      setEditingClient(undefined);
      toast({ title: "Client created", description: "New client has been successfully added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create client", variant: "destructive" });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const { id, ...updates } = clientData;
      return apiRequest("PATCH", `/api/clients/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsClientDialogOpen(false);
      setEditingClient(undefined);
      toast({ title: "Client updated", description: "Client information has been updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update client", variant: "destructive" });
    },
  });

  const updateClientStatus = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      return apiRequest("PATCH", `/api/clients/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client Updated",
        description: "Client status has been updated successfully.",
      });
    },
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "potential":
        return "bg-blue-100 text-blue-800";
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

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "N/A";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleClientSubmit = (clientData: any) => {
    if (clientData.id) {
      updateClientMutation.mutate(clientData);
    } else {
      createClientMutation.mutate(clientData);
    }
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setIsClientDialogOpen(true);
  };

  const handleCreateClick = () => {
    setEditingClient(undefined);
    setIsClientDialogOpen(true);
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter clients based on status and search term
  const filteredClients = useMemo(() => {
    let filtered = clients.filter((client) => {
      if (filterStatus === "all") return true;
      return client.status === filterStatus;
    });

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(client => {
        const name = (client.name || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        const phone = (client.phone || '').toLowerCase();
        const company = (client.company || '').toLowerCase();
        const address = (client.address || '').toLowerCase();
        const status = (client.status || '').toLowerCase();
        
        return name.includes(search) ||
               email.includes(search) ||
               phone.includes(search) ||
               company.includes(search) ||
               address.includes(search) ||
               status.includes(search);
      });
    }
    
    return filtered;
  }, [clients, filterStatus, searchTerm]);

  // Paginate filtered clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
          <div>
            <CardTitle>Clients Management</CardTitle>
            <CardDescription>View and manage your client accounts</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="potential">Potential</SelectItem>
              </SelectContent>
            </Select>
            {hasPermission(userRole, 'manageClients') && (
              <Button onClick={handleCreateClick} data-testid="button-create-client">
                <Plus className="w-4 h-4 mr-2" />
                Create New Client
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, company, address, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-clients"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found{searchTerm ? ` matching "${searchTerm}"` : filterStatus !== "all" ? ` with status "${filterStatus}"` : ""}.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company/Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Converted On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                  <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium" data-testid={`text-client-name-${client.id}`}>
                          {client.company || client.name}
                        </p>
                        {client.company && client.name && (
                          <p className="text-sm text-muted-foreground">{client.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                        {client.address && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {client.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.industry || "N/A"}</TableCell>
                    <TableCell>
                      <Select
                        value={client.status || "potential"}
                        onValueChange={(value) =>
                          updateClientStatus.mutate({ id: client.id, updates: { status: value as any } })
                        }
                      >
                        <SelectTrigger className="w-32" data-testid={`select-client-status-${client.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="potential">Potential</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(client.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {hasPermission(userRole, 'manageClients') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(client)}
                            data-testid={`button-edit-client-${client.id}`}
                          >
                            Edit
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedClient(client)}
                              data-testid={`button-view-client-${client.id}`}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Client Details</DialogTitle>
                            <DialogDescription>
                              Complete information for {client.company || client.name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedClient && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                                  <p className="text-sm mt-1">{selectedClient.name}</p>
                                </div>
                                {selectedClient.company && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                                    <p className="text-sm mt-1">{selectedClient.company}</p>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                                  <p className="text-sm mt-1">{selectedClient.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                  <p className="text-sm mt-1">{selectedClient.phone}</p>
                                </div>
                              </div>

                              {selectedClient.address && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                                  <p className="text-sm mt-1">{selectedClient.address}</p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Industry</label>
                                  <p className="text-sm mt-1">{selectedClient.industry || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                                  <Badge variant="outline" className={getStatusColor(selectedClient.status)}>
                                    {selectedClient.status}
                                  </Badge>
                                </div>
                              </div>

                              {selectedClient.notes && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                  <p className="text-sm mt-1 bg-muted p-3 rounded-md">{selectedClient.notes}</p>
                                </div>
                              )}

                              <div className="pt-4 border-t">
                                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                  <div>
                                    <label className="font-medium">Converted On</label>
                                    <p className="mt-1">{formatDate(selectedClient.createdAt)}</p>
                                  </div>
                                  {selectedClient.leadId && (
                                    <div>
                                      <label className="font-medium">Converted From Lead</label>
                                      <p className="mt-1 flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        Lead ID: {selectedClient.leadId.slice(0, 8)}...
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredClients.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} results
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

      <ClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        onSubmit={handleClientSubmit}
        isPending={createClientMutation.isPending || updateClientMutation.isPending}
        client={editingClient}
      />
    </div>
  );
}
