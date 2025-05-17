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
                    className="w-full h-6 justify-between"
                >
                    {selectedMusic ? (
                        <div className="flex items-center">
                            {selectedMusic.name}
                        </div>
                    ) : (
                        "Pilih Musik"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder="Search music by name..."
                        value={searchQuery}
                        onValueChange={setSearchQuery} // Update search query
                    />
                    <CommandList>
                        <CommandEmpty>No music found.</CommandEmpty>
                        {isLoading ? (
                            <CommandGroup>
                                <CommandItem disabled>Loading...</CommandItem>
                            </CommandGroup>
                        ) : filteredList.length > 0 ? (
                            <CommandGroup>
                                {list.map((data) => (
                                    <CommandItem
                                        key={data.id}
                                        value={data.name} // Use name for search filtering
                                        onSelect={() => {
                                            onValueChange(String(data.id)); // Store id in formData (converted to string if needed)
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center w-full">
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    Number(value) === data.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {data.name}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : (
                            <CommandGroup>
                                <CommandItem disabled>No options available</CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default MusicCombobox