import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import ScheduleAppointmentDialog from "@/components/ScheduleAppointmentDialog";
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
  const [selectedService, setSelectedService] = useState<number | null>(null);

  const services = [
    {
      icon: Camera,
      title: "CCTV Surveillance",
      description: "Professional IP camera installation and monitoring systems",
      image: cctvImage,
      features: ["4K HD Cameras", "Night Vision", "Remote Viewing", "Motion Detection"],
      pricing: "Starting at $299",
      detailedInfo: {
        overview: "Our CCTV surveillance systems provide comprehensive video monitoring solutions for residential and commercial properties. We specialize in IP-based camera systems that offer superior image quality, remote access, and intelligent analytics.",
        benefits: [
          "Crystal-clear 4K Ultra HD video resolution for maximum detail",
          "Advanced night vision with infrared technology up to 100ft",
          "Mobile app access for real-time viewing from anywhere",
          "AI-powered motion detection with customizable zones",
          "Weatherproof cameras rated for extreme conditions",
          "Scalable systems from 4 to 128+ cameras"
        ],
        applications: [
          "Retail stores and shopping centers",
          "Office buildings and corporate campuses",
          "Warehouses and industrial facilities",
          "Residential homes and apartment complexes",
          "Parking lots and garages",
          "Schools and educational institutions"
        ],
        process: "Our installation process begins with a site survey to assess your property and security needs. We design a camera placement plan, install high-quality equipment, configure your network, and provide comprehensive training on system operation."
      }
    },
    {
      icon: Shield,
      title: "Alarm Systems", 
      description: "Advanced intrusion detection and alert systems",
      image: alarmImage,
      features: ["24/7 Monitoring", "Mobile Alerts", "Smart Integration", "Battery Backup"],
      pricing: "Starting at $199",
      detailedInfo: {
        overview: "Protect your property with state-of-the-art intrusion detection systems. Our alarm solutions combine door/window sensors, motion detectors, glass break sensors, and professional monitoring to provide comprehensive security coverage.",
        benefits: [
          "Instant mobile notifications for any security events",
          "Professional 24/7 monitoring with rapid police dispatch",
          "Smart home integration with Alexa, Google Home, and more",
          "Battery backup ensures protection during power outages",
          "Wireless sensors for easy installation and flexibility",
          "User-friendly control panels with touchscreen displays"
        ],
        applications: [
          "Single-family homes and estates",
          "Multi-unit residential buildings",
          "Retail and commercial properties",
          "Medical facilities and pharmacies",
          "Banks and financial institutions",
          "Museums and high-value storage"
        ],
        process: "We start with a security assessment to identify vulnerable entry points. Then we install door/window contacts, motion sensors, and control panels. Finally, we connect to our monitoring center and train you on arming/disarming procedures."
      }
    },
    {
      icon: Key,
      title: "Access Control",
      description: "Secure entry systems with keycard and biometric access",
      image: accessImage,
      features: ["Keycard Access", "Biometric Scanning", "Time Scheduling", "Audit Trails"],
      pricing: "Starting at $449",
      detailedInfo: {
        overview: "Take complete control of who enters your facility and when with our advanced access control systems. From basic keycard systems to sophisticated biometric authentication, we provide solutions that balance security with convenience.",
        benefits: [
          "Eliminate the costs and risks of traditional keys",
          "Fingerprint and facial recognition for maximum security",
          "Schedule access by time, day, or user credentials",
          "Complete audit trails track all entry and exit events",
          "Remote management through cloud-based platforms",
          "Integration with HR systems for automated provisioning"
        ],
        applications: [
          "Corporate office buildings",
          "Healthcare facilities and hospitals",
          "Data centers and server rooms",
          "Manufacturing plants and laboratories",
          "Gyms and fitness centers",
          "Government and military facilities"
        ],
        process: "We design your access control architecture, install card readers or biometric devices at entry points, configure user permissions and schedules, and integrate with your existing systems. Ongoing support includes credential management and system updates."
      }
    },
    {
      icon: Phone,
      title: "Intercom Systems",
      description: "Video and audio communication for secure building entry",
      image: intercomImage,
      features: ["Video Calling", "Remote Unlock", "Multi-Unit Support", "Mobile Integration"],
      pricing: "Starting at $179",
      detailedInfo: {
        overview: "Modern intercom systems provide secure two-way communication and remote access control for buildings and facilities. Our video intercoms allow you to see and speak with visitors before granting entry, whether you're on-site or miles away.",
        benefits: [
          "HD video allows clear identification of visitors",
          "Two-way audio communication with noise cancellation",
          "Unlock doors remotely from your smartphone",
          "Support for multi-tenant buildings with directory",
          "Integration with existing access control systems",
          "Call forwarding to multiple devices"
        ],
        applications: [
          "Apartment buildings and condominiums",
          "Gated communities and HOAs",
          "Office buildings with multiple suites",
          "Medical and dental practices",
          "Senior living facilities",
          "Commercial buildings and business parks"
        ],
        process: "We install outdoor stations at entry points, indoor monitors or mobile apps for residents, and configure the directory and calling features. For multi-unit buildings, we set up individual tenant accounts with customized settings."
      }
    },
    {
      icon: Cloud,
      title: "Cloud Storage",
      description: "Secure cloud-based surveillance data storage and backup",
      image: null,
      features: ["Encrypted Storage", "30-Day Retention", "Remote Access", "Automatic Backup"],
      pricing: "Starting at $29/month",
      detailedInfo: {
        overview: "Never lose critical security footage again with our secure cloud storage solutions. Automatically back up all camera recordings to encrypted cloud servers with configurable retention periods and instant remote access from any device.",
        benefits: [
          "Bank-level encryption protects your video data",
          "Automatic uploads ensure no footage is lost",
          "Access recordings from anywhere via web or mobile app",
          "Configurable retention from 7 to 365 days",
          "Redundant storage across multiple data centers",
          "Intelligent search and retrieval by date, time, or event"
        ],
        applications: [
          "Businesses requiring long-term video retention",
          "Properties without on-site server infrastructure",
          "Multi-location organizations",
          "Compliance-driven industries (retail, healthcare)",
          "Remote or unmanned facilities",
          "Disaster recovery and business continuity"
        ],
        process: "We configure your cameras to automatically upload to our secure cloud platform. You receive login credentials to access your footage anytime. Our team manages all server maintenance, updates, and security patches."
      }
    },
    {
      icon: Monitor,
      title: "Remote Monitoring",
      description: "Professional 24/7 monitoring and rapid response services",
      image: null,
      features: ["24/7 Monitoring", "Instant Alerts", "Emergency Response", "Monthly Reports"],
      pricing: "Starting at $49/month",
      detailedInfo: {
        overview: "Our professional monitoring center watches over your property 24/7/365, providing rapid response to security events, fire alarms, and emergency situations. Trained security professionals verify alerts and dispatch appropriate authorities when needed.",
        benefits: [
          "Round-the-clock surveillance by certified operators",
          "Faster emergency response than self-monitoring",
          "Reduced false alarm rates through video verification",
          "Direct communication with local police and fire",
          "Detailed incident reports and monthly summaries",
          "May qualify for insurance premium discounts"
        ],
        applications: [
          "High-value retail and jewelry stores",
          "Pharmacies and medical facilities",
          "Banks and financial services",
          "Manufacturing and warehouses",
          "Vacation homes and rental properties",
          "Critical infrastructure and utilities"
        ],
        process: "We connect your security system to our UL-listed monitoring center. When an alarm triggers, our operators view live video, assess the situation, and contact you or dispatch authorities. You receive detailed reports of all monitored events."
      }
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
                  <Button 
                    variant="outline" 
                    className="w-full group" 
                    data-testid={`button-learn-more-${index}`}
                    onClick={() => setSelectedService(index)}
                  >
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
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-custom-quote">
                  Get Custom Quote
                </Button>
              </GetQuoteDialog>
              <ScheduleAppointmentDialog>
                <Button variant="outline" size="lg" data-testid="button-schedule-consultation">
                  Schedule Consultation
                </Button>
              </ScheduleAppointmentDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedService !== null && (
        <Dialog open={selectedService !== null} onOpenChange={(isOpen) => !isOpen && setSelectedService(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-md">
                  {(() => {
                    const IconComponent = services[selectedService].icon;
                    return <IconComponent className="h-6 w-6 text-primary" />;
                  })()}
                </div>
                <Badge variant="secondary">
                  {services[selectedService].pricing}
                </Badge>
              </div>
              <DialogTitle className="text-2xl">{services[selectedService].title}</DialogTitle>
              <DialogDescription className="text-base">
                {services[selectedService].description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Overview</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {services[selectedService].detailedInfo.overview}
                </p>
              </div>

              {/* Key Benefits */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Key Benefits</h3>
                <ul className="space-y-2">
                  {services[selectedService].detailedInfo.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Applications */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Ideal Applications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services[selectedService].detailedInfo.applications.map((app, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{app}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Process */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Our Process</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {services[selectedService].detailedInfo.process}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <GetQuoteDialog>
                  <Button className="flex-1" data-testid="button-get-quote-modal">
                    Get Free Quote
                  </Button>
                </GetQuoteDialog>
                <ScheduleAppointmentDialog>
                  <Button variant="outline" className="flex-1" data-testid="button-schedule-modal">
                    Schedule Consultation
                  </Button>
                </ScheduleAppointmentDialog>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}