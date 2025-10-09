import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SystemConfig, UpdateSystemConfigType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSystemConfigSchema } from "@shared/schema";
import { Settings, Upload, Loader2 } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface AppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppConfigDialog({ open, onOpenChange }: AppConfigDialogProps) {
  const { toast } = useToast();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDarkLogo, setUploadingDarkLogo] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const { data: config, isLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
    enabled: open,
  });

  const form = useForm<UpdateSystemConfigType>({
    resolver: zodResolver(updateSystemConfigSchema),
    defaultValues: {
      website: '',
      contactEmail: '',
      infoEmail: '',
      address: '',
      phoneNumber: '',
      mission: '',
      aboutUs: '',
      headerTagline: '',
      footerTagline: '',
      logoUrl: '',
      darkLogoUrl: '',
      iconUrl: '',
    },
  });

  // Update form when config is loaded
  useEffect(() => {
    if (config && open) {
      form.reset({
        website: config.website || '',
        contactEmail: config.contactEmail || '',
        infoEmail: config.infoEmail || '',
        address: config.address || '',
        phoneNumber: config.phoneNumber || '',
        mission: config.mission || '',
        aboutUs: config.aboutUs || '',
        headerTagline: config.headerTagline || '',
        footerTagline: config.footerTagline || '',
        logoUrl: config.logoUrl || '',
        darkLogoUrl: config.darkLogoUrl || '',
        iconUrl: config.iconUrl || '',
      });
    }
  }, [config, open, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSystemConfigType) =>
      apiRequest('/api/system-config', 'PUT', data),
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
    updateMutation.mutate(values);
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest('/api/objects/upload', 'POST', {});
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const createUploadCompleteHandler = (
    fieldName: 'logoUrl' | 'darkLogoUrl' | 'iconUrl',
    setUploading: (value: boolean) => void
  ) => {
    return async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const uploadURL = uploadedFile.uploadURL;

        try {
          setUploading(true);
          const response = await apiRequest('/api/logos/upload', 'POST', {
            logoURL: uploadURL,
          });

          form.setValue(fieldName, response.objectPath);
          
          toast({
            title: "Upload successful",
            description: "Logo uploaded and ready to use",
          });
        } catch (error) {
          console.error("Error setting logo ACL:", error);
          toast({
            title: "Upload failed",
            description: "Failed to process uploaded logo",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
        }
      }
    };
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
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Contact Information</h3>
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
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

              {/* Logo Upload */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Branding (Logos)</h3>
                <p className="text-xs text-muted-foreground">
                  Upload logo files directly to secure storage
                </p>

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Logo</FormLabel>
                      <div className="flex gap-2 items-start">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="/objects/..."
                            data-testid="input-logo-url"
                            readOnly
                            className="flex-1"
                          />
                        </FormControl>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={createUploadCompleteHandler('logoUrl', setUploadingLogo)}
                          buttonVariant="outline"
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </ObjectUploader>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="darkLogoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dark Mode Logo (Optional)</FormLabel>
                      <div className="flex gap-2 items-start">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="/objects/..."
                            data-testid="input-dark-logo-url"
                            readOnly
                            className="flex-1"
                          />
                        </FormControl>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={createUploadCompleteHandler('darkLogoUrl', setUploadingDarkLogo)}
                          buttonVariant="outline"
                          disabled={uploadingDarkLogo}
                        >
                          {uploadingDarkLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </ObjectUploader>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="iconUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon/Favicon (Optional)</FormLabel>
                      <div className="flex gap-2 items-start">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="/objects/..."
                            data-testid="input-icon-url"
                            readOnly
                            className="flex-1"
                          />
                        </FormControl>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={2097152}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={createUploadCompleteHandler('iconUrl', setUploadingIcon)}
                          buttonVariant="outline"
                          disabled={uploadingIcon}
                        >
                          {uploadingIcon ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </ObjectUploader>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
