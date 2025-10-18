import { useQuery } from "@tanstack/react-query";
import type { SystemConfig } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Award, 
  Clock, 
  Shield,
  CheckCircle2
} from "lucide-react";

export default function AboutUs() {
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  const companyName = config?.companyName || "FibreUS";
  const achievements = [
    {
      icon: Award,
      title: "Industry Certified",
      description: "UL Listed, FCC Certified, and NFPA Compliant installations"
    },
    {
      icon: Clock,
      title: "15+ Years Experience", 
      description: "Trusted by businesses and homeowners since 2008"
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Licensed technicians with ongoing professional training"
    },
    {
      icon: Shield,
      title: "24/7 Support",
      description: "Emergency response and round-the-clock monitoring"
    }
  ];

  //todo: remove mock functionality - company history
  const milestones = [
    {
      year: "2008",
      title: "FibreUS Founded",
      description: "Established as an independent electronic security contractor"
    },
    {
      year: "2013", 
      title: "Expanded Services",
      description: "Added comprehensive fiber optic installation and maintenance"
    },
    {
      year: "2020",
      title: "Technology Focus",
      description: "Specialized in cloud-based surveillance and remote monitoring"
    },
    {
      year: "2024",
      title: "FibreUS Tech Services",
      description: "Rebranded to reflect our comprehensive security and fiber expertise"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              About {companyName}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Trusted Security & Fiber Partner
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {config?.aboutUs || "From our founding in 2008 as an independent security contractor to becoming a leading provider of comprehensive security solutions, we've been protecting what matters most."}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left Column - Story */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Our Story</h3>
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  {config?.aboutUs || "Since 2008, we've evolved from a small independent security contractor into a comprehensive electronic security solutions provider. Our journey began with a commitment to delivering reliable, cutting-edge security services for homes and businesses across the region."}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, {companyName} combines decades of experience with 
                  cutting-edge technology to deliver reliable, future-proof security 
                  and fiber optic systems that protect your most valuable assets.
                </p>
                
                {/* Key Services List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  {[
                    "Consulting & Design",
                    "Professional Installation", 
                    "System Integration",
                    "Maintenance & Support",
                    "24/7 Monitoring",
                    "Emergency Response"
                  ].map((service) => (
                    <div key={service} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Achievements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => {
                const IconComponent = achievement.icon;
                return (
                  <Card key={achievement.title} className="hover-elevate" data-testid={`card-achievement-${index}`}>
                    <CardContent className="p-6">
                      <div className="p-3 bg-primary/10 rounded-md w-fit mb-4">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold mb-2">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">Our Journey</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {milestones.map((milestone, index) => (
                <Card key={milestone.year} className="text-center hover-elevate" data-testid={`card-milestone-${index}`}>
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-primary mb-2">
                      {milestone.year}
                    </div>
                    <h4 className="font-semibold mb-2">{milestone.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
