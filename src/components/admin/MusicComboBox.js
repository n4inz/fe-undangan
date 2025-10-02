// MusicCombobox.js
import React from 'react'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const MusicCombobox = ({ value, onValueChange, list = [], isLoading }) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')

    // Find the selected music by ID
    const selectedMusic = list?.find(data => data.id === Number(value))

    // Filter the list based on the search query (name)
    const filteredList = searchQuery
        ? list.filter((data) =>
            data.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : list

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
                            : "Pilih Musik"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-w-[95vw]">
                <Command>
                    <CommandInput
                        placeholder="Search music by name..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="text-sm"
                    />
                    <CommandList>
                        <CommandEmpty>No music found.</CommandEmpty>
                        {isLoading ? (
                            <CommandGroup>
                                <CommandItem disabled className="text-sm text-left">Loading...</CommandItem>
                            </CommandGroup>
                        ) : filteredList.length > 0 ? (
                            <CommandGroup>
                                {filteredList.map((data) => (
                                    <CommandItem
                                        key={data.id}
                                        value={data.name}
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
                            </CommandGroup>
                        ) : (
                            <CommandGroup>
                                <CommandItem disabled className="text-sm text-left">No options available</CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default MusicCombobox