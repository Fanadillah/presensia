import { cn } from '@/lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

const TableWrapper = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'w-full overflow-x-auto rounded-card border border-border bg-surface shadow-card',
      className
    )}
    {...props}
  />
);

const Table = ({ className, ...props }: TableProps) => (
  <table
    className={cn('w-full min-w-[640px] text-left text-sm', className)}
    {...props}
  />
);

const THead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn(
      'border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-muted-foreground [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold',
      className
    )}
    {...props}
  />
);

const TBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody
    className={cn(
      'divide-y divide-border [&_td]:px-4 [&_td]:py-3 text-foreground',
      className
    )}
    {...props}
  />
);

const TR = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('transition-colors hover:bg-surface-muted/40', className)} {...props} />
);

const EmptyRow = ({ colSpan, children }: { colSpan: number; children: React.ReactNode }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-12 text-center">
      {children}
    </td>
  </tr>
);

export { TableWrapper, Table, THead, TBody, TR, EmptyRow };
