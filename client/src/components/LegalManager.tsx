import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LegalDocuments, UpdateLegalDocumentsType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateLegalDocumentsSchema } from "@shared/schema";
import { Save, FileText, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function LegalManager() {
  const { toast } = useToast();

  const { data: legalDocs, isLoading } = useQuery<LegalDocuments>({
    queryKey: ['/api/legal-documents'],
  });

  const form = useForm<UpdateLegalDocumentsType>({
    resolver: zodResolver(updateLegalDocumentsSchema),
    defaultValues: {
      privacyPolicy: '',
      termsOfService: '',
      serviceAgreement: '',
      warrantyInfo: '',
      regularHourlyRate: '',
      afterHoursRate: '',
      holidayRate: '',
      hoursRatesNotes: '',
    },
  });

  useEffect(() => {
    if (legalDocs) {
      form.reset({
        privacyPolicy: legalDocs.privacyPolicy || '',
        termsOfService: legalDocs.termsOfService || '',
        serviceAgreement: legalDocs.serviceAgreement || '',
        warrantyInfo: legalDocs.warrantyInfo || '',
        regularHourlyRate: legalDocs.regularHourlyRate || '',
        afterHoursRate: legalDocs.afterHoursRate || '',
        holidayRate: legalDocs.holidayRate || '',
        hoursRatesNotes: legalDocs.hoursRatesNotes || '',
      });
    }
  }, [legalDocs, form]);

  const updateMutation = useMutation({
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

  const handleSubmit = async (values: UpdateLegalDocumentsType) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          Loading legal documents...
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
                name="termsOfService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms of Service</FormLabel>
                    <FormDescription>
                      Your company's terms of service agreement
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter your terms of service..."
                        className="min-h-[150px] font-mono text-sm"
                        data-testid="textarea-terms-of-service"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceAgreement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Agreement</FormLabel>
                    <FormDescription>
                      Standard service agreement for clients
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter your service agreement..."
                        className="min-h-[150px] font-mono text-sm"
                        data-testid="textarea-service-agreement"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                  disabled={updateMutation.isPending}
                  data-testid="button-save-legal-docs"
                >
                  {updateMutation.isPending ? (
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
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>Hourly Rates</CardTitle>
          </div>
          <CardDescription>
            Configure your company's hourly rates for different time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="regularHourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regular Hourly Rate</FormLabel>
                      <FormDescription>
                        Standard business hours rate
                      </FormDescription>
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
                            data-testid="input-regular-rate"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="afterHoursRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>After Hours Rate</FormLabel>
                      <FormDescription>
                        Evening/weekend rate
                      </FormDescription>
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
                            data-testid="input-after-hours-rate"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="holidayRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Holiday Rate</FormLabel>
                      <FormDescription>
                        Holiday premium rate
                      </FormDescription>
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
                            data-testid="input-holiday-rate"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hoursRatesNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours & Rates Notes</FormLabel>
                    <FormDescription>
                      Additional information about your hourly rates and billing policies
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="e.g., Regular hours: Mon-Fri 8am-5pm, After hours: Weekdays 5pm-8am and weekends, Holidays: Major US holidays..."
                        className="min-h-[100px]"
                        data-testid="textarea-hours-rates-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-rates"
                >
                  {updateMutation.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Hourly Rates
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
