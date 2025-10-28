import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Edit, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateReferralSchema, type Referral, type UpdateReferralType, type ReferralProgram } from "@shared/schema";

export default function ReferreesManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referrees Management</CardTitle>
          <CardDescription>View and manage all people who have been referred</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading referrals...</div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No referrals found.
            </div>
          ) : (
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
                {referrals.map((referral) => (
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
