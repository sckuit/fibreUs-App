import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PriceMatrix, Lead, Client, Quote, InsertQuoteType, SystemConfig } from "@shared/schema";
import { insertQuoteSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, DollarSign, Save, Download, Search } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";

interface QuoteItem {
  priceMatrixId: string;
  itemName: string;
  description: string;
  unit: string;
  unitPrice: string;
  quantity: number;
  total: number;
}

export default function QuoteBuilder() {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<QuoteItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: priceMatrixItems = [], isLoading: priceMatrixLoading } = useQuery<PriceMatrix[]>({
    queryKey: ['/api/price-matrix'],
    queryFn: () => fetch('/api/price-matrix').then(res => res.json()),
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const form = useForm({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      quoteNumber: '',
      leadId: '',
      clientId: '',
      items: [],
      subtotal: '0.00',
      taxRate: '0.00',
      taxAmount: '0.00',
      total: '0.00',
      validUntil: '',
      notes: '',
      status: 'draft' as const,
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data: InsertQuoteType) => apiRequest('POST', '/api/quotes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({ title: "Quote created successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPriceMatrixItems = priceMatrixItems.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.item.toLowerCase().includes(query) ||
      (item.description?.toLowerCase().includes(query) ?? false)
    );
  });

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
    setIsDialogOpen(false);
    setSearchQuery('');
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

  const handleSaveQuote = (values: any) => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please add at least one item to the quote",
        variant: "destructive",
      });
      return;
    }

    if (!values.leadId && !values.clientId) {
      toast({
        title: "No recipient selected",
        description: "Please select a lead or client for this quote",
        variant: "destructive",
      });
      return;
    }

    const subtotal = calculateSubtotal();
    const taxAmount = calculateTax();
    const total = calculateTotal();

    // Build quote data - send only non-empty values
    const quoteData: any = {
      items: selectedItems.map(item => ({
        priceMatrixId: item.priceMatrixId,
        itemName: item.itemName,
        description: item.description,
        unit: item.unit,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.total,
      })),
      subtotal: subtotal.toFixed(2),
      taxRate: values.taxRate || '0',
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      status: 'draft',
    };

    // Add optional fields only if they have values
    if (values.leadId) quoteData.leadId = values.leadId;
    if (values.clientId) quoteData.clientId = values.clientId;
    if (values.validUntil && values.validUntil !== '') quoteData.validUntil = values.validUntil;
    if (values.notes && values.notes.trim() !== '') quoteData.notes = values.notes;

    createQuoteMutation.mutate(quoteData);
  };

  const resetForm = () => {
    setSelectedItems([]);
    form.reset();
  };

  const handleDownloadPDF = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items to export",
        description: "Please add items before generating a PDF",
        variant: "destructive",
      });
      return;
    }

    const leadId = form.watch('leadId');
    const clientId = form.watch('clientId');
    const selectedLead = leads.find(l => l.id === leadId);
    const selectedClient = clients.find(c => c.id === clientId);
    const recipient = selectedLead || selectedClient;

    if (!recipient) {
      toast({
        title: "No recipient selected",
        description: "Please select a lead or client before generating PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Load company logo if available (use dark logo for PDF)
      let logoData: string | null = null;
      if (systemConfig?.darkLogoUrl) {
        try {
          const response = await fetch(systemConfig.darkLogoUrl);
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
      const quoteNumber = form.watch('quoteNumber') || 'DRAFT';
      const currentDate = format(new Date(), 'MMMM dd, yyyy');
      pdf.text(`Quote #: ${quoteNumber}`, margin, yPos);
      pdf.text(`Date: ${currentDate}`, pageWidth - margin - 50, yPos);
      yPos += 7;

      const validUntil = form.watch('validUntil');
      if (validUntil) {
        pdf.text(`Valid Until: ${format(new Date(validUntil), 'MMMM dd, yyyy')}`, pageWidth - margin - 50, yPos);
        yPos += 7;
      }

      yPos += 5;

      // Customer Information
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
      pdf.setFont('helvetica', 'normal');
      selectedItems.forEach((item) => {
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
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();
      const taxRate = parseFloat(form.watch('taxRate') || '0');

      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', pageWidth - 70, yPos);
      pdf.text(`$${subtotal.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 6;

      if (taxRate > 0) {
        pdf.text(`Tax (${taxRate.toFixed(2)}%):`, pageWidth - 70, yPos);
        pdf.text(`$${tax.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 6;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Total:', pageWidth - 70, yPos);
      pdf.text(`$${total.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;

      // Notes
      const notes = form.watch('notes');
      if (notes) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes:', margin, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const noteLines = pdf.splitTextToSize(notes, pageWidth - 2 * margin);
        pdf.text(noteLines, margin, yPos);
        yPos += noteLines.length * 5;
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

      pdf.save(`quote-${quoteNumber}-${currentDate}.pdf`);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quote Builder
        </CardTitle>
        <CardDescription>
          Create professional quotes from the price matrix catalog
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveQuote)} className="space-y-6">
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
                        <SelectTrigger data-testid="select-lead">
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
                    <FormDescription>
                      Select a lead if this is for a potential client
                    </FormDescription>
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
                        <SelectTrigger data-testid="select-client">
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
                    <FormDescription>
                      Select a client if this is for an existing customer
                    </FormDescription>
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
                    Add items from the price matrix catalog
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {selectedItems.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    No items added yet. Click "Add Item" to get started.
                  </p>
                </div>
              ) : (
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
                              data-testid={`input-quantity-${index}`}
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
                              data-testid={`button-remove-${index}`}
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
                        placeholder="0.00"
                        data-testid="input-tax-rate"
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
                        type="date"
                        data-testid="input-valid-until"
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
                      data-testid="textarea-notes"
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
                onClick={resetForm}
                data-testid="button-reset"
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={selectedItems.length === 0}
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                type="submit"
                disabled={createQuoteMutation.isPending}
                data-testid="button-save-quote"
              >
                <Save className="h-4 w-4 mr-2" />
                {createQuoteMutation.isPending ? 'Saving...' : 'Save Quote'}
              </Button>
            </div>
          </form>
        </Form>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSearchQuery('');
        }}>
          <DialogContent className="sm:max-w-[700px]" data-testid="dialog-add-item">
            <DialogHeader>
              <DialogTitle>Add Item from Price Matrix</DialogTitle>
              <DialogDescription>
                Search and select an item from the catalog to add to this quote
              </DialogDescription>
            </DialogHeader>

            {priceMatrixLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading items...</div>
            ) : priceMatrixItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active items in the price matrix. Please add items in Settings.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by item name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-items"
                  />
                </div>

                {filteredPriceMatrixItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items found matching "{searchQuery}"
                  </div>
                ) : (
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
                        {filteredPriceMatrixItems.map((item) => (
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
                                data-testid={`button-select-${item.id}`}
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
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
