import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle } from "lucide-react";

const quoteFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  company: z.string().optional(),
  serviceType: z.enum(['cctv', 'alarm', 'access_control', 'intercom', 'cloud_storage', 'monitoring', 'fiber_installation', 'maintenance']),
  propertyType: z.enum(['residential', 'commercial', 'industrial']),
  address: z.string().min(5, "Please enter a complete address"),
  description: z.string().min(10, "Please provide more details about your needs"),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface GetQuoteDialogProps {
  children: React.ReactNode;
}

export default function GetQuoteDialog({ children }: GetQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      serviceType: "cctv",
      propertyType: "commercial",
      address: "",
      description: "",
      urgency: "medium",
    },
  });

  const submitInquiry = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "quote",
          ...data,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Quote Request Submitted",
        description: "We'll contact you within 24 hours with a detailed quote.",
      });

      setTimeout(() => {
        setOpen(false);
        setIsSubmitted(false);
        form.reset();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or call us directly at (555) 123-4567",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    submitInquiry.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Get Free Security Quote
          </DialogTitle>
          <DialogDescription>
            Tell us about your security needs and we'll provide a customized quote within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Quote Request Submitted!</h3>
            <p className="text-muted-foreground">
              Thank you for your interest. Our team will review your requirements and contact you within 24 hours.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} data-testid="input-quote-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@company.com" {...field} data-testid="input-quote-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} data-testid="input-quote-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Corporation" {...field} data-testid="input-quote-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-quote-service">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cctv">CCTV Surveillance</SelectItem>
                          <SelectItem value="alarm">Alarm Systems</SelectItem>
                          <SelectItem value="access_control">Access Control</SelectItem>
                          <SelectItem value="intercom">Intercom Systems</SelectItem>
                          <SelectItem value="cloud_storage">Cloud Storage</SelectItem>
                          <SelectItem value="monitoring">24/7 Monitoring</SelectItem>
                          <SelectItem value="fiber_installation">Fiber Installation</SelectItem>
                          <SelectItem value="maintenance">Maintenance Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-quote-property">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State 12345" {...field} data-testid="input-quote-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your security needs, number of cameras, coverage areas, special requirements, etc."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-quote-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-quote-urgency">
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">No rush (30+ days)</SelectItem>
                        <SelectItem value="medium">Standard (2-4 weeks)</SelectItem>
                        <SelectItem value="high">Priority (1-2 weeks)</SelectItem>
                        <SelectItem value="urgent">Emergency (ASAP)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  data-testid="button-quote-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitInquiry.isPending}
                  data-testid="button-quote-submit"
                >
                  {submitInquiry.isPending ? "Submitting..." : "Get Free Quote"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}