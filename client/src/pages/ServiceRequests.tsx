import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User, ServiceRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Building2, Shield, Camera, Phone, Settings } from "lucide-react";

// Form validation schema
const serviceRequestSchema = z.object({
  serviceType: z.enum(['cctv', 'alarm', 'access_control', 'intercom', 'cloud_storage', 'monitoring', 'fiber_installation', 'maintenance']),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  propertyType: z.string().optional(),
  address: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

type ServiceRequestForm = z.infer<typeof serviceRequestSchema>;

const serviceTypeIcons = {
  cctv: Camera,
  alarm: Shield,
  access_control: Settings,
  intercom: Phone,
  cloud_storage: Building2,
  monitoring: Shield,
  fiber_installation: Building2,
  maintenance: Settings,
};

const serviceTypeLabels = {
  cctv: 'CCTV Systems',
  alarm: 'Alarm Systems',
  access_control: 'Access Control',
  intercom: 'Intercom Systems',
  cloud_storage: 'Cloud Storage',
  monitoring: 'Monitoring Services',
  fiber_installation: 'Fiber Installation',
  maintenance: 'Maintenance',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  scheduled: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

function ServiceRequestForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<ServiceRequestForm>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      serviceType: 'cctv',
      title: '',
      description: '',
      propertyType: '',
      address: '',
      priority: 'medium',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceRequestForm) => {
      return apiRequest('/api/service-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Request submitted successfully",
        description: "We'll review your request and get back to you soon.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/client'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to submit request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceRequestForm) => {
    createMutation.mutate(data);
  };

  return (
    <Card data-testid="card-service-request-form">
      <CardHeader>
        <CardTitle>New Service Request</CardTitle>
        <CardDescription>
          Tell us about your security or fiber needs and we'll provide a custom quote
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service-type">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(serviceTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Install 8-camera CCTV system for office building" 
                      {...field} 
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide details about your requirements, property size, specific needs, etc."
                      rows={4}
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Residential, Commercial, Industrial" 
                        {...field} 
                        data-testid="input-property-type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Full address for site survey" 
                        {...field} 
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onSuccess}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ServiceRequests() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  const [location, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(location.includes('action=new'));

  const { data: requests, isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ['/api/service-requests'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">FibreUS</h1>
            <nav className="flex space-x-4">
              <Link href="/" className="text-muted-foreground hover:text-blue-600" data-testid="link-dashboard">
                Dashboard
              </Link>
              <Link href="/requests" className="text-foreground hover:text-blue-600" data-testid="link-requests">
                Service Requests
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {typedUser?.firstName || typedUser?.email}
            </span>
            <Badge variant={typedUser?.role === 'admin' ? 'default' : 'secondary'} data-testid="badge-user-role">
              {typedUser?.role}
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showForm ? (
          <div>
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setLocation('/requests');
                }}
                className="mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Requests
              </Button>
            </div>
            <ServiceRequestForm onSuccess={() => {
              setShowForm(false);
              setLocation('/requests');
            }} />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Service Requests</h2>
                <p className="text-muted-foreground">
                  {typedUser?.role === 'admin' 
                    ? 'Manage all client service requests'
                    : 'View and track your service requests'
                  }
                </p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                data-testid="button-new-request"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>

            {/* Service Requests List */}
            <div className="space-y-4" data-testid="list-service-requests">
              {requests && requests.length > 0 ? (
                requests.map((request) => {
                  const IconComponent = serviceTypeIcons[request.serviceType as keyof typeof serviceTypeIcons];
                  return (
                    <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <IconComponent className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{request.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {serviceTypeLabels[request.serviceType as keyof typeof serviceTypeLabels]} • {request.propertyType}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge 
                              className={statusColors[request.status as keyof typeof statusColors]}
                              data-testid={`badge-status-${request.id}`}
                            >
                              {request.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      {request.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                          {request.address && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>Address:</strong> {request.address}
                            </p>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              ) : (
                <Card data-testid="card-no-requests">
                  <CardContent className="text-center py-12">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No service requests yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first service request to get started with FibreUS
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      data-testid="button-create-first-request"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Request
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}