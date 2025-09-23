import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Star, Award } from "lucide-react";
import heroImage from "@assets/generated_images/Security_control_room_hero_22c35e0c.png";

export default function Hero() {
  const stats = [
    { label: "Years Experience", value: "15+" },
    { label: "Clients Protected", value: "500+" },
    { label: "Projects Completed", value: "1,200+" },
    { label: "Response Time", value: "< 30min" },
  ];

  const certifications = [
    "Licensed & Insured",
    "UL Listed Equipment", 
    "FCC Certified",
    "NFPA Compliant"
  ];

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Professional security control room" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl text-white">
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              <Award className="h-3 w-3 mr-1" />
              Industry Leader
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              <Star className="h-3 w-3 mr-1" />
              24/7 Support
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              <Shield className="h-3 w-3 mr-1" />
              Licensed & Insured
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Professional 
            <span className="text-blue-400"> Electronic Security</span> Solutions
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
            Protecting your business and home with cutting-edge CCTV, alarm systems, 
            access control, and surveillance technology. Expert installation, maintenance, 
            and 24/7 monitoring services.
          </p>

          {/* Certifications */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {certifications.map((cert) => (
              <div key={cert} className="flex items-center gap-2 text-sm text-gray-200">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span>{cert}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              data-testid="button-free-consultation"
            >
              Get Free Consultation
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
              data-testid="button-view-services"
            >
              View Our Services
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
              data-testid="button-emergency-service"
            >
              Emergency Service
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}