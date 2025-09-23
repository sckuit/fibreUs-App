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
import { ArrowLeft, Plus, Building2, Shield, Camera, Phone, Settings, Edit, DollarSign, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

const statusOptions = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Admin update form schema
const adminUpdateSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  quotedAmount: z.string().optional(),
  adminNotes: z.string().optional(),
});

type AdminUpdateForm = z.infer<typeof adminUpdateSchema>;

function AdminUpdateDialog({ request, onSuccess }: { request: ServiceRequest; onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const form = useForm<AdminUpdateForm>({
    resolver: zodResolver(adminUpdateSchema),
    defaultValues: {
      status: request.status || 'pending',
      quotedAmount: request.quotedAmount || '',
      adminNotes: request.adminNotes || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AdminUpdateForm) => {
      const updateData = {
        status: data.status,
        adminNotes: data.adminNotes,
        ...(data.quotedAmount && { quotedAmount: parseFloat(data.quotedAmount) }),
      };
      
      return apiRequest('PUT', `/api/service-requests/${request.id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Request updated successfully",
        description: "The service request has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/admin'] });
      setOpen(false);
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminUpdateForm) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-edit-${request.id}`}>
          <Edit className="w-4 h-4 mr-1" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Service Request</DialogTitle>
          <DialogDescription>
            Update status, add notes, and set quoted amounts for this request.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-admin-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="quotedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quoted Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-quoted-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="adminNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Internal notes, updates, or instructions..."
                      rows={4}
                      {...field}
                      data-testid="textarea-admin-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel-update"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                data-testid="button-save-update"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
      return apiRequest('POST', '/api/service-requests', data);
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const { data: requests, isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ['/api/service-requests'],
  });

  // Filter and sort requests
  const filteredAndSortedRequests = requests ? requests
    .filter(request => statusFilter === 'all' || request.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        case 'oldest':
          return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
        default:
          return 0;
      }
    }) : [];

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
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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
            <div className="flex justify-between items-start mb-8">
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

            {/* Admin Controls */}
            {typedUser?.role === 'admin' && (
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Filter by Status:</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Sort by:</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32" data-testid="select-sort-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span data-testid="text-total-requests">
                    Total: {requests?.length || 0}
                  </span>
                  <span data-testid="text-filtered-requests">
                    Showing: {filteredAndSortedRequests.length}
                  </span>
                </div>
              </div>
            )}

            {/* Service Requests List */}
            <div className="space-y-4" data-testid="list-service-requests">
              {filteredAndSortedRequests && filteredAndSortedRequests.length > 0 ? (
                filteredAndSortedRequests.map((request) => {
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
                            <div className="flex items-center space-x-2">
                              <Badge 
                                className={statusColors[request.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
                                data-testid={`badge-status-${request.id}`}
                              >
                                {request.status?.replace('_', ' ') || 'pending'}
                              </Badge>
                              {request.priority && request.priority !== 'medium' && (
                                <Badge variant="outline" className="text-xs">
                                  {request.priority}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(request.createdAt || new Date()).toLocaleDateString()}
                            </span>
                            {typedUser?.role === 'admin' && (
                              <AdminUpdateDialog 
                                request={request} 
                                onSuccess={() => {}} 
                              />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {request.description && (
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {request.address && (
                            <div>
                              <strong className="text-foreground">Address:</strong>
                              <p className="text-muted-foreground">{request.address}</p>
                            </div>
                          )}
                          
                          {request.quotedAmount && (
                            <div>
                              <strong className="text-foreground">Quoted Amount:</strong>
                              <p className="text-muted-foreground">${Number(request.quotedAmount).toLocaleString()}</p>
                            </div>
                          )}
                        </div>

                        {typedUser?.role === 'admin' && request.adminNotes && (
                          <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                            <strong className="text-blue-900 text-sm">Admin Notes:</strong>
                            <p className="text-blue-800 text-sm mt-1">{request.adminNotes}</p>
                          </div>
                        )}
                      </CardContent>
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
      </div>
    </div>
  );
}