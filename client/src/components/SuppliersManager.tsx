import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, Phone, MapPin, Calendar, FileText, Plus } from "lucide-react";
import { insertSupplierSchema, type Supplier, type InsertSupplierType } from "@shared/schema";

export default function SuppliersManager() {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createSupplier = useMutation({
    mutationFn: async (data: InsertSupplierType) => {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create supplier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Supplier Created",
        description: "The supplier has been added successfully.",
      });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Supplier> }) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update supplier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
      toast({
        title: "Supplier Updated",
        description: "Supplier information has been updated successfully.",
      });
    },
  });

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "supplier":
        return "bg-blue-100 text-blue-800";
      case "vendor":
        return "bg-purple-100 text-purple-800";
      case "partner":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatType = (type?: string) => {
    if (!type) return "N/A";
    return type.charAt(0).toUpperCase() + type.slice(1);
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

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (filterType !== "all" && supplier.type !== filterType) return false;
    if (filterStatus !== "all" && supplier.status !== filterStatus) return false;
    return true;
  });

  const addForm = useForm<InsertSupplierType>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      type: "supplier",
      status: "active",
      email: "",
      phone: "",
      address: "",
      contactPerson: "",
      website: "",
      taxId: "",
      paymentTerms: "",
      deliveryTerms: "",
      contractStartDate: undefined,
      contractEndDate: undefined,
      notes: "",
    },
  });

  const editForm = useForm<Partial<Supplier>>({
    defaultValues: selectedSupplier || {},
  });

  const handleAdd = (data: InsertSupplierType) => {
    createSupplier.mutate(data);
  };

  const handleEdit = (data: Partial<Supplier>) => {
    if (!selectedSupplier) return;
    updateSupplier.mutate({ id: selectedSupplier.id, updates: data });
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    editForm.reset(supplier);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Suppliers, Vendors & Partners</CardTitle>
            <CardDescription>Manage your business relationships</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36" data-testid="select-filter-type">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
                <SelectItem value="vendor">Vendors</SelectItem>
                <SelectItem value="partner">Partners</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-testid="select-filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-supplier">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                  <DialogDescription>Add a new supplier, vendor, or partner to your system</DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ABC Corporation" data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="supplier">Supplier</SelectItem>
                                <SelectItem value="vendor">Vendor</SelectItem>
                                <SelectItem value="partner">Partner</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="contact@company.com" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+1 (555) 123-4567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John Doe" data-testid="input-contact-person" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
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
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={addForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="123 Business St, City, State, ZIP" data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://www.company.com" data-testid="input-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="12-3456789" data-testid="input-tax-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="paymentTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Terms</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Net 30" data-testid="input-payment-terms" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="deliveryTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Terms</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="FOB Destination" data-testid="input-delivery-terms" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={addForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Additional notes" data-testid="input-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-submit">
                        Add Supplier
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading suppliers...</p>
          ) : filteredSuppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suppliers found. Add your first supplier to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium" data-testid={`text-name-${supplier.id}`}>{supplier.name}</p>
                          {supplier.contactPerson && (
                            <p className="text-xs text-muted-foreground">{supplier.contactPerson}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(supplier.type)} data-testid={`badge-type-${supplier.id}`}>
                        {formatType(supplier.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(supplier.status)} data-testid={`badge-status-${supplier.id}`}>
                        {supplier.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(supplier)}
                        data-testid={`button-view-${supplier.id}`}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedSupplier && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Supplier Details</DialogTitle>
              <DialogDescription>View and update supplier information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-md">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-base">{selectedSupplier.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge className={getTypeColor(selectedSupplier.type)}>
                    {formatType(selectedSupplier.type)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedSupplier.status)}>
                    {selectedSupplier.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                  <p className="text-base">{selectedSupplier.contactPerson || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedSupplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{selectedSupplier.email}</p>
                    </div>
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{selectedSupplier.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedSupplier.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm">{selectedSupplier.address}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedSupplier.website && (
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="text-sm">{selectedSupplier.website}</p>
                  </div>
                )}
                {selectedSupplier.taxId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tax ID</p>
                    <p className="text-sm">{selectedSupplier.taxId}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedSupplier.paymentTerms && (
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Terms</p>
                    <p className="text-sm">{selectedSupplier.paymentTerms}</p>
                  </div>
                )}
                {selectedSupplier.deliveryTerms && (
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Terms</p>
                    <p className="text-sm">{selectedSupplier.deliveryTerms}</p>
                  </div>
                )}
              </div>

              {selectedSupplier.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedSupplier.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Added on {formatDate(selectedSupplier.createdAt)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-close">
                  Close
                </Button>
                <Select
                  value={selectedSupplier.status}
                  onValueChange={(value) =>
                    updateSupplier.mutate({
                      id: selectedSupplier.id,
                      updates: { status: value as "active" | "inactive" },
                    })
                  }
                >
                  <SelectTrigger className="w-40" data-testid="select-update-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Mark Active</SelectItem>
                    <SelectItem value="inactive">Mark Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
