import { cn } from '@/lib/utils';
import * as React from 'react';

export const tableDataClass = (rowIdx: number, columns: Array<any>) =>
    `px-4 py-3 whitespace-nowrap ${rowIdx !== columns.length - 1 ? 'border-r border-gray-100 dark:border-neutral-800' : ''}`;

const Table = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement> & { columns?: any[]; data?: any[]; renderRow?: (row: any, index: number) => React.ReactNode }
>(({ className, columns, data, renderRow, ...props }, ref) => {
    if (columns && data && renderRow) {
        return (
            <div className="relative w-full overflow-auto rounded-md border">
                <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props}>
                    <thead className="bg-muted/50">
                        <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={cn(
                                        'text-muted-foreground h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0',
                                        idx !== columns.length - 1 && 'border-r',
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {data.length === 0 ? (
                            <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                                <td colSpan={columns.length} className="text-muted-foreground p-4 text-center align-middle">
                                    No data available.
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIdx) => renderRow(row, rowIdx))
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-auto">
            <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
        </div>
    );
});
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)} {...props} />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', className)} {...props} />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn('text-muted-foreground h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0', className)}
        {...props}
    />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';

export { Table as SimpleTable, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
