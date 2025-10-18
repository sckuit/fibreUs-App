import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Quote, Lead, Client, PriceMatrix, SystemConfig, UpdateQuoteType } from "@shared/schema";
import { updateQuoteSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Download, FileText, DollarSign, Trash2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface QuoteItem {
  priceMatrixId: string;
  itemName: string;
  description: string;
  unit: string;
  unitPrice: string;
  quantity: number;
  total: number;
}

export default function QuotesManager() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<QuoteItem[]>([]);

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
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

  const form = useForm<UpdateQuoteType>({
    resolver: zodResolver(updateQuoteSchema),
    defaultValues: {
      quoteNumber: '',
      leadId: '',
      clientId: '',
      items: [],
      subtotal: '0.00',
      taxRate: '0.00',
      taxAmount: '0.00',
      total: '0.00',
      validUntil: undefined,
      notes: '',
      status: 'draft',
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuoteType }) =>
      apiRequest('PUT', `/api/quotes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({ title: "Quote updated successfully" });
      setIsEditDialogOpen(false);
      setEditingQuote(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/quotes/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({ title: "Quote deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredQuotes = statusFilter === "all"
    ? quotes
    : quotes.filter(q => q.status === statusFilter);

  const getRecipientName = (quote: Quote) => {
    if (quote.leadId) {
      const lead = leads.find(l => l.id === quote.leadId);
      return lead ? `${lead.name} (Lead)` : 'Unknown Lead';
    }
    if (quote.clientId) {
      const client = clients.find(c => c.id === quote.clientId);
      return client ? `${client.name} (Client)` : 'Unknown Client';
    }
    return 'No Recipient';
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    const items = Array.isArray(quote.items) ? quote.items as QuoteItem[] : [];
    setSelectedItems(items);
    
    form.reset({
      quoteNumber: quote.quoteNumber,
      leadId: quote.leadId || '',
      clientId: quote.clientId || '',
      items: quote.items as any,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate || '0',
      taxAmount: quote.taxAmount || '0',
      total: quote.total,
      validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : undefined,
      notes: quote.notes || '',
      status: quote.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (values: UpdateQuoteType) => {
    if (!editingQuote) return;

    const subtotal = calculateSubtotal();
    const taxAmount = calculateTax();
    const total = calculateTotal();

    const updateData: UpdateQuoteType = {
      ...values,
      leadId: values.leadId || undefined,
      clientId: values.clientId || undefined,
      items: selectedItems as any,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      validUntil: values.validUntil || undefined,
    };

    updateQuoteMutation.mutate({ id: editingQuote.id, data: updateData });
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      const recipient = quote.leadId
        ? leads.find(l => l.id === quote.leadId)
        : clients.find(c => c.id === quote.clientId);

      // Load company logo if available
      let logoData: string | null = null;
      if (systemConfig?.logoUrl) {
        try {
          const response = await fetch(systemConfig.logoUrl);
          const blob = await response.blob();
          logoData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Failed to load logo:', error);
        }
      }

      // Header Background
      pdf.setFillColor(30, 58, 95);
      pdf.rect(0, 0, pageWidth, 45, 'F');

      // Company Logo
      if (logoData) {
        try {
          pdf.addImage(logoData, 'PNG', margin, 10, 30, 25);
        } catch (error) {
          console.error('Failed to add logo to PDF:', error);
        }
      }

      // Company Name and Info
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text(systemConfig?.companyName || 'Quote', logoData ? margin + 35 : margin, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const tagline = systemConfig?.headerTagline || 'Professional Quote';
      pdf.text(tagline, logoData ? margin + 35 : margin, 27);

      // Company Contact Info (Right Side)
      pdf.setFontSize(9);
      const contactInfo = [];
      if (systemConfig?.phoneNumber) contactInfo.push(systemConfig.phoneNumber);
      if (systemConfig?.contactEmail) contactInfo.push(systemConfig.contactEmail);
      if (systemConfig?.website) contactInfo.push(systemConfig.website);
      
      contactInfo.forEach((info, index) => {
        pdf.text(info, pageWidth - margin, 18 + (index * 5), { align: 'right' });
      });

      if (systemConfig?.address) {
        pdf.setFontSize(8);
        pdf.text(systemConfig.address, pageWidth - margin, 33, { align: 'right' });
      }

      // Reset text color for body
      pdf.setTextColor(0, 0, 0);
      yPos = 55;

      // Quote Number and Date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Quote #: ${quote.quoteNumber}`, margin, yPos);
      pdf.text(`Date: ${format(new Date(quote.createdAt!), 'MMMM dd, yyyy')}`, pageWidth - margin - 50, yPos);
      yPos += 7;

      if (quote.validUntil) {
        pdf.text(`Valid Until: ${format(new Date(quote.validUntil), 'MMMM dd, yyyy')}`, pageWidth - margin - 50, yPos);
        yPos += 7;
      }

      yPos += 5;

      // Customer Information
      if (recipient) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Bill To:', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(recipient.name, margin, yPos);
        yPos += 5;
        if (recipient.company) {
          pdf.text(recipient.company, margin, yPos);
          yPos += 5;
        }
        if (recipient.email) {
          pdf.text(recipient.email, margin, yPos);
          yPos += 5;
        }
        if (recipient.phone) {
          pdf.text(recipient.phone, margin, yPos);
          yPos += 5;
        }
      }
      yPos += 10;

      // Items Table Header
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      pdf.text('Item', margin + 2, yPos + 5);
      pdf.text('Qty', pageWidth - 90, yPos + 5);
      pdf.text('Unit Price', pageWidth - 70, yPos + 5);
      pdf.text('Total', pageWidth - margin - 2, yPos + 5, { align: 'right' });
      yPos += 10;

      // Items
      const items = Array.isArray(quote.items) ? quote.items as QuoteItem[] : [];
      pdf.setFont('helvetica', 'normal');
      items.forEach((item: QuoteItem) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.text(item.itemName, margin + 2, yPos);
        if (item.description) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          const descLines = pdf.splitTextToSize(item.description, 70);
          pdf.text(descLines[0], margin + 2, yPos + 4);
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
        }
        pdf.text(item.quantity.toString(), pageWidth - 90, yPos);
        pdf.text(`$${parseFloat(item.unitPrice).toFixed(2)}`, pageWidth - 70, yPos);
        pdf.text(`$${item.total.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 8;
      });

      yPos += 5;

      // Totals
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', pageWidth - 70, yPos);
      pdf.text(`$${parseFloat(quote.subtotal).toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 6;

      const taxRate = parseFloat(quote.taxRate || '0');
      if (taxRate > 0) {
        pdf.text(`Tax (${taxRate.toFixed(2)}%):`, pageWidth - 70, yPos);
        pdf.text(`$${parseFloat(quote.taxAmount || '0').toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 6;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Total:', pageWidth - 70, yPos);
      pdf.text(`$${parseFloat(quote.total).toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;

      // Notes
      if (quote.notes) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes:', margin, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const noteLines = pdf.splitTextToSize(quote.notes, pageWidth - 2 * margin);
        pdf.text(noteLines, margin, yPos);
      }

      // Footer
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        if (systemConfig?.companyName) {
          pdf.text(
            systemConfig.companyName,
            margin,
            pdf.internal.pageSize.getHeight() - 10
          );
        }
      }

      pdf.save(`quote-${quote.quoteNumber}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: "Quote has been downloaded successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Failed to generate PDF",
        description: "An error occurred while creating the PDF",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = (quote: Quote) => {
    const newStatus = quote.status === 'draft' ? 'sent' : 'draft';
    updateQuoteMutation.mutate({
      id: quote.id,
      data: { status: newStatus },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      deleteQuoteMutation.mutate(id);
    }
  };

  const handleAddItem = (item: PriceMatrix) => {
    const existingItem = selectedItems.find(si => si.priceMatrixId === item.id);
    
    if (existingItem) {
      toast({
        title: "Item already added",
        description: "This item is already in the quote. Update the quantity instead.",
        variant: "destructive",
      });
      return;
    }

    const newItem: QuoteItem = {
      priceMatrixId: item.id,
      itemName: item.item,
      description: item.description || '',
      unit: item.unit,
      unitPrice: item.customerPrice,
      quantity: 1,
      total: parseFloat(item.customerPrice),
    };

    setSelectedItems([...selectedItems, newItem]);
    setIsItemDialogOpen(false);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...selectedItems];
    const item = updatedItems[index];
    item.quantity = Math.max(1, quantity);
    item.total = item.quantity * parseFloat(item.unitPrice);
    setSelectedItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(form.watch('taxRate') || '0');
    return (subtotal * taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quotes Manager
        </CardTitle>
        <CardDescription>
          View and manage all quotes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {quotesLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading quotes...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No quotes found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                    <TableCell className="font-medium" data-testid={`text-quote-number-${quote.id}`}>
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell data-testid={`text-recipient-${quote.id}`}>
                      {getRecipientName(quote)}
                    </TableCell>
                    <TableCell data-testid={`text-total-${quote.id}`}>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {parseFloat(quote.total).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`badge-status-${quote.id}`}>
                      <Badge variant={getStatusBadgeVariant(quote.status)}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-created-${quote.id}`}>
                      {quote.createdAt ? format(new Date(quote.createdAt), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={quote.status !== 'expired' && quote.status !== 'rejected'}
                        onCheckedChange={() => handleToggleStatus(quote)}
                        data-testid={`switch-active-${quote.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(quote)}
                          data-testid={`button-edit-${quote.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(quote)}
                          data-testid={`button-download-${quote.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(quote.id)}
                          data-testid={`button-delete-${quote.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-quote">
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
            <DialogDescription>
              Update quote details and items
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quoteNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} data-testid="input-edit-quote-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value || 'draft'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('clientId', '');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-lead">
                            <SelectValue placeholder="Select a lead (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.name} - {lead.company || 'No Company'}
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
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('leadId', '');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-client">
                            <SelectValue placeholder="Select a client (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.company || 'No Company'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Quote Items</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage items in this quote
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsItemDialogOpen(true)}
                    data-testid="button-edit-add-item"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {selectedItems.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="w-[120px]">Quantity</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                {parseFloat(item.unitPrice).toFixed(2)}/{item.unit}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-full"
                                data-testid={`input-edit-quantity-${index}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 font-medium">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                {item.total.toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                data-testid={`button-edit-remove-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          data-testid="input-edit-tax-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                          type="date"
                          data-testid="input-edit-valid-until"
                        />
                      </FormControl>
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
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Additional terms, conditions, or special notes..."
                        data-testid="textarea-edit-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedItems.length > 0 && (
                <Card>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        ${calculateSubtotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({parseFloat(form.watch('taxRate') || '0').toFixed(2)}%):
                      </span>
                      <span className="font-medium">
                        ${calculateTax().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateQuoteMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {updateQuoteMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-[700px]" data-testid="dialog-edit-add-item">
          <DialogHeader>
            <DialogTitle>Add Item from Price Matrix</DialogTitle>
            <DialogDescription>
              Select an item from the catalog to add to this quote
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceMatrixItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {parseFloat(item.customerPrice).toFixed(2)}/{item.unit}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddItem(item)}
                        data-testid={`button-edit-select-${item.id}`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
