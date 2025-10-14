import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, AlertCircle, Scale } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using FibreUS services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time."
    },
    {
      title: "2. Service Description",
      content: "FibreUS provides security system installation, monitoring, maintenance, and related services. Service details, pricing, and availability may vary by location and are subject to change. All services are provided subject to these terms."
    },
    {
      title: "3. User Obligations",
      content: "You agree to provide accurate information, maintain the security of your account credentials, use services lawfully and responsibly, and comply with all applicable laws and regulations. You are responsible for all activities under your account."
    },
    {
      title: "4. Payment Terms",
      content: "Payment is due according to your service agreement. We accept various payment methods. Late payments may result in service suspension. All fees are non-refundable except as required by law or specified in your service agreement."
    },
    {
      title: "5. Service Availability",
      content: "We strive to provide reliable service but cannot guarantee 100% uptime. Scheduled maintenance will be communicated in advance. We are not liable for service interruptions beyond our control, including internet outages or natural disasters."
    },
    {
      title: "6. Limitation of Liability",
      content: "Our liability is limited to the amount you paid for services in the 12 months preceding any claim. We are not liable for indirect, consequential, or punitive damages. This does not affect statutory rights that cannot be waived."
    },
    {
      title: "7. Intellectual Property",
      content: "All content, software, and materials provided by FibreUS are our property or licensed to us. You may not copy, modify, or distribute our materials without permission. Your feedback and suggestions become our property."
    },
    {
      title: "8. Termination",
      content: "Either party may terminate services according to the service agreement terms. Upon termination, you must pay all outstanding fees. We will provide access to your data for 30 days after termination, after which data may be deleted."
    },
  ];

  const keyPoints = [
    { icon: CheckCircle, title: "Service Agreement", description: "Binding contract for all users" },
    { icon: Scale, title: "Fair Use", description: "Lawful and responsible use required" },
    { icon: FileText, title: "Clear Terms", description: "Transparent policies and procedures" },
    { icon: AlertCircle, title: "Your Rights", description: "Protected by law and contract" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-legal-category">Legal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Terms of Service</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Please read these terms carefully before using our services. These terms govern your use of FibreUS services and website.
          </p>
          <p className="text-sm text-muted-foreground mt-4">Effective date: March 1, 2024</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Points</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {keyPoints.map((point) => (
              <Card key={point.title} data-testid={`card-point-${point.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <point.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{point.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-4xl mx-auto space-y-8 mb-16">
            {sections.map((section) => (
              <Card key={section.title} data-testid={`card-section-${section.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="max-w-4xl mx-auto mb-16" data-testid="card-governing-law">
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                These Terms of Service are governed by and construed in accordance with the laws of the state 
                in which our principal office is located, without regard to conflict of law principles. Any 
                disputes arising from these terms will be resolved in the courts of that jurisdiction.
              </p>
            </CardContent>
          </Card>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
            <p className="text-muted-foreground mb-6">
              Contact our legal team for clarification or visit your client portal for service details.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button variant="outline" size="lg" data-testid="button-contact-legal">
                Contact Legal Team
              </Button>
              <Link href="/login">
                <Button size="lg" data-testid="button-client-portal">
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
