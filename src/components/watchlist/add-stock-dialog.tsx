"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, X, Check } from "lucide-react";

interface AddStockDialogProps {
  onAdd: (symbol: string) => void;
  existingSymbols: string[];
  allSymbols: { symbol: string; name: string; sector: string }[];
  children?: React.ReactNode;
}

export function AddStockDialog({
  onAdd,
  existingSymbols,
  allSymbols,
  children,
}: AddStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");

  const filteredSymbols = allSymbols.filter(
    (s) =>
      !existingSymbols.includes(s.symbol) &&
      (s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = (symbol: string) => {
    onAdd(symbol.toUpperCase());
    setSearch("");
  };

  const handleAddCustom = () => {
    if (customSymbol.trim()) {
      onAdd(customSymbol.trim().toUpperCase());
      setCustomSymbol("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children || (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Ajouter une action
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter à la watchlist</DialogTitle>
          <DialogDescription>
            Recherchez une action dans l&apos;univers ou ajoutez un symbole
            personnalisé.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par symbole ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[240px]">
          <div className="space-y-0.5">
            {filteredSymbols.slice(0, 20).map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleAdd(stock.symbol)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div>
                  <div className="text-sm font-medium">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {stock.name}
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {stock.sector}
                </Badge>
              </button>
            ))}
            {filteredSymbols.length === 0 && search && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Aucun résultat pour &quot;{search}&quot;
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Custom symbol input */}
        <div className="border-t border-border pt-4">
          <label className="text-xs text-muted-foreground mb-2 block">
            Symbole personnalisé
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: AAPL, TSLA..."
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            />
            <Button onClick={handleAddCustom} disabled={!customSymbol.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
