import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Video, FileText, Users } from "lucide-react";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import LoginDialog from "@/components/LoginDialog";

export default function Training() {
  const trainingPrograms = [
    {
      icon: Users,
      title: "On-Site Training",
      duration: "2-4 hours",
      description: "Hands-on training at your location for your team",
      topics: ["System overview", "Daily operations", "Basic troubleshooting", "Best practices"]
    },
    {
      icon: Video,
      title: "Online Webinars",
      duration: "1 hour",
      description: "Live interactive sessions with Q&A",
      topics: ["Remote access", "Mobile app usage", "Alert management", "System features"]
    },
    {
      icon: FileText,
      title: "Documentation",
      duration: "Self-paced",
      description: "Comprehensive guides and manuals",
      topics: ["User manuals", "Quick start guides", "Troubleshooting docs", "Video tutorials"]
    },
    {
      icon: GraduationCap,
      title: "Certification Program",
      duration: "8 hours",
      description: "Advanced training with certification",
      topics: ["System administration", "Advanced features", "Security protocols", "Compliance"]
    },
  ];

  const trainingTopics = [
    { category: "Basic Operations", items: ["Arming/disarming", "Viewing cameras", "User management", "Mobile app basics"] },
    { category: "Advanced Features", items: ["Analytics setup", "Custom alerts", "Integration", "Automation rules"] },
    { category: "Maintenance", items: ["System checks", "Cleaning procedures", "Battery replacement", "Software updates"] },
    { category: "Emergency Response", items: ["Alarm handling", "Emergency contacts", "Incident reporting", "Evacuation procedures"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-support-category">Support</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">Training & Resources</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Comprehensive training programs to help you get the most from your security systems.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Training Programs</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {trainingPrograms.map((program) => (
              <Card key={program.title} data-testid={`card-program-${program.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <program.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                        <CardTitle>{program.title}</CardTitle>
                        <Badge variant="secondary">{program.duration}</Badge>
                      </div>
                      <p className="text-muted-foreground">{program.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold mb-2">Topics Covered:</p>
                  <ul className="space-y-1">
                    {program.topics.map((topic) => (
                      <li key={topic} className="text-muted-foreground">• {topic}</li>
                    ))}
                  </ul>
                  <GetQuoteDialog>
                    <Button className="w-full mt-6" data-testid={`button-enroll-${program.title.toLowerCase().replace(/\s/g, '-')}`}>
                      Enroll Now
                    </Button>
                  </GetQuoteDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">Training Topics</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {trainingTopics.map((topic) => (
              <Card key={topic.category} data-testid={`card-topic-${topic.category.toLowerCase().replace(/\s/g, '-')}`}>
                <CardHeader>
                  <CardTitle>{topic.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {topic.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Training Benefits</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="text-center">
                <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Expert Instructors</h3>
                <p className="text-muted-foreground">
                  Learn from certified security professionals
                </p>
              </div>
              <div className="text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Hands-On Learning</h3>
                <p className="text-muted-foreground">
                  Practice with your actual equipment
                </p>
              </div>
              <div className="text-center">
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Ongoing Support</h3>
                <p className="text-muted-foreground">
                  Access to resources after training
                </p>
              </div>
            </div>
          </div>

          <Card className="mb-16" data-testid="card-custom-training">
            <CardHeader>
              <CardTitle>Custom Training Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Need specialized training for your organization? We offer custom training programs tailored 
                to your specific systems, workflows, and security requirements. Our trainers can work with 
                teams of any size, from small businesses to large enterprises.
              </p>
              <GetQuoteDialog>
                <Button data-testid="button-request-custom">Request Custom Training</Button>
              </GetQuoteDialog>
            </CardContent>
          </Card>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Start Learning Today</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Empower your team with the knowledge to maximize your security system's potential.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button variant="secondary" size="lg" data-testid="button-schedule-training">
                  Schedule Training
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
