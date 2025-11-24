// components/MusicCombobox.js
"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DEFAULT_LIMIT = 10;

export default function MusicCombobox({
  value,
  onValueChange,
  apiUrl = process.env.NEXT_PUBLIC_API_URL,
  limit = DEFAULT_LIMIT,
  placeholder = "Pilih Musik",
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const contentRef = useRef(null);

  // selectedMusic from list
  const selectedMusic = list.find((m) => Number(m.id) === Number(value));

  // fetch page from server
  const fetchPage = async (p = 1, q = "") => {
    const urlBase = (apiUrl || "").replace(/\/$/, "");
    if (!urlBase) {
      console.error(
        "MusicCombobox: apiUrl not provided or NEXT_PUBLIC_API_URL missing"
      );
      return;
    }

    // Cancel previous request
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch (e) {}
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    try {
      const res = await axios.get(`${urlBase}/music-list`, {
        params: { page: p, limit, search: q },
        signal: controller.signal,
      });

      const { data: items = [], total: tot = 0, pageCount: pc = null } =
        res.data || {};

      setList(items);
      setTotal(tot);
      setPage(p);
      setPageCount(pc ?? Math.max(1, Math.ceil(tot / limit)));
    } catch (err) {
      if (err?.name === "CanceledError" || err?.message === "canceled") {
        // ignore abort
      } else {
        console.error("Music fetch error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search; reset UI immediately while typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setList([]);
    setPage(1);
    setPageCount(1);
    setTotal(0);

    debounceRef.current = setTimeout(() => {
      fetchPage(1, searchQuery.trim());
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // When popover opens, load first page if needed
  useEffect(() => {
    if (!open) return;
    if (list.length === 0) fetchPage(1, searchQuery.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // If a value is set but item not in list, fetch it (search by id)
  useEffect(() => {
    const loadSelected = async () => {
      if (value == null || value === "") return;
      const idNum = Number(value);
      if (!Number.isFinite(idNum)) return;
      const exists = list.some((m) => Number(m.id) === idNum);
      if (exists) return;

      const urlBase = (apiUrl || "").replace(/\/$/, "");
      if (!urlBase) return;

      try {
        const res = await axios.get(`${urlBase}/music-list`, {
          params: { page: 1, limit: 1, search: String(idNum) },
        });
        const item = res.data?.data?.[0];
        if (item) setList((prev) => [item, ...prev]);
      } catch (err) {
        console.error("Failed to fetch selected music:", err);
      }
    };
    loadSelected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handlePrev = () => {
    if (page <= 1) return;
    fetchPage(page - 1, searchQuery.trim());
  };

  const handleNext = () => {
    if (page >= pageCount) return;
    fetchPage(page + 1, searchQuery.trim());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex w-full max-w-full h-10 justify-between px-3 py-2 text-sm text-left"
        >
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
            {selectedMusic
              ? selectedMusic.name.length > 32
                ? selectedMusic.name.slice(0, 32) + "..."
                : selectedMusic.name
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        ref={contentRef}
        className="w-[var(--radix-popover-trigger-width)] p-0 max-w-[95vw]"
      >
        <Command>
          <CommandInput
            placeholder="Search music by name..."
            value={searchQuery}
            onValueChange={(val) => {
              setSearchQuery(val);
            }}
            className="text-sm"
          />
          <CommandList>
            <CommandEmpty>No music found.</CommandEmpty>

            {isLoading && (
              <CommandGroup>
                <CommandItem disabled className="text-sm text-left">
                  Loading...
                </CommandItem>
              </CommandGroup>
            )}

            {!isLoading && list.length > 0 && (
              <CommandGroup>
                {list.map((data) => (
                  <CommandItem
                    key={data.id}
                    value={String(data.name)}
                    onSelect={() => {
                      onValueChange(String(data.id));
                      setOpen(false);
                    }}
                    className="text-sm text-left"
                  >
                    <div className="flex w-full">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 flex-shrink-0",
                          Number(value) === data.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left">
                        {data.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}

                {/* Pagination controls */}
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {total > 0 ? (
                      <>Page {page} of {pageCount} · {total} items</>
                    ) : (
                      <>—</>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handlePrev}
                      disabled={isLoading || page <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleNext}
                      disabled={isLoading || page >= pageCount}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CommandGroup>
            )}

            {!isLoading && list.length === 0 && (
              <CommandGroup>
                <CommandItem disabled className="text-sm text-left">
                  No options available
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
