import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, registerSchema, type LoginType, type RegisterType } from "@shared/schema";
import { Shield, Mail, Lock, User, Building2 } from "lucide-react";

interface LoginDialogProps {
  children: React.ReactNode;
}

export default function LoginDialog({ children }: LoginDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Login form
  const loginForm = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      company: '',
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginType) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const result = await response.json();
      return result;
    },
    onSuccess: (data: any) => {
      const role = data?.user?.role || 'client';
      
      toast({
        title: "Welcome back!",
        description: "You've been successfully signed in.",
      });
      
      setOpen(false);
      
      // Use full page reload to ensure auth state is fresh
      window.location.href = `/portal/${role}`;
    },
    onError: (error: any) => {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterType) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      const result = await response.json();
      return result;
    },
    onSuccess: (data: any) => {
      const role = data?.user?.role || 'client';
      
      toast({
        title: "Account created!",
        description: "Welcome to FibreUS. You've been automatically signed in.",
      });
      
      setOpen(false);
      
      // Use full page reload to ensure auth state is fresh
      window.location.href = `/portal/${role}`;
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginType) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterType) => {
    registerMutation.mutate(data);
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
            {mode === 'login' ? 'Sign In to FibreUS' : 'Create Your Account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' 
              ? 'Access your security dashboard and manage your projects'
              : 'Join FibreUS to manage your security services'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Auth Mode Toggle */}
          <div className="flex justify-center">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={mode === 'login' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('login')}
                data-testid="button-switch-login"
              >
                Sign In
              </Button>
              <Button
                variant={mode === 'register' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('register')}
                data-testid="button-switch-register"
              >
                Register
              </Button>
            </div>
          </div>

          {/* Email/Password Forms */}
          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    data-testid="input-login-email"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    data-testid="input-login-password"
                    {...loginForm.register('password')}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="First name"
                      className="pl-10"
                      data-testid="input-register-firstname"
                      {...registerForm.register('firstName')}
                    />
                  </div>
                  {registerForm.formState.errors.firstName && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    data-testid="input-register-lastname"
                    {...registerForm.register('lastName')}
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    data-testid="input-register-email"
                    {...registerForm.register('email')}
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    className="pl-10"
                    data-testid="input-register-password"
                    {...registerForm.register('password')}
                  />
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    placeholder="Phone number"
                    data-testid="input-register-phone"
                    {...registerForm.register('phone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      placeholder="Company name"
                      className="pl-10"
                      data-testid="input-register-company"
                      {...registerForm.register('company')}
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          )}

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}