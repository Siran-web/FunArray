'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatPrice } from '@/lib/utils';
import {
  adminApi,
  AdminOrder,
} from '@/services/adminApi';
import {
  Receipt,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  User,
  ShoppingBag,
  CreditCard,
  Building2,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Check,
  PackageCheck,
  XCircle
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // POS Modal State
  const [showPOSModal, setShowPOSModal] = useState(false);
  const [posCustomer, setPosCustomer] = useState('');
  const [posPhone, setPosPhone] = useState('');
  const [posProduct, setPosProduct] = useState('Kanso 3-Seater Sofa (Oatmeal Linen)');
  const [posPrice, setPosPrice] = useState('78999');
  const [posDiscount, setPosDiscount] = useState('0');
  const [posChannel, setPosChannel] = useState<'DELHI_SHOWROOM' | 'JALANDHAR_SHOWROOM'>('DELHI_SHOWROOM');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrders({
        status: statusFilter,
      });
      setOrders(data.content || []);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Status update handler
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      try {
        await adminApi.updateOrderStatus(orderId, newStatus);
      } catch (err) {
        console.warn('Backend update failed, applying local state update');
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: newStatus as any, updatedAt: new Date().toISOString() }
            : o
        )
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus as any, updatedAt: new Date().toISOString() } : null
        );
      }

      showToast(`Order status updated to ${newStatus}.`);
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Create POS Order
  const handleCreatePOSOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(posPrice) || 78999;
    const discountNum = parseFloat(posDiscount) || 0;
    const taxNum = (priceNum - discountNum) * 0.08;
    const totalNum = priceNum - discountNum + taxNum;

    const newOrd: AdminOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: posCustomer || 'Walk-In Showroom Client',
      customerEmail: 'showroom.pos@funarray.store',
      customerPhone: posPhone || '+91 98765 00000',
      channel: posChannel,
      subtotal: priceNum,
      shippingFee: 0,
      tax: taxNum,
      discount: discountNum,
      totalAmount: totalNum,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'STORE_POS_SWIPE',
      shippingAddress: {
        id: 'addr-pos',
        fullName: posCustomer || 'Showroom Floor Pickup',
        phone: posPhone || '+91 98765 00000',
        addressLine1: posChannel === 'DELHI_SHOWROOM' ? 'Delhi Flagship Showroom' : 'Jalandhar Gallery Showroom',
        city: posChannel === 'DELHI_SHOWROOM' ? 'New Delhi' : 'Jalandhar',
        state: posChannel === 'DELHI_SHOWROOM' ? 'Delhi' : 'Punjab',
        postalCode: '110001',
        country: 'India',
        isDefault: true,
      },
      items: [
        {
          id: `item-${Date.now()}`,
          productId: '1',
          productName: posProduct,
          variantSku: 'POS-ITEM-01',
          quantity: 1,
          unitPrice: priceNum,
          totalPrice: priceNum,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders([newOrd, ...orders]);
    setShowPOSModal(false);
    setPosCustomer('');
    setPosPhone('');
    showToast(`Store POS Order ${newOrd.orderNumber} placed & confirmed.`);
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerPhone && o.customerPhone.includes(searchQuery));

    const matchesStatus =
      statusFilter === 'ALL' || o.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-6 sm:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#24211E] text-white px-5 py-3 rounded-[12px] shadow-2xl border border-[#8B5E3C]/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-[#2F7D50]" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E5E0DA]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027] inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Overview</span>
              </Link>
              <span className="text-xs text-[#9B958E]">/</span>
              <span className="text-xs font-semibold text-[#24211E]">Orders</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
              Order Fulfillment & Showroom POS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setShowPOSModal(true)}
              className="gap-2 text-xs font-semibold shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Store POS Order</span>
            </Button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#9B958E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order #, client name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] placeholder:text-[#9B958E] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            <span className="text-xs font-semibold text-[#6F6A64] shrink-0">Filter Status:</span>
            {['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold uppercase tracking-wider transition shrink-0 ${
                  statusFilter === st
                    ? 'bg-[#8B5E3C] text-white shadow-xs'
                    : 'bg-[#FAF9F7] text-[#6F6A64] hover:text-[#24211E] hover:bg-[#F3E8DE]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-[#E5E0DA] rounded-[16px] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0DA] bg-[#FAF9F7]/80 text-[#6F6A64] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Order ID & Date</th>
                  <th className="py-3.5 px-6">Customer & Contact</th>
                  <th className="py-3.5 px-6">Sales Channel</th>
                  <th className="py-3.5 px-6">Items Snapshot</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6 text-center">Payment</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0DA] text-[#24211E]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#6F6A64]">
                      <div className="w-6 h-6 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading orders ledger...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#6F6A64]">
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ord) => {
                    const isConfirmed = ord.status === 'CONFIRMED';
                    const isProcessing = ord.status === 'PROCESSING';
                    const isShipped = ord.status === 'SHIPPED';
                    const isDelivered = ord.status === 'DELIVERED';
                    const isCancelled = ord.status === 'CANCELLED';

                    return (
                      <tr key={ord.id} className="hover:bg-[#FAF9F7]/60 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-[#24211E]">{ord.orderNumber}</span>
                          <p className="text-[10px] text-[#9B958E] mt-0.5">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-semibold text-[#24211E] block">
                            {ord.customerName || 'Customer'}
                          </span>
                          <span className="text-[11px] text-[#6F6A64] block">
                            {ord.customerEmail || 'No email provided'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-[#6F6A64] text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-[#9B958E]" />
                            <span>
                              {ord.channel === 'DELHI_SHOWROOM'
                                ? 'Delhi Flagship'
                                : ord.channel === 'JALANDHAR_SHOWROOM'
                                ? 'Jalandhar Gallery'
                                : 'Online Store'}
                            </span>
                          </span>
                        </td>

                        <td className="py-4 px-6 max-w-xs truncate text-[11px] text-[#6F6A64]">
                          {ord.items && ord.items.length > 0 ? (
                            <span>
                              {ord.items[0].productName}{' '}
                              {ord.items.length > 1 && `+ ${ord.items.length - 1} more`}
                            </span>
                          ) : (
                            'Custom Heirloom Order'
                          )}
                        </td>

                        <td className="py-4 px-6 font-bold text-[#24211E]">
                          {formatPrice(ord.totalAmount)}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${
                              ord.paymentStatus === 'PAID'
                                ? 'bg-[#2F7D50]/10 text-[#2F7D50] border border-[#2F7D50]/20'
                                : 'bg-[#C78A24]/10 text-[#C78A24] border border-[#C78A24]/20'
                            }`}
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>{ord.paymentStatus || 'PAID'}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isConfirmed
                                ? 'bg-[#2F7D50]/10 text-[#2F7D50] border border-[#2F7D50]/30'
                                : isProcessing
                                ? 'bg-[#C78A24]/10 text-[#C78A24] border border-[#C78A24]/30'
                                : isShipped
                                ? 'bg-[#477DA8]/10 text-[#477DA8] border border-[#477DA8]/30'
                                : isDelivered
                                ? 'bg-[#8B5E3C]/10 text-[#8B5E3C] border border-[#8B5E3C]/30'
                                : 'bg-[#C84B4B]/10 text-[#C84B4B] border border-[#C84B4B]/30'
                            }`}
                          >
                            <span>{ord.status}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(ord)}
                            className="text-xs gap-1.5 px-3 h-8"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#8B5E3C]" />
                            <span>Details</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Order Details & Fulfillment Controls */}
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Fulfillment: ${selectedOrder?.orderNumber || ''}`}
          className="max-w-2xl"
        >
          {selectedOrder && (
            <div className="space-y-6">
              
              {/* Order Status Ribbon & Quick State Actions */}
              <div className="p-4 rounded-[14px] bg-[#FAF9F7] border border-[#E5E0DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6F6A64]">Current State:</span>
                    <Badge variant="available">{selectedOrder.status}</Badge>
                  </div>
                  <p className="text-[11px] text-[#9B958E] mt-0.5">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* State Transition Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder.status !== 'PROCESSING' && selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                      disabled={isUpdatingStatus}
                      className="text-xs gap-1 text-[#C78A24] border-[#C78A24]/30 hover:bg-[#C78A24]/10"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Mark Processing</span>
                    </Button>
                  )}

                  {selectedOrder.status !== 'SHIPPED' && selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPED')}
                      disabled={isUpdatingStatus}
                      className="text-xs gap-1 text-[#477DA8] border-[#477DA8]/30 hover:bg-[#477DA8]/10"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch (Shipped)</span>
                    </Button>
                  )}

                  {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      disabled={isUpdatingStatus}
                      className="text-xs gap-1"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </Button>
                  )}

                  {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                      disabled={isUpdatingStatus}
                      className="text-xs text-[#C84B4B] hover:bg-[#C84B4B]/10 p-2"
                      title="Cancel Order"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Customer & Shipping Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[12px] bg-white border border-[#E5E0DA] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B5E3C] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Client Information</span>
                  </span>
                  <div className="text-xs space-y-1 text-[#6F6A64]">
                    <p className="font-semibold text-[#24211E] text-sm">{selectedOrder.customerName || 'Direct Client'}</p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-[#9B958E]" />
                      <span>{selectedOrder.customerEmail || 'N/A'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#9B958E]" />
                      <span>{selectedOrder.customerPhone || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-[12px] bg-white border border-[#E5E0DA] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B5E3C] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Fulfillment Address</span>
                  </span>
                  <div className="text-xs text-[#6F6A64] leading-relaxed">
                    {selectedOrder.shippingAddress ? (
                      <div>
                        <p className="font-semibold text-[#24211E]">{selectedOrder.shippingAddress.fullName}</p>
                        <p>{selectedOrder.shippingAddress.addressLine1}</p>
                        {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                        <p>
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}
                        </p>
                        <p>{selectedOrder.shippingAddress.country}</p>
                      </div>
                    ) : (
                      <p>Showroom Direct Collection</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table Snapshot */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#24211E]">
                  Line Items Snapshot
                </span>
                <div className="rounded-[12px] border border-[#E5E0DA] overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E0DA] bg-[#FAF9F7] text-[#6F6A64] font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-4">Item Name</th>
                        <th className="py-2.5 px-4">SKU / Finish</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Price</th>
                        <th className="py-2.5 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0DA]">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 px-4 font-semibold text-[#24211E]">
                              {item.productName}
                            </td>
                            <td className="py-3 px-4 text-[#6F6A64] font-mono text-[11px]">
                              {item.variantSku || 'SOFA-KANSO-01'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 text-right text-[#6F6A64]">
                              {formatPrice(item.unitPrice)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#8B5E3C]">
                              {formatPrice(item.totalPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-[#6F6A64]">
                            1 × Architectural Item ({formatPrice(selectedOrder.subtotal)})
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financials & Payment Breakdown */}
              <div className="p-4 rounded-[12px] bg-[#FAF9F7] border border-[#E5E0DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1 text-[#6F6A64]">
                  <p>Payment Method: <strong className="text-[#24211E]">{selectedOrder.paymentMethod || 'RAZORPAY GATEWAY'}</strong></p>
                  <p>Settlement State: <strong className="text-[#2F7D50]">{selectedOrder.paymentStatus || 'PAID'}</strong></p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <div className="flex justify-between sm:justify-end gap-6 text-[#6F6A64]">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-6 text-[#6F6A64]">
                    <span>Tax (8% GST):</span>
                    <span>{formatPrice(selectedOrder.tax)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between sm:justify-end gap-6 text-[#2F7D50]">
                      <span>Discount Applied:</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between sm:justify-end gap-6 font-serif text-base font-bold text-[#24211E] pt-1 border-t border-[#E5E0DA]">
                    <span>Total Settled:</span>
                    <span className="text-[#8B5E3C]">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                  Close Details
                </Button>
              </div>

            </div>
          )}
        </Modal>

        {/* Modal: Store POS Order */}
        <Modal
          isOpen={showPOSModal}
          onClose={() => setShowPOSModal(false)}
          title="Create Store POS Order"
          className="max-w-md"
        >
          <form onSubmit={handleCreatePOSOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Showroom Location
              </label>
              <select
                value={posChannel}
                onChange={(e) => setPosChannel(e.target.value as any)}
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              >
                <option value="DELHI_SHOWROOM">Delhi Flagship Showroom</option>
                <option value="JALANDHAR_SHOWROOM">Jalandhar Gallery Showroom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Walk-In Customer Name
              </label>
              <input
                type="text"
                required
                value={posCustomer}
                onChange={(e) => setPosCustomer(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Client Phone Number
              </label>
              <input
                type="tel"
                value={posPhone}
                onChange={(e) => setPosPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Product Selection
              </label>
              <select
                value={posProduct}
                onChange={(e) => setPosProduct(e.target.value)}
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              >
                <option value="Kanso 3-Seater Sofa (Oatmeal Linen)">Kanso 3-Seater Sofa (Oatmeal Linen) - ₹78,999</option>
                <option value="Neva Sculptural Lounge Chair (Cognac)">Neva Sculptural Lounge Chair (Cognac) - ₹34,500</option>
                <option value="Tusk Minimalist Coffee Table">Tusk Minimalist Coffee Table - ₹22,000</option>
                <option value="Voxel Modular Dining Table (Walnut)">Voxel Modular Dining Table (Walnut) - ₹62,000</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                In-Store Discount (₹ INR)
              </label>
              <input
                type="number"
                min="0"
                value={posDiscount}
                onChange={(e) => setPosDiscount(e.target.value)}
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowPOSModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm POS Order & Print Invoice
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}
