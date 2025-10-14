import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Clock, Activity } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function SystemStatus() {
  const services = [
    { name: "Cloud Storage", status: "operational", uptime: "99.99%", icon: CheckCircle, color: "text-green-500" },
    { name: "Monitoring Center", status: "operational", uptime: "100%", icon: CheckCircle, color: "text-green-500" },
    { name: "Mobile App", status: "operational", uptime: "99.95%", icon: CheckCircle, color: "text-green-500" },
    { name: "API Services", status: "operational", uptime: "99.98%", icon: CheckCircle, color: "text-green-500" },
  ];

  const incidents = [
    { date: "Mar 10, 2024", title: "Scheduled Maintenance", status: "Completed", description: "Routine server maintenance completed successfully" },
    { date: "Feb 28, 2024", title: "Network Upgrade", status: "Completed", description: "Infrastructure upgrade to improve performance" },
    { date: "Feb 15, 2024", title: "Security Patch", status: "Completed", description: "Security updates applied to all systems" },
  ];

  const metrics = [
    { label: "Average Response Time", value: "< 15 min", icon: Clock },
    { label: "System Uptime", value: "99.98%", icon: Activity },
    { label: "Active Monitoring", value: "24/7/365", icon: CheckCircle },
    { label: "Alert Response", value: "< 30 sec", icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-support-category">Support</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">System Status</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Real-time status of our security services and infrastructure. All systems are operating normally.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-2xl font-bold">All Systems Operational</h2>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="grid gap-4 mb-16">
            {services.map((service) => (
              <Card key={service.name} data-testid={`card-service-${service.name.toLowerCase().replace(/\s/g, '-')}`}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <service.icon className={`h-6 w-6 ${service.color}`} />
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{service.status}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Uptime: {service.uptime}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Performance Metrics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {metrics.map((metric) => (
              <Card key={metric.label} data-testid={`card-metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <metric.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-sm">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-8">Recent Updates</h2>
          <div className="space-y-4 mb-16">
            {incidents.map((incident) => (
              <Card key={incident.title} data-testid={`card-incident-${incident.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">{incident.title}</p>
                        <Badge variant="secondary">{incident.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                      <p className="text-xs text-muted-foreground">{incident.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Need Immediate Assistance?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Our support team is available 24/7 to help with any issues or questions.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/support/technical-support">
                <Button variant="secondary" size="lg" data-testid="button-contact-support">
                  Contact Support
                </Button>
              </Link>
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
