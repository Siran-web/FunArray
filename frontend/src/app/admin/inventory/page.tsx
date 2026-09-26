'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  variantColor?: string;
  variantMaterial?: string;
  quantity: number;
  reserved: number;
  available: number;
  updatedAt: string;
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [threshold, setThreshold] = useState(5);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Inventory reconciliation');
  const [isAbsoluteMode, setIsAbsoluteMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (lowStockOnly) {
        params.append('lowStockOnly', 'true');
        params.append('threshold', threshold.toString());
      }

      const res = await fetch(`http://localhost:8080/api/v1/inventory?${params.toString()}`, {
        headers,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Authentication or Admin permission required to access inventory.');
        }
        throw new Error(`Failed to load inventory (HTTP ${res.status})`);
      }

      const data = await res.json();
      setInventory(data.content || []);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to inventory service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let res: Response;
      if (isAbsoluteMode) {
        res = await fetch(`http://localhost:8080/api/v1/inventory/variant/${selectedItem.variantId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ quantity: adjustAmount }),
        });
      } else {
        res = await fetch(`http://localhost:8080/api/v1/inventory/variant/${selectedItem.variantId}/adjust`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ adjustment: adjustAmount, reason: adjustReason }),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update inventory (HTTP ${res.status})`);
      }

      setActionSuccess(`Stock successfully updated for ${selectedItem.variantSku}`);
      setSelectedItem(null);
      setAdjustAmount(0);
      fetchInventory();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuantity = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalReserved = inventory.reduce((sum, item) => sum + (item.reserved || 0), 0);
  const totalAvailable = inventory.reduce((sum, item) => sum + (item.available || 0), 0);
  const lowStockCount = inventory.filter((item) => item.available <= threshold).length;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link href="/admin" className="text-xs text-amber-500 hover:underline inline-flex items-center gap-1 mb-3">
            ← Back to Admin Console
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-white">Inventory Management</h1>
              <p className="text-sm text-stone-400 mt-1">
                Real-time stock tracking, reservation monitoring, and multi-variant availability enforcement.
              </p>
            </div>
            <button
              onClick={fetchInventory}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 self-start"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Stock
            </button>
          </div>
        </div>

        {/* Action / Success Banner */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
            <span>✓ {actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-stone-900/70 border border-stone-800/80 p-5 rounded-xl">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">Total Variants</div>
            <div className="text-2xl font-semibold text-white mt-2">{inventory.length}</div>
            <div className="text-xs text-stone-500 mt-1">Tracked SKU variants</div>
          </div>
          <div className="bg-stone-900/70 border border-stone-800/80 p-5 rounded-xl">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">Total On-Hand</div>
            <div className="text-2xl font-semibold text-white mt-2">{totalQuantity}</div>
            <div className="text-xs text-stone-500 mt-1">Physical physical units</div>
          </div>
          <div className="bg-stone-900/70 border border-stone-800/80 p-5 rounded-xl">
            <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">Reserved In Checkout</div>
            <div className="text-2xl font-semibold text-amber-300 mt-2">{totalReserved}</div>
            <div className="text-xs text-stone-500 mt-1">Locked in pending carts</div>
          </div>
          <div className="bg-stone-900/70 border border-stone-800/80 p-5 rounded-xl">
            <div className="text-xs font-medium text-rose-400 uppercase tracking-wider">Low Stock Alerts</div>
            <div className="text-2xl font-semibold text-rose-300 mt-2">{lowStockCount}</div>
            <div className="text-xs text-stone-500 mt-1">Stock ≤ {threshold} units</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-stone-900/50 border border-stone-800/80 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by SKU, Product Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-950 border border-stone-700/80 px-3.5 py-2 rounded-lg text-sm text-stone-200 placeholder-stone-500 w-full focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-sm rounded-lg transition-colors"
            >
              Filter
            </button>
          </form>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <label className="inline-flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span>Low Stock Only</span>
            </label>
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <span>Threshold:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 5)}
                className="bg-stone-950 border border-stone-700 px-2 py-1 rounded text-center w-14 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-16 text-center text-stone-400">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mb-3" />
              <p className="text-sm">Loading real-time inventory ledger...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-400 space-y-3">
              <p className="font-medium">{error}</p>
              <button
                onClick={fetchInventory}
                className="px-4 py-1.5 bg-stone-800 text-stone-300 text-xs rounded hover:bg-stone-700"
              >
                Retry
              </button>
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-16 text-center text-stone-500">
              <p className="text-sm">No inventory records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-950 text-stone-400 text-xs uppercase tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="px-5 py-3.5">Product & SKU</th>
                    <th className="px-4 py-3.5">Variant Specs</th>
                    <th className="px-4 py-3.5 text-right">On-Hand</th>
                    <th className="px-4 py-3.5 text-right">Reserved</th>
                    <th className="px-4 py-3.5 text-right">Available</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {inventory.map((item) => {
                    const isLow = item.available <= threshold;
                    const isOut = item.available <= 0;

                    return (
                      <tr key={item.id || item.variantId} className="hover:bg-stone-850/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{item.productName || 'Unknown Product'}</div>
                          <div className="text-xs font-mono text-amber-500/90 mt-0.5">{item.variantSku}</div>
                        </td>
                        <td className="px-4 py-4 text-xs text-stone-300">
                          <div>Color: <span className="text-stone-100">{item.variantColor || 'Standard'}</span></div>
                          {item.variantMaterial && (
                            <div className="text-stone-400">Material: {item.variantMaterial}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-stone-200">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {item.reserved > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-950/70 text-amber-400 border border-amber-800/60 font-semibold">
                              {item.reserved}
                            </span>
                          ) : (
                            <span className="text-stone-500">0</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-base">
                          <span className={isOut ? 'text-rose-500' : isLow ? 'text-amber-400' : 'text-emerald-400'}>
                            {item.available}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {isOut ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800/80">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800/80">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsAbsoluteMode(false);
                              setAdjustAmount(0);
                            }}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-md transition-colors"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Stock Adjustment Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Adjust Stock Level</h3>
                  <p className="text-xs text-amber-500 font-mono mt-0.5">{selectedItem.variantSku}</p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-stone-400 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsAbsoluteMode(false);
                    setAdjustAmount(0);
                  }}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                    !isAbsoluteMode ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Relative (± Delta)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAbsoluteMode(true);
                    setAdjustAmount(selectedItem.quantity);
                  }}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                    isAbsoluteMode ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Absolute (Override)
                </button>
              </div>

              <form onSubmit={handleUpdateStock} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">
                    {isAbsoluteMode ? 'New Total Quantity' : 'Adjustment Amount (+ to add, - to reduce)'}
                  </label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 px-3.5 py-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500 text-base"
                    required
                  />
                  <div className="flex justify-between text-xs text-stone-500 mt-1">
                    <span>Current: {selectedItem.quantity} (Avail: {selectedItem.available})</span>
                    <span>
                      Resulting:{' '}
                      <strong className="text-stone-200">
                        {isAbsoluteMode ? adjustAmount : selectedItem.quantity + adjustAmount}
                      </strong>
                    </span>
                  </div>
                </div>

                {!isAbsoluteMode && (
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Reason for Adjustment</label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="e.g. Stock shipment received, write-off, damage..."
                      className="w-full bg-stone-950 border border-stone-700 px-3 py-2 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Confirm Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
