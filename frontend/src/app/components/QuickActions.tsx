import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "./ui/dropdown-menu";
import { Plus, FileText, Users, DollarSign, Package, Calendar } from "lucide-react";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full shadow-xl w-14 h-14 lg:w-auto lg:h-auto lg:rounded-2xl z-30 bg-foreground hover:bg-foreground/90"
        >
          <Plus className="w-6 h-6 lg:mr-2" />
          <span className="hidden lg:inline">Quick Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("lead")}>
          <Users className="w-4 h-4 mr-2" />
          Add Lead
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("invoice")}>
          <FileText className="w-4 h-4 mr-2" />
          Create Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("expense")}>
          <DollarSign className="w-4 h-4 mr-2" />
          Log Expense
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("product")}>
          <Package className="w-4 h-4 mr-2" />
          Add Product
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("meeting")}>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Meeting
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}