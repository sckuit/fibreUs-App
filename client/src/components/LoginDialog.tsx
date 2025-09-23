import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight } from "lucide-react";

interface LoginDialogProps {
  children: React.ReactNode;
}

export default function LoginDialog({ children }: LoginDialogProps) {
  const [open, setOpen] = useState(false);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Sign In to FibreUS
          </DialogTitle>
          <DialogDescription>
            Access your security dashboard and manage your projects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="text-center py-4">
            <h3 className="text-lg font-semibold mb-2">Welcome Back</h3>
            <p className="text-muted-foreground">
              Sign in to access your security service dashboard, track projects, and manage your account.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 gap-3">
            <Card className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Project Tracking</h4>
                  <p className="text-xs text-muted-foreground">Monitor your security installations in real-time</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Service Requests</h4>
                  <p className="text-xs text-muted-foreground">Submit and track service requests easily</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Secure Access</h4>
                  <p className="text-xs text-muted-foreground">Your data is protected with enterprise security</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full"
              size="lg"
              data-testid="button-signin-replit"
            >
              <Shield className="w-4 h-4 mr-2" />
              Sign In with Replit
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy.
              New to FibreUS? Your account will be created automatically.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}