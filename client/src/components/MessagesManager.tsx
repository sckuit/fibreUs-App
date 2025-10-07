import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MapPin, Building, Calendar, Clock, Package, FileText } from "lucide-react";
import type { Inquiry } from "@shared/schema";

export default function MessagesManager() {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const updateInquiry = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Inquiry> }) => {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error("Failed to update inquiry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Status Updated",
        description: "Inquiry status has been updated successfully.",
      });
    },
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatServiceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    if (activeTab === "all") return true;
    if (activeTab === "quotes") return inquiry.type === "quote";
    if (activeTab === "appointments") return inquiry.type === "appointment";
    if (activeTab === "new") return inquiry.status === "new";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Messages & Inquiries
          </CardTitle>
          <CardDescription>
            Manage quote requests and appointment inquiries from potential clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all-messages">
                All ({inquiries.length})
              </TabsTrigger>
              <TabsTrigger value="new" data-testid="tab-new-messages">
                New ({inquiries.filter((i) => i.status === "new").length})
              </TabsTrigger>
              <TabsTrigger value="quotes" data-testid="tab-quotes">
                Quote Requests ({inquiries.filter((i) => i.type === "quote").length})
              </TabsTrigger>
              <TabsTrigger value="appointments" data-testid="tab-appointments">
                Appointments ({inquiries.filter((i) => i.type === "appointment").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredInquiries.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInquiries.map((inquiry) => (
                        <TableRow key={inquiry.id} data-testid={`row-inquiry-${inquiry.id}`}>
                          <TableCell>
                            <Badge variant="outline">
                              {inquiry.type === "quote" ? <FileText className="w-3 h-3 mr-1" /> : <Calendar className="w-3 h-3 mr-1" />}
                              {inquiry.type === "quote" ? "Quote" : "Appointment"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-name-${inquiry.id}`}>
                            {inquiry.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {inquiry.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {inquiry.phone}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatServiceType(inquiry.serviceType)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(inquiry.status || "new")}>
                              {inquiry.status || "new"}
                            </Badge>
                            {inquiry.urgency && inquiry.type === "quote" && (
                              <Badge className={`ml-2 ${getUrgencyColor(inquiry.urgency)}`}>
                                {inquiry.urgency}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(inquiry.createdAt!).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedInquiry(inquiry)}
                              data-testid={`button-view-${inquiry.id}`}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedInquiry && (
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedInquiry.type === "quote" ? <FileText className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                {selectedInquiry.type === "quote" ? "Quote Request" : "Appointment Request"}
              </DialogTitle>
              <DialogDescription>
                Submitted on {new Date(selectedInquiry.createdAt!).toLocaleDateString()} at{" "}
                {new Date(selectedInquiry.createdAt!).toLocaleTimeString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Status Update */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Status:</label>
                <Select
                  value={selectedInquiry.status || "new"}
                  onValueChange={(value) => {
                    updateInquiry.mutate({
                      id: selectedInquiry.id,
                      updates: { status: value },
                    });
                    setSelectedInquiry({ ...selectedInquiry, status: value });
                  }}
                >
                  <SelectTrigger className="w-40" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedInquiry.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedInquiry.phone}</span>
                  </div>
                  {selectedInquiry.company && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedInquiry.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedInquiry.address}</span>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-3">
                <h3 className="font-semibold">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatServiceType(selectedInquiry.serviceType)}</span>
                  </div>
                  {selectedInquiry.propertyType && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{selectedInquiry.propertyType}</span>
                    </div>
                  )}
                  {selectedInquiry.urgency && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Badge className={getUrgencyColor(selectedInquiry.urgency)}>
                        {selectedInquiry.urgency}
                      </Badge>
                    </div>
                  )}
                  {selectedInquiry.preferredDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(selectedInquiry.preferredDate).toLocaleDateString()} - {selectedInquiry.preferredTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description/Notes */}
              {selectedInquiry.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Project Description</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedInquiry.description}
                  </p>
                </div>
              )}

              {selectedInquiry.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Additional Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedInquiry.notes}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
