import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Trash2, Download, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { insertRevenueSchema, updateRevenueSchema, type Revenue, type InsertRevenueType, type Client, type Invoice } from "@shared/schema";
import { exportToCSV } from "@/lib/exportUtils";

const revenueSources = [
  { value: "contract", label: "Contract" },
  { value: "service", label: "Service" },
  { value: "installation", label: "Installation" },
  { value: "maintenance", label: "Maintenance" },
  { value: "consultation", label: "Consultation" },
  { value: "recurring", label: "Recurring" },
  { value: "other", label: "Other" },
];

export default function RevenueManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | undefined>(undefined);
  const { toast } = useToast();

  const { data: revenue = [], isLoading } = useQuery<Revenue[]>({
    queryKey: ["/api/revenue"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const form = useForm<InsertRevenueType>({
    resolver: zodResolver(editingRevenue ? updateRevenueSchema : insertRevenueSchema),
    defaultValues: {
      date: new Date(),
      source: "service",
      amount: "",
      description: "",
      clientId: "",
      invoiceId: "",
    },
  });

  const createRevenueMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/revenue", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revenue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-logs"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Revenue created", description: "New revenue has been added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create revenue", variant: "destructive" });
    },
  });

  const updateRevenueMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/revenue/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revenue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-logs"] });
      setIsDialogOpen(false);
      setEditingRevenue(undefined);
      form.reset();
      toast({ title: "Revenue updated", description: "Revenue has been updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update revenue", variant: "destructive" });
    },
  });

  const deleteRevenueMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/revenue/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revenue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-logs"] });
      toast({ title: "Revenue deleted", description: "Revenue has been deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete revenue", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertRevenueType) => {
    const submitData = {
      ...data,
      clientId: data.clientId || undefined,
      invoiceId: data.invoiceId || undefined,
    };

    if (editingRevenue) {
      updateRevenueMutation.mutate({ id: editingRevenue.id, ...submitData });
    } else {
      createRevenueMutation.mutate(submitData);
    }
  };

  const handleEdit = (rev: Revenue) => {
    setEditingRevenue(rev);
    form.reset({
      date: new Date(rev.date),
      source: rev.source as any,
      amount: rev.amount,
      description: rev.description,
      clientId: rev.clientId || "",
      invoiceId: rev.invoiceId || "",
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRevenue(undefined);
    form.reset({
      date: new Date(),
      source: "service",
      amount: "",
      description: "",
      clientId: "",
      invoiceId: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this revenue entry?")) {
      deleteRevenueMutation.mutate(id);
    }
  };

  const getClientName = (clientId?: string | null) => {
    if (!clientId) return "-";
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "-";
  };

  const getInvoiceNumber = (invoiceId?: string | null) => {
    if (!invoiceId) return "-";
    const invoice = invoices.find((i) => i.id === invoiceId);
    return invoice?.invoiceNumber || "-";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
        <div>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Track and manage business revenue</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportToCSV(revenue, 'revenue')} data-testid="button-export-revenue">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAdd} data-testid="button-add-revenue">
            <Plus className="w-4 h-4 mr-2" />
            Add Revenue
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading revenue...</p>
        ) : revenue.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No revenue recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first revenue entry to start tracking</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenue.map((rev) => (
                <TableRow key={rev.id} data-testid={`row-revenue-${rev.id}`}>
                  <TableCell data-testid={`text-revenue-date-${rev.id}`}>
                    {format(new Date(rev.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize" data-testid={`text-revenue-source-${rev.id}`}>
                      {rev.source.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-revenue-amount-${rev.id}`}>
                    ${Number(rev.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" data-testid={`text-revenue-description-${rev.id}`}>
                    {rev.description}
                  </TableCell>
                  <TableCell data-testid={`text-revenue-client-${rev.id}`}>
                    {getClientName(rev.clientId)}
                  </TableCell>
                  <TableCell data-testid={`text-revenue-invoice-${rev.id}`}>
                    {getInvoiceNumber(rev.invoiceId)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rev)}
                        data-testid={`button-edit-revenue-${rev.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rev.id)}
                        data-testid={`button-delete-revenue-${rev.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-revenue">
          <DialogHeader>
            <DialogTitle>{editingRevenue ? "Edit Revenue" : "Add Revenue"}</DialogTitle>
            <DialogDescription>
              {editingRevenue ? "Update revenue details" : "Add a new revenue entry"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="input-revenue-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-revenue-source">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {revenueSources.map((src) => (
                          <SelectItem key={src.value} value={src.value}>
                            {src.label}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-revenue-amount"
                      />
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
                        placeholder="Enter revenue description"
                        {...field}
                        data-testid="input-revenue-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-revenue-client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
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
                name="invoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-revenue-invoice">
                          <SelectValue placeholder="Select invoice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {invoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingRevenue(undefined);
                    form.reset();
                  }}
                  data-testid="button-cancel-revenue"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRevenueMutation.isPending || updateRevenueMutation.isPending}
                  data-testid="button-submit-revenue"
                >
                  {createRevenueMutation.isPending || updateRevenueMutation.isPending
                    ? "Saving..."
                    : editingRevenue
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
