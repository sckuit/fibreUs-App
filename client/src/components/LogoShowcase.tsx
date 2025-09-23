import { Shield, Zap, Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import fiberOpticImage from "@assets/stock_images/fiber_optic_cables_n_b318453e.jpg";

// Logo Version 1: Enhanced Shield (keeping existing shield)
export function LogoVersion1() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Shield className="h-12 w-12 text-primary drop-shadow-lg" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-sm"></div>
      </div>
      <div>
        <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
          FibreUS
        </div>
        <div className="text-sm text-muted-foreground font-medium tracking-wide">
          ELECTRONIC SECURITY SERVICES
        </div>
      </div>
    </div>
  );
}

// Logo Version 2: Fiber Optic Network Design
export function LogoVersion2() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12">
        {/* Fiber optic inspired icon */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-2">
          <div className="relative h-full w-full">
            <Wifi className="h-full w-full text-white" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-1 w-1 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        {/* Light rays effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full opacity-30 blur-sm"></div>
      </div>
      <div>
        <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
          FibreUS
        </div>
        <div className="text-sm text-muted-foreground font-medium tracking-wide">
          FIBER • SECURITY • TECHNOLOGY
        </div>
      </div>
    </div>
  );
}

// Logo Version 3: Modern Geometric Design
export function LogoVersion3() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12">
        {/* Geometric design */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg rotate-45 transform"></div>
          <div className="absolute h-8 w-8 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-lg -rotate-12 transform"></div>
          <div className="absolute h-6 w-6 bg-gradient-to-bl from-orange-400 to-red-500 rounded-lg rotate-12 transform"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-lg blur-md"></div>
      </div>
      <div>
        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
          FibreUS
        </div>
        <div className="text-sm text-muted-foreground font-medium tracking-wide">
          INNOVATIVE SECURITY SOLUTIONS
        </div>
      </div>
    </div>
  );
}

// Main showcase component
export default function LogoShowcase() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">FibreUS Logo Concepts</h1>
        <p className="text-muted-foreground text-lg">
          Three creative logo variations for your security services platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Version 1: Enhanced Shield */}
        <Card className="p-6 hover-elevate">
          <CardHeader>
            <CardTitle className="text-xl">Version 1: Enhanced Shield</CardTitle>
            <CardDescription>
              Maintains the trusted shield icon with golden script typography inspired by your reference
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LogoVersion1 />
          </CardContent>
        </Card>

        {/* Version 2: Fiber Optic Network */}
        <Card className="p-6 hover-elevate">
          <CardHeader>
            <CardTitle className="text-xl">Version 2: Fiber Network</CardTitle>
            <CardDescription>
              Modern fiber optic theme with network connectivity and technology focus
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LogoVersion2 />
          </CardContent>
        </Card>

        {/* Version 3: Modern Geometric */}
        <Card className="p-6 hover-elevate">
          <CardHeader>
            <CardTitle className="text-xl">Version 3: Modern Geometric</CardTitle>
            <CardDescription>
              Contemporary abstract design with dynamic geometric elements and vibrant gradients
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LogoVersion3 />
          </CardContent>
        </Card>
      </div>

      {/* Dark background showcase */}
      <div className="bg-slate-900 rounded-xl p-8 space-y-8">
        <h2 className="text-2xl font-bold text-white text-center">Dark Background Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex justify-center py-8">
            <LogoVersion1 />
          </div>
          <div className="flex justify-center py-8">
            <LogoVersion2 />
          </div>
          <div className="flex justify-center py-8">
            <LogoVersion3 />
          </div>
        </div>
      </div>

      {/* Usage recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Enhanced Shield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Perfect for maintaining brand recognition</li>
              <li>• Great for official documents and letterheads</li>
              <li>• Conveys trust and security</li>
              <li>• Works well in both light and dark themes</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wifi className="h-5 w-5 text-blue-500" />
              Fiber Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Emphasizes fiber optic services</li>
              <li>• Modern tech-forward appearance</li>
              <li>• Great for digital platforms</li>
              <li>• Appeals to tech-savvy clients</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Modern Geometric
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Contemporary and innovative feel</li>
              <li>• Stands out from competitors</li>
              <li>• Perfect for marketing materials</li>
              <li>• Appeals to modern businesses</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}