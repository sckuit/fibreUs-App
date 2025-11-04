import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, TrendingUp, TrendingDown, DollarSign, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { FinancialLog } from "@shared/schema";

export default function FinancialLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: logs = [], isLoading } = useQuery<FinancialLog[]>({
    queryKey: ["/api/financial-logs"],
  });

  // Filter for expense and revenue related logs
  const financialLogs = logs.filter(log =>
    log.entityType === 'expense' ||
    log.entityType === 'revenue' ||
    log.logType === 'inventory_purchase' ||
    log.logType === 'inventory_sale'
  );

  const getLogIcon = (logType: string) => {
    switch (logType) {
      case "inventory_purchase":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "inventory_sale":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogTypeLabel = (logType: string) => {
    switch (logType) {
      case "inventory_purchase":
        return "Purchase";
      case "inventory_sale":
        return "Sale";
      default:
        return logType.replace(/_/g, " ");
    }
  };

  const formatAmount = (value?: string | null) => {
    if (!value) return "-";
    const num = Number(value);
    return isNaN(num) ? "-" : `$${num.toFixed(2)}`;
  };

  // Filter logs based on search term
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return financialLogs;
    
    const searchLower = searchTerm.toLowerCase();
    return financialLogs.filter((log) => {
      const logTypeLabel = getLogTypeLabel(log.logType);
      
      return (
        logTypeLabel.toLowerCase().includes(searchLower) ||
        log.description.toLowerCase().includes(searchLower) ||
        (log.previousValue ?? "").toLowerCase().includes(searchLower) ||
        (log.newValue ?? "").toLowerCase().includes(searchLower) ||
        (log.performedBy ?? "").toLowerCase().includes(searchLower)
      );
    });
  }, [financialLogs, searchTerm]);

  // Paginate filtered logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Financial Activity Logs
        </CardTitle>
        <CardDescription>
          Read-only audit trail of all expense and revenue transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search financial logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-financial-logs"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading financial logs...</p>
        ) : financialLogs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-4 h-4 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No financial activity logged yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Logs will appear here when expenses or revenue are created or updated
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No logs match your search</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Previous Value</TableHead>
                  <TableHead>New Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                    <TableCell>{getLogIcon(log.logType)}</TableCell>
                    <TableCell className="whitespace-nowrap" data-testid={`text-log-timestamp-${log.id}`}>
                      {log.createdAt ? format(new Date(log.createdAt), "MMM dd, yyyy HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize" data-testid={`badge-log-type-${log.id}`}>
                        {getLogTypeLabel(log.logType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md" data-testid={`text-log-description-${log.id}`}>
                      {log.description}
                    </TableCell>
                    <TableCell data-testid={`text-log-previous-${log.id}`}>
                      {formatAmount(log.previousValue)}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-log-new-${log.id}`}>
                      {formatAmount(log.newValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} results
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20" data-testid="select-items-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
