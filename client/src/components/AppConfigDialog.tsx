import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SystemConfig, UpdateSystemConfigType, ServiceType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSystemConfigSchema } from "@shared/schema";
import { Settings } from "lucide-react";

interface AppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppConfigDialog({ open, onOpenChange }: AppConfigDialogProps) {
  const { toast } = useToast();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { data: config, isLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
    enabled: open,
  });

  const { data: serviceTypes } = useQuery<ServiceType[]>({
    queryKey: ['/api/service-types'],
    enabled: open,
  });

  const form = useForm<UpdateSystemConfigType>({
    resolver: zodResolver(updateSystemConfigSchema),
    defaultValues: {
      companyName: '',
      website: '',
      contactEmail: '',
      infoEmail: '',
      address: '',
      phoneNumber: '',
      mission: '',
      aboutUs: '',
      headerTagline: '',
      footerTagline: '',
      facebookUrl: '',
      twitterUrl: '',
      linkedinUrl: '',
      instagramUrl: '',
      emergencyPhone: '',
      emergencyEmail: '',
      termsOfServiceUrl: '',
      serviceAgreementUrl: '',
      warrantyInfoUrl: '',
      privacyPolicyUrl: '',
    },
  });

  useEffect(() => {
    if (config && open) {
      form.reset({
        companyName: config.companyName || '',
        website: config.website || '',
        contactEmail: config.contactEmail || '',
        infoEmail: config.infoEmail || '',
        address: config.address || '',
        phoneNumber: config.phoneNumber || '',
        mission: config.mission || '',
        aboutUs: config.aboutUs || '',
        headerTagline: config.headerTagline || '',
        footerTagline: config.footerTagline || '',
        facebookUrl: config.facebookUrl || '',
        twitterUrl: config.twitterUrl || '',
        linkedinUrl: config.linkedinUrl || '',
        instagramUrl: config.instagramUrl || '',
        emergencyPhone: config.emergencyPhone || '',
        emergencyEmail: config.emergencyEmail || '',
        termsOfServiceUrl: config.termsOfServiceUrl || '',
        serviceAgreementUrl: config.serviceAgreementUrl || '',
        warrantyInfoUrl: config.warrantyInfoUrl || '',
        privacyPolicyUrl: config.privacyPolicyUrl || '',
      });
      setSelectedServices(config.selectedFrontpageServices || []);
    }
  }, [config, open, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSystemConfigType) =>
      apiRequest('PUT', '/api/system-config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      toast({ title: "App configuration updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (values: UpdateSystemConfigType) => {
    updateMutation.mutate({
      ...values,
      selectedFrontpageServices: selectedServices,
    });
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-app-config">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Configuration
          </DialogTitle>
          <DialogDescription>
            Update your app information, contact details, and branding
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading configuration...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Company Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Company Information</h3>
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="FibreUS"
                          data-testid="input-company-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="https://www.fibreus.com"
                          data-testid="input-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            type="email"
                            placeholder="contact@fibreus.com"
                            data-testid="input-contact-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="infoEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Info Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            type="email"
                            placeholder="info@fibreus.com"
                            data-testid="input-info-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="+1 (555) 123-4567"
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="123 Business Ave, Suite 100, City, State 12345"
                          rows={2}
                          data-testid="textarea-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mission & About */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Mission & About</h3>

                <FormField
                  control={form.control}
                  name="mission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mission Statement</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="Our mission is to..."
                          rows={3}
                          data-testid="textarea-mission"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aboutUs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Us</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="About FibreUS..."
                          rows={4}
                          data-testid="textarea-about"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Taglines */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Taglines</h3>

                <FormField
                  control={form.control}
                  name="headerTagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header Tagline</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Professional Security Solutions"
                          data-testid="input-header-tagline"
                        />
                      </FormControl>
                      <FormDescription>Shown in the header</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="footerTagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Tagline</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Securing Your Future"
                          data-testid="input-footer-tagline"
                        />
                      </FormControl>
                      <FormDescription>Shown in the footer</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social Media Links */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Social Media Links</h3>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="https://facebook.com/yourpage"
                            data-testid="input-facebook"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="https://twitter.com/yourhandle"
                            data-testid="input-twitter"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="https://linkedin.com/company/yourcompany"
                            data-testid="input-linkedin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="https://instagram.com/yourhandle"
                            data-testid="input-instagram"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Emergency Contacts</h3>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Phone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="+1 (555) 911-HELP"
                            data-testid="input-emergency-phone"
                          />
                        </FormControl>
                        <FormDescription>24/7 emergency line</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            type="email"
                            placeholder="emergency@fibreus.com"
                            data-testid="input-emergency-email"
                          />
                        </FormControl>
                        <FormDescription>For urgent requests</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Legal Document URLs */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Legal Document URLs</h3>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="privacyPolicyUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Privacy Policy URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="/privacy-policy"
                            data-testid="input-privacy-policy"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsOfServiceUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms of Service URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="/terms-of-service"
                            data-testid="input-terms-of-service"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceAgreementUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Agreement URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="/service-agreement"
                            data-testid="input-service-agreement"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warrantyInfoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Information URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="/warranty-information"
                            data-testid="input-warranty-info"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Frontpage Service Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Frontpage Services Display</h3>
                <FormDescription>
                  Select which services to display on the homepage
                </FormDescription>

                <div className="grid grid-cols-2 gap-3">
                  {serviceTypes?.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.name)}
                        onCheckedChange={() => toggleService(service.name)}
                        data-testid={`checkbox-service-${service.name}`}
                      />
                      <label
                        htmlFor={`service-${service.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service.displayName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
