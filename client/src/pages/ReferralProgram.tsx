import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Users, DollarSign, TrendingUp, ArrowRight, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import LoginDialog from "@/components/LoginDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicReferralSubmissionSchema, type ReferralProgram } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ReferralFormData = z.infer<typeof publicReferralSubmissionSchema>;

export default function ReferralProgram() {
  const { toast } = useToast();
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);

  const { data: activePrograms = [] } = useQuery<ReferralProgram[]>({
    queryKey: ["/api/referral-programs/active"],
  });

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(publicReferralSubmissionSchema),
    defaultValues: {
      referrerName: "",
      referrerEmail: "",
      referrerPhone: "",
      referredName: "",
      referredEmail: "",
      referredPhone: "",
      referredCompany: "",
      referralProgramId: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ReferralFormData) => {
      const response = await apiRequest("POST", "/api/referrals/submit-public", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your referral has been submitted successfully. We'll be in touch soon!",
      });
      setIsReferralDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit referral",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReferralFormData) => {
    submitMutation.mutate(data);
  };

  const benefits = [
    {
      icon: Gift,
      title: "Earn Rewards",
      description: "Get rewarded for every successful referral that becomes a client"
    },
    {
      icon: Users,
      title: "Help Others",
      description: "Share our professional security services with people you know"
    },
    {
      icon: DollarSign,
      title: "Track Earnings",
      description: "Monitor your referrals and rewards in real-time through your portal"
    },
    {
      icon: TrendingUp,
      title: "Unlimited Potential",
      description: "No limit on how many people you can refer or how much you can earn"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Get Your Code",
      description: "Sign up and generate your unique referral code in your dashboard"
    },
    {
      number: "2",
      title: "Share With Friends",
      description: "Share your code with businesses and contacts who need our services"
    },
    {
      number: "3",
      title: "Earn Rewards",
      description: "When they become clients, you earn rewards for the referral"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Refer & Earn Rewards
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Know someone who needs professional security services? Refer them and earn rewards when they become our client.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center hover-elevate active-elevate-2">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-card rounded-lg p-8 mb-12 border">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {step.number}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto -ml-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="grid md:grid-cols-2 gap-6 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-muted-foreground mb-6">
                Join our referral program today and start earning rewards for sharing professional security services with your network.
              </p>
              <LoginDialog>
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  data-testid="button-get-referral-code"
                >
                  Get Your Referral Code
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </LoginDialog>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold mb-4">Send a Referral Now</h2>
              <p className="text-muted-foreground mb-6">
                Know someone who needs our services? Submit their information and earn rewards when they become a client.
              </p>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8"
                onClick={() => setIsReferralDialogOpen(true)}
                data-testid="button-send-referral"
              >
                <Send className="mr-2 w-5 h-5" />
                Send Referral
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send a Referral</DialogTitle>
            <DialogDescription>
              Fill out the form below to refer someone to our services. We'll reach out to them and you'll earn rewards when they become a client.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Your Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Your Information</h3>
                
                <FormField
                  control={form.control}
                  name="referrerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          data-testid="input-referrer-name"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referrerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Email (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          data-testid="input-referrer-email"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referrerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          data-testid="input-referrer-phone"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Referral Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Who Are You Referring?</h3>

                <FormField
                  control={form.control}
                  name="referredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Their Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jane Smith"
                          data-testid="input-referred-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referredEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Their Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jane@example.com"
                          data-testid="input-referred-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referredPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Their Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 987-6543"
                          data-testid="input-referred-phone"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referredCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Their Company (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Corp"
                          data-testid="input-referred-company"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {activePrograms.length > 0 && (
                  <FormField
                    control={form.control}
                    name="referralProgramId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Program (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-referral-program">
                              <SelectValue placeholder="Select a program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activePrograms.map((program) => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.name} - ${program.rewardAmount}
                                {program.rewardType === 'percentage' && '%'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReferralDialogOpen(false);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-referral"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Referral"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
