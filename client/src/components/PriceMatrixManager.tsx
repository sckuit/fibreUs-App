import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PriceMatrix, InsertPriceMatrixType, UpdatePriceMatrixType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPriceMatrixSchema, updatePriceMatrixSchema } from "@shared/schema";
import { Plus, Edit, Trash2, DollarSign, Upload, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PriceMatrixManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceMatrix | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: allPriceMatrixItems = [], isLoading } = useQuery<PriceMatrix[]>({
    queryKey: ['/api/price-matrix'],
    queryFn: () => fetch('/api/price-matrix').then(res => res.json()),
  });

  // Filter items based on active status and search term
  const filteredItems = useMemo(() => {
    let items = includeInactive ? allPriceMatrixItems : allPriceMatrixItems.filter(item => item.isActive);
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.item.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search)) ||
        item.unit.toLowerCase().includes(search)
      );
    }
    
    return items;
  }, [allPriceMatrixItems, includeInactive, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when search term or filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, includeInactive, itemsPerPage]);

  const form = useForm<InsertPriceMatrixType>({
    resolver: zodResolver(editingItem ? updatePriceMatrixSchema : insertPriceMatrixSchema),
    defaultValues: {
      item: '',
      description: '',
      unit: '',
      unitPrice: '0.00',
      costPrice: '0.00',
      customerPrice: '0.00',
      year: new Date().getFullYear(),
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertPriceMatrixType) =>
      apiRequest('POST', '/api/price-matrix', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-matrix'] });
      toast({ title: "Price matrix item created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create price matrix item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePriceMatrixType }) =>
      apiRequest('PUT', `/api/price-matrix/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-matrix'] });
      toast({ title: "Price matrix item updated successfully" });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update price matrix item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/price-matrix/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-matrix'] });
      toast({ title: "Price matrix item deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete price matrix item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest('PUT', `/api/price-matrix/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-matrix'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update item status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (item?: PriceMatrix) => {
    if (item) {
      setEditingItem(item);
      form.reset({
        item: item.item,
        description: item.description || '',
        unit: item.unit,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice || '0.00',
        customerPrice: item.customerPrice,
        year: item.year,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      form.reset({
        item: '',
        description: '',
        unit: '',
        unitPrice: '0.00',
        costPrice: '0.00',
        customerPrice: '0.00',
        year: new Date().getFullYear(),
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (values: InsertPriceMatrixType) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this price matrix item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast({
        title: "No data to export",
        description: "Add items to the price matrix before exporting",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Item', 'Description', 'Unit', 'Unit Price', 'Cost Price', 'Customer Price', 'Year', 'Status'];
    const rows = filteredItems.map(item => [
      item.item,
      item.description || '',
      item.unit,
      item.unitPrice,
      item.costPrice || '0.00',
      item.customerPrice,
      item.year.toString(),
      item.isActive ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Price matrix exported successfully" });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file is empty or invalid');
        }

        const rows = lines.slice(1).map(line => {
          const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
          return matches ? matches.map(cell => cell.replace(/^"|"$/g, '').trim()) : [];
        });

        let successCount = 0;
        let errorCount = 0;

        for (const row of rows) {
          if (row.length < 7) continue;

          try {
            const itemData: InsertPriceMatrixType = {
              item: row[0],
              description: row[1] || '',
              unit: row[2],
              unitPrice: row[3],
              costPrice: row[4] || '0.00',
              customerPrice: row[5],
              year: parseInt(row[6]) || new Date().getFullYear(),
              isActive: row[7]?.toLowerCase() !== 'inactive',
            };

            await apiRequest('POST', '/api/price-matrix', itemData);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error('Failed to import row:', row, error);
          }
        }

        queryClient.invalidateQueries({ queryKey: ['/api/price-matrix'] });
        
        toast({
          title: "Import complete",
          description: `Successfully imported ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
      } catch (error: any) {
        toast({
          title: "Import failed",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle>Price Matrix</CardTitle>
            <CardDescription>Manage billable items catalog for quote generation</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById('csv-upload')?.click()}
              data-testid="button-import-csv"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
            <Button
              onClick={() => handleOpenDialog()}
              data-testid="button-add-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by item name, description, or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeInactive}
                  onCheckedChange={setIncludeInactive}
                  data-testid="switch-include-inactive"
                />
                <span className="text-sm text-muted-foreground">Show inactive items</span>
              </div>
              {filteredItems.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading price matrix...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No items match your search.' : 'No price matrix items found. Add one to get started.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Customer Price</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{parseFloat(item.unitPrice).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{parseFloat(item.costPrice || '0').toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{parseFloat(item.customerPrice).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={(checked) => {
                              toggleActiveMutation.mutate({ id: item.id, isActive: checked });
                            }}
                            data-testid={`switch-status-${item.id}`}
                          />
                          <span className="text-sm text-muted-foreground">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            data-testid={`button-delete-${item.id}`}
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

          {/* Pagination Controls */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(parseInt(value))}
                >
                  <SelectTrigger className="w-20" data-testid="select-items-per-page">
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

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="w-9"
                          data-testid={`button-page-${pageNumber}`}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-price-matrix-form">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Price Matrix Item' : 'Add Price Matrix Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the billable item details and pricing'
                : 'Create a new billable item for the catalog'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="item"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., CAT6 Cable"
                          data-testid="input-item-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., ft, each, hour"
                          data-testid="input-unit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Describe this item..."
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            data-testid="input-unit-price"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            data-testid="input-cost-price"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Price</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            data-testid="input-customer-price"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="2020"
                        max="2099"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-year"
                      />
                    </FormControl>
                    <FormDescription>
                      Year for pricing reference
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Item</FormLabel>
                      <FormDescription>
                        Enable this item for quote generation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingItem(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
