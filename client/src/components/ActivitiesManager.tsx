import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { Activity } from "@shared/schema";
import { exportToCSV } from "@/lib/exportUtils";

export default function ActivitiesManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) return activities;
    
    const lowerSearch = searchTerm.toLowerCase();
    return activities.filter((activity) => {
      const actionMatch = activity.action?.toLowerCase().includes(lowerSearch);
      const entityTypeMatch = activity.entityType?.toLowerCase().includes(lowerSearch);
      const entityNameMatch = activity.entityName?.toLowerCase().includes(lowerSearch);
      const detailsMatch = activity.details?.toLowerCase().includes(lowerSearch);
      const userIdMatch = activity.userId?.toLowerCase().includes(lowerSearch);
      
      return actionMatch || entityTypeMatch || entityNameMatch || detailsMatch || userIdMatch;
    });
  }, [activities, searchTerm]);

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startRecord = filteredActivities.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, filteredActivities.length);

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
          <CardTitle>System Activity Logs</CardTitle>
          <CardDescription>Track all system activities and changes for audit purposes</CardDescription>
        </div>
        <Button variant="outline" onClick={() => exportToCSV(activities, 'activities')} data-testid="button-export-activities">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search activities by action, entity, details, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-activities"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        ) : filteredActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {searchTerm ? "No activities found matching your search" : "No activities recorded yet"}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.map((activity) => (
                  <TableRow key={activity.id} data-testid={`row-activity-${activity.id}`}>
                    <TableCell className="whitespace-nowrap">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>{activity.userId || 'System'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`badge-action-${activity.id}`}>
                        {activity.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{activity.entityType}</span>
                        {activity.entityName && (
                          <span className="text-sm text-muted-foreground">{activity.entityName}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={activity.details || ''}>
                      {activity.details || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">
                Showing {startRecord}-{endRecord} of {filteredActivities.length} results
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
