import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Users, 
  Globe, 
  Monitor, 
  TrendingUp,
  Eye,
  Calendar,
  MapPin
} from "lucide-react";
import type { User, Visitor } from "@shared/schema";

interface VisitorAnalytics {
  totalVisitors: number;
  uniqueVisitors: number;
  topReferrers: { referrer: string; count: number }[];
  topLandingPages: { landingPage: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topBrowsers: { browser: string; count: number }[];
  visitorsByDate: { date: string; count: number }[];
}

export default function Analytics() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  
  // Fetch visitor analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<VisitorAnalytics>({
    queryKey: ['/api/analytics/visitors'],
    enabled: !!typedUser && (typedUser.role === 'admin' || typedUser.role === 'manager'),
  });

  // Fetch recent visitors
  const { data: recentVisitors, isLoading: visitorsLoading } = useQuery<Visitor[]>({
    queryKey: ['/api/analytics/recent-visitors'],
    enabled: !!typedUser && (typedUser.role === 'admin' || typedUser.role === 'manager'),
  });

  if (analyticsLoading || visitorsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Check if user has permission to view analytics
  if (!typedUser || (typedUser.role !== 'admin' && typedUser.role !== 'manager')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <BarChart className="w-8 h-8 mr-3 text-blue-600" />
            Visitor Analytics
          </h2>
          <p className="text-muted-foreground">
            Track website visitors and marketing performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-visitors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                <Eye className="w-4 h-4 mr-2 text-blue-600" />
                Total Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-visitors">
                {analytics?.totalVisitors || 0}
              </div>
              <p className="text-xs text-muted-foreground">All time visits</p>
            </CardContent>
          </Card>

          <Card data-testid="card-unique-visitors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                <Users className="w-4 h-4 mr-2 text-green-600" />
                Unique Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-unique-visitors">
                {analytics?.uniqueVisitors || 0}
              </div>
              <p className="text-xs text-muted-foreground">Unique sessions</p>
            </CardContent>
          </Card>

          <Card data-testid="card-top-country">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                Top Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold" data-testid="text-top-country">
                {analytics?.topCountries?.[0]?.country || 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.topCountries?.[0]?.count || 0} visits
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-top-browser">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                <Monitor className="w-4 h-4 mr-2 text-orange-600" />
                Top Browser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold" data-testid="text-top-browser">
                {analytics?.topBrowsers?.[0]?.browser || 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.topBrowsers?.[0]?.count || 0} users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Referrers */}
          <Card data-testid="card-top-referrers">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Top Referrers
              </CardTitle>
              <CardDescription>Traffic sources bringing visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topReferrers?.slice(0, 5).map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between" data-testid={`row-referrer-${index}`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {referrer.referrer === 'Direct' ? 'Direct Traffic' : referrer.referrer}
                      </p>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-referrer-count-${index}`}>
                      {referrer.count}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No referrer data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Landing Pages */}
          <Card data-testid="card-top-landing-pages">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-green-600" />
                Top Landing Pages
              </CardTitle>
              <CardDescription>Most popular entry points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topLandingPages?.slice(0, 5).map((page, index) => (
                  <div key={index} className="flex items-center justify-between" data-testid={`row-landing-page-${index}`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {page.landingPage || '/'}
                      </p>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-page-count-${index}`}>
                      {page.count}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No landing page data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Countries */}
          <Card data-testid="card-countries">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                Top Countries
              </CardTitle>
              <CardDescription>Visitor geographic distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topCountries?.slice(0, 5).map((country, index) => (
                  <div key={index} className="flex items-center justify-between" data-testid={`row-country-${index}`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {country.country}
                      </p>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-country-count-${index}`}>
                      {country.count}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No country data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Browsers */}
          <Card data-testid="card-browsers">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-orange-600" />
                Top Browsers
              </CardTitle>
              <CardDescription>Browser preferences of visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topBrowsers?.slice(0, 5).map((browser, index) => (
                  <div key={index} className="flex items-center justify-between" data-testid={`row-browser-${index}`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {browser.browser}
                      </p>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-browser-count-${index}`}>
                      {browser.count}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No browser data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Visitors */}
        <Card data-testid="card-recent-visitors">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Recent Visitors
            </CardTitle>
            <CardDescription>Latest visitor activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVisitors?.slice(0, 10).map((visitor, index) => (
                <div key={visitor.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`row-recent-visitor-${index}`}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium" data-testid={`text-visitor-country-${index}`}>
                          {visitor.country || 'Unknown'} • {visitor.browser || 'Unknown Browser'}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-visitor-page-${index}`}>
                          Landing: {visitor.landingPage || '/'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground" data-testid={`text-visitor-time-${index}`}>
                      {visitor.visitedAt ? new Date(visitor.visitedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {visitor.device || 'Unknown Device'}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No recent visitor data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}