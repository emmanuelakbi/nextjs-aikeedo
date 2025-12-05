/**
 * Invoices List Component
 * Requirements: 12.3 - Display invoices
 */

'use client';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  invoiceUrl: string | null;
  createdAt: string;
}

interface InvoicesListProps {
  invoices: Invoice[];
}

export default function InvoicesList({ invoices }: InvoicesListProps) {
  const statusColors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    OPEN: 'bg-yellow-100 text-yellow-800',
    VOID: 'bg-gray-100 text-gray-800',
    DRAFT: 'bg-blue-100 text-blue-800',
    UNCOLLECTIBLE: 'bg-red-100 text-red-800',
  };

  if (invoices.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No invoices yet
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-600">
                {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="py-3 px-4">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                  {invoice.status}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
              </td>
              <td className="py-3 px-4 text-right">
                {invoice.invoiceUrl && (
                  <a
                    href={invoice.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Invoice →
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
