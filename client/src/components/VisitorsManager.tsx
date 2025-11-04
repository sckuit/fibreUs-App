import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { Visitor } from "@shared/schema";
import { exportToCSV } from "@/lib/exportUtils";

export default function VisitorsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/analytics/recent-visitors"],
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredVisitors = useMemo(() => {
    if (!searchTerm.trim()) return visitors;
    
    const lowerSearch = searchTerm.toLowerCase();
    return visitors.filter((visitor) => {
      const ipMatch = visitor.ipAddress?.toLowerCase().includes(lowerSearch);
      const userAgentMatch = visitor.userAgent?.toLowerCase().includes(lowerSearch);
      const referrerMatch = visitor.referrer?.toLowerCase().includes(lowerSearch);
      const landingPageMatch = visitor.landingPage?.toLowerCase().includes(lowerSearch);
      const countryMatch = visitor.country?.toLowerCase().includes(lowerSearch);
      const cityMatch = visitor.city?.toLowerCase().includes(lowerSearch);
      const browserMatch = visitor.browser?.toLowerCase().includes(lowerSearch);
      const deviceMatch = visitor.device?.toLowerCase().includes(lowerSearch);
      
      return ipMatch || userAgentMatch || referrerMatch || landingPageMatch || 
             countryMatch || cityMatch || browserMatch || deviceMatch;
    });
  }, [visitors, searchTerm]);

  const paginatedVisitors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVisitors.slice(startIndex, endIndex);
  }, [filteredVisitors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  const startRecord = filteredVisitors.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, filteredVisitors.length);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-4">
        <div>
          <CardTitle>Visitor Analytics</CardTitle>
          <CardDescription>Recent visitor activity and tracking data</CardDescription>
        </div>
        <Button variant="outline" onClick={() => exportToCSV(visitors, 'visitors')} data-testid="button-export-visitors">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search visitors by IP, user agent, referrer, page, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-visitors"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading visitors...</p>
        ) : filteredVisitors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {searchTerm ? "No visitors found matching your search" : "No visitor data available"}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device/Browser</TableHead>
                  <TableHead>Landing Page</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVisitors.map((visitor) => (
                  <TableRow key={visitor.id} data-testid={`row-visitor-${visitor.id}`}>
                    <TableCell className="font-mono">{visitor.ipAddress || '-'}</TableCell>
                    <TableCell>
                      {visitor.city && visitor.country 
                        ? `${visitor.city}, ${visitor.country}`
                        : visitor.country || visitor.city || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {visitor.device && <span className="text-sm capitalize">{visitor.device}</span>}
                        {visitor.browser && <span className="text-xs text-muted-foreground">{visitor.browser}</span>}
                        {!visitor.device && !visitor.browser && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={visitor.landingPage || ''}>
                      {visitor.landingPage || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={visitor.referrer || ''}>
                      {visitor.referrer || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {visitor.visitedAt ? new Date(visitor.visitedAt).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">
                Showing {startRecord}-{endRecord} of {filteredVisitors.length} results
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32" data-testid="select-items-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
