"use client"

import { X } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"

export interface FilterOption {
  columnId: string
  title: string
  options:  {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey: string
  filters?: FilterOption[]
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  filters = []
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-2"> {/* flex-wrap ve gap-2 eklendi */}
      <div className="flex flex-1 items-center space-x-2 overflow-x-auto pb-1 sm:pb-0"> {/* Scroll eklendi */}
        <Input
          placeholder="Ara..."
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn(searchKey)?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        
        {filters.map((filter) => {
             const column = table.getColumn(filter.columnId)
             if(!column) return null;
             
             return (
                 <DataTableFacetedFilter
                    key={filter.columnId}
                    column={column}
                    title={filter.title}
                    options={filter.options}
                 />
             )
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Sıfırla
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}