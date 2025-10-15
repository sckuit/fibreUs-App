import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText } from "lucide-react";
import LoginDialog from "@/components/LoginDialog";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "Information We Collect",
      content: "We collect information you provide directly to us, including name, email, phone number, address, and payment information when you use our services. We also collect technical data such as IP addresses, device information, and usage patterns to improve our services."
    },
    {
      title: "How We Use Your Information",
      content: "We use your information to provide and improve our security services, process transactions, send service notifications, respond to support requests, and ensure compliance with legal obligations. We never sell your personal information to third parties."
    },
    {
      title: "Data Security",
      content: "We implement industry-standard security measures including encryption, secure servers, and access controls to protect your data. Our security systems are monitored 24/7, and we regularly conduct security audits to maintain the highest protection standards."
    },
    {
      title: "Video Surveillance Data",
      content: "Video footage from your security cameras is stored securely and encrypted both in transit and at rest. You control who has access to your footage. We retain footage according to your service plan (30, 90, or custom retention periods)."
    },
    {
      title: "Your Rights",
      content: "You have the right to access, correct, or delete your personal information. You can request a copy of your data, opt-out of marketing communications, and withdraw consent at any time. Contact us to exercise these rights."
    },
    {
      title: "Cookies and Tracking",
      content: "We use cookies and similar technologies to improve website functionality, analyze usage patterns, and provide personalized experiences. You can control cookie preferences through your browser settings."
    },
  ];

  const principles = [
    { icon: Lock, title: "Data Encryption", description: "All data encrypted with industry-standard protocols" },
    { icon: Shield, title: "Secure Storage", description: "Data stored in secure, monitored facilities" },
    { icon: Eye, title: "Transparency", description: "Clear communication about data usage" },
    { icon: FileText, title: "Compliance", description: "Full compliance with privacy regulations" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-legal-category">Legal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Privacy Policy</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-muted-foreground mt-4">Last updated: March 2024</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Privacy Principles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {principles.map((principle) => (
              <Card key={principle.title} data-testid={`card-principle-${principle.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <principle.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{principle.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{principle.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-4xl mx-auto space-y-8 mb-16">
            {sections.map((section) => (
              <Card key={section.title} data-testid={`card-section-${section.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="max-w-4xl mx-auto mb-16" data-testid="card-contact">
            <CardHeader>
              <CardTitle>Contact Us About Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>Email: privacy@fibreus.com</li>
                <li>Phone: (555) 911-4357</li>
                <li>Mail: FibreUS Security, Privacy Department, 123 Security Blvd</li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Questions About Your Data?</h2>
            <p className="text-muted-foreground mb-6">
              Contact our privacy team or visit your client portal to manage your data preferences.
            </p>
            <LoginDialog>
              <Button size="lg" data-testid="button-client-portal">
                Access Client Portal
              </Button>
            </LoginDialog>
          </div>
        </div>
      </section>
    </div>
  );
}
