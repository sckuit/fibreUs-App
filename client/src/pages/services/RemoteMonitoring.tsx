import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Clock, Phone, Shield, CheckCircle } from "lucide-react";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import LoginDialog from "@/components/LoginDialog";

export default function RemoteMonitoring() {
  const features = [
    { icon: Clock, title: "24/7 Monitoring", description: "Round-the-clock professional monitoring service" },
    { icon: Eye, title: "Real-Time Alerts", description: "Instant notifications for any security events" },
    { icon: Phone, title: "Emergency Response", description: "Direct connection to emergency services" },
    { icon: Shield, title: "Verified Alarms", description: "Professional verification before dispatch" },
  ];

  const services = [
    { name: "Basic Monitoring", price: "$39/month", features: ["24/7 Monitoring", "Email Alerts", "Phone Notifications", "Event Log", "Mobile App"] },
    { name: "Premium Monitoring", price: "$79/month", features: ["Video Verification", "Priority Response", "Police Dispatch", "SMS Alerts", "Dedicated Support"] },
    { name: "Enterprise Monitoring", price: "Custom Quote", features: ["Multi-Site Monitoring", "Custom Protocols", "Dedicated Team", "Advanced Analytics", "SLA Guarantee"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-service-category">Services</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">24/7 Remote Monitoring</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Professional remote monitoring and alert services. Our certified operators watch your property 24/7 and respond to any security events.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Professional Monitoring Center</h2>
              <p className="text-muted-foreground mb-6">
                Our UL-certified monitoring center operates 24/7/365, staffed by trained security 
                professionals. When an alarm is triggered, our team verifies the event and takes 
                immediate action, including contacting emergency services if needed.
              </p>
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-get-quote">
                  Get Free Trial
                </Button>
              </GetQuoteDialog>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <strong>Alarm Triggered:</strong> Your security system detects an event
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <strong>Instant Alert:</strong> Our monitoring center receives the signal
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <strong>Verification:</strong> Operators verify the alarm using video/audio
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                      <div>
                        <strong>Response:</strong> We contact you and dispatch authorities if needed
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Monitoring Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature) => (
              <Card key={feature.title} data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Monitoring Plans</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {services.map((service) => (
              <Card key={service.name} data-testid={`card-plan-${service.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary">{service.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <GetQuoteDialog>
                    <Button className="w-full mt-6" data-testid={`button-subscribe-${service.name.toLowerCase().replace(/\s/g, '-')}`}>
                      Subscribe Now
                    </Button>
                  </GetQuoteDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Peace of Mind, Day and Night</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Let our professionals watch over your property while you focus on what matters most.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-start-monitoring">
                  Start Monitoring
                </Button>
              </GetQuoteDialog>
              <LoginDialog>
                <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-client-portal">
                  Client Portal
                </Button>
              </LoginDialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
