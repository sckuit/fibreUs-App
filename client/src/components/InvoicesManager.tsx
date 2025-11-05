import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Invoice, Lead, Client, PriceMatrix, SystemConfig, UpdateInvoiceType, User } from "@shared/schema";
import { updateInvoiceSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Download, FileText, Trash2, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { InvoicePreview } from "@/components/InvoicePreview";
import { formatCurrency } from "@/lib/currency";
import { InvoiceDetailsModal } from "@/components/InvoiceDetailsModal";

interface InvoiceItem {
  priceMatrixId: string;
  itemName: string;
  description: string;
  unit: string;
  unitPrice: string;
  quantity: number;
  total: number;
}

export default function InvoicesManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [downloadingInvoice, setDownloadingInvoice] = useState<Invoice | null>(null);
  const downloadPreviewRef = useRef<HTMLDivElement>(null);
  
  // Details modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const isClient = typedUser?.role === 'client';

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: priceMatrixItems = [] } = useQuery<PriceMatrix[]>({
    queryKey: ['/api/price-matrix'],
  });

  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const form = useForm<UpdateInvoiceType>({
    resolver: zodResolver(updateInvoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      quoteId: '',
      leadId: '',
      clientId: '',
      items: [],
      subtotal: '0.00',
      taxRate: '0.00',
      taxAmount: '0.00',
      total: '0.00',
      amountPaid: '0.00',
      balanceDue: '0.00',
      paymentStatus: 'unpaid',
      status: 'draft',
      dueDate: undefined,
      notes: '',
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceType }) =>
      apiRequest('PUT', `/api/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({ title: "Invoice updated successfully" });
      setIsEditDialogOpen(false);
      setEditingInvoice(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/invoices/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({ title: "Invoice deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getRecipientName = (invoice: Invoice & { recipientName?: string }) => {
    if (invoice.recipientName) {
      const type = invoice.leadId ? 'Lead' : invoice.clientId ? 'Client' : '';
      return type ? `${invoice.recipientName} (${type})` : invoice.recipientName;
    }
    return 'No Recipient';
  };

  // Filter invoices based on status and search term
  const filteredInvoices = useMemo(() => {
    let filtered = statusFilter === "all" ? invoices : invoices.filter(i => i.status === statusFilter);
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => {
        const recipientName = getRecipientName(invoice).toLowerCase();
        const invoiceNumber = invoice.invoiceNumber.toLowerCase();
        const status = invoice.status.toLowerCase();
        const paymentStatus = invoice.paymentStatus.toLowerCase();
        const total = invoice.total.toString();
        const amountPaid = (invoice.amountPaid || '0').toString();
        const balanceDue = (invoice.balanceDue || '0').toString();
        
        return invoiceNumber.includes(search) ||
               recipientName.includes(search) ||
               status.includes(search) ||
               paymentStatus.includes(search) ||
               total.includes(search) ||
               amountPaid.includes(search) ||
               balanceDue.includes(search);
      });
    }
    
    return filtered;
  }, [invoices, statusFilter, searchTerm]);

  // Paginate filtered invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    const items = Array.isArray(invoice.items) ? invoice.items as InvoiceItem[] : [];
    setSelectedItems(items);
    
    form.reset({
      invoiceNumber: invoice.invoiceNumber,
      quoteId: invoice.quoteId || undefined,
      leadId: invoice.leadId || undefined,
      clientId: invoice.clientId || undefined,
      items: invoice.items as any,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate || '0',
      taxAmount: invoice.taxAmount || '0',
      total: invoice.total,
      amountPaid: invoice.amountPaid || '0',
      balanceDue: invoice.balanceDue || '0',
      paymentStatus: invoice.paymentStatus,
      status: invoice.status,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : undefined,
      notes: invoice.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (values: UpdateInvoiceType) => {
    if (!editingInvoice) return;

    const updateData: UpdateInvoiceType = {
      ...values,
      leadId: values.leadId || undefined,
      clientId: values.clientId || undefined,
      quoteId: values.quoteId || undefined,
      items: selectedItems as any,
      dueDate: values.dueDate || undefined,
    };

    updateInvoiceMutation.mutate({ id: editingInvoice.id, data: updateData });
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    // Set the invoice to download, which will trigger rendering of the hidden preview
    setDownloadingInvoice(invoice);
    
    // Wait for next render cycle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!downloadPreviewRef.current) {
      toast({
        title: "Failed to generate PDF",
        description: "Preview not ready",
        variant: "destructive",
      });
      setDownloadingInvoice(null);
      return;
    }

    try {
      const canvas = await html2canvas(downloadPreviewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'letter',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;

      let heightLeft = canvasHeight;
      let position = 0;
      let page = 0;

      while (heightLeft > 0) {
        if (page > 0) {
          pdf.addPage();
        }

        const idealSliceHeight = pdfHeight * ratio;
        const sourceY = page * idealSliceHeight;
        const remainingHeight = canvasHeight - sourceY;
        const sliceHeight = Math.min(Math.ceil(idealSliceHeight), remainingHeight);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasWidth;
        sliceCanvas.height = sliceHeight;
        const sliceCtx = sliceCanvas.getContext('2d');

        if (sliceCtx) {
          sliceCtx.drawImage(
            canvas,
            0, sourceY,
            canvasWidth, sliceHeight,
            0, 0,
            canvasWidth, sliceHeight
          );

          const sliceImgData = sliceCanvas.toDataURL('image/png');
          pdf.addImage(sliceImgData, 'PNG', 0, 0, pdfWidth, (sliceHeight / ratio));
        }

        heightLeft -= sliceHeight;
        page++;
      }

      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
      toast({ title: "PDF downloaded successfully" });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Failed to generate PDF",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      deleteInvoiceMutation.mutate(id);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      partial: "secondary",
      unpaid: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      sent: "secondary",
      paid: "default",
      partial: "secondary",
      cancelled: "destructive",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  if (invoicesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading invoices...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Manage Invoices
            </CardTitle>
            <CardDescription>
              View, edit, and download invoices
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by invoice number, client, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-invoices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found{searchTerm ? ` matching "${searchTerm}"` : statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
            </div>
          ) : (
            <>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map(invoice => (
                  <TableRow 
                    key={invoice.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setIsDetailsModalOpen(true);
                    }}
                    data-testid={`row-invoice-${invoice.id}`}
                  >
                    <TableCell className="font-medium" data-testid={`text-invoice-${invoice.id}`}>
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{getRecipientName(invoice)}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate && invoice.dueDate !== null ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(parseFloat(invoice.total))}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(parseFloat(invoice.amountPaid || '0'))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={parseFloat(invoice.balanceDue || '0') > 0 ? "text-orange-600" : "text-green-600"}>
                        {formatCurrency(parseFloat(invoice.balanceDue || '0'))}
                      </span>
                    </TableCell>
                    <TableCell>{getPaymentStatusBadge(invoice.paymentStatus)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isClient && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/portal/admin/invoices/${invoice.id}/edit`);
                            }}
                            data-testid={`button-edit-invoice-${invoice.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(invoice);
                          }}
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {!isClient && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                            data-testid={`button-delete-${invoice.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredInvoices.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} results
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

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update invoice details
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
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
                        <Input {...field} type="date" value={field.value || ''} data-testid="input-duedate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" data-testid="input-amountpaid" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateInvoiceMutation.isPending} data-testid="button-save">
                  {updateInvoiceMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Hidden Invoice Preview for PDF Download */}
      {downloadingInvoice && (
        <div className="fixed top-0 left-[-9999px]">
          <InvoicePreview
            ref={downloadPreviewRef}
            items={Array.isArray(downloadingInvoice.items) ? downloadingInvoice.items as InvoiceItem[] : []}
            subtotal={downloadingInvoice.subtotal}
            taxRate={downloadingInvoice.taxRate || '0'}
            taxAmount={downloadingInvoice.taxAmount || '0'}
            total={downloadingInvoice.total}
            amountPaid={downloadingInvoice.amountPaid || '0'}
            balanceDue={downloadingInvoice.balanceDue || '0'}
            paymentStatus={downloadingInvoice.paymentStatus}
            dueDate={downloadingInvoice.dueDate || undefined}
            notes={downloadingInvoice.notes || ''}
            leadId={downloadingInvoice.leadId || undefined}
            clientId={downloadingInvoice.clientId || undefined}
            invoiceNumber={downloadingInvoice.invoiceNumber}
            quoteId={downloadingInvoice.quoteId || undefined}
          />
        </div>
      )}
      
      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedInvoice(null);
        }}
        recipientName={selectedInvoice ? getRecipientName(selectedInvoice) : undefined}
      />
    </div>
  );
}
