import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CompanyCertification, InsertCompanyCertificationType, UpdateCompanyCertificationType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanyCertificationSchema, updateCompanyCertificationSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";

export function CertificationsManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<CompanyCertification | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: certifications = [], isLoading } = useQuery<CompanyCertification[]>({
    queryKey: ['/api/certifications', includeInactive],
    queryFn: () => fetch(`/api/certifications?includeInactive=${includeInactive}`).then(res => res.json()),
  });

  const form = useForm<InsertCompanyCertificationType>({
    resolver: zodResolver(editingCertification ? updateCompanyCertificationSchema : insertCompanyCertificationSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'certification',
      iconName: '',
      displayOrder: 0,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCompanyCertificationType) =>
      apiRequest('/api/certifications', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      toast({ title: "Certification created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create certification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyCertificationType }) =>
      apiRequest(`/api/certifications/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      toast({ title: "Certification updated successfully" });
      setIsDialogOpen(false);
      setEditingCertification(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update certification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/certifications/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      toast({ title: "Certification deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete certification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (certification?: CompanyCertification) => {
    if (certification) {
      setEditingCertification(certification);
      form.reset({
        name: certification.name,
        description: certification.description || '',
        category: certification.category || 'certification',
        iconName: certification.iconName || '',
        displayOrder: certification.displayOrder || 0,
        isActive: certification.isActive,
      });
    } else {
      setEditingCertification(null);
      form.reset({
        name: '',
        description: '',
        category: 'certification',
        iconName: '',
        displayOrder: 0,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (values: InsertCompanyCertificationType) => {
    if (editingCertification) {
      updateMutation.mutate({ id: editingCertification.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      deleteMutation.mutate(id);
    }
  };

  const renderIcon = (iconName?: string | null) => {
    if (!iconName) return <Shield className="h-4 w-4" />;
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4" />;
    }
    return <Shield className="h-4 w-4" />;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle>Certifications</CardTitle>
            <CardDescription>Manage company certifications, licenses, and standards</CardDescription>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            data-testid="button-add-certification"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
                data-testid="switch-include-inactive"
              />
              <span className="text-sm text-muted-foreground">Show inactive certifications</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading certifications...</div>
          ) : certifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No certifications found. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Icon Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.map((cert) => (
                  <TableRow key={cert.id} data-testid={`row-certification-${cert.id}`}>
                    <TableCell>
                      {renderIcon(cert.iconName)}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-name-${cert.id}`}>
                      {cert.name}
                    </TableCell>
                    <TableCell data-testid={`text-icon-name-${cert.id}`}>
                      {cert.iconName || '-'}
                    </TableCell>
                    <TableCell className="max-w-md truncate" data-testid={`text-description-${cert.id}`}>
                      {cert.description || '-'}
                    </TableCell>
                    <TableCell data-testid={`text-order-${cert.id}`}>
                      {cert.displayOrder}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={cert.isActive ? "default" : "secondary"}
                        data-testid={`badge-status-${cert.id}`}
                      >
                        {cert.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(cert)}
                          data-testid={`button-edit-${cert.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cert.id)}
                          data-testid={`button-delete-${cert.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCertification ? 'Edit Certification' : 'Add Certification'}
            </DialogTitle>
            <DialogDescription>
              {editingCertification 
                ? 'Update the certification details below.' 
                : 'Add a new certification, license, or standard.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ISO 9001:2015"
                        data-testid="input-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iconName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Shield, Award, BadgeCheck"
                        data-testid="input-icon-name"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a Lucide icon name (e.g., Shield, Award, BadgeCheck)
                    </FormDescription>
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
                        placeholder="Brief description of the certification"
                        data-testid="input-description"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        data-testid="input-display-order"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first
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
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Display this certification on public pages
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
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingCertification
                    ? 'Update Certification'
                    : 'Create Certification'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
