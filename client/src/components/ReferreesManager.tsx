import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, ExternalLink, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateReferralSchema, type Referral, type UpdateReferralType, type ReferralProgram } from "@shared/schema";

export default function ReferreesManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: referrals = [], isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals/all"],
  });

  const { data: programs = [] } = useQuery<ReferralProgram[]>({
    queryKey: ["/api/referral-programs"],
  });

  const form = useForm<UpdateReferralType>({
    resolver: zodResolver(updateReferralSchema),
    defaultValues: {
      status: "pending",
      notes: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReferralType }) => {
      const response = await apiRequest("PATCH", `/api/referrals/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({
        title: "Success",
        description: "Referral updated successfully",
      });
      setIsDialogOpen(false);
      setEditingReferral(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update referral",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (referral: Referral) => {
    setEditingReferral(referral);
    form.reset({
      status: referral.status,
      notes: referral.notes || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: UpdateReferralType) => {
    if (editingReferral) {
      updateMutation.mutate({ id: editingReferral.id, data });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'contacted': return 'default';
      case 'qualified': return 'default';
      case 'converted': return 'default';
      case 'declined': return 'destructive';
      default: return 'secondary';
    }
  };

  const getProgramName = (programId: string | null) => {
    if (!programId) return '-';
    const program = programs.find(p => p.id === programId);
    return program ? program.name : 'Unknown Program';
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter referrals based on search term
  const filteredReferrals = useMemo(() => {
    if (!searchTerm.trim()) return referrals;
    
    const search = searchTerm.toLowerCase();
    return referrals.filter(referral => {
      const referredName = (referral.referredName || '').toLowerCase();
      const referredEmail = (referral.referredEmail || '').toLowerCase();
      const referredCompany = (referral.referredCompany || '').toLowerCase();
      const referredPhone = (referral.referredPhone || '').toLowerCase();
      const status = (referral.status || '').toLowerCase();
      const programName = getProgramName(referral.referralProgramId).toLowerCase();
      
      return referredName.includes(search) ||
             referredEmail.includes(search) ||
             referredCompany.includes(search) ||
             referredPhone.includes(search) ||
             status.includes(search) ||
             programName.includes(search);
    });
  }, [referrals, searchTerm, programs]);

  // Paginate filtered referrals
  const paginatedReferrals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReferrals.slice(startIndex, endIndex);
  }, [filteredReferrals, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referrees Management</CardTitle>
          <CardDescription>View and manage all people who have been referred</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by referred name, email, company, phone, status, or program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-referrals"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading referrals...</div>
          ) : filteredReferrals.length === 0 ? (
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
                      <TableHead>Company</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Conversion</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">{referral.referredName}</TableCell>
                    <TableCell>{referral.referredEmail}</TableCell>
                    <TableCell>{referral.referredCompany || '-'}</TableCell>
                    <TableCell>{referral.referredPhone || '-'}</TableCell>
                    <TableCell className="text-sm">{getProgramName(referral.referralProgramId)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(referral.status)}>
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {referral.convertedClientId ? (
                        <Badge variant="default" className="gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Client
                        </Badge>
                      ) : referral.convertedLeadId ? (
                        <Badge variant="secondary" className="gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Lead
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(referral)}
                        data-testid={`button-edit-${referral.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredReferrals.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredReferrals.length)} of {filteredReferrals.length} results
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Referral</DialogTitle>
            <DialogDescription>
              Update the status and notes for {editingReferral?.referredName}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this referral..."
                        data-testid="input-notes"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
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
                    setEditingReferral(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {updateMutation.isPending ? "Saving..." : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
