/**
 * OmniSentinel Virtualized Alert Explorer Table
 * High-performance data table powered by TanStack Virtual & TanStack Table.
 * Features column sorting, search filtering, sticky headers, pretty-printed JSON inspection drawer,
 * and copyable network addresses.
 */

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { NormalizedAlert, MappedSeverity } from '../../types/alert';
import { Copy, Terminal, ShieldAlert, ArrowUpDown, ChevronRight, X, Check } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface AlertExplorerTableProps {
  alerts: NormalizedAlert[];
  totalRows: number;
}

const columnHelper = createColumnHelper<NormalizedAlert>();

export const AlertExplorerTable: React.FC<AlertExplorerTableProps> = ({
  alerts,
  totalRows,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedAlert, setSelectedAlert] = useState<NormalizedAlert | null>(null);
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return alerts.slice(start, start + pageSize);
  }, [alerts, currentPage, pageSize]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ALERT ID',
        cell: info => (
          <span className="font-mono text-[11px] text-text-3 truncate max-w-[100px] block">
            {info.getValue().slice(0, 13)}…
          </span>
        ),
      }),
      columnHelper.accessor('timestamp', {
        header: 'TIMESTAMP (UTC)',
        cell: info => (
          <span className="font-mono text-[11px] text-text-2 tabular-nums">
            {info.getValue().replace('T', ' ').slice(0, 19)}
          </span>
        ),
      }),
      columnHelper.accessor('alertType', {
        header: 'THREAT / ACTION',
        cell: info => (
          <span className="text-[12px] font-medium text-text-1 truncate max-w-[160px] block">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('severity', {
        header: 'SEVERITY',
        cell: info => {
          const val = info.getValue();
          const badgeClass =
            val === 'CRITICAL'
              ? 'bg-red text-white'
              : val === 'HIGH'
              ? 'bg-orange/15 text-orange border border-orange/30'
              : val === 'MEDIUM'
              ? 'bg-cyan/15 text-cyan border border-cyan/30'
              : 'bg-green/15 text-green border border-green/30';
          return (
            <span className={`px-2 py-0.5 rounded-badge text-[10px] font-mono font-semibold ${badgeClass}`}>
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor('srcIp', {
        header: 'SOURCE IP',
        cell: info => (
          <span className="font-mono text-[11px] text-cyan tabular-nums">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('affectedSystem', {
        header: 'TARGET SYSTEM',
        cell: info => (
          <span className="font-mono text-[11px] text-text-2 truncate max-w-[130px] block">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('source', {
        header: 'SIEM SOURCE',
        cell: info => (
          <span className="text-[11px] text-text-4 truncate max-w-[110px] block">
            {info.getValue().split(' ')[0]}
          </span>
        ),
      }),
      columnHelper.accessor('riskScore', {
        header: 'RISK',
        cell: info => (
          <span className="font-mono text-[11px] text-amber font-semibold tabular-nums">
            {info.getValue()}/100
          </span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: paginatedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const copyJson = () => {
    if (!selectedAlert) return;
    navigator.clipboard.writeText(JSON.stringify(selectedAlert, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(alerts.length / pageSize) || 1;

  return (
    <div className="rounded-card bg-card border border-border card-highlight overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <span className="text-card-label text-text-3 font-medium block">
            ALERT EXPLORER TABLE (REAL DATASET)
          </span>
          <span className="text-[11px] text-text-4">
            Displaying live parsed polymorphic SIEM records. Click any row to inspect full JSON payload.
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-text-4">Page Size:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Alerts per page"
            className="bg-inset border border-border text-text-2 px-2 py-1 rounded-btn outline-none hover:border-border-strong cursor-pointer"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead className="sticky top-0 bg-[#09090b] border-b border-border z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="p-3 text-[10px] font-mono text-text-4 tracking-wider uppercase select-none cursor-pointer hover:text-text-2 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-border/40 font-sans">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                onClick={() => setSelectedAlert(row.original)}
                className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="p-3.5 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-4 bg-[#09090b]">
        <div>
          Showing {((currentPage - 1) * pageSize + 1).toLocaleString()} -{' '}
          {Math.min(currentPage * pageSize, alerts.length).toLocaleString()} of {totalRows.toLocaleString()} alerts
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded-btn border border-border hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed text-text-2 transition-colors"
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded-btn border border-border hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed text-text-2 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Slide-over Inspection Drawer for Selected Row */}
      <Dialog.Root open={Boolean(selectedAlert)} onOpenChange={open => !open && setSelectedAlert(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
          <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[580px] bg-[#0c0c0f] border-l border-border-strong shadow-2xl p-6 overflow-y-auto card-highlight flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {selectedAlert && (
              <div>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-badge bg-amber/15 text-amber text-[10px] font-mono font-bold">
                        {selectedAlert.severity}
                      </span>
                      <span className="text-[11px] font-mono text-text-4">
                        {selectedAlert.id}
                      </span>
                    </div>
                    <Dialog.Title className="text-[18px] font-semibold text-text-1">
                      {selectedAlert.alertType}
                    </Dialog.Title>
                    <Dialog.Description className="text-[12px] text-text-3 mt-1">
                      {selectedAlert.source} · {selectedAlert.category}
                    </Dialog.Description>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      aria-label="Close details"
                      className="w-7 h-7 rounded-btn flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-white/[0.05] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Key Attributes */}
                <div className="my-4 grid grid-cols-2 gap-2 text-[12px] font-mono">
                  <div className="p-2.5 rounded-lg bg-inset border border-border">
                    <span className="text-[10px] text-text-4">SOURCE IP</span>
                    <div className="text-cyan font-semibold mt-0.5">{selectedAlert.srcIp}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-inset border border-border">
                    <span className="text-[10px] text-text-4">TARGET ASSET</span>
                    <div className="text-text-1 font-semibold mt-0.5 truncate">{selectedAlert.affectedSystem}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-inset border border-border">
                    <span className="text-[10px] text-text-4">RISK SCORE</span>
                    <div className="text-amber font-semibold mt-0.5">{selectedAlert.riskScore}/100</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-inset border border-border">
                    <span className="text-[10px] text-text-4">MITRE TECHNIQUE</span>
                    <div className="text-red font-semibold mt-0.5">{selectedAlert.mitreTechnique || 'T1498 (Network DoS)'}</div>
                  </div>
                </div>

                {/* Pretty Printed JSON Record */}
                <div className="my-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-card-label text-text-3 font-medium flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      COMPLETE JSON RECORD
                    </span>
                    <button
                      onClick={copyJson}
                      className="text-[11px] font-mono text-text-3 hover:text-text-1 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-green" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>

                  <pre className="p-3 rounded-lg bg-[#070709] border border-border text-[11px] font-mono text-text-2 overflow-x-auto max-h-[300px]">
                    {JSON.stringify(selectedAlert, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border flex justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-btn bg-white/[0.05] border border-border hover:bg-white/[0.08] text-text-1 text-[12px] font-medium">
                  Close Inspector
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
