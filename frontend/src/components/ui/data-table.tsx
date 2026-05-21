import * as React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from 'lucide-react';
import { Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '.';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  onSearch,
  emptyMessage = 'No results found',
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const filteredData = React.useMemo(() => {
    if (!search) return sortedData;
    const lowerSearch = search.toLowerCase();
    return sortedData.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(lowerSearch))
    );
  }, [sortedData, search]);

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sortColumn !== columnId) return <ChevronsUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {onSearch && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(col.sortable && 'cursor-pointer select-none', col.className)}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div className="flex items-center">
                    {col.header}
                    {col.sortable && <SortIcon columnId={col.id} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((col) => (
                    <TableCell key={col.id} className={col.className}>
                      {col.accessor(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {filteredData.length} of {data.length} results
      </div>
    </div>
  );
}
