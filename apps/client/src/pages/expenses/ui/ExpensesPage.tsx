import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { expenseQueries, type ExpenseCategory } from "@/entities/expense";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import {
  Search,
  Plus,
  Loader2,
  DollarSign,
  Tag,
  Receipt,
  Trash2,
  TrendingDown,
  PieChart,
  Wallet,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Textarea } from "@/shared/ui/textarea";

const CATEGORIES: ExpenseCategory[] = [
  "RENT",
  "UTILITIES",
  "SALARY",
  "TRANSPORT",
  "REPAIRS",
  "MARKETING",
  "SUPPLIES",
  "OTHER",
];

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [startDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  const { data: expenses, isLoading } = expenseQueries.useAll();
  const { data: summary } = expenseQueries.useSummary(startDate, endDate);
  const createMutation = expenseQueries.useCreate();
  const deleteMutation = expenseQueries.useDelete();

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.receiptNo?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [expenses, search]);

  const handleCreate = () => {
    if (!amount || !description) return;
    createMutation.mutate(
      {
        category,
        amount: Number(amount),
        description,
        receiptNo,
        expenseDate,
      },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          resetForm();
        },
      },
    );
  };

  const resetForm = () => {
    setCategory("OTHER");
    setAmount("");
    setDescription("");
    setReceiptNo("");
    setExpenseDate(format(new Date(), "yyyy-MM-dd"));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          {t("expenses.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight italic uppercase">
            {t("expenses.title")}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {t("expenses.description")}
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 rounded-xl shadow-xl shadow-rose-600/10 h-12 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t("expenses.record_expense")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border border-l-4 border-l-rose-600 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-12 h-12 text-rose-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("expenses.stats.total_month")}
            </CardDescription>
            <CardTitle className="text-3xl font-black text-foreground">
              ${summary?.total.toLocaleString() || "0"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieChart className="w-12 h-12 text-amber-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("expenses.stats.top_category")}
            </CardDescription>
            <CardTitle className="text-xl font-black text-foreground uppercase italic">
              {summary?.byCategory[0]?.category
                ? t(
                    `expenses.create.categories.${summary.byCategory[0].category}`,
                  )
                : "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border overflow-hidden relative group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-12 h-12 text-emerald-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("expenses.stats.entries")}
            </CardDescription>
            <CardTitle className="text-3xl font-black text-foreground">
              {expenses?.length || "0"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="bg-card border-border overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-border p-6 bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                {t("expenses.ledger.title")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">
                {t("expenses.ledger.subtitle")}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("expenses.ledger.search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-muted border-border rounded-lg text-sm font-medium"
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest px-6 h-12">
                  {t("expenses.table.date")}
                </TableHead>
                <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest px-6 h-12">
                  {t("expenses.table.category")}
                </TableHead>
                <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest px-6 h-12">
                  {t("expenses.table.description")}
                </TableHead>
                <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest px-6 h-12">
                  {t("expenses.table.receipt")}
                </TableHead>
                <TableHead className="text-muted-foreground/60 font-black uppercase text-[10px] tracking-widest px-6 h-12 text-right">
                  {t("expenses.table.amount")}
                </TableHead>
                <TableHead className="w-12 px-6 h-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground/60 italic text-sm"
                  >
                    {t("expenses.ledger.no_records")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((exp) => (
                  <TableRow
                    key={exp.id}
                    className="border-border hover:bg-rose-600/5 transition-colors group"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground font-bold text-sm">
                          {format(new Date(exp.expenseDate), "MMM d, yyyy")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          {t("expenses.table.logged_by")}{" "}
                          {exp.createdBy?.name || "Member"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="border-border bg-muted text-[10px] font-black uppercase tracking-widest px-2 py-0.5 h-6"
                      >
                        {t(`expenses.create.categories.${exp.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="text-foreground font-medium text-sm max-w-xs">
                        {exp.description}
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="font-mono text-xs text-muted-foreground">
                        {exp.receiptNo || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <span className="text-rose-500 font-black text-lg tracking-tight">
                        ${Number(exp.amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(exp.id)}
                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border max-w-md p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="bg-rose-600 p-6 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Receipt className="w-16 h-16" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
              {t("expenses.create.title")}
            </DialogTitle>
            <DialogDescription className="text-rose-100 font-medium text-xs">
              {t("expenses.create.subtitle")}
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  {t("expenses.create.category")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-11 bg-muted border-border rounded-xl px-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`expenses.create.categories.${c}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  {t("expenses.create.date")}
                </label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="h-11 bg-muted border-border font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                {t("expenses.create.amount")}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 h-12 bg-muted border-border text-lg font-black text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                {t("expenses.create.description")}
              </label>
              <Textarea
                placeholder={t("expenses.create.description_placeholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-muted border-border rounded-xl text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                {t("expenses.create.receipt")}
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("expenses.create.receipt_placeholder")}
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="pl-10 h-11 bg-muted border-border text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/50 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setIsAddOpen(false)}
              className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]"
            >
              {t("expenses.create.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black px-8 rounded-xl h-11 transition-all active:scale-95"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("expenses.create.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
