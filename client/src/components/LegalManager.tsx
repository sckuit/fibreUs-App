import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LegalDocuments, UpdateLegalDocumentsType, RateType, ServiceRate, UpdateServiceRateType, InsertRateTypeType, SupportPlan, InsertSupportPlanType, UpdateSupportPlanType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateLegalDocumentsSchema, insertRateTypeSchema, insertSupportPlanSchema } from "@shared/schema";
import { Save, FileText, DollarSign, Plus, Trash2, LifeBuoy } from "lucide-react";

export function LegalManager() {
  const { toast } = useToast();
  const [rateTypeDialogOpen, setRateTypeDialogOpen] = useState(false);
  const [supportPlanDialogOpen, setSupportPlanDialogOpen] = useState(false);

  const { data: legalDocs, isLoading } = useQuery<LegalDocuments>({
    queryKey: ['/api/legal-documents'],
  });

  const { data: rateTypes = [] } = useQuery<RateType[]>({
    queryKey: ['/api/rate-types'],
  });

  const { data: serviceRates = [] } = useQuery<ServiceRate[]>({
    queryKey: ['/api/service-rates'],
  });

  const { data: supportPlans = [] } = useQuery<SupportPlan[]>({
    queryKey: ['/api/support-plans'],
  });

  const legalDocsForm = useForm<UpdateLegalDocumentsType>({
    resolver: zodResolver(updateLegalDocumentsSchema),
    defaultValues: {
      privacyPolicy: '',
      termsOfService: '',
      serviceAgreement: '',
      warrantyInfo: '',
    },
  });

  const rateTypeForm = useForm<InsertRateTypeType>({
    resolver: zodResolver(insertRateTypeSchema),
    defaultValues: {
      name: '',
      isCustom: true,
      displayOrder: 100,
    },
  });

  const supportPlanForm = useForm<InsertSupportPlanType>({
    resolver: zodResolver(insertSupportPlanSchema),
    defaultValues: {
      name: '',
      rate: '',
      billingPeriod: 'monthly',
      description: '',
      isCustom: true,
    },
  });

  useEffect(() => {
    if (legalDocs) {
      legalDocsForm.reset({
        privacyPolicy: legalDocs.privacyPolicy || '',
        termsOfService: legalDocs.termsOfService || '',
        serviceAgreement: legalDocs.serviceAgreement || '',
        warrantyInfo: legalDocs.warrantyInfo || '',
      });
    }
  }, [legalDocs, legalDocsForm]);

  const updateLegalDocsMutation = useMutation({
    mutationFn: (data: UpdateLegalDocumentsType) =>
      apiRequest('PUT', '/api/legal-documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/legal-documents'] });
      toast({ title: "Legal documents updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update legal documents",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createRateTypeMutation = useMutation({
    mutationFn: (data: InsertRateTypeType) =>
      apiRequest('POST', '/api/rate-types', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/rate-types'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/service-rates'] });
      setRateTypeDialogOpen(false);
      rateTypeForm.reset();
      toast({ title: "Rate type created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create rate type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRateTypeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/rate-types/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rate-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-rates'] });
      toast({ title: "Rate type deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete rate type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateServiceRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRateType }) =>
      apiRequest('PUT', `/api/service-rates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-rates'] });
      toast({ title: "Service rate updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update service rate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createSupportPlanMutation = useMutation({
    mutationFn: (data: InsertSupportPlanType) =>
      apiRequest('POST', '/api/support-plans', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/support-plans'] });
      setSupportPlanDialogOpen(false);
      supportPlanForm.reset();
      toast({ title: "Support plan created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create support plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSupportPlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupportPlanType }) =>
      apiRequest('PUT', `/api/support-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-plans'] });
      toast({ title: "Support plan updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update support plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSupportPlanMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/support-plans/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-plans'] });
      toast({ title: "Support plan deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete support plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateServiceRate = (rateId: string, field: 'regularRate' | 'afterHoursRate' | 'holidayRate', value: string) => {
    updateServiceRateMutation.mutate({
      id: rateId,
      data: { [field]: value === '' ? '' : value },
    });
  };

  const handleUpdateSupportPlan = (planId: string, field: 'rate' | 'billingPeriod' | 'description', value: string) => {
    updateSupportPlanMutation.mutate({
      id: planId,
      data: { [field]: value === '' ? '' : value },
    });
  };

  const getRateForType = (rateTypeId: string) => {
    return serviceRates.find(sr => sr.rateTypeId === rateTypeId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          Loading legal information...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Legal Documents</CardTitle>
          </div>
          <CardDescription>
            Manage your company's legal documents and policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...legalDocsForm}>
            <form onSubmit={legalDocsForm.handleSubmit((data) => updateLegalDocsMutation.mutate(data))} className="space-y-6">
              <FormField
                control={legalDocsForm.control}
                name="privacyPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy Policy</FormLabel>
                    <FormDescription>
                      Your company's privacy policy
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter your privacy policy..."
                        className="min-h-[150px] font-mono text-sm"
                        data-testid="textarea-privacy-policy"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={legalDocsForm.control}
                name="termsOfService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms of Service</FormLabel>
                    <FormDescription>
                      Your company's terms of service
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter terms of service..."
                        className="min-h-[150px] font-mono text-sm"
                        data-testid="textarea-terms-of-service"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={legalDocsForm.control}
                name="serviceAgreement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Agreement</FormLabel>
                    <FormDescription>
                      Standard service agreement template
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter service agreement..."
                        className="min-h-[150px] font-mono text-sm"
                        data-testid="textarea-service-agreement"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={legalDocsForm.control}
                name="warrantyInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty Information</FormLabel>
                    <FormDescription>
                      Warranty terms and coverage details
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter warranty information..."
                        className="min-h-[150px] font-mono text-sm"
                        data-testid="textarea-warranty-info"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateLegalDocsMutation.isPending}
                  data-testid="button-save-legal-docs"
                >
                  {updateLegalDocsMutation.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Legal Documents
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <CardTitle>Service Rates</CardTitle>
              </div>
              <CardDescription>
                Configure hourly rates for different service types across time periods
              </CardDescription>
            </div>
            <Dialog open={rateTypeDialogOpen} onOpenChange={setRateTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-rate-type">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rate Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Rate Type</DialogTitle>
                  <DialogDescription>
                    Create a new service rate type
                  </DialogDescription>
                </DialogHeader>
                <Form {...rateTypeForm}>
                  <form onSubmit={rateTypeForm.handleSubmit((data) => createRateTypeMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={rateTypeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Type Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Emergency Service" data-testid="input-rate-type-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createRateTypeMutation.isPending} data-testid="button-submit-rate-type">
                        {createRateTypeMutation.isPending ? 'Creating...' : 'Create Rate Type'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Rate Type</TableHead>
                <TableHead>Regular Hours</TableHead>
                <TableHead>After Hours</TableHead>
                <TableHead>Holiday</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateTypes.map((rateType) => {
                const rate = getRateForType(rateType.id);
                return (
                  <TableRow key={rateType.id}>
                    <TableCell className="font-medium">{rateType.name}</TableCell>
                    <TableCell>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-7"
                          value={rate?.regularRate || ''}
                          onChange={(e) => rate && handleUpdateServiceRate(rate.id, 'regularRate', e.target.value)}
                          data-testid={`input-regular-rate-${rateType.id}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-7"
                          value={rate?.afterHoursRate || ''}
                          onChange={(e) => rate && handleUpdateServiceRate(rate.id, 'afterHoursRate', e.target.value)}
                          data-testid={`input-after-hours-rate-${rateType.id}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-7"
                          value={rate?.holidayRate || ''}
                          onChange={(e) => rate && handleUpdateServiceRate(rate.id, 'holidayRate', e.target.value)}
                          data-testid={`input-holiday-rate-${rateType.id}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {rateType.isCustom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRateTypeMutation.mutate(rateType.id)}
                          disabled={deleteRateTypeMutation.isPending}
                          data-testid={`button-delete-rate-type-${rateType.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-primary" />
                <CardTitle>Support Plans</CardTitle>
              </div>
              <CardDescription>
                Manage support plan offerings and pricing
              </CardDescription>
            </div>
            <Dialog open={supportPlanDialogOpen} onOpenChange={setSupportPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-support-plan">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Support Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Support Plan</DialogTitle>
                  <DialogDescription>
                    Create a new support plan offering
                  </DialogDescription>
                </DialogHeader>
                <Form {...supportPlanForm}>
                  <form onSubmit={supportPlanForm.handleSubmit((data) => createSupportPlanMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={supportPlanForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Premium Support" data-testid="input-support-plan-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supportPlanForm.control}
                      name="rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                {...field}
                                value={field.value || ''}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7"
                                data-testid="input-support-plan-rate"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supportPlanForm.control}
                      name="billingPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Period</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger data-testid="select-billing-period">
                                <SelectValue placeholder="Select billing period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                              <SelectItem value="per-hour">Per Hour</SelectItem>
                              <SelectItem value="one-time">One-Time</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supportPlanForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ''}
                              placeholder="Describe what's included in this plan..."
                              data-testid="textarea-support-plan-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createSupportPlanMutation.isPending} data-testid="button-submit-support-plan">
                        {createSupportPlanMutation.isPending ? 'Creating...' : 'Create Support Plan'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Plan Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supportPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        value={plan.rate || ''}
                        onChange={(e) => handleUpdateSupportPlan(plan.id, 'rate', e.target.value)}
                        data-testid={`input-support-plan-rate-${plan.id}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={plan.billingPeriod || ''}
                      onValueChange={(value) => handleUpdateSupportPlan(plan.id, 'billingPeriod', value)}
                    >
                      <SelectTrigger className="w-[150px]" data-testid={`select-billing-period-${plan.id}`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="per-hour">Per Hour</SelectItem>
                        <SelectItem value="one-time">One-Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={plan.description || ''}
                      onChange={(e) => handleUpdateSupportPlan(plan.id, 'description', e.target.value)}
                      placeholder="Plan description..."
                      className="min-h-[60px]"
                      data-testid={`textarea-support-plan-description-${plan.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    {plan.isCustom && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSupportPlanMutation.mutate(plan.id)}
                        disabled={deleteSupportPlanMutation.isPending}
                        data-testid={`button-delete-support-plan-${plan.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
