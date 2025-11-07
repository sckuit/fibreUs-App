import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, MapPin } from "lucide-react";

const siteVisitFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  company: z.string().optional(),
  propertyAddress: z.string().min(5, "Please provide the property address"),
  propertyType: z.enum(["residential", "commercial", "industrial"], {
    required_error: "Please select a property type"
  }),
  serviceInterest: z.enum([
    "cctv",
    "alarm",
    "access_control",
    "intercom",
    "fiber_installation",
    "cloud_storage",
    "remote_monitoring",
    "multiple",
    "other"
  ], { required_error: "Please select a service type" }),
  squareFootage: z.string().optional(),
  preferredDate: z.string().min(1, "Please select a preferred date"),
  preferredTime: z.enum(["morning", "afternoon", "evening"], {
    required_error: "Please select a preferred time"
  }),
  specialRequirements: z.string().optional(),
});

type SiteVisitFormData = z.infer<typeof siteVisitFormSchema>;

export default function ScheduleSiteVisit() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<SiteVisitFormData>({
    resolver: zodResolver(siteVisitFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      propertyAddress: "",
      squareFootage: "",
      specialRequirements: "",
    },
  });

  const onSubmit = async (data: SiteVisitFormData) => {
    try {
      await apiRequest("/api/public/site-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      setIsSubmitted(true);
      form.reset();
      
      toast({
        title: "Site Visit Scheduled",
        description: "We'll contact you to confirm the visit details.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl">Site Visit Requested!</CardTitle>
            <CardDescription className="text-lg mt-4">
              Your site survey request has been received.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our technical team will review your request and contact you within 24 hours to
              confirm the site visit details and schedule.
            </p>
            <div className="pt-6">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                data-testid="button-schedule-another"
              >
                Schedule Another Visit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Schedule a Site Visit</h1>
          <p className="text-xl text-muted-foreground">
            Let our experts assess your property and recommend the best security solutions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Site Survey Request</CardTitle>
            <CardDescription>
              Provide your property details and we'll schedule a comprehensive security assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} data-testid="input-name" />
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
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            {...field}
                            data-testid="input-phone"
                          />
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
                          <Input placeholder="ABC Corporation" {...field} data-testid="input-company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="propertyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Address *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main St, City, State ZIP"
                          {...field}
                          data-testid="input-property-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property-type">
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

                  <FormField
                    control={form.control}
                    name="squareFootage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approximate Square Footage (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2500"
                            {...field}
                            data-testid="input-square-footage"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="serviceInterest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Interest *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-service-interest">
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cctv">CCTV Installation</SelectItem>
                          <SelectItem value="alarm">Alarm Systems</SelectItem>
                          <SelectItem value="access_control">Access Control</SelectItem>
                          <SelectItem value="intercom">Intercom Systems</SelectItem>
                          <SelectItem value="fiber_installation">Fiber Installation</SelectItem>
                          <SelectItem value="cloud_storage">Cloud Storage</SelectItem>
                          <SelectItem value="remote_monitoring">Remote Monitoring</SelectItem>
                          <SelectItem value="multiple">Multiple Services</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="preferredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Visit Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            {...field}
                            data-testid="input-preferred-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Time *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-preferred-time">
                              <SelectValue placeholder="Select time preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                            <SelectItem value="evening">Evening (5 PM - 7 PM)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requirements (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any specific areas of concern, access requirements, or special considerations..."
                          className="min-h-24"
                          {...field}
                          data-testid="textarea-special-requirements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                    data-testid="button-submit-site-visit"
                  >
                    {form.formState.isSubmitting ? "Submitting..." : "Schedule Site Visit"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Questions about site surveys? Call us at <strong>(555) 123-4567</strong>
        </p>
      </div>
    </div>
  );
}
