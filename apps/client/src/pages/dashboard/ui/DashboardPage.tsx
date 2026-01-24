import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { reportQueries } from "@/entities/report";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { aiApi } from "@/shared/api/ai.api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";

const AiInsights = ({ data }: { data: any }) => {
  const { t } = useTranslation();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    try {
      setLoading(true);
      const { data: aiRes } = await aiApi.analyzeDashboard(data);
      setInsight(aiRes.analysis);
    } catch (error) {
      console.error("AI Insight error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) fetchInsight();
  }, [data]);

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-24 w-24 text-primary" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <CardTitle className="text-lg">
            {t("dashboard.ai_insights_title")}
          </CardTitle>
        </div>
        <CardDescription>
          {t("dashboard.ai_insights_description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("common.analyzing_data")}</span>
          </div>
        ) : insight ? (
          <div className="text-sm leading-relaxed text-foreground/80">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-2 mb-2">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-primary">
                    {children}
                  </strong>
                ),
              }}
            >
              {insight}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("common.no_data")}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = reportQueries.useDashboard();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: t("dashboard.revenue"),
      value: `$${Number(data?.todayRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: t("dashboard.orders"),
      value: data?.todayOrders || 0,
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: t("dashboard.low_stock"),
      value: (data?.lowStockItems as any[])?.length || 0,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: t("dashboard.pending_returns"),
      value: data?.pendingReturns || 0,
      icon: RotateCcw,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-foreground">
            {t("dashboard.title")}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="gap-1.5 h-7 font-black tracking-widest uppercase text-[10px]"
          >
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            {t("common.live_sync_active")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AiInsights data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("dashboard.recent_sales")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>{t("dashboard.invoice")}</TableHead>
                  <TableHead>{t("dashboard.amount")}</TableHead>
                  <TableHead>{t("dashboard.seller")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recentSales as any[])?.slice(0, 5).map((sale: any) => (
                  <TableRow key={sale.id} className="border-border">
                    <TableCell className="font-mono text-sm uppercase">
                      {sale.invoiceNo}
                    </TableCell>
                    <TableCell className="text-green-500 font-medium">
                      ${Number(sale.totalAmount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sale.user?.name}
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("common.no_data")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t("dashboard.alert_stock")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>{t("dashboard.product")}</TableHead>
                  <TableHead>{t("dashboard.stock")}</TableHead>
                  <TableHead>{t("dashboard.min")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.lowStockItems as any[])
                  ?.slice(0, 5)
                  .map((item: any) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-mono">
                          {item.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        {item.min_stock}
                      </TableCell>
                    </TableRow>
                  )) || (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("common.no_data")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
