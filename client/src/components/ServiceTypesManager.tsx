import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ServiceType, InsertServiceTypeType, UpdateServiceTypeType } from "@shared/schema";
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
import { insertServiceTypeSchema, updateServiceTypeSchema } from "@shared/schema";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ServiceTypesManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: serviceTypes = [], isLoading } = useQuery<ServiceType[]>({
    queryKey: ['/api/service-types', includeInactive],
    queryFn: () => fetch(`/api/service-types?includeInactive=${includeInactive}`).then(res => res.json()),
  });

  const form = useForm<InsertServiceTypeType>({
    resolver: zodResolver(editingServiceType ? updateServiceTypeSchema : insertServiceTypeSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      minServiceFee: '0',
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertServiceTypeType) =>
      apiRequest('/api/service-types', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-types'] });
      toast({ title: "Service type created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create service type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceTypeType }) =>
      apiRequest(`/api/service-types/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-types'] });
      toast({ title: "Service type updated successfully" });
      setIsDialogOpen(false);
      setEditingServiceType(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update service type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/service-types/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-types'] });
      toast({ title: "Service type deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete service type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (serviceType?: ServiceType) => {
    if (serviceType) {
      setEditingServiceType(serviceType);
      form.reset({
        name: serviceType.name,
        displayName: serviceType.displayName,
        description: serviceType.description || '',
        minServiceFee: serviceType.minServiceFee || '0',
        isActive: serviceType.isActive,
      });
    } else {
      setEditingServiceType(null);
      form.reset({
        name: '',
        displayName: '',
        description: '',
        minServiceFee: '0',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (values: InsertServiceTypeType) => {
    if (editingServiceType) {
      updateMutation.mutate({ id: editingServiceType.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service type?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle>Service Types</CardTitle>
            <CardDescription>Manage available service offerings and minimum fees</CardDescription>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            data-testid="button-add-service-type"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service Type
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
              <span className="text-sm text-muted-foreground">Show inactive services</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading service types...</div>
          ) : serviceTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No service types found. Add one to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Min Service Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceTypes.map((serviceType) => (
                    <TableRow key={serviceType.id} data-testid={`row-service-type-${serviceType.id}`}>
                      <TableCell className="font-medium">{serviceType.name}</TableCell>
                      <TableCell>{serviceType.displayName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{parseFloat(serviceType.minServiceFee || '0').toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={serviceType.isActive ? "default" : "secondary"}
                          data-testid={`badge-status-${serviceType.id}`}
                        >
                          {serviceType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(serviceType)}
                            data-testid={`button-edit-${serviceType.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(serviceType.id)}
                            data-testid={`button-delete-${serviceType.id}`}
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-service-type-form">
          <DialogHeader>
            <DialogTitle>
              {editingServiceType ? 'Edit Service Type' : 'Add Service Type'}
            </DialogTitle>
            <DialogDescription>
              {editingServiceType
                ? 'Update the service type details and minimum fee'
                : 'Create a new service type with a minimum service fee'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name (ID)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., cctv_installation"
                        data-testid="input-service-name"
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier for the service (lowercase, no spaces)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., CCTV Installation"
                        data-testid="input-display-name"
                      />
                    </FormControl>
                    <FormDescription>
                      User-friendly name shown to clients
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Describe this service..."
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minServiceFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Service Fee</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          data-testid="input-min-fee"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Minimum charge for this service
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
                      <FormLabel className="text-base">Active Service</FormLabel>
                      <FormDescription>
                        Enable this service for client bookings
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
                    setEditingServiceType(null);
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
