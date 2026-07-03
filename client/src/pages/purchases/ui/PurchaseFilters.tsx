import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { Search, Filter, X, Calendar, Store, User } from "lucide-react";
import { providerQueries } from "@/entities/provider";
import { useTranslation } from "react-i18next";

export type PurchaseFilterValues = {
  search: string;
  type: string;
  providerId: string;
  startDate: string;
  endDate: string;
};

interface PurchaseFiltersProps {
  filters: PurchaseFilterValues;
  setFilters: (filters: PurchaseFilterValues) => void;
  onClear: () => void;
}

export function PurchaseFilters({
  filters,
  setFilters,
  onClear,
}: PurchaseFiltersProps) {
  const { t } = useTranslation();
  const { data: providers } = providerQueries.useAll();

  const activeFiltersCount = [
    filters.type !== "all",
    filters.providerId !== "all",
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 bg-card/30 p-4 rounded-xl border border-border shadow-sm">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
          <Input
            placeholder={t("purchases.filters.search_placeholder")}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9 h-10 bg-muted border-border rounded-lg text-sm transition-all focus:ring-2 focus:ring-emerald-500/20"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Type Filter */}
        <div className="flex items-center gap-2">
          <Select
            value={filters.type}
            onValueChange={(v) => setFilters({ ...filters, type: v })}
          >
            <SelectTrigger className="w-full md:w-[180px] h-10 bg-muted/50 border-border rounded-lg text-xs font-bold">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-purple-500" />
                <SelectValue
                  placeholder={t("purchases.filters.purchase_type")}
                />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">
                {t("purchases.filters.all_types")}
              </SelectItem>
              <SelectItem value="PROVIDER">
                <div className="flex items-center gap-2">
                  <Store className="w-3 h-3 text-emerald-500" />
                  {t("purchases.filters.supplier_purchase")}
                </div>
              </SelectItem>
              <SelectItem value="WALKING_CUSTOMER">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-blue-500" />
                  {t("purchases.filters.walking_seller")}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Provider Filter - Only show if not walking customer or "all" selected */}
          {filters.type !== "WALKING_CUSTOMER" && (
            <Select
              value={filters.providerId}
              onValueChange={(v) => setFilters({ ...filters, providerId: v })}
            >
              <SelectTrigger className="w-full md:w-[200px] h-10 bg-muted/50 border-border rounded-lg text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Store className="h-3.5 w-3.5 text-emerald-500" />
                  <SelectValue
                    placeholder={t("purchases.filters.all_providers")}
                  />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">
                  {t("purchases.filters.all_providers")}
                </SelectItem>
                {providers?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-lg px-2 h-10">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="bg-transparent border-none text-[10px] font-bold outline-none focus:ring-0 w-24"
            />
            <span className="text-muted-foreground text-[10px] font-black px-1">
              ~
            </span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="bg-transparent border-none text-[10px] font-bold outline-none focus:ring-0 w-24"
            />
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 w-full md:w-auto">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-9 px-3 text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {t("purchases.filters.clear")} ({activeFiltersCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
