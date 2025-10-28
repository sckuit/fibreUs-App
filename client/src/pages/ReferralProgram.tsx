import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Users, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import LoginDialog from "@/components/LoginDialog";

export default function ReferralProgram() {

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
        <div className="text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
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
        </div>
      </div>
    </div>
  );
}
