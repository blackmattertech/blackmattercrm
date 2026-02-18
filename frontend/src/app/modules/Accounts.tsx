import { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { MetricCard } from "../components/MetricCard";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { DollarSign, FileText, TrendingUp, TrendingDown, Download, Eye, Send, ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { formatINR, formatINRCompact, formatDate } from "../utils/formatters";
import { accountsApi } from "../../lib/api";
import { Loader2 } from "lucide-react";

interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue" | "draft";
  dueDate: string;
  issueDate: string;
  service?: string;
}

interface Expense {
  id: string;
  category: string;
  party: string;
  amount: number;
  date: string;
  status: "paid" | "pending";
  description?: string;
}

interface ReportDetail {
  date: string;
  client: string;
  service: string;
  amount: number;
}

export function Accounts() {
  const [selectedTab, setSelectedTab] = useState("invoices");
  const [currentView, setCurrentView] = useState<"main" | "income" | "cashflow" | "trial" | "capital" | "new-invoice" | "new-receipt" | "new-payment" | "new-expense">("main");
  const [selectedDirector, setSelectedDirector] = useState<string | null>(null);
  const [directors, setDirectors] = useState<any[]>([]);
  const [directorsLoading, setDirectorsLoading] = useState(false);

  // Empty arrays - will be populated from API when accounts endpoints are implemented
  const invoices: Invoice[] = [];
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const incomeDetails: ReportDetail[] = [];

  // Load directors on mount
  useEffect(() => {
    loadDirectors();
  }, []);

  const loadDirectors = async () => {
    setDirectorsLoading(true);
    try {
      const response = await accountsApi.getDirectors();
      if (response.success && response.data) {
        setDirectors(response.data);
      }
    } catch (error) {
      console.error('Failed to load directors:', error);
    } finally {
      setDirectorsLoading(false);
    }
  };

  const expenseDetails = expenses.filter(e => e.status === "paid");

  const trialBalanceData = [
    { account: "Cash in Hand", drAmount: 25000, crAmount: 0, group: "Assets" },
    { account: "Bank Account - HDFC", drAmount: 184360, crAmount: 0, group: "Assets" },
    { account: "Sundry Debtors", drAmount: 117000, crAmount: 0, group: "Assets" },
    { account: "Office Equipment", drAmount: 50000, crAmount: 0, group: "Assets" },
    { account: "Sundry Creditors", drAmount: 0, crAmount: 15000, group: "Liabilities" },
    { account: "Outstanding Expenses", drAmount: 0, crAmount: 8500, group: "Liabilities" },
    // Director capital accounts will be dynamically generated from directors data
    { account: "Service Revenue", drAmount: 0, crAmount: 332000, group: "Income" },
    { account: "Consulting Income", drAmount: 0, crAmount: 45000, group: "Income" },
    { account: "Salary & Wages", drAmount: 125000, crAmount: 0, group: "Expenses" },
    { account: "Marketing Expenses", drAmount: 24000, crAmount: 0, group: "Expenses" },
    { account: "Software Expenses", drAmount: 5990, crAmount: 0, group: "Expenses" },
    { account: "Infrastructure Costs", drAmount: 12500, crAmount: 0, group: "Expenses" },
    { account: "Office Expenses", drAmount: 3400, crAmount: 0, group: "Expenses" },
    { account: "Professional Fees", drAmount: 8250, crAmount: 0, group: "Expenses" },
  ];

  // Calculate totals from actual data
  const totalDr = trialBalanceData.reduce((sum, item) => sum + item.drAmount, 0);
  const totalCr = trialBalanceData.reduce((sum, item) => sum + item.crAmount, 0);
  const totalRevenue = incomeDetails.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseDetails.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  // Calculate stats for metric cards
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').length;
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidAmount = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
  const totalExpenseAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Empty arrays - will be populated from API when accounts endpoints are implemented
  const cashInflows: any[] = [];
  const cashOutflows: any[] = [];
  
  const openingBalance = 0;
  const totalCashIn = cashInflows.reduce((sum, item) => sum + item.amount, 0);
  const totalCashOut = cashOutflows.reduce((sum, item) => sum + item.amount, 0);
  const closingBalance = openingBalance + totalCashIn - totalCashOut;

  // Directors are loaded from API via useEffect

  const calculateDirectorBalance = (director: any) => {
    const additionalCapitalTotal = (director.additionalCapital || []).reduce((sum: number, item: any) => sum + item.amount, 0);
    const drawingsTotal = (director.drawings || []).reduce((sum: number, item: any) => sum + item.amount, 0);
    return (director.openingCapital || 0) + additionalCapitalTotal - drawingsTotal;
  };

  // Full-page Income Statement View
  if (currentView === "income") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Income Statement</h1>
                  <p className="text-sm text-muted-foreground">Detailed profit & loss report</p>
                </div>
              </div>
              <Button className="rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full space-y-6">
            <div>
              <h3 className="font-medium text-lg mb-3 pb-2 border-b-2 border-primary">Income</h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium">Date</th>
                      <th className="p-4 text-left text-sm font-medium">Client</th>
                      <th className="p-4 text-left text-sm font-medium">Service/Product</th>
                      <th className="p-4 text-right text-sm font-medium">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeDetails.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-sm">{item.date}</td>
                        <td className="p-4 text-sm">{item.client}</td>
                        <td className="p-4 text-sm text-muted-foreground">{item.service}</td>
                        <td className="p-4 text-sm text-right font-medium">{formatINR(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30 font-semibold">
                      <td colSpan={3} className="p-4 text-sm">Total Income</td>
                      <td className="p-4 text-sm text-right">{formatINR(totalRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-3 pb-2 border-b-2 border-destructive">Expenses</h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium">Date</th>
                      <th className="p-4 text-left text-sm font-medium">Category</th>
                      <th className="p-4 text-left text-sm font-medium">Description</th>
                      <th className="p-4 text-right text-sm font-medium">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseDetails.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-sm">{formatDate(item.date)}</td>
                        <td className="p-4 text-sm">{item.category}</td>
                        <td className="p-4 text-sm text-muted-foreground">{item.description}</td>
                        <td className="p-4 text-sm text-right font-medium">{formatINR(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30 font-semibold">
                      <td colSpan={3} className="p-4 text-sm">Total Expenses</td>
                      <td className="p-4 text-sm text-right">{formatINR(totalExpenses)}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xl">Net Income (Profit)</span>
                <span className="font-bold text-3xl text-emerald-600">{formatINR(netIncome)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full-page Cash Flow View
  if (currentView === "cashflow") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Cash Flow Statement</h1>
                  <p className="text-sm text-muted-foreground">Detailed cash flow report</p>
                </div>
              </div>
              <Button className="rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full space-y-6">
            <div className="bg-muted/30 border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="font-medium text-lg">Opening Balance</span>
                <span className="font-semibold text-2xl">{formatINR(openingBalance)}</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-3 pb-2 border-b-2 border-emerald-600">Cash Inflows</h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium">Date</th>
                      <th className="p-4 text-left text-sm font-medium">Source</th>
                      <th className="p-4 text-right text-sm font-medium">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashInflows.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-sm">{item.date}</td>
                        <td className="p-4 text-sm">{item.source}</td>
                        <td className="p-4 text-sm text-right font-medium text-emerald-600">+{formatINR(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 dark:bg-emerald-900/20 font-semibold">
                      <td colSpan={2} className="p-4 text-sm">Total Cash Inflows</td>
                      <td className="p-4 text-sm text-right text-emerald-600">+{formatINR(totalCashIn)}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-3 pb-2 border-b-2 border-red-600">Cash Outflows</h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium">Date</th>
                      <th className="p-4 text-left text-sm font-medium">Purpose</th>
                      <th className="p-4 text-right text-sm font-medium">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashOutflows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-12 text-center text-muted-foreground">
                          <p>No cash outflows found</p>
                          <p className="text-xs mt-2">Cash outflows will appear here once they are recorded</p>
                        </td>
                      </tr>
                    ) : (
                      <>
                    {cashOutflows.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-4 text-sm">{formatDate(item.date)}</td>
                        <td className="p-4 text-sm">{item.purpose}</td>
                        <td className="p-4 text-sm text-right font-medium text-red-600">-{formatINR(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-red-50 dark:bg-red-900/20 font-semibold">
                      <td colSpan={2} className="p-4 text-sm">Total Cash Outflows</td>
                      <td className="p-4 text-sm text-right text-red-600">-{formatINR(totalCashOut)}</td>
                    </tr>
                      </>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-xl">Closing Balance</span>
                <span className="font-bold text-3xl text-primary">{formatINR(closingBalance)}</span>
              </div>
              <div className="pt-3 border-t text-sm text-muted-foreground">
                <p>Calculation: Opening ({formatINR(openingBalance)}) + Inflows ({formatINR(totalCashIn)}) - Outflows ({formatINR(totalCashOut)})</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full-page Trial Balance View
  if (currentView === "trial") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Trial Balance</h1>
                  <p className="text-sm text-muted-foreground">As on {formatDate(new Date().toISOString())}</p>
                </div>
              </div>
              <Button className="rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full space-y-6">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium">Account Name</th>
                      <th className="p-4 text-left text-sm font-medium">Group</th>
                      <th className="p-4 text-right text-sm font-medium">Debit (₹)</th>
                    <th className="p-4 text-right text-sm font-medium">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50 dark:bg-blue-900/20">
                    <td colSpan={4} className="p-3 text-sm font-semibold">ASSETS</td>
                  </tr>
                  {trialBalanceData.filter(item => item.group === "Assets").map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm pl-8">{item.account}</td>
                      <td className="p-4 text-sm text-muted-foreground">{item.group}</td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.drAmount > 0 ? formatINR(item.drAmount) : '-'}
                      </td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.crAmount > 0 ? formatINR(item.crAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50 dark:bg-amber-900/20">
                    <td colSpan={4} className="p-3 text-sm font-semibold">LIABILITIES</td>
                  </tr>
                  {trialBalanceData.filter(item => item.group === "Liabilities").map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm pl-8">{item.account}</td>
                      <td className="p-4 text-sm text-muted-foreground">{item.group}</td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.drAmount > 0 ? formatINR(item.drAmount) : '-'}
                      </td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.crAmount > 0 ? formatINR(item.crAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-purple-50 dark:bg-purple-900/20">
                    <td colSpan={4} className="p-3 text-sm font-semibold">CAPITAL</td>
                  </tr>
                  {trialBalanceData.filter(item => item.group === "Capital").map((item: any, idx) => (
                    <tr 
                      key={idx} 
                      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (item.director) {
                          setSelectedDirector(item.director);
                          setCurrentView("capital");
                        }
                      }}
                    >
                      <td className="p-4 text-sm pl-8 text-foreground hover:text-accent-foreground hover:underline">{item.account}</td>
                      <td className="p-4 text-sm text-muted-foreground">{item.group}</td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.drAmount > 0 ? formatINR(item.drAmount) : '-'}
                      </td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.crAmount > 0 ? formatINR(item.crAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                    <td colSpan={4} className="p-3 text-sm font-semibold">INCOME</td>
                  </tr>
                  {trialBalanceData.filter(item => item.group === "Income").map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm pl-8">{item.account}</td>
                      <td className="p-4 text-sm text-muted-foreground">{item.group}</td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.drAmount > 0 ? formatINR(item.drAmount) : '-'}
                      </td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.crAmount > 0 ? formatINR(item.crAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 dark:bg-red-900/20">
                    <td colSpan={4} className="p-3 text-sm font-semibold">EXPENSES</td>
                  </tr>
                  {trialBalanceData.filter(item => item.group === "Expenses").map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm pl-8">{item.account}</td>
                      <td className="p-4 text-sm text-muted-foreground">{item.group}</td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.drAmount > 0 ? formatINR(item.drAmount) : '-'}
                      </td>
                      <td className="p-4 text-sm text-right font-medium">
                        {item.crAmount > 0 ? formatINR(item.crAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary/20 font-bold border-t-2 border-primary">
                    <td colSpan={2} className="p-4 text-sm">TOTAL</td>
                    <td className="p-4 text-sm text-right">{formatINR(totalDr)}</td>
                    <td className="p-4 text-sm text-right">{formatINR(totalCr)}</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>

            <div className={`border-2 rounded-2xl p-6 ${totalDr === totalCr ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600' : 'bg-red-50 dark:bg-red-900/20 border-red-600'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xl">Balance Status</span>
                <span className={`font-bold text-2xl ${totalDr === totalCr ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totalDr === totalCr ? '✓ Balanced' : '✗ Not Balanced'}
                </span>
              </div>
              {totalDr !== totalCr && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Difference: {formatINR(Math.abs(totalDr - totalCr))}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full-page Capital Account View
  if (currentView === "capital") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Directors' Capital Account</h1>
                  <p className="text-sm text-muted-foreground">Capital, Drawings & Balance Statement</p>
                </div>
              </div>
              <Button className="rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full space-y-8">
            {/* Summary Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b bg-muted/30">
                <h3 className="font-medium text-lg">Capital Account Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">Director Name</th>
                    <th className="p-4 text-left text-sm font-medium">Role</th>
                    <th className="p-4 text-right text-sm font-medium">Opening Capital (₹)</th>
                    <th className="p-4 text-right text-sm font-medium">Additional Capital (₹)</th>
                    <th className="p-4 text-right text-sm font-medium">Total Drawings (₹)</th>
                    <th className="p-4 text-right text-sm font-medium">Closing Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {directorsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading directors...</p>
                      </td>
                    </tr>
                  ) : directors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        <p>No directors found</p>
                        <p className="text-xs mt-2">Directors will appear here once they are marked as directors by admin</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                  {directors.map((director, idx) => {
                        const additionalCapitalTotal = (director.additionalCapital || []).reduce((sum: number, item: any) => sum + item.amount, 0);
                        const drawingsTotal = (director.drawings || []).reduce((sum: number, item: any) => sum + item.amount, 0);
                    const closingBalance = calculateDirectorBalance(director);
                    
                    return (
                          <tr key={director.id || idx} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-4 text-sm font-medium">
                              <div>
                                <div>{director.name}</div>
                                {director.equity_ratio > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {director.equity_ratio}% Equity
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{director.role || 'Director'}</td>
                            <td className="p-4 text-sm text-right font-medium">{formatINR(director.openingCapital || 0)}</td>
                        <td className="p-4 text-sm text-right font-medium text-emerald-600">
                          {additionalCapitalTotal > 0 ? `+${formatINR(additionalCapitalTotal)}` : '-'}
                        </td>
                        <td className="p-4 text-sm text-right font-medium text-red-600">
                          {drawingsTotal > 0 ? `-${formatINR(drawingsTotal)}` : '-'}
                        </td>
                        <td className="p-4 text-sm text-right font-semibold text-primary">
                          {formatINR(closingBalance)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-primary/10 font-bold border-t-2">
                    <td colSpan={2} className="p-4 text-sm">TOTAL</td>
                    <td className="p-4 text-sm text-right">
                          {formatINR(directors.reduce((sum, d) => sum + (d.openingCapital || 0), 0))}
                    </td>
                    <td className="p-4 text-sm text-right">
                          {formatINR(directors.reduce((sum, d) => sum + ((d.additionalCapital || []).reduce((s: number, i: any) => s + i.amount, 0)), 0))}
                    </td>
                    <td className="p-4 text-sm text-right">
                          {formatINR(directors.reduce((sum, d) => sum + ((d.drawings || []).reduce((s: number, i: any) => s + i.amount, 0)), 0))}
                    </td>
                    <td className="p-4 text-sm text-right">
                      {formatINR(directors.reduce((sum, d) => sum + calculateDirectorBalance(d), 0))}
                    </td>
                  </tr>
                    </>
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Detailed Breakdown for Each Director */}
            {directorsLoading ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading directors...</p>
              </div>
            ) : directors.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
                <p>No directors found</p>
                <p className="text-xs mt-2">Directors will appear here once they are marked as directors by admin</p>
              </div>
            ) : (
              directors.map((director) => (
              <div key={director.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-xl">{director.name} - Capital Account</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">{director.role || 'Director'}</p>
                      {director.equity_ratio > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          {director.equity_ratio}% Equity
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-semibold text-primary">{formatINR(calculateDirectorBalance(director))}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Capital Section */}
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b bg-emerald-50 dark:bg-emerald-900/20">
                      <h4 className="font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Capital Contributions</span>
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between pb-3 border-b">
                          <span className="text-sm font-medium">Opening Capital</span>
                          <span className="text-sm font-semibold text-emerald-600">
                            {formatINR(director.openingCapital)}
                          </span>
                        </div>
                        {director.additionalCapital.length > 0 && (
                          <>
                            <div className="pt-2">
                              <p className="text-sm font-medium mb-2">Additional Investments:</p>
                              <div className="space-y-2">
                                {director.additionalCapital.map((capital, idx) => (
                                  <div key={idx} className="flex justify-between items-start py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
                                    <div>
                                      <p className="text-sm">{capital.description}</p>
                                      <p className="text-xs text-muted-foreground">{formatDate(capital.date)}</p>
                                    </div>
                                    <span className="text-sm font-medium text-emerald-600">
                                      +{formatINR(capital.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between pt-3 border-t font-semibold">
                              <span className="text-sm">Total Additional Capital</span>
                              <span className="text-sm text-emerald-600">
                                +{formatINR(director.additionalCapital.reduce((sum, item) => sum + item.amount, 0))}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between pt-3 border-t-2 border-primary font-bold">
                          <span className="text-sm">Total Capital</span>
                          <span className="text-sm text-primary">
                            {formatINR(director.openingCapital + director.additionalCapital.reduce((sum, item) => sum + item.amount, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Drawings Section */}
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b bg-red-50 dark:bg-red-900/20">
                      <h4 className="font-medium flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span>Drawings & Withdrawals</span>
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {director.drawings.length > 0 ? (
                          <>
                            <div>
                              <p className="text-sm font-medium mb-2">Withdrawal History:</p>
                              <div className="space-y-2">
                                {director.drawings.map((drawing, idx) => (
                                  <div key={idx} className="flex justify-between items-start py-2 px-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                                    <div>
                                      <p className="text-sm">{drawing.description}</p>
                                      <p className="text-xs text-muted-foreground">{formatDate(drawing.date)}</p>
                                    </div>
                                    <span className="text-sm font-medium text-red-600">
                                      -{formatINR(drawing.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between pt-3 border-t-2 border-destructive font-bold">
                              <span className="text-sm">Total Drawings</span>
                              <span className="text-sm text-red-600">
                                -{formatINR(director.drawings.reduce((sum, item) => sum + item.amount, 0))}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            No drawings recorded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Calculation */}
                <div className="bg-primary/10 border-2 border-primary rounded-2xl p-5">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Opening Capital:</span>
                      <span className="font-medium">{formatINR(director.openingCapital)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Add: Additional Capital:</span>
                      <span className="font-medium text-emerald-600">
                        +{formatINR((director.additionalCapital || []).reduce((sum: number, item: any) => sum + item.amount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Less: Drawings:</span>
                      <span className="font-medium text-red-600">
                        -{formatINR((director.drawings || []).reduce((sum: number, item: any) => sum + item.amount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t-2 border-primary">
                      <span className="font-semibold text-lg">Closing Balance:</span>
                      <span className="font-bold text-2xl text-primary">
                        {formatINR(calculateDirectorBalance(director))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // New Invoice Form View
  if (currentView === "new-invoice") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Create New Invoice</h1>
                  <p className="text-sm text-muted-foreground">Generate invoice for client</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentView("main")} className="rounded-xl">Cancel</Button>
                <Button className="rounded-xl">Save Invoice</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <form className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client Name *</label>
                    <input type="text" placeholder="Acme Corp" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <input type="email" placeholder="client@acme.com" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GSTIN</label>
                    <input type="text" placeholder="29ABCDE1234F1Z5" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Address *</label>
                  <textarea rows={3} placeholder="Enter full billing address" className="w-full px-4 py-2 rounded-xl border border-border bg-background"></textarea>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Invoice Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Invoice Number *</label>
                    <input type="text" placeholder="INV-2024-001" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issue Date *</label>
                    <input type="date" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date *</label>
                    <input type="date" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="font-medium text-lg">Line Items</h3>
                  <Button type="button" variant="outline" size="sm" className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-5 space-y-2">
                      <label className="text-sm font-medium">Description *</label>
                      <input type="text" placeholder="Website Design Services" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium">Quantity *</label>
                      <input type="number" placeholder="1" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium">Rate (₹) *</label>
                      <input type="number" placeholder="50000" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium">Amount (₹)</label>
                      <input type="text" value="₹50,000" disabled className="w-full px-4 py-2 rounded-xl border border-border bg-muted text-muted-foreground" />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button type="button" variant="ghost" size="icon" className="rounded-xl text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-medium text-lg pb-3 border-b">Totals</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal:</span>
                    <span className="text-sm font-medium">₹50,000.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">GST (18%):</span>
                    <span className="text-sm font-medium">₹9,000.00</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t-2 border-primary">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">₹59,000.00</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentView("main")} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">
                  <Send className="w-4 h-4 mr-2" />
                  Generate & Send Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // New Receipt Form View
  if (currentView === "new-receipt") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Record New Receipt</h1>
                  <p className="text-sm text-muted-foreground">Track money received</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentView("main")} className="rounded-xl">Cancel</Button>
                <Button className="rounded-xl">Save Receipt</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <form className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Receipt Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Receipt Number *</label>
                    <input type="text" placeholder="RCP-001" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date *</label>
                    <input type="date" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Received From *</label>
                    <input type="text" placeholder="Client Name / Company" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (₹) *</label>
                    <input type="number" placeholder="50000" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Mode *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="">Select Mode</option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="upi">UPI</option>
                      <option value="cheque">Cheque</option>
                      <option value="card">Credit/Debit Card</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reference Number</label>
                    <input type="text" placeholder="Transaction/Cheque Number" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank/Account</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="">Select Account</option>
                      <option value="hdfc">HDFC Bank - Current</option>
                      <option value="icici">ICICI Bank - Savings</option>
                      <option value="sbi">SBI - Current</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="cleared">Cleared</option>
                      <option value="pending">Pending</option>
                      <option value="bounced">Bounced</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Purpose & Details</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Purpose/Description *</label>
                  <textarea rows={3} placeholder="Invoice payment, advance, etc." className="w-full px-4 py-2 rounded-xl border border-border bg-background"></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link to Invoice (Optional)</label>
                  <input type="text" placeholder="INV-001" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Notes</label>
                  <textarea rows={2} placeholder="Any additional information..." className="w-full px-4 py-2 rounded-xl border border-border bg-background"></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentView("main")} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Receipt
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // New Payment Form View
  if (currentView === "new-payment") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Record New Payment</h1>
                  <p className="text-sm text-muted-foreground">Track money paid</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentView("main")} className="rounded-xl">Cancel</Button>
                <Button className="rounded-xl">Save Payment</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <form className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Number *</label>
                    <input type="text" placeholder="PAY-001" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date *</label>
                    <input type="date" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Paid To *</label>
                    <input type="text" placeholder="Vendor / Supplier Name" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (₹) *</label>
                    <input type="number" placeholder="25000" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Mode *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="">Select Mode</option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="upi">UPI</option>
                      <option value="cheque">Cheque</option>
                      <option value="card">Credit/Debit Card</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reference Number</label>
                    <input type="text" placeholder="Transaction/Cheque Number" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Bank/Account *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="">Select Account</option>
                      <option value="hdfc">HDFC Bank - Current</option>
                      <option value="icici">ICICI Bank - Savings</option>
                      <option value="sbi">SBI - Current</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="completed">Completed</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Purpose & Category</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                    <option value="">Select Category</option>
                    <option value="salary">Salary & Wages</option>
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="software">Software & Subscriptions</option>
                    <option value="marketing">Marketing</option>
                    <option value="vendor">Vendor Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Purpose/Description *</label>
                  <textarea rows={3} placeholder="What is this payment for?" className="w-full px-4 py-2 rounded-xl border border-border bg-background"></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Notes</label>
                  <textarea rows={2} placeholder="Any additional information..." className="w-full px-4 py-2 rounded-xl border border-border bg-background"></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentView("main")} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // New Expense Form View
  if (currentView === "new-expense") {
    const handleExpenseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const id = `EXP-${String(expenses.length + 1).padStart(3, "0")}`;
      const newExpense: Expense = {
        id,
        category: (formData.get("category") as string) || "Other",
        party: (formData.get("party") as string) || "",
        amount: Number(formData.get("amount")) || 0,
        date: (formData.get("date") as string) || new Date().toISOString().slice(0, 10),
        status: (formData.get("status") as "paid" | "pending") || "pending",
        description: (formData.get("description") as string) || undefined,
      };
      setExpenses((prev) => [...prev, newExpense]);
      setCurrentView("main");
      setSelectedTab("expenses");
    };
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Add Expense</h1>
                  <p className="text-sm text-muted-foreground">Record a new expense</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setCurrentView("main")} className="rounded-xl">Cancel</Button>
                <Button type="submit" form="new-expense-form" className="rounded-xl">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Expense
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <form id="new-expense-form" onSubmit={handleExpenseSubmit} className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Expense Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category *</label>
                    <select name="category" required className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="">Select Category</option>
                      <option value="Salary & Wages">Salary & Wages</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Software">Software & Subscriptions</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Vendor">Vendor Payment</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Party *</label>
                    <input name="party" type="text" required placeholder="Party (person or entity)" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (₹) *</label>
                    <input name="amount" type="number" required min="1" step="0.01" placeholder="0" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date *</label>
                    <input name="date" type="date" required className="w-full px-4 py-2 rounded-xl border border-border bg-background" defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status *</label>
                  <select name="status" className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea name="description" rows={3} placeholder="What is this expense for?" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentView("main")} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main View
  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="Accounts"
        description="Financial management and tracking"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <MetricCard
              title="Total Revenue"
              value={formatINRCompact(totalRevenue)}
              icon={DollarSign}
              subtitle={totalRevenue === 0 ? "No revenue yet" : `${incomeDetails.length} income entries`}
              highlight={true}
            />
            <MetricCard
              title="Outstanding"
              value={formatINRCompact(unpaidAmount)}
              icon={FileText}
              subtitle={unpaidInvoices === 0 ? "All invoices paid" : `${unpaidInvoices} unpaid invoices`}
            />
            <MetricCard
              title="Expenses"
              value={formatINRCompact(totalExpenseAmount)}
              icon={TrendingDown}
              subtitle={totalExpenseAmount === 0 ? "No expenses yet" : `${expenses.length} expense entries`}
            />
            <MetricCard
              title="Net Profit"
              value={formatINRCompact(netIncome)}
              icon={TrendingUp}
              subtitle={netIncome === 0 ? "No income data" : netIncome > 0 ? "Profit" : "Loss"}
            />
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="invoices" className="rounded-lg">Invoices</TabsTrigger>
              <TabsTrigger value="receipts" className="rounded-lg">Receipts</TabsTrigger>
              <TabsTrigger value="payments" className="rounded-lg">Payments</TabsTrigger>
              <TabsTrigger value="expenses" className="rounded-lg">Expenses</TabsTrigger>
              <TabsTrigger value="reports" className="rounded-lg">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">View and manage your invoices</p>
                <Button onClick={() => setCurrentView("new-invoice")} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  New Invoice
                </Button>
              </div>
              <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">Invoice ID</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Client</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Service</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Issue Date</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Due Date</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-sm font-medium">{invoice.id}</span>
                        </td>
                        <td className="p-4 text-sm">{invoice.client}</td>
                        <td className="p-4 text-sm text-muted-foreground">{invoice.service}</td>
                        <td className="p-4">
                          <span className="text-sm font-medium">{formatINR(invoice.amount)}</span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(invoice.issueDate)}</td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                        <td className="p-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="receipts" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Track all money received</p>
                <Button onClick={() => setCurrentView("new-receipt")} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  New Receipt
                </Button>
              </div>
              <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium text-muted-foreground">Receipt No.</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">From</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Purpose</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Mode</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "RCP-001", from: "Acme Corp", purpose: "Invoice INV-001 Payment", amount: 450000, date: "01/02/2024", mode: "Bank Transfer", status: "Cleared" },
                      { id: "RCP-002", from: "Tech Solutions", purpose: "Advance Payment", amount: 200000, date: "03/02/2024", mode: "UPI", status: "Cleared" },
                      { id: "RCP-003", from: "StartUp Inc", purpose: "Project Milestone", amount: 350000, date: "04/02/2024", mode: "Cheque", status: "Pending" }
                    ].map((receipt) => (
                      <tr key={receipt.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <span className="font-medium text-sm">{receipt.id}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{receipt.from}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{receipt.purpose}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium">{formatINR(receipt.amount)}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{receipt.date}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{receipt.mode}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${receipt.status === 'Cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {receipt.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="rounded-lg">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-lg">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Track all money paid</p>
                <Button onClick={() => setCurrentView("new-payment")} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  New Payment
                </Button>
              </div>
              <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium text-muted-foreground">Payment No.</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">To</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Purpose</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Mode</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "PAY-001", to: "AWS Services", purpose: "Cloud Infrastructure", amount: 85000, date: "01/02/2024", mode: "Credit Card", status: "Completed" },
                      { id: "PAY-002", to: "Office Rent", purpose: "February Rent", amount: 150000, date: "01/02/2024", mode: "Bank Transfer", status: "Completed" },
                      { id: "PAY-003", to: "Freelancer - John", purpose: "Design Services", amount: 45000, date: "03/02/2024", mode: "UPI", status: "Processing" }
                    ].map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <span className="font-medium text-sm">{payment.id}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{payment.to}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{payment.purpose}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium">{formatINR(payment.amount)}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{payment.date}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">{payment.mode}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="rounded-lg">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-lg">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Track and record your expenses</p>
                <Button onClick={() => setCurrentView("new-expense")} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </div>
              <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Category</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Party</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Description</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-sm font-medium">{expense.id}</span>
                        </td>
                        <td className="p-4 text-sm">{expense.category}</td>
                        <td className="p-4 text-sm">{expense.party}</td>
                        <td className="p-4 text-sm text-muted-foreground">{expense.description}</td>
                        <td className="p-4">
                          <span className="text-sm font-medium">{formatINR(expense.amount)}</span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(expense.date)}</td>
                        <td className="p-4">
                          <StatusBadge status={expense.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div 
                  className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setCurrentView("income")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">Income Statement</h3>
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="text-sm font-medium">{formatINR(totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Expenses</span>
                      <span className="text-sm font-medium">{formatINR(totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-sm font-semibold">Net Income</span>
                      <span className="text-sm font-semibold text-emerald-600">{formatINR(netIncome)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">Click to view detailed report</p>
                </div>

                <div 
                  className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setCurrentView("cashflow")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">Cash Flow</h3>
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-sm text-muted-foreground">Opening Balance</span>
                      <span className="text-sm font-medium">{formatINR(openingBalance)}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-sm text-muted-foreground">Cash In</span>
                      <span className="text-sm font-medium text-emerald-600">+{formatINR(totalCashIn)}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-sm text-muted-foreground">Cash Out</span>
                      <span className="text-sm font-medium text-red-600">-{formatINR(totalCashOut)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-sm font-semibold">Closing Balance</span>
                      <span className="text-sm font-semibold">{formatINR(closingBalance)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">Click to view detailed report</p>
                </div>

                <div 
                  className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setCurrentView("trial")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">Trial Balance</h3>
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Debit</span>
                      <span className="text-sm font-medium">{formatINR(totalDr)}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Credit</span>
                      <span className="text-sm font-medium">{formatINR(totalCr)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-sm font-semibold">Difference</span>
                      <span className={`text-sm font-semibold ${totalDr === totalCr ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatINR(Math.abs(totalDr - totalCr))}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">Click to view detailed report</p>
                </div>

                <div 
                  className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setCurrentView("capital")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">Capital Account</h3>
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    {directors.map((director, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{director.name} ({director.role})</span>
                        <span className="text-sm font-medium">{formatINR(calculateDirectorBalance(director))}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">Click to view detailed report</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}