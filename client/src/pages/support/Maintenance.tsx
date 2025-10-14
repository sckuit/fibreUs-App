import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Calendar, CheckCircle, Shield } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function Maintenance() {
  const maintenancePlans = [
    {
      name: "Basic Maintenance",
      price: "$99/year",
      features: [
        "Annual system inspection",
        "Software updates",
        "Basic cleaning",
        "Performance report",
        "10% discount on repairs"
      ]
    },
    {
      name: "Premium Maintenance",
      price: "$199/year",
      features: [
        "Quarterly inspections",
        "Priority software updates",
        "Deep system cleaning",
        "Detailed performance reports",
        "20% discount on repairs",
        "Free emergency calls"
      ]
    },
    {
      name: "Enterprise Maintenance",
      price: "Custom Quote",
      features: [
        "Monthly inspections",
        "Immediate software updates",
        "Complete system optimization",
        "Real-time monitoring reports",
        "30% discount on repairs",
        "Unlimited emergency calls",
        "Dedicated technician"
      ]
    }
  ];

  const maintenanceServices = [
    { icon: Wrench, title: "System Inspection", description: "Comprehensive check of all components" },
    { icon: CheckCircle, title: "Software Updates", description: "Latest firmware and security patches" },
    { icon: Calendar, title: "Scheduled Service", description: "Regular preventive maintenance visits" },
    { icon: Shield, title: "Performance Testing", description: "Verify optimal system operation" },
  ];

  const maintenanceSchedule = [
    { frequency: "Monthly", tasks: ["Check system alerts", "Review event logs", "Test remote access"] },
    { frequency: "Quarterly", tasks: ["Full system inspection", "Camera cleaning", "Sensor testing", "Battery replacement if needed"] },
    { frequency: "Annually", tasks: ["Complete system audit", "Hardware assessment", "Security review", "Upgrade recommendations"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-support-category">Support</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Maintenance & Service Plans</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Keep your security systems running at peak performance with our professional maintenance services.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Maintenance Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {maintenanceServices.map((service) => (
              <Card key={service.title} data-testid={`card-service-${service.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <service.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Maintenance Plans</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {maintenancePlans.map((plan) => (
              <Card key={plan.name} data-testid={`card-plan-${plan.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary">{plan.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <GetQuoteDialog>
                    <Button className="w-full mt-6" data-testid={`button-subscribe-${plan.name.toLowerCase().replace(/\s/g, '-')}`}>
                      Subscribe Now
                    </Button>
                  </GetQuoteDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Recommended Maintenance Schedule</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {maintenanceSchedule.map((schedule) => (
              <Card key={schedule.frequency} data-testid={`card-schedule-${schedule.frequency.toLowerCase()}`}>
                <CardHeader>
                  <CardTitle>{schedule.frequency}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {schedule.tasks.map((task) => (
                      <li key={task} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <span className="text-muted-foreground">{task}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Regular Maintenance Matters</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Prevent Failures</h3>
                <p className="text-muted-foreground">
                  Catch issues before they become problems
                </p>
              </div>
              <div className="text-center">
                <Wrench className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Extend Lifespan</h3>
                <p className="text-muted-foreground">
                  Keep systems running longer with proper care
                </p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Optimal Performance</h3>
                <p className="text-muted-foreground">
                  Ensure maximum security effectiveness
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Choose Your Maintenance Plan</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Protect your investment with regular professional maintenance. Schedule your service today.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-schedule-maintenance">
                  Schedule Maintenance
                </Button>
              </GetQuoteDialog>
              <Link href="/login">
                <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-client-portal">
                  Client Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
