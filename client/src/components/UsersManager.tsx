import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, UserPlus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { User } from "@shared/schema";
import { UserDialog } from "@/components/UserDialog";
import { exportToCSV } from "@/lib/exportUtils";
import { useAuth } from "@/hooks/useAuth";

export default function UsersManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("POST", "/api/users", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(undefined);
      toast({ title: "User created", description: "New user has been successfully added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(undefined);
      toast({ title: "User updated", description: "User has been successfully updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted", description: "User has been successfully removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("PATCH", `/api/users/${userId}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User status updated", description: "User status has been successfully toggled" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user status", variant: "destructive" });
    },
  });

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const search = searchTerm.toLowerCase();
    return users.filter(user => {
      const email = user.email.toLowerCase();
      const firstName = (user.firstName || '').toLowerCase();
      const lastName = (user.lastName || '').toLowerCase();
      const company = (user.company || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const role = user.role.toLowerCase();
      
      return email.includes(search) ||
             firstName.includes(search) ||
             lastName.includes(search) ||
             company.includes(search) ||
             phone.includes(search) ||
             role.includes(search);
    });
  }, [users, searchTerm]);

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleUserSubmit = (userData: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage all system users and their roles</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => exportToCSV(users, 'users')} data-testid="button-export-users">
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
            <Button onClick={() => { setEditingUser(undefined); setIsUserDialogOpen(true); }} data-testid="button-add-user">
              <UserPlus className="w-4 h-4 mr-2" />Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by email, name, company, phone, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>

          {usersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found{searchTerm ? ` matching "${searchTerm}"` : ""}.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                        <TableCell data-testid={`text-email-${u.id}`}>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" data-testid={`badge-role-${u.id}`}>{u.role}</Badge>
                        </TableCell>
                        <TableCell>{u.company || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={u.isActive ?? true}
                              disabled={u.id === typedUser?.id || toggleUserStatusMutation.isPending}
                              onCheckedChange={() => toggleUserStatusMutation.mutate(u.id)}
                              data-testid={`switch-status-${u.id}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              {u.isActive ?? true ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setEditingUser(u); setIsUserDialogOpen(true); }} 
                              data-testid={`button-edit-${u.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={u.id === typedUser?.id} 
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
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
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

      <UserDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        onSubmit={handleUserSubmit}
        user={editingUser}
        isPending={createUserMutation.isPending || updateUserMutation.isPending}
      />
    </div>
  );
}
