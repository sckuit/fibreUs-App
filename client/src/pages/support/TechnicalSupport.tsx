import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Phone, Mail, MessageCircle, Book } from "lucide-react";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import LoginDialog from "@/components/LoginDialog";

export default function TechnicalSupport() {
  const contactMethods = [
    { icon: Phone, title: "Phone Support", description: "Call us at (555) 911-4357", availability: "24/7" },
    { icon: Mail, title: "Email Support", description: "support@fibreus.com", availability: "Response within 2 hours" },
    { icon: MessageCircle, title: "Live Chat", description: "Chat with our experts", availability: "Mon-Fri 8AM-8PM" },
    { icon: Book, title: "Documentation", description: "Browse our knowledge base", availability: "Always available" },
  ];

  const faqs = [
    {
      question: "How do I access my camera footage remotely?",
      answer: "You can access your camera footage through our mobile app or web portal. Simply log in with your credentials and select the camera you want to view. Live streaming and recorded footage are available 24/7."
    },
    {
      question: "What should I do if my alarm system is beeping?",
      answer: "A beeping alarm usually indicates a low battery, sensor issue, or system fault. Check your control panel for error codes. If the issue persists, contact our support team immediately. For false alarms, enter your disarm code."
    },
    {
      question: "How often should I test my security system?",
      answer: "We recommend testing your security system monthly. This includes checking all sensors, cameras, and alarm signals. Our maintenance plans include quarterly professional testing and annual comprehensive inspections."
    },
    {
      question: "Can I add more cameras to my existing system?",
      answer: "Yes! Most systems are expandable. Contact our team to discuss your needs. We'll assess your current system capacity and recommend the best cameras to add. Installation can typically be scheduled within 3-5 business days."
    },
    {
      question: "How long is my footage stored in the cloud?",
      answer: "Cloud storage retention depends on your plan. Basic plans include 30 days, Professional plans include 90 days, and Enterprise plans offer custom retention periods. You can download important footage for permanent storage."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-support-category">Support</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Technical Support</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Get expert help with your security systems. Our technical support team is here to assist you 24/7.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Contact Support</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method) => (
              <Card key={method.title} data-testid={`card-contact-${method.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <method.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{method.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">{method.description}</p>
                  <Badge variant="secondary">{method.availability}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} data-testid={`accordion-faq-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-8">Support Resources</h2>
              <div className="space-y-4">
                <Card data-testid="card-user-guides">
                  <CardHeader>
                    <CardTitle>User Guides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Comprehensive guides for all our products and services.
                    </p>
                    <Button variant="outline" data-testid="button-view-guides">View Guides</Button>
                  </CardContent>
                </Card>

                <Card data-testid="card-video-tutorials">
                  <CardHeader>
                    <CardTitle>Video Tutorials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Step-by-step video instructions for common tasks.
                    </p>
                    <Button variant="outline" data-testid="button-watch-tutorials">Watch Tutorials</Button>
                  </CardContent>
                </Card>

                <Card data-testid="card-troubleshooting">
                  <CardHeader>
                    <CardTitle>Troubleshooting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Solutions to common technical issues.
                    </p>
                    <Button variant="outline" data-testid="button-troubleshooting">Get Solutions</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Our expert support team is ready to assist you with any technical issues or questions.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-submit-ticket">
                  Submit Support Ticket
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
