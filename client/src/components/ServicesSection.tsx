import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Shield, 
  Key, 
  Phone, 
  Cloud, 
  Monitor,
  ArrowRight,
  CheckCircle
} from "lucide-react";

import cctvImage from "@assets/generated_images/CCTV_installation_service_bd6e4d29.png";
import accessImage from "@assets/generated_images/Access_control_system_146c8a85.png";
import alarmImage from "@assets/generated_images/Alarm_system_panel_1ccf7e52.png";
import intercomImage from "@assets/generated_images/Intercom_system_22f24182.png";

export default function ServicesSection() {
  const services = [
    {
      icon: Camera,
      title: "CCTV Surveillance",
      description: "Professional IP camera installation and monitoring systems",
      image: cctvImage,
      features: ["4K HD Cameras", "Night Vision", "Remote Viewing", "Motion Detection"],
      pricing: "Starting at $299"
    },
    {
      icon: Shield,
      title: "Alarm Systems", 
      description: "Advanced intrusion detection and alert systems",
      image: alarmImage,
      features: ["24/7 Monitoring", "Mobile Alerts", "Smart Integration", "Battery Backup"],
      pricing: "Starting at $199"
    },
    {
      icon: Key,
      title: "Access Control",
      description: "Secure entry systems with keycard and biometric access",
      image: accessImage,
      features: ["Keycard Access", "Biometric Scanning", "Time Scheduling", "Audit Trails"],
      pricing: "Starting at $449"
    },
    {
      icon: Phone,
      title: "Intercom Systems",
      description: "Video and audio communication for secure building entry",
      image: intercomImage,
      features: ["Video Calling", "Remote Unlock", "Multi-Unit Support", "Mobile Integration"],
      pricing: "Starting at $179"
    },
    {
      icon: Cloud,
      title: "Cloud Storage",
      description: "Secure cloud-based surveillance data storage and backup",
      image: null,
      features: ["Encrypted Storage", "30-Day Retention", "Remote Access", "Automatic Backup"],
      pricing: "Starting at $29/month"
    },
    {
      icon: Monitor,
      title: "Remote Monitoring",
      description: "Professional 24/7 monitoring and rapid response services",
      image: null,
      features: ["24/7 Monitoring", "Instant Alerts", "Emergency Response", "Monthly Reports"],
      pricing: "Starting at $49/month"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Our Services
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comprehensive Security Solutions
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From installation to maintenance, we provide complete electronic security services 
            for residential and commercial properties with industry-leading technology.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card key={service.title} className="group hover-elevate cursor-pointer" data-testid={`card-service-${index}`}>
                {service.image && (
                  <div className="aspect-video overflow-hidden rounded-t-md">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className={service.image ? "pt-4" : ""}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {service.pricing}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full group" data-testid={`button-learn-more-${index}`}>
                    Learn More
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-card border rounded-lg p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Need a Custom Security Solution?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our security experts will design a tailored system that meets your specific needs and budget.
              Get a free consultation and quote today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" data-testid="button-custom-quote">
                Get Custom Quote
              </Button>
              <Button variant="outline" size="lg" data-testid="button-schedule-consultation">
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}