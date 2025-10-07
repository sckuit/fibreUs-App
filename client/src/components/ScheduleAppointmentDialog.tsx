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
import { Calendar, CheckCircle, Clock } from "lucide-react";

const appointmentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  serviceType: z.enum(['consultation', 'assessment', 'installation', 'maintenance', 'emergency']),
  preferredDate: z.string().min(1, "Please select a preferred date"),
  preferredTime: z.enum(['morning', 'afternoon', 'evening']),
  address: z.string().min(5, "Please enter a complete address"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

interface ScheduleAppointmentDialogProps {
  children: React.ReactNode;
}

export default function ScheduleAppointmentDialog({ children }: ScheduleAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceType: "consultation",
      preferredDate: "",
      preferredTime: "morning",
      address: "",
      notes: "",
    },
  });

  // Generate date options for next 30 days (excluding weekends)
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 45; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
      
      if (dates.length >= 20) break; // Limit to 20 options
    }
    
    return dates;
  };

  const submitInquiry = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      return apiRequest("/api/inquiries", {
        method: "POST",
        body: JSON.stringify({
          type: "appointment",
          ...data,
        }),
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Appointment Scheduled",
        description: "We'll confirm your appointment within 2 hours.",
      });

      setTimeout(() => {
        setOpen(false);
        setIsSubmitted(false);
        form.reset();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Please try again or call us directly at (555) 123-4567",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
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
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Schedule Security Consultation
          </DialogTitle>
          <DialogDescription>
            Book a free consultation with our security experts to assess your needs.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Appointment Requested!</h3>
            <p className="text-muted-foreground">
              Thank you for scheduling with us. We'll confirm your appointment within 2 hours and send you all the details.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-700">
                Our team will call you to confirm the exact time and discuss any preparation needed.
              </p>
            </div>
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
                        <Input placeholder="John Smith" {...field} data-testid="input-appointment-name" />
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
                        <Input type="email" placeholder="john@company.com" {...field} data-testid="input-appointment-email" />
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
                        <Input placeholder="(555) 123-4567" {...field} data-testid="input-appointment-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-appointment-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consultation">Free Consultation</SelectItem>
                          <SelectItem value="assessment">Security Assessment</SelectItem>
                          <SelectItem value="installation">Installation Visit</SelectItem>
                          <SelectItem value="maintenance">Maintenance Check</SelectItem>
                          <SelectItem value="emergency">Emergency Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Date *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-appointment-date">
                            <SelectValue placeholder="Select date" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getDateOptions().map((date) => (
                            <SelectItem key={date.value} value={date.value}>
                              {date.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-appointment-time">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12:00 PM - 5:00 PM)</SelectItem>
                          <SelectItem value="evening">Evening (5:00 PM - 8:00 PM)</SelectItem>
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
                      <Input placeholder="123 Main St, City, State 12345" {...field} data-testid="input-appointment-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific requirements, access instructions, or questions you'd like to discuss..."
                        className="min-h-[80px]"
                        {...field}
                        data-testid="textarea-appointment-notes"
                      />
                    </FormControl>
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
                  data-testid="button-appointment-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitInquiry.isPending}
                  data-testid="button-appointment-submit"
                >
                  {submitInquiry.isPending ? "Scheduling..." : "Schedule Appointment"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}