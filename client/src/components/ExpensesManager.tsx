import { useState, useMemo, useEffect } from "react";
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
import { Plus, Edit, Trash2, Download, CalendarIcon, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { insertExpenseSchema, updateExpenseSchema, type Expense, type InsertExpenseType, type Project } from "@shared/schema";
import { exportToCSV } from "@/lib/exportUtils";

const expenseCategories = [
  { value: "operations", label: "Operations" },
  { value: "equipment", label: "Equipment" },
  { value: "payroll", label: "Payroll" },
  { value: "marketing", label: "Marketing" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "insurance", label: "Insurance" },
  { value: "maintenance", label: "Maintenance" },
  { value: "supplies", label: "Supplies" },
  { value: "transportation", label: "Transportation" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
];

export default function ExpensesManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const { toast } = useToast();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<InsertExpenseType>({
    resolver: zodResolver(editingExpense ? updateExpenseSchema : insertExpenseSchema),
    defaultValues: {
      date: new Date(),
      category: "operations",
      amount: "",
      description: "",
      vendor: "",
      receipt: "",
      projectId: "none",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-logs"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Expense created", description: "New expense has been added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-logs"] });
      setIsDialogOpen(false);
      setEditingExpense(undefined);
      form.reset();
      toast({ title: "Expense updated", description: "Expense has been updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update expense", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-logs"] });
      toast({ title: "Expense deleted", description: "Expense has been deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete expense", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertExpenseType) => {
    const submitData = {
      ...data,
      projectId: data.projectId && data.projectId !== 'none' ? data.projectId : undefined,
    };

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, ...submitData });
    } else {
      createExpenseMutation.mutate(submitData);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      date: new Date(expense.date),
      category: expense.category as any,
      amount: expense.amount,
      description: expense.description,
      vendor: expense.vendor || "",
      receipt: expense.receipt || "",
      projectId: expense.projectId || "none",
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingExpense(undefined);
    form.reset({
      date: new Date(),
      category: "operations",
      amount: "",
      description: "",
      vendor: "",
      receipt: "",
      projectId: "none",
    });
    setIsDialogOpen(true);
  };

  const getProjectName = (projectId?: string | null) => {
    if (!projectId) return "-";
    const project = projects.find((p) => p.id === projectId);
    return project?.projectName || "-";
  };

  const activeProjects = projects.filter(
    (p) => p.status === 'scheduled' || p.status === 'in_progress'
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  // Filter expenses based on search term
  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return expenses;
    
    const searchLower = searchTerm.toLowerCase();
    return expenses.filter((expense) => {
      const categoryLabel = expenseCategories.find(c => c.value === expense.category)?.label || expense.category;
      const projectName = getProjectName(expense.projectId);
      
      return (
        expense.description.toLowerCase().includes(searchLower) ||
        categoryLabel.toLowerCase().includes(searchLower) ||
        expense.amount.toLowerCase().includes(searchLower) ||
        (expense.vendor && expense.vendor.toLowerCase().includes(searchLower)) ||
        (expense.receipt && expense.receipt.toLowerCase().includes(searchLower)) ||
        projectName.toLowerCase().includes(searchLower)
      );
    });
  }, [expenses, searchTerm, projects]);

  // Paginate filtered expenses
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredExpenses.slice(startIndex, endIndex);
  }, [filteredExpenses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
        <div>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Track and manage business expenses</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportToCSV(expenses, 'expenses')} data-testid="button-export-expenses">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAdd} data-testid="button-add-expense">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-expenses"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first expense to start tracking</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No expenses match your search</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search terms</p>
          </div>
        ) : (
          <>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.map((expense) => (
                <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                  <TableCell data-testid={`text-expense-date-${expense.id}`}>
                    {format(new Date(expense.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize" data-testid={`text-expense-category-${expense.id}`}>
                      {expense.category.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-expense-amount-${expense.id}`}>
                    ${Number(expense.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" data-testid={`text-expense-description-${expense.id}`}>
                    {expense.description}
                  </TableCell>
                  <TableCell data-testid={`text-expense-vendor-${expense.id}`}>
                    {expense.vendor || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        data-testid={`button-edit-expense-${expense.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        data-testid={`button-delete-expense-${expense.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredExpenses.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} results
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
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
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          </>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-expense">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update expense details" : "Add a new business expense"}
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
                            data-testid="input-expense-date"
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-expense-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
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
                        data-testid="input-expense-amount"
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
                        placeholder="Enter expense description"
                        {...field}
                        data-testid="input-expense-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter vendor name"
                        {...field}
                        data-testid="input-expense-vendor"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receipt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        {...field}
                        data-testid="input-expense-receipt"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-expense-project">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {activeProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.projectName}
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
                    setEditingExpense(undefined);
                    form.reset();
                  }}
                  data-testid="button-cancel-expense"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                  data-testid="button-submit-expense"
                >
                  {createExpenseMutation.isPending || updateExpenseMutation.isPending
                    ? "Saving..."
                    : editingExpense
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
