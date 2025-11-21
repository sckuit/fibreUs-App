import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InventoryItem, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InventoryDialog } from "./InventoryDialog";
import { VendorAccountsManager } from "./VendorAccountsManager";
import { exportToCSV, downloadInventoryTemplate, parseCSV } from "@/lib/exportUtils";

export function InventoryManager() {
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });
  
  // Only show Accounts tab to admin and manager roles
  const canViewAccounts = currentUser && currentUser.role && ['admin', 'manager'].includes(currentUser.role);
  
  return (
    <Tabs defaultValue="inventory" className="space-y-4">
      <TabsList>
        <TabsTrigger value="inventory" data-testid="tab-inventory">Inventory</TabsTrigger>
        {canViewAccounts && <TabsTrigger value="accounts" data-testid="tab-accounts">Accounts</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="inventory">
        <InventoryContent />
      </TabsContent>
      
      {canViewAccounts && (
        <TabsContent value="accounts">
          <VendorAccountsManager />
        </TabsContent>
      )}
    </Tabs>
  );
}

function InventoryContent() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: inventoryItems = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/items"],
  });

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filtered inventory based on search
  const filteredInventory = useMemo(() => {
    if (!searchTerm.trim()) return inventoryItems;
    
    const search = searchTerm.toLowerCase();
    return inventoryItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(search) ||
        (item.description?.toLowerCase().includes(search) || false) ||
        item.sku.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        (item.location?.toLowerCase().includes(search) || false) ||
        (item.supplier?.toLowerCase().includes(search) || false)
      );
    });
  }, [inventoryItems, searchTerm]);

  // Paginated inventory
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInventory.slice(startIndex, endIndex);
  }, [filteredInventory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startResult = filteredInventory.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, filteredInventory.length);

  const createMutation = useMutation({
    mutationFn: (itemData: any) => apiRequest("POST", "/api/inventory/items", itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      setIsDialogOpen(false);
      setEditingItem(undefined);
      toast({ title: "Item created", description: "Inventory item has been successfully added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create inventory item", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/inventory/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      setIsDialogOpen(false);
      setEditingItem(undefined);
      toast({ title: "Item updated", description: "Inventory item has been successfully updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update inventory item", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/inventory/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      toast({ title: "Item deleted", description: "Inventory item has been successfully deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete inventory item", variant: "destructive" });
    },
  });

  const handleOpenDialog = (item?: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = (itemData: any) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    exportToCSV(inventoryItems, 'inventory-export.csv');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        
        if (parsedData.length === 0) {
          toast({ title: "Error", description: "No data found in CSV file", variant: "destructive" });
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const item of parsedData) {
          try {
            await apiRequest("POST", "/api/inventory/items", {
              sku: item.sku,
              name: item.name,
              description: item.description || null,
              category: item.category,
              quantityInStock: parseInt(item.quantityInStock) || 0,
              minimumStockLevel: parseInt(item.minimumStockLevel) || 0,
              unitOfMeasure: item.unitOfMeasure || 'piece',
              unitCost: item.unitCost || null,
              unitPrice: item.unitPrice || null,
              supplier: item.supplier || null,
              location: item.location || null,
              manufacturer: item.manufacturer || null,
            });
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });

        toast({
          title: "Import complete",
          description: `Successfully imported ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to import inventory", variant: "destructive" });
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
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>Manage inventory items, stock levels, and suppliers</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadInventoryTemplate} data-testid="button-download-template">
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" onClick={handleExport} data-testid="button-export-inventory">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('inventory-import')?.click()} data-testid="button-import-inventory">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <input id="inventory-import" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-inventory">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-inventory"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No inventory items match your search." : "No inventory items found. Add one to get started."}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInventory.map((item) => (
                      <TableRow 
                        key={item.id} 
                        data-testid={`row-inventory-${item.id}`}
                        className={(item.quantityInStock ?? 0) <= (item.minimumStockLevel ?? 0) ? "bg-yellow-50 dark:bg-yellow-950" : ""}
                      >
                        <TableCell className="font-mono">{item.sku}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>{item.quantityInStock ?? 0}</TableCell>
                        <TableCell>{item.minimumStockLevel ?? 0}</TableCell>
                        <TableCell>{item.supplier || '-'}</TableCell>
                        <TableCell>{item.location || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenDialog(item)} 
                              data-testid={`button-edit-inventory-${item.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(item.id)} 
                              data-testid={`button-delete-inventory-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between gap-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startResult}-{endResult} of {filteredInventory.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[120px]" data-testid="select-items-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <InventoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        item={editingItem}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
