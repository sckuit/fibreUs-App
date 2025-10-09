import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SystemConfig, UpdateSystemConfigType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSystemConfigSchema } from "@shared/schema";
import { Image, Upload, Loader2 } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface LogoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoUploadDialog({ open, onOpenChange }: LogoUploadDialogProps) {
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
      logoUrl: '',
      darkLogoUrl: '',
      iconUrl: '',
    },
  });

  useEffect(() => {
    if (config && open) {
      form.reset({
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
      toast({ title: "Logos updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update logos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (values: UpdateSystemConfigType) => {
    updateMutation.mutate(values);
  };

  const handleGetUploadParameters = async (file: any) => {
    const response = await apiRequest('/api/objects/upload', 'POST', {}) as unknown as { uploadURL: string };
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
          }) as unknown as { objectPath: string };

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
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-logo-upload">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo & Branding Assets
          </DialogTitle>
          <DialogDescription>
            Upload and manage your application logos and icons
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading logos...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-3">
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
                            value={field.value || ''}
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
                            value={field.value || ''}
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
                            value={field.value || ''}
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
                  {updateMutation.isPending ? 'Saving...' : 'Save Logos'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
