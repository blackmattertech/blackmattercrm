import { ReactNode } from "react";
import { Card } from "./ui/card";
import { cn } from "./ui/utils";

interface Column {
  header: string;
  accessor: string;
  cell?: (value: any, row: any) => ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  className?: string;
}

export function DataTable({ columns, data, onRowClick, className }: DataTableProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "p-4 text-left text-sm font-medium text-muted-foreground",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-sm text-muted-foreground">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b last:border-0",
                    onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors"
                  )}
                >
                  {columns.map((column, colIdx) => {
                    const value = row[column.accessor];
                    return (
                      <td key={colIdx} className={cn("p-4", column.className)}>
                        {column.cell ? column.cell(value, row) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
