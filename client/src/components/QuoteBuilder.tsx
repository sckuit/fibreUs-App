import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PriceMatrix, Lead, Client, Quote, InsertQuoteType, SystemConfig, LegalDocuments, User } from "@shared/schema";
import { insertQuoteSchema } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";
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
import { QuotePreview } from "./QuotePreview";

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
  const quotePreviewRef = useRef<HTMLDivElement>(null);

  const { data: priceMatrixItems = [], isLoading: priceMatrixLoading } = useQuery<PriceMatrix[]>({
    queryKey: ['/api/price-matrix/active'],
    queryFn: () => fetch('/api/price-matrix/active').then(res => res.json()),
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

  const { data: legalDocs } = useQuery<LegalDocuments>({
    queryKey: ['/api/legal-documents'],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
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

  // Update form values when items or tax rate changes
  useEffect(() => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(form.watch('taxRate') || '0');
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    form.setValue('subtotal', subtotal.toFixed(2));
    form.setValue('taxAmount', taxAmount.toFixed(2));
    form.setValue('total', total.toFixed(2));
  }, [selectedItems, form.watch('taxRate')]);

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

    if (!currentUser?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to create quotes",
        variant: "destructive",
      });
      return;
    }

    // Build quote data - send only non-empty values
    const quoteData: any = {
      createdById: currentUser.id,
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

    if (!quotePreviewRef.current) {
      toast({
        title: "Preview not ready",
        description: "Please wait for the preview to load",
        variant: "destructive",
      });
      return;
    }

    try {
      // Capture the preview component as an image
      const canvas = await html2canvas(quotePreviewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      
      // Calculate how the image maps to PDF dimensions
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      const pageHeightInPixels = (canvas.width * pageHeight) / pageWidth;

      let heightLeft = canvas.height;
      let position = 0;
      let page = 0;

      while (heightLeft > 0) {
        // Calculate slice height, clamped to remaining content
        const idealSliceHeight = Math.ceil(pageHeightInPixels);
        const actualSliceHeight = Math.min(idealSliceHeight, heightLeft);
        
        // Create a temporary canvas for each page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = actualSliceHeight;
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          // Draw the slice of the original canvas for this page
          // Ensure we don't try to read past the end of the source canvas
          const sourceHeight = Math.min(actualSliceHeight, canvas.height - position);
          
          ctx.drawImage(
            canvas,
            0,
            position,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );

          const pageImgHeight = (actualSliceHeight * pageWidth) / pageCanvas.width;
          
          // Add new page if not the first page
          if (page > 0) {
            pdf.addPage();
          }
          
          // Add the sliced image to the PDF
          pdf.addImage(
            pageCanvas.toDataURL('image/png'),
            'PNG',
            0,
            0,
            imgWidth,
            pageImgHeight
          );
        }

        // Update position based on actual slice height used
        heightLeft -= actualSliceHeight;
        position += actualSliceHeight;
        page++;
      }

      const quoteNumber = form.watch('quoteNumber') || 'DRAFT';
      const currentDate = format(new Date(), 'yyyy-MM-dd');
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
    <div className="space-y-6">
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
                      {formatCurrency(calculateSubtotal())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({parseFloat(form.watch('taxRate') || '0').toFixed(2)}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(calculateTax())}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
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

      <QuotePreview
        ref={quotePreviewRef}
        items={selectedItems}
        subtotal={form.watch('subtotal') || '0.00'}
        taxRate={form.watch('taxRate') || '0.00'}
        taxAmount={form.watch('taxAmount') || '0.00'}
        total={form.watch('total') || '0.00'}
        validUntil={form.watch('validUntil')}
        notes={form.watch('notes')}
        leadId={form.watch('leadId')}
        clientId={form.watch('clientId')}
        quoteNumber={form.watch('quoteNumber')}
      />
    </div>
  );
}
