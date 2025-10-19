import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PriceMatrix, Lead, Client, Quote, Invoice, InsertInvoiceType, SystemConfig, LegalDocuments, User } from "@shared/schema";
import { insertInvoiceSchema } from "@shared/schema";
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
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, FileText, DollarSign, Save, Download, Search } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { InvoicePreview } from "./InvoicePreview";

interface InvoiceItem {
  priceMatrixId: string;
  itemName: string;
  description: string;
  unit: string;
  unitPrice: string;
  quantity: number;
  total: number;
}

export default function InvoiceBuilder() {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

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

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
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
    resolver: zodResolver(insertInvoiceSchema.omit({ createdById: true })),
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
      percentageOfQuote: '',
      amountPaid: '0.00',
      balanceDue: '0.00',
      paymentStatus: 'unpaid' as const,
      status: 'draft' as const,
      dueDate: '',
      notes: '',
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: InsertInvoiceType) => apiRequest('POST', '/api/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({ title: "Invoice created successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form values when items or tax rate changes
  useEffect(() => {
    const quoteId = form.watch('quoteId');
    const percentageStr = form.watch('percentageOfQuote');
    const percentageNum = percentageStr ? parseFloat(percentageStr) : 100;
    
    // Skip recalculation if in percentage-of-quote mode (quoteId exists and percentage !== 100)
    const isPercentageMode = quoteId && percentageNum > 0 && percentageNum < 100;
    
    if (isPercentageMode) {
      // In percentage mode - only update balance due based on existing total
      const total = parseFloat(form.watch('total') || '0');
      const amountPaid = parseFloat(form.watch('amountPaid') || '0');
      const balanceDue = total - amountPaid;
      form.setValue('balanceDue', balanceDue.toFixed(2));
      return;
    }

    // Normal mode - recalculate from items
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(form.watch('taxRate') || '0');
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    form.setValue('subtotal', subtotal.toFixed(2));
    form.setValue('taxAmount', taxAmount.toFixed(2));
    form.setValue('total', total.toFixed(2));
    
    // Recalculate balance due
    const amountPaid = parseFloat(form.watch('amountPaid') || '0');
    const balanceDue = total - amountPaid;
    form.setValue('balanceDue', balanceDue.toFixed(2));
  }, [selectedItems, form.watch('taxRate'), form.watch('amountPaid'), form.watch('quoteId'), form.watch('percentageOfQuote')]);

  // Handle quote selection and auto-populate
  useEffect(() => {
    const quoteId = form.watch('quoteId');
    if (quoteId) {
      const selectedQuote = quotes.find(q => q.id === quoteId);
      if (selectedQuote) {
        // Auto-populate from quote
        form.setValue('leadId', selectedQuote.leadId ?? '');
        form.setValue('clientId', selectedQuote.clientId ?? '');
        form.setValue('taxRate', selectedQuote.taxRate ?? '0');
        
        // Handle percentage of quote if specified
        const percentageStr = form.watch('percentageOfQuote');
        const percentage = percentageStr ? parseFloat(percentageStr) : 100;
        
        if (percentage && percentage !== 100) {
          // Calculate partial invoice based on percentage
          const quoteTotal = parseFloat(selectedQuote.total);
          const partialTotal = (quoteTotal * percentage) / 100;
          const quoteTaxRate = parseFloat(selectedQuote.taxRate ?? '0');
          
          form.setValue('subtotal', (partialTotal / (1 + quoteTaxRate / 100)).toFixed(2));
          form.setValue('total', partialTotal.toFixed(2));
          
          // Clear items when using percentage mode
          setSelectedItems([]);
        } else {
          // Full quote - populate items
          const quoteItems = selectedQuote.items as any[];
          const invoiceItems: InvoiceItem[] = quoteItems.map(item => ({
            priceMatrixId: item.priceMatrixId || '',
            itemName: item.itemName,
            description: item.description,
            unit: item.unit,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.total,
          }));
          setSelectedItems(invoiceItems);
        }
      }
    }
  }, [form.watch('quoteId'), form.watch('percentageOfQuote')]);

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
        description: "This item is already in the invoice. Update the quantity instead.",
        variant: "destructive",
      });
      return;
    }

    const newItem: InvoiceItem = {
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

  const handleSaveInvoice = (values: any) => {
    if (selectedItems.length === 0 && !values.percentageOfQuote) {
      toast({
        title: "No items selected",
        description: "Please add at least one item to the invoice or specify a percentage of quote.",
        variant: "destructive",
      });
      return;
    }

    if (!values.leadId && !values.clientId) {
      toast({
        title: "No recipient selected",
        description: "Please select either a lead or a client.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to create invoices",
        variant: "destructive",
      });
      return;
    }

    const invoiceData = {
      ...values,
      createdById: currentUser.id,
      items: selectedItems,
      leadId: values.leadId || undefined,
      clientId: values.clientId || undefined,
      quoteId: values.quoteId || undefined,
      percentageOfQuote: values.percentageOfQuote ? parseFloat(values.percentageOfQuote) : undefined,
      dueDate: values.dueDate || undefined,
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const handleDownloadPDF = async () => {
    if (!invoicePreviewRef.current) return;

    try {
      const canvas = await html2canvas(invoicePreviewRef.current, {
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

      const invoiceNumber = form.watch('invoiceNumber') || 'DRAFT';
      pdf.save(`Invoice-${invoiceNumber}.pdf`);

      toast({ title: "PDF downloaded successfully" });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Failed to generate PDF",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedItems([]);
  };

  const subtotalValue = form.watch('subtotal');
  const taxRateValue = form.watch('taxRate');
  const taxAmountValue = form.watch('taxAmount');
  const totalValue = form.watch('total');
  const amountPaidValue = form.watch('amountPaid');
  const balanceDueValue = form.watch('balanceDue');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create New Invoice
          </CardTitle>
          <CardDescription>
            Build a professional invoice for your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveInvoice)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quote Selection */}
                <FormField
                  control={form.control}
                  name="quoteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Quote (Optional)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-quote">
                            <SelectValue placeholder="Select a quote to reference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {quotes.map(quote => (
                            <SelectItem key={quote.id} value={quote.id}>
                              {quote.quoteNumber} - {formatCurrency(parseFloat(quote.total))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Auto-populate invoice from existing quote
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Percentage of Quote */}
                {form.watch('quoteId') && (
                  <FormField
                    control={form.control}
                    name="percentageOfQuote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage of Quote</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="100"
                            data-testid="input-percentage"
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for full quote or specify percentage (e.g., 50 for deposit)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Lead Selection */}
                <FormField
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value) form.setValue('clientId', '');
                        }}
                        disabled={!!form.watch('clientId')}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-lead">
                            <SelectValue placeholder="Select a lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map(lead => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.name} - {lead.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client Selection */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value) form.setValue('leadId', '');
                        }}
                        disabled={!!form.watch('leadId')}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-client">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-duedate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Rate */}
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="6.00"
                          data-testid="input-taxrate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount Paid */}
                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          data-testid="input-amountpaid"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter payment received (if any)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Items Section */}
              {!form.watch('percentageOfQuote') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Line Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDialogOpen(true)}
                      data-testid="button-add-item"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {selectedItems.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Unit</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="font-medium">{item.itemName}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground">{item.description}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{item.unit}</TableCell>
                            <TableCell className="text-right">{formatCurrency(parseFloat(item.unitPrice))}</TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value))}
                                className="w-20 mx-auto text-center"
                                data-testid={`input-quantity-${index}`}
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                data-testid={`button-remove-${index}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Totals Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium" data-testid="text-subtotal">{formatCurrency(parseFloat(subtotalValue))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({taxRateValue}%):</span>
                    <span className="font-medium" data-testid="text-tax">{formatCurrency(parseFloat(taxAmountValue))}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span data-testid="text-total">{formatCurrency(parseFloat(totalValue))}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid:</span>
                    <span className="font-medium text-green-600" data-testid="text-amountpaid">
                      {formatCurrency(parseFloat(amountPaidValue))}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Balance Due:</span>
                    <span className={parseFloat(balanceDueValue) > 0 ? "text-orange-600" : "text-green-600"} data-testid="text-balancedue">
                      {formatCurrency(parseFloat(balanceDueValue))}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any special instructions or notes..."
                        rows={4}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button type="submit" disabled={createInvoiceMutation.isPending} data-testid="button-save">
                  <Save className="w-4 h-4 mr-2" />
                  {createInvoiceMutation.isPending ? "Saving..." : "Save Invoice"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadPDF}
                  data-testid="button-download"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <InvoicePreview
        ref={invoicePreviewRef}
        items={selectedItems}
        subtotal={subtotalValue}
        taxRate={taxRateValue}
        taxAmount={taxAmountValue}
        total={totalValue}
        amountPaid={amountPaidValue}
        balanceDue={balanceDueValue}
        paymentStatus={form.watch('paymentStatus')}
        dueDate={form.watch('dueDate')}
        notes={form.watch('notes')}
        leadId={form.watch('leadId')}
        clientId={form.watch('clientId')}
        invoiceNumber={form.watch('invoiceNumber')}
        quoteId={form.watch('quoteId')}
      />

      {/* Add Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Item from Price Matrix</DialogTitle>
            <DialogDescription>
              Browse and add items to your invoice
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {priceMatrixLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading items...</div>
            ) : filteredPriceMatrixItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No items found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPriceMatrixItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.item}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(item.customerPrice))}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleAddItem(item)}
                          data-testid={`button-select-${item.id}`}
                        >
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
