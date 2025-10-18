import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LegalDocuments, UpdateLegalDocumentsType, RateType, ServiceRate, UpdateServiceRateType, InsertRateTypeType, SupportPlan, InsertSupportPlanType, UpdateSupportPlanType, CustomLegalDocument, InsertCustomLegalDocumentType, UpdateCustomLegalDocumentType } from "@shared/schema";
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
import { updateLegalDocumentsSchema, insertRateTypeSchema, insertSupportPlanSchema, insertCustomLegalDocumentSchema, updateCustomLegalDocumentSchema } from "@shared/schema";
import { Save, FileText, DollarSign, Plus, Trash2, LifeBuoy, Edit2, FilePlus } from "lucide-react";

export function LegalManager() {
  const { toast } = useToast();
  const [rateTypeDialogOpen, setRateTypeDialogOpen] = useState(false);
  const [supportPlanDialogOpen, setSupportPlanDialogOpen] = useState(false);
  const [customDocDialogOpen, setCustomDocDialogOpen] = useState(false);
  const [editingCustomDoc, setEditingCustomDoc] = useState<CustomLegalDocument | null>(null);
  const [localServiceRates, setLocalServiceRates] = useState<ServiceRate[]>([]);
  const [localSupportPlans, setLocalSupportPlans] = useState<SupportPlan[]>([]);

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

  const { data: customDocs = [] } = useQuery<CustomLegalDocument[]>({
    queryKey: ['/api/custom-legal-documents'],
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (serviceRates.length > 0) {
      setLocalServiceRates(serviceRates);
    }
  }, [serviceRates]);

  useEffect(() => {
    if (supportPlans.length > 0) {
      setLocalSupportPlans(supportPlans);
    }
  }, [supportPlans]);

  const legalDocsForm = useForm<UpdateLegalDocumentsType>({
    resolver: zodResolver(updateLegalDocumentsSchema),
    defaultValues: {
      privacyPolicy: '',
      termsOfService: '',
      serviceAgreement: '',
      warrantyInfo: '',
      termsAndConditions: '',
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

  const customDocForm = useForm<InsertCustomLegalDocumentType | UpdateCustomLegalDocumentType>({
    resolver: zodResolver(editingCustomDoc ? updateCustomLegalDocumentSchema : insertCustomLegalDocumentSchema),
    defaultValues: {
      name: '',
      content: '',
    },
  });

  useEffect(() => {
    if (editingCustomDoc) {
      customDocForm.reset({
        name: editingCustomDoc.name,
        content: editingCustomDoc.content,
      });
    } else {
      customDocForm.reset({
        name: '',
        content: '',
      });
    }
  }, [editingCustomDoc, customDocForm]);

  useEffect(() => {
    if (legalDocs) {
      legalDocsForm.reset({
        privacyPolicy: legalDocs.privacyPolicy || '',
        termsOfService: legalDocs.termsOfService || '',
        serviceAgreement: legalDocs.serviceAgreement || '',
        warrantyInfo: legalDocs.warrantyInfo || '',
        termsAndConditions: legalDocs.termsAndConditions || '',
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

  const updateServiceRatesMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; data: UpdateServiceRateType }>) => {
      await Promise.all(
        updates.map(({ id, data }) => 
          apiRequest('PUT', `/api/service-rates/${id}`, data)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-rates'] });
      toast({ title: "Service rates saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save service rates",
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

  const updateSupportPlansMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; data: UpdateSupportPlanType }>) => {
      await Promise.all(
        updates.map(({ id, data }) => 
          apiRequest('PUT', `/api/support-plans/${id}`, data)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-plans'] });
      toast({ title: "Support plans saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save support plans",
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

  const createCustomDocMutation = useMutation({
    mutationFn: (data: InsertCustomLegalDocumentType) =>
      apiRequest('POST', '/api/custom-legal-documents', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/custom-legal-documents'] });
      setCustomDocDialogOpen(false);
      setEditingCustomDoc(null);
      customDocForm.reset();
      toast({ title: "Custom legal document created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create custom legal document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCustomDocMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomLegalDocumentType }) =>
      apiRequest('PUT', `/api/custom-legal-documents/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/custom-legal-documents'] });
      setCustomDocDialogOpen(false);
      setEditingCustomDoc(null);
      customDocForm.reset();
      toast({ title: "Custom legal document updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update custom legal document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCustomDocMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/custom-legal-documents/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-legal-documents'] });
      toast({ title: "Custom legal document deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete custom legal document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditServiceRate = (rateId: string, field: 'regularRate' | 'afterHoursRate' | 'holidayRate', value: string) => {
    setLocalServiceRates(prev => 
      prev.map(rate => 
        rate.id === rateId ? { ...rate, [field]: value } : rate
      )
    );
  };

  const handleEditSupportPlan = (planId: string, field: 'rate' | 'billingPeriod' | 'description', value: string) => {
    setLocalSupportPlans(prev => 
      prev.map(plan => 
        plan.id === planId ? { ...plan, [field]: value } : plan
      )
    );
  };

  const handleSaveServiceRates = () => {
    const updates = localServiceRates.map(rate => ({
      id: rate.id,
      data: {
        regularRate: rate.regularRate,
        afterHoursRate: rate.afterHoursRate,
        holidayRate: rate.holidayRate,
      } as UpdateServiceRateType,
    }));
    
    updateServiceRatesMutation.mutate(updates);
  };

  const handleSaveSupportPlans = () => {
    const updates = localSupportPlans.map(plan => ({
      id: plan.id,
      data: {
        rate: plan.rate,
        billingPeriod: plan.billingPeriod,
        description: plan.description,
      } as UpdateSupportPlanType,
    }));
    
    updateSupportPlansMutation.mutate(updates);
  };

  const handleSubmitCustomDoc = (data: InsertCustomLegalDocumentType | UpdateCustomLegalDocumentType) => {
    if (editingCustomDoc) {
      updateCustomDocMutation.mutate({ id: editingCustomDoc.id, data: data as UpdateCustomLegalDocumentType });
    } else {
      createCustomDocMutation.mutate(data as InsertCustomLegalDocumentType);
    }
  };

  const handleEditCustomDoc = (doc: CustomLegalDocument) => {
    setEditingCustomDoc(doc);
    setCustomDocDialogOpen(true);
  };

  const handleCloseCustomDocDialog = () => {
    setCustomDocDialogOpen(false);
    setEditingCustomDoc(null);
    customDocForm.reset();
  };

  const getRateForType = (rateTypeId: string) => {
    return localServiceRates.find(sr => sr.rateTypeId === rateTypeId);
  };

  const getServiceRateValue = (rateId: string, field: 'regularRate' | 'afterHoursRate' | 'holidayRate'): string => {
    const rate = localServiceRates.find(sr => sr.id === rateId);
    return rate?.[field] ?? '';
  };

  const getSupportPlanValue = (planId: string, field: 'rate' | 'billingPeriod' | 'description'): string => {
    const plan = localSupportPlans.find(sp => sp.id === planId);
    return plan?.[field] ?? '';
  };

  const hasUnsavedServiceRates = JSON.stringify(localServiceRates) !== JSON.stringify(serviceRates);
  const hasUnsavedSupportPlans = JSON.stringify(localSupportPlans) !== JSON.stringify(supportPlans);

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

              <FormField
                control={legalDocsForm.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms and Conditions</FormLabel>
                    <FormDescription>
                      Standard terms and conditions for quotes and contracts
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter terms and conditions..."
                        className="min-h-[150px] font-mono text-sm"
                        data-testid="textarea-terms-and-conditions"
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
                          value={rate ? getServiceRateValue(rate.id, 'regularRate') : ''}
                          onChange={(e) => rate && handleEditServiceRate(rate.id, 'regularRate', e.target.value)}
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
                          value={rate ? getServiceRateValue(rate.id, 'afterHoursRate') : ''}
                          onChange={(e) => rate && handleEditServiceRate(rate.id, 'afterHoursRate', e.target.value)}
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
                          value={rate ? getServiceRateValue(rate.id, 'holidayRate') : ''}
                          onChange={(e) => rate && handleEditServiceRate(rate.id, 'holidayRate', e.target.value)}
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
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSaveServiceRates}
              disabled={!hasUnsavedServiceRates || updateServiceRatesMutation.isPending}
              data-testid="button-save-service-rates"
            >
              {updateServiceRatesMutation.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Service Rates
                </>
              )}
            </Button>
          </div>
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
              {localSupportPlans.map((plan) => (
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
                        value={getSupportPlanValue(plan.id, 'rate')}
                        onChange={(e) => handleEditSupportPlan(plan.id, 'rate', e.target.value)}
                        data-testid={`input-support-plan-rate-${plan.id}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={getSupportPlanValue(plan.id, 'billingPeriod')}
                      onValueChange={(value) => handleEditSupportPlan(plan.id, 'billingPeriod', value)}
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
                      value={getSupportPlanValue(plan.id, 'description')}
                      onChange={(e) => handleEditSupportPlan(plan.id, 'description', e.target.value)}
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
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSaveSupportPlans}
              disabled={!hasUnsavedSupportPlans || updateSupportPlansMutation.isPending}
              data-testid="button-save-support-plans"
            >
              {updateSupportPlansMutation.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Support Plans
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FilePlus className="h-5 w-5 text-primary" />
                <CardTitle>Custom Legal Documents</CardTitle>
              </div>
              <CardDescription>
                Create and manage custom legal document types
              </CardDescription>
            </div>
            <Dialog open={customDocDialogOpen} onOpenChange={setCustomDocDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditingCustomDoc(null)} data-testid="button-add-custom-doc">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCustomDoc ? 'Edit Custom Document' : 'Add Custom Document'}</DialogTitle>
                  <DialogDescription>
                    {editingCustomDoc ? 'Update the custom legal document' : 'Create a new custom legal document type'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...customDocForm}>
                  <form onSubmit={customDocForm.handleSubmit(handleSubmitCustomDoc)} className="space-y-4">
                    <FormField
                      control={customDocForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Safety Waiver" data-testid="input-custom-doc-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customDocForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Content</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ''}
                              placeholder="Enter the document content..."
                              className="min-h-[200px] font-mono text-sm"
                              data-testid="textarea-custom-doc-content"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseCustomDocDialog}
                        data-testid="button-cancel-custom-doc"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCustomDocMutation.isPending || updateCustomDocMutation.isPending}
                        data-testid="button-submit-custom-doc"
                      >
                        {editingCustomDoc
                          ? (updateCustomDocMutation.isPending ? 'Updating...' : 'Update Document')
                          : (createCustomDocMutation.isPending ? 'Creating...' : 'Create Document')
                        }
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {customDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom legal documents yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCustomDoc(doc)}
                          data-testid={`button-edit-custom-doc-${doc.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCustomDocMutation.mutate(doc.id)}
                          disabled={deleteCustomDocMutation.isPending}
                          data-testid={`button-delete-custom-doc-${doc.id}`}
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
    </div>
  );
}
