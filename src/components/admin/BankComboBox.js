import React from 'react'
import Image from 'next/image'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const BankCombobox = ({ value, onValueChange, bankList, isLoading }) => {
  const [open, setOpen] = React.useState(false)

  // Find the currently selected bank for display
  const selectedBank = bankList.find(bank => bank.icon === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-6 justify-between"
        >
          {selectedBank ? (
            <div className="flex items-center">
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/images/${selectedBank.icon}`}
                alt={selectedBank.name}
                width={24}
                height={24}
                className="mr-2"
              />
              {selectedBank.name}
            </div>
          ) : (
            "Pilih Icon"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search bank..." />
          <CommandList>
            <CommandEmpty>No banks found.</CommandEmpty>
            {isLoading ? (
              <CommandGroup>
                <CommandItem disabled>Loading...</CommandItem>
              </CommandGroup>
            ) : bankList.length > 0 ? (
              <CommandGroup>
                {bankList.map((bank) => (
                  <CommandItem
                    key={bank.name}
                    value={bank.icon}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center w-full">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === bank.icon ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/images/${bank.icon}`}
                        alt={bank.name}
                        width={24}
                        height={24}
                        className="mr-2"
                      />
                      {bank.name}
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

export default BankCombobox