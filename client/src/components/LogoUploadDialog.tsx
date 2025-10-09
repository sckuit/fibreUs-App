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
import { Image, Upload, Loader2, X } from "lucide-react";

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

  const handleFileUpload = async (
    file: File,
    fieldName: 'logoUrl' | 'darkLogoUrl' | 'iconUrl',
    setUploading: (value: boolean) => void
  ) => {
    try {
      setUploading(true);

      // Step 1: Get presigned URL
      const response = await apiRequest('POST', '/api/objects/upload', {});
      const uploadParams = await response.json() as { uploadURL: string };

      // Step 2: Upload to object storage using presigned URL
      const uploadResponse = await fetch(uploadParams.uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Step 3: Set ACL and get final path
      const aclResponseRaw = await apiRequest('POST', '/api/logos/upload', {
        logoURL: uploadParams.uploadURL,
      });
      const aclResponse = await aclResponseRaw.json() as { objectPath: string };

      // Step 4: Update form field
      form.setValue(fieldName, aclResponse.objectPath);

      toast({
        title: "Upload successful",
        description: "Logo uploaded and ready to use",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="logo-file"
                          disabled={uploadingLogo}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, 'logoUrl', setUploadingLogo);
                              e.target.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingLogo}
                          onClick={() => document.getElementById('logo-file')?.click()}
                          data-testid="button-upload-logo"
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
                        </Button>
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
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="dark-logo-file"
                          disabled={uploadingDarkLogo}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, 'darkLogoUrl', setUploadingDarkLogo);
                              e.target.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingDarkLogo}
                          onClick={() => document.getElementById('dark-logo-file')?.click()}
                          data-testid="button-upload-dark-logo"
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
                        </Button>
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
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="icon-file"
                          disabled={uploadingIcon}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, 'iconUrl', setUploadingIcon);
                              e.target.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingIcon}
                          onClick={() => document.getElementById('icon-file')?.click()}
                          data-testid="button-upload-icon"
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
                        </Button>
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
