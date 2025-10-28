import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Users, TrendingUp, Award, Copy, CheckCircle, XCircle, Gift } from "lucide-react";
import type { ReferralCode, Referral } from "@shared/schema";

export default function ReferralTracker() {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: referralCodes = [], isLoading: codesLoading } = useQuery<ReferralCode[]>({
    queryKey: ["/api/referral-codes"],
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  const { data: stats } = useQuery<{totalReferrals: number, converted: number, totalRewards: string}>({
    queryKey: ["/api/referral-stats"],
  });

  const generateCodeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/referral-codes", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-codes"] });
      toast({
        title: "Referral Code Generated",
        description: "Your new referral code is ready to share!",
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to generate referral code", 
        variant: "destructive" 
      });
    },
  });

  const toggleCodeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) =>
      apiRequest("PATCH", `/api/referral-codes/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-codes"] });
      toast({
        title: "Code Updated",
        description: "Referral code status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update code", 
        variant: "destructive" 
      });
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'qualified':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">People you've referred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.converted || 0}</div>
            <p className="text-xs text-muted-foreground">Became clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRewards || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Rewards earned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="codes" data-testid="tab-referral-codes">
            <Share2 className="w-4 h-4 mr-2" />
            My Codes
          </TabsTrigger>
          <TabsTrigger value="referrals" data-testid="tab-active-referrals">
            <Users className="w-4 h-4 mr-2" />
            Active Referrals
            {referrals.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {referrals.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Referral Codes</CardTitle>
                <CardDescription>Share these codes to refer new clients</CardDescription>
              </div>
              <Button 
                onClick={() => generateCodeMutation.mutate()}
                disabled={generateCodeMutation.isPending}
                data-testid="button-generate-code"
              >
                <Gift className="w-4 h-4 mr-2" />
                Generate New Code
              </Button>
            </CardHeader>
            <CardContent>
              {codesLoading ? (
                <p className="text-sm text-muted-foreground">Loading codes...</p>
              ) : referralCodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No referral codes yet. Generate one to start referring!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralCodes.map((code) => (
                      <TableRow key={code.id} data-testid={`row-code-${code.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-muted rounded font-mono text-sm">
                              {code.code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(code.code)}
                              data-testid={`button-copy-${code.id}`}
                            >
                              {copiedCode === code.code ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={code.isActive ? "default" : "secondary"}>
                            {code.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {code.createdAt ? new Date(code.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCodeMutation.mutate({ 
                              id: code.id, 
                              isActive: !code.isActive 
                            })}
                            disabled={toggleCodeMutation.isPending}
                            data-testid={`button-toggle-${code.id}`}
                          >
                            {code.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Referrals</CardTitle>
              <CardDescription>People who used your referral codes</CardDescription>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <p className="text-sm text-muted-foreground">Loading referrals...</p>
              ) : referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No referrals yet. Share your code to start!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id} data-testid={`row-referral-${referral.id}`}>
                        <TableCell className="font-medium">{referral.referredName}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>{referral.referredEmail}</div>
                            {referral.referredPhone && (
                              <div className="text-muted-foreground">{referral.referredPhone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{referral.referredCompany || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(referral.status)}>
                            {referral.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {referral.rewardAmount && parseFloat(referral.rewardAmount) > 0 ? (
                            <span className="font-medium text-green-600">
                              ${parseFloat(referral.rewardAmount).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
