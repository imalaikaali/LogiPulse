import React, { useState } from 'react';
import { useLogiPulse } from '../context/LogiPulseContext';
import { InteractiveMap } from './InteractiveMap';
import { OrderStatus, Order } from '../types/courier';
import {
  Shield,
  Truck,
  Users,
  DollarSign,
  PackageCheck,
  Search,
  Filter,
  ArrowUpDown,
  Bike,
  MessageSquare,
  Clock,
  Compass,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  FileText,
  UserCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const {
    orders,
    users,
    messages,
    assignRider,
    updateOrderStatus,
    selectedOrderId,
    setSelectedOrderId,
    setActiveChatOrderId,
    resetDatabase,
    approveRider,
    rejectRider,
    getPendingRiderApprovals,
  } = useLogiPulse();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [activeAdminTab, setActiveAdminTab] = useState<'all' | 'approvals' | 'orders'>('all');

  const pendingRiders = getPendingRiderApprovals();
  const approvedRiders = users.filter((u) => u.role === 'rider' && u.isApproved);
  const onlineRiders = approvedRiders.filter((r) => r.isOnline);

  // Stats calculation
  const totalOrders = orders.length;
  const inTransitCount = orders.filter((o) => o.status === 'In Transit' || o.status === 'Picked Up').length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
  const riders = users.filter((u) => u.role === 'rider');
  const totalGross = orders.reduce((acc, o) => acc + o.fare_amount, 0);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.package_details.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.dropoff_address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' ? true : o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedOrder = orders.find((o) => o.order_id === selectedOrderId) || orders[0];

  return (
    <div className="space-y-5">
      {/* Admin Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">Central Dispatch & Operations</h2>
            <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded font-mono">
              HQ ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full platform oversight, automated dispatch orchestration, fleet telemetry, and order reassignment.
          </p>
        </div>

        <button
          onClick={resetDatabase}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Fleet Telemetry</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Dispatches</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">{inTransitCount}</div>
          <div className="text-[11px] text-sky-400/90 mt-0.5">
            {pendingCount} Pending assignment
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Fleet Online</span>
            <Bike className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {onlineRiders.length} <span className="text-xs text-slate-500 font-normal">/ {approvedRiders.length}</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-0.5">Verified active fleet</div>
        </div>

        <div className={`p-3.5 rounded-xl border transition-all ${
          pendingRiders.length > 0 
            ? 'bg-amber-950/40 border-amber-600/60 ring-1 ring-amber-500/40' 
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Rider Approvals</span>
            </span>
            <Clock className={`w-4 h-4 ${pendingRiders.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${pendingRiders.length > 0 ? 'text-amber-300' : 'text-white'}`}>
            {pendingRiders.length}
          </div>
          <div className="text-[11px] text-amber-400/90 mt-0.5">
            {pendingRiders.length > 0 ? 'Awaiting verification' : 'All riders verified'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Delivered</span>
            <PackageCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{deliveredCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalOrders} lifetime orders</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Platform Gross</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">Rs. {totalGross}</div>
          <div className="text-[11px] text-emerald-400/90 mt-0.5">Avg: Rs. {Math.round(totalGross / (totalOrders || 1))} / trip</div>
        </div>
      </div>

      {/* DEDICATED RIDER APPROVALS & VERIFICATION HUB (Core User Requirement) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BadgeCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Rider Verification & Onboarding Hub</span>
                {pendingRiders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black uppercase">
                    {pendingRiders.length} Action Required
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                New courier riders must have their CNIC and vehicle credentials verified by Admin before accessing dispatch.
              </p>
            </div>
          </div>
        </div>

        {pendingRiders.length === 0 ? (
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5 py-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
            <div className="font-medium text-slate-300">All Registered Riders Are Verified</div>
            <div className="text-[11px] text-slate-500 max-w-md">
              When a new courier rider registers via the portal, their profile, CNIC, and vehicle details will appear here for Admin approval.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRiders.map((applicant) => (
              <div
                key={applicant.id}
                className="p-3.5 bg-slate-950 rounded-xl border border-amber-500/40 hover:border-amber-500/70 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={applicant.avatar}
                      alt={applicant.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/50"
                    />
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{applicant.name}</span>
                        <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded font-mono">
                          PENDING
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{applicant.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{applicant.phone}</div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {applicant.registeredAt ? new Date(applicant.registeredAt).toLocaleDateString() : 'Today'}
                  </span>
                </div>

                {/* Verification Document Info */}
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 font-mono text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Vehicle:</span>
                    <span className="text-white font-semibold">
                      {applicant.vehicleType || 'Motorcycle'} · Plate: {applicant.vehicleNumber || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">CNIC No:</span>
                    <span className="text-amber-400 font-bold">{applicant.cnicNumber || '42101-XXXXXXX-X'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Karachi Zone:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">{applicant.cityArea || 'Karachi'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => approveRider(applicant.id)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Verify Rider</span>
                  </button>

                  <button
                    onClick={() => rejectRider(applicant.id)}
                    className="py-2 px-3 bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-800 hover:border-rose-800 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fleet Unified City Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Fleet Dispatch & Live Grid Overview</h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Tracking {riders.length} Riders · {orders.filter((o) => o.status !== 'Delivered').length} Active Routes
          </div>
        </div>

        <InteractiveMap
          order={selectedOrder}
          rider={selectedOrder?.rider_id ? users.find((u) => u.id === selectedOrder.rider_id) : undefined}
          allRiders={riders}
          allOrders={orders}
          showAllFleet={true}
          height={compact ? 'h-60' : 'h-72'}
        />
      </div>

      {/* Orders Dispatch & Reassignment Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-3.5 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Orders Master Registry</h3>
            <span className="text-xs text-slate-400 font-mono">({filteredOrders.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders, items..."
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 w-44"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Picked Up">Picked Up</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Package Details</th>
                <th className="py-2.5 px-3">Assigned Rider</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Fare</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No orders matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const assignedRider = users.find((u) => u.id === ord.rider_id);
                  const isCurrentSelected = ord.order_id === selectedOrderId;

                  return (
                    <tr
                      key={ord.order_id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrentSelected ? 'bg-sky-950/20' : ''
                      }`}
                    >
                      {/* ID & Route preview */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-sky-400 font-semibold">#{ord.order_id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-white truncate">{ord.package_details.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {ord.package_details.category} · {ord.package_details.weightKg} kg
                          {ord.package_details.isFragile && ' · Fragile'}
                        </div>
                      </td>

                      {/* Rider Dropdown / Assign */}
                      <td className="py-3 px-3">
                        <select
                          value={ord.rider_id || ''}
                          onChange={(e) => assignRider(ord.order_id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-hidden focus:border-sky-500"
                        >
                          <option value="">(Unassigned)</option>
                          {riders.map((r) => (
                            <option key={r.id} value={r.id} disabled={!r.isApproved}>
                              {r.name} ({r.vehicleType}){r.isApproved ? '' : ' [Unapproved]'}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status Override */}
                      <td className="py-3 px-3">
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.order_id, e.target.value as OrderStatus)}
                          className={`rounded px-2 py-0.5 text-[11px] font-medium border focus:outline-hidden ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : ord.status === 'In Transit'
                              ? 'bg-sky-950 text-sky-300 border-sky-800'
                              : ord.status === 'Picked Up'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-950 text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Picked Up">Picked Up</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>

                      {/* Fare */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-200">
                        Rs. {ord.fare_amount}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrderId(ord.order_id)}
                            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                            title="Focus in Map"
                          >
                            Map
                          </button>
                          <button
                            onClick={() => setActiveChatOrderId(ord.order_id)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded border border-slate-700 transition-colors"
                            title="View Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fleet Roster */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Courier Fleet Telemetry & Status ({riders.length})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {riders.map((r) => {
            const riderOrders = orders.filter((o) => o.rider_id === r.id && o.status !== 'Delivered');

            return (
              <div
                key={r.id}
                className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={r.avatar}
                    alt={r.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <div className="font-medium text-white flex items-center gap-1">
                      <span>{r.name}</span>
                      <span className="text-[10px] text-amber-400">★ {r.rating}</span>
                      {r.isApproved ? (
                        <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded font-mono">
                          PENDING
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {r.vehicleType} · {riderOrders.length} active drop · {r.cityArea || 'Karachi'}
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        r.isApproved && r.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                      title={r.isApproved && r.isOnline ? 'Online' : 'Offline / Unverified'}
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {r.isApproved ? (r.isOnline ? 'Online' : 'Offline') : 'Unverified'}
                    </span>
                  </div>
                  {!r.isApproved && (
                    <button
                      onClick={() => approveRider(r.id)}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                  {r.isApproved && (
                    <div className="text-[9px] font-mono text-slate-500">
                      {r.current_coordinates ? `${r.current_coordinates.lat.toFixed(2)}, ${r.current_coordinates.lng.toFixed(2)}` : 'N/A'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
