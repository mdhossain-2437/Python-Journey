/**
 * Command Palette - W&B Inspired Quick Actions
 *
 * Features:
 * - Press "/" to open
 * - Search runs, models, experiments
 * - Quick navigation
 * - Recent items
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Search,
  ArrowRight,
  Clock,
  FileText,
  GitBranch,
  Server,
  Settings,
  Zap,
  BarChart3,
  Tag,
  X,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { Kbd } from "./wandb-ui";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: "navigation" | "runs" | "models" | "actions" | "recent";
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  recentItems?: CommandItem[];
}

// Default navigation items
const getNavigationItems = (navigate: (path: string) => void): CommandItem[] => [
  {
    id: "nav-dashboard",
    title: "Dashboard",
    subtitle: "Platform overview",
    icon: <BarChart3 className="h-4 w-4" />,
    category: "navigation",
    action: () => navigate("/"),
    keywords: ["home", "overview", "stats"],
  },
  {
    id: "nav-experiments",
    title: "Experiments",
    subtitle: "Track training runs",
    icon: <GitBranch className="h-4 w-4" />,
    category: "navigation",
    action: () => navigate("/experiments"),
    keywords: ["runs", "training", "track"],
  },
  {
    id: "nav-models",
    title: "Model Registry",
    subtitle: "Manage model versions",
    icon: <Server className="h-4 w-4" />,
    category: "navigation",
    action: () => navigate("/model-registry"),
    keywords: ["registry", "deploy", "version"],
  },
  {
    id: "nav-pipelines",
    title: "Pipelines",
    subtitle: "ML pipelines & workflows",
    icon: <Zap className="h-4 w-4" />,
    category: "navigation",
    action: () => navigate("/pipelines"),
    keywords: ["workflow", "automation", "dag"],
  },
  {
    id: "nav-features",
    title: "Feature Store",
    subtitle: "Feature management",
    icon: <Tag className="h-4 w-4" />,
    category: "navigation",
    action: () => navigate("/feature-store"),
    keywords: ["features", "data", "store"],
  },
  {
    id: "nav-labeling",
    title: "Data Labeling",
    subtitle: "Label datasets",
    icon: <FileText className="h-4 w-4" />,
    category: "navigation",
    action: () => navigate("/labeling"),
    keywords: ["label", "annotate", "dataset"],
  },
  {
    id: "nav-settings",
    title: "Settings",
    subtitle: "App configuration",
    icon: <Settings className="h-4 w-4" />,
    category: "navigation",
    action: () => navigate("/settings"),
    keywords: ["config", "preferences", "account"],
  },
];

export function CommandPalette({ isOpen, onClose, recentItems = [] }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Get all items
  const allItems = useMemo(() => {
    const navItems = getNavigationItems(setLocation);
    const recent = recentItems.map((item) => ({ ...item, category: "recent" as const }));
    return [...recent, ...navItems];
  }, [recentItems, setLocation]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return allItems;
    }

    const lowerQuery = query.toLowerCase();
    return allItems.filter((item) => {
      const searchText = [
        item.title,
        item.subtitle,
        ...(item.keywords || []),
      ].join(" ").toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }, [allItems, query]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Flatten for keyboard navigation
  const flatItems = useMemo(() => {
    return Object.values(groupedItems).flat();
  }, [groupedItems]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            flatItems[selectedIndex].action();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatItems, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Category labels
  const categoryLabels: Record<string, string> = {
    recent: "Recent",
    navigation: "Navigation",
    runs: "Runs",
    models: "Models",
    actions: "Actions",
  };

  if (!isOpen) return null;

  let itemIndex = 0;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
        <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for runs, models, or actions..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {flatItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {categoryLabels[category] || category}
                  </div>
                  {items.map((item) => {
                    const currentIndex = itemIndex++;
                    const isSelected = currentIndex === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        data-index={currentIndex}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <span className={cn(
                          "shrink-0",
                          isSelected ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          {item.subtitle && (
                            <div className={cn(
                              "text-xs truncate",
                              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <CornerDownLeft className="h-4 w-4 shrink-0 opacity-70" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 px-4 py-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd>Esc</Kbd>
                <span>Close</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="h-3 w-3" />
              <span>Command Palette</span>
            </span>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// Hook to manage command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" to open (when not in input)
      if (e.key === "/" && !isInputFocused()) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  const tagName = activeElement.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || (activeElement as HTMLElement).isContentEditable;
}

export default CommandPalette;

