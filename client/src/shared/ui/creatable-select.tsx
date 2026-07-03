"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

export type CreatableSelectOption = {
  value: string;
  label: string;
};

type CreatableSelectProps = {
  options: CreatableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  onCreateNew: (name: string) => Promise<{ id: number; name: string }>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  createText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
};

export function CreatableSelect({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder,
  searchPlaceholder,
  emptyText,
  createText,
  isLoading = false,
  disabled = false,
  className,
}: CreatableSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const innerPlaceholder =
    placeholder ?? t("common.select_placeholder", "Select...");
  const innerSearchPlaceholder =
    searchPlaceholder ?? t("common.search", "Search...");
  const innerEmptyText = emptyText ?? t("common.no_data", "No results found.");
  const innerCreateText = createText ?? t("common.create", "Create");

  const selectedOption = options.find((opt) => opt.value === value);

  // Check if search query exactly matches an existing option
  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === searchQuery.toLowerCase(),
  );

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateNew = async () => {
    if (!searchQuery.trim() || exactMatch) return;

    setIsCreating(true);
    try {
      const newItem = await onCreateNew(searchQuery.trim());
      onChange(String(newItem.id));
      setSearchQuery("");
      setOpen(false);
    } catch (error) {
      // Error is handled by the parent via toast
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between bg-muted/50 font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.loading", "Loading...")}
            </span>
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            innerPlaceholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={innerSearchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {filteredOptions.length === 0 && !searchQuery && (
              <CommandEmpty>{innerEmptyText}</CommandEmpty>
            )}

            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setSearchQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Show create option when there's a search query that doesn't exactly match */}
            {searchQuery.trim() && !exactMatch && (
              <>
                {filteredOptions.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateNew}
                    disabled={isCreating}
                    className="text-primary"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("products.form.creating", "Creating...")}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {innerCreateText} "{searchQuery.trim()}"
                      </>
                    )}
                  </CommandItem>
                </CommandGroup>
              </>
            )}

            {/* Show empty state with create option when no matches */}
            {filteredOptions.length === 0 && searchQuery && !exactMatch && (
              <div className="py-2 text-center text-sm text-muted-foreground">
                {t("common.no_data", "No matches found")}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
