import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { FinancialLog } from "@shared/schema";

export default function FinancialLogs() {
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
                {financialLogs.map((log) => (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
