
import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CANTONS_SUISSES } from "@/utils/swissCantons";

interface CantonOption {
  value: string;
  label: string;
}

interface CantonComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Show "Tous les cantons" option at top */
  showAllOption?: boolean;
  /** Custom list of cantons (e.g. filtered by available data) */
  options?: CantonOption[];
  /** Dark theme (glassmorphism) */
  darkMode?: boolean;
  /** Additional className for the trigger */
  className?: string;
  /** Compact mode for filter bars */
  compact?: boolean;
}

export function CantonCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionnez un canton",
  showAllOption = false,
  options,
  darkMode = false,
  className,
  compact = false,
}: CantonComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cantons = options || CANTONS_SUISSES;

  const selectedLabel = value && value !== "all"
    ? cantons.find((c) => c.value === value)?.label || value
    : null;

  const filtered = cantons.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.value.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = useCallback((val: string) => {
    onValueChange(val);
    setOpen(false);
    setSearch("");
  }, [onValueChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(showAllOption ? "all" : "");
    setSearch("");
  }, [onValueChange, showAllOption]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-2 text-left transition-all",
          compact
            ? "h-9 px-3 text-xs rounded-full border"
            : "h-12 px-3 rounded-xl border text-base",
          darkMode
            ? "bg-white/10 border-white/20 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50"
            : "bg-white border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary",
          selectedLabel
            ? (darkMode ? "text-white" : "text-gray-900")
            : (darkMode ? "text-white/40" : "text-muted-foreground"),
          className
        )}
      >
        <span className="truncate">
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedLabel && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className={cn(
                "rounded-full p-0.5 transition-colors",
                darkMode ? "hover:bg-white/20" : "hover:bg-gray-200"
              )}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden",
            darkMode
              ? "bg-[#0d2847] border-white/20"
              : "bg-white border-gray-200"
          )}
        >
          {/* Search input */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 border-b",
            darkMode ? "border-white/10" : "border-gray-100"
          )}>
            <Search className={cn("h-4 w-4 shrink-0", darkMode ? "text-white/40" : "text-gray-400")} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un canton..."
              className={cn(
                "w-full bg-transparent text-sm outline-none",
                darkMode
                  ? "text-white placeholder:text-white/40"
                  : "text-gray-900 placeholder:text-gray-400"
              )}
            />
          </div>

          {/* Options list */}
          <div className="max-h-[240px] overflow-y-auto overscroll-contain">
            {showAllOption && !search && (
              <button
                type="button"
                onClick={() => handleSelect("all")}
                className={cn(
                  "w-full text-left px-3 transition-colors",
                  compact ? "py-2 text-xs" : "py-2.5 text-sm",
                  value === "all" || !value
                    ? darkMode ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                    : darkMode ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                Tous les cantons
              </button>
            )}
            {filtered.length === 0 ? (
              <div className={cn(
                "px-3 py-4 text-center text-sm",
                darkMode ? "text-white/40" : "text-gray-400"
              )}>
                Aucun canton trouvé
              </div>
            ) : (
              filtered.map((canton) => (
                <button
                  key={canton.value}
                  type="button"
                  onClick={() => handleSelect(canton.value)}
                  className={cn(
                    "w-full text-left px-3 transition-colors",
                    compact ? "py-2 text-xs" : "py-2.5 text-sm",
                    value === canton.value
                      ? darkMode ? "bg-white/15 text-white font-medium" : "bg-primary/10 text-primary font-medium"
                      : darkMode ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {canton.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
