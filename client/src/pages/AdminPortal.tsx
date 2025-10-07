import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Users, Database, Activity, Eye, Trash2, UserPlus, Edit, Package, AlertTriangle, Download, Upload, FileDown, ArrowRight, Settings, FolderKanban } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, downloadInventoryTemplate, parseCSV } from "@/lib/exportUtils";
import { UserDialog } from "@/components/UserDialog";
import { InventoryDialog } from "@/components/InventoryDialog";
import ReportsManager from "@/components/ReportsManager";
import { TasksManager } from "@/components/TasksManager";
import MessagesManager from "@/components/MessagesManager";
import LeadsManager from "@/components/LeadsManager";
import ClientsManager from "@/components/ClientsManager";
import SuppliersManager from "@/components/SuppliersManager";
import type { User, Visitor, InventoryItem, FinancialLog } from "@shared/schema";

export default function AdminPortal() {
  const { toast } = useToast();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | undefined>();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: visitors = [], isLoading: visitorsLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/analytics/recent-visitors"],
  });

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/items"],
  });

  const { data: lowStockItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const { data: financialLogs = [], isLoading: financialLogsLoading } = useQuery<FinancialLog[]>({
    queryKey: ["/api/financial-logs"],
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("POST", "/api/users", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(undefined);
      toast({
        title: "User created",
        description: "New user has been successfully added",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(undefined);
      toast({
        title: "User updated",
        description: "User has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been successfully removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleUserSubmit = (userData: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const handleAddUser = () => {
    setEditingUser(undefined);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const createInventoryMutation = useMutation({
    mutationFn: (itemData: any) => apiRequest("POST", "/api/inventory/items", itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setIsInventoryDialogOpen(false);
      setEditingInventoryItem(undefined);
      toast({
        title: "Item created",
        description: "Inventory item has been successfully added",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create inventory item",
        variant: "destructive",
      });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/inventory/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setIsInventoryDialogOpen(false);
      setEditingInventoryItem(undefined);
      toast({
        title: "Item updated",
        description: "Inventory item has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item",
        variant: "destructive",
      });
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/inventory/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Item deleted",
        description: "Inventory item has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory item",
        variant: "destructive",
      });
    },
  });

  const handleInventorySubmit = (itemData: any) => {
    if (editingInventoryItem) {
      updateInventoryMutation.mutate({ id: editingInventoryItem.id, data: itemData });
    } else {
      createInventoryMutation.mutate(itemData);
    }
  };

  const handleImportInventory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        
        if (parsedData.length === 0) {
          toast({
            title: "Error",
            description: "No data found in CSV file",
            variant: "destructive",
          });
          return;
        }

        // Import each inventory item
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
              unitCost: item.unitCost ? parseFloat(item.unitCost) : null,
              supplier: item.supplier || null,
              location: item.location || null,
              notes: item.notes || null,
            });
            successCount++;
          } catch (error) {
            console.error('Error importing item:', item, error);
            errorCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
        queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });

        toast({
          title: "Import complete",
          description: `Successfully imported ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to import inventory",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleAddInventoryItem = () => {
    setEditingInventoryItem(undefined);
    setIsInventoryDialogOpen(true);
  };

  const handleEditInventoryItem = (item: InventoryItem) => {
    setEditingInventoryItem(item);
    setIsInventoryDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Portal</h1>
            <p className="text-muted-foreground mt-1">
              System administration and configuration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" data-testid="badge-role">
              <Shield className="w-3 h-3 mr-1" />
              {user?.role}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">
                +12 this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4GB</div>
              <p className="text-xs text-muted-foreground">
                Storage used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">43</div>
              <p className="text-xs text-muted-foreground">
                Currently logged in
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <div className="space-y-2">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="users" data-testid="tab-users">
                Users
              </TabsTrigger>
              <TabsTrigger value="tasks" data-testid="tab-tasks">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="projects" data-testid="tab-projects">
                Projects
              </TabsTrigger>
              <TabsTrigger value="reports" data-testid="tab-reports">
                Reports
              </TabsTrigger>
              <TabsTrigger value="inventory" data-testid="tab-inventory">
                Inventory
              </TabsTrigger>
              <TabsTrigger value="suppliers" data-testid="tab-suppliers">
                Suppliers
              </TabsTrigger>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-3"
                onClick={() => window.location.href = "/"}
                data-testid="button-site"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TabsList>
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="messages" data-testid="tab-messages">
                Messages
              </TabsTrigger>
              <TabsTrigger value="clients" data-testid="tab-clients">
                Clients
              </TabsTrigger>
              <TabsTrigger value="leads" data-testid="tab-leads">
                Leads
              </TabsTrigger>
              <TabsTrigger value="visitors" data-testid="tab-visitors">
                Visitors
              </TabsTrigger>
              <TabsTrigger value="financial" data-testid="tab-financial">
                Financial
              </TabsTrigger>
              <TabsTrigger value="logs" data-testid="tab-logs">
                Activities
              </TabsTrigger>
              <TabsTrigger value="system" data-testid="tab-system">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage all system users and their roles
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => exportToCSV(users, 'users')} 
                    data-testid="button-export-users"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={handleAddUser} data-testid="button-add-user">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                          <TableCell className="font-medium">
                            {u.firstName} {u.lastName}
                          </TableCell>
                          <TableCell data-testid={`text-email-${u.id}`}>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" data-testid={`badge-role-${u.id}`}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.company || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(u)}
                                data-testid={`button-edit-${u.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={u.id === user?.id}
                                onClick={() => deleteUserMutation.mutate(u.id)}
                                data-testid={`button-delete-${u.id}`}
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
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <LeadsManager />
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <ClientsManager />
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <SuppliersManager />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            {lowStockItems.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Low Stock Alert
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {lowStockItems.length} items at or below minimum stock level
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-4">
                <div>
                  <CardTitle>Inventory Management</CardTitle>
                  <CardDescription>
                    Manage equipment and parts inventory
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => exportToCSV(inventoryItems, 'inventory')} 
                    data-testid="button-export-inventory"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={downloadInventoryTemplate} 
                    data-testid="button-template-inventory"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('inventory-import')?.click()} 
                    data-testid="button-import-inventory"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <input
                    id="inventory-import"
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleImportInventory}
                  />
                  <Button onClick={handleAddInventoryItem} data-testid="button-add-inventory">
                    <Package className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <p className="text-sm text-muted-foreground">Loading inventory...</p>
                ) : inventoryItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inventory items yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow
                          key={item.id}
                          data-testid={`row-inventory-${item.id}`}
                          className={
                            (item.quantityInStock ?? 0) <= (item.minimumStockLevel ?? 0)
                              ? "bg-yellow-50 dark:bg-yellow-950"
                              : ""
                          }
                        >
                          <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.category.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.quantityInStock} {item.unitOfMeasure}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.minimumStockLevel}
                          </TableCell>
                          <TableCell>
                            {item.unitCost ? `$${parseFloat(item.unitCost).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.supplier || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditInventoryItem(item)}
                                data-testid={`button-edit-inventory-${item.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteInventoryMutation.mutate(item.id)}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {user && <ReportsManager role="admin" userId={user.id} />}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {user && <TasksManager role="admin" userId={user.id} />}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Projects Management
                </CardTitle>
                <CardDescription>
                  View and manage all projects in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Projects management functionality - track client projects, timelines, and deliverables
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <MessagesManager />
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Visitor Analytics</CardTitle>
                  <CardDescription>
                    Recent website visitors for marketing follow-up
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => exportToCSV(visitors, 'visitors')} 
                  data-testid="button-export-visitors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                {visitorsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading visitors...</p>
                ) : visitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No visitors tracked yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Browser</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Landing Page</TableHead>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Visit Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.slice(0, 20).map((visitor, idx) => (
                        <TableRow key={visitor.id || idx} data-testid={`row-visitor-${idx}`}>
                          <TableCell className="font-mono text-xs">
                            {visitor.ipAddress}
                          </TableCell>
                          <TableCell>
                            {visitor.city && visitor.country
                              ? `${visitor.city}, ${visitor.country}`
                              : visitor.country || "-"}
                          </TableCell>
                          <TableCell>{visitor.browser || "-"}</TableCell>
                          <TableCell>{visitor.device || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {visitor.landingPage || "-"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {visitor.referrer || "Direct"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {visitor.visitedAt
                              ? new Date(visitor.visitedAt).toLocaleString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Manage system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Enable system maintenance mode
                      </p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="button-maintenance">
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>
                  System and user activity monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Activity logs coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Financial Audit Logs</CardTitle>
                  <CardDescription>
                    Read-only financial transaction audit trail for compliance
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => exportToCSV(financialLogs, 'financial-logs')} 
                  data-testid="button-export-financial-logs"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                {financialLogsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading financial logs...</p>
                ) : financialLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No financial transactions recorded yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Previous Value</TableHead>
                        <TableHead>New Value</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialLogs.map((log) => (
                        <TableRow key={log.id} data-testid={`row-financial-log-${log.id}`}>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-log-type-${log.id}`}>
                              {log.logType.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.entityType}</TableCell>
                          <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                          <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                          <TableCell className="text-right">
                            {log.previousValue ? `$${parseFloat(log.previousValue).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {log.newValue ? `$${parseFloat(log.newValue).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={log.description}>
                              {log.description}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <UserDialog
        user={editingUser}
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        onSubmit={handleUserSubmit}
        isPending={createUserMutation.isPending || updateUserMutation.isPending}
      />
      
      <InventoryDialog
        item={editingInventoryItem}
        open={isInventoryDialogOpen}
        onOpenChange={setIsInventoryDialogOpen}
        onSubmit={handleInventorySubmit}
        isPending={createInventoryMutation.isPending || updateInventoryMutation.isPending}
      />
    </div>
  );
}
