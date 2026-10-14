import React from 'react';
import { useLogiPulse } from '../context/LogiPulseContext';
import { InteractiveMap } from './InteractiveMap';
import {
  Bike,
  Navigation,
  CheckCircle2,
  Package,
  MessageSquare,
  Play,
  Pause,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';

export const RiderDashboard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const {
    orders,
    users,
    currentUser,
    selectedOrderId,
    setSelectedOrderId,
    assignRider,
    updateOrderStatus,
    stepRiderMovement,
    isAutoSimulating,
    toggleAutoSimulation,
    setActiveChatOrderId,
    getOrderMessages,
    getUserById,
    setCurrentUser,
    setCurrentView,
  } = useLogiPulse();

  // Determine current active rider (prefer approved rider if current is visitor)
  const rider = currentUser.role === 'rider' ? currentUser : users.find((u) => u.role === 'rider' && u.isApproved) || users.find((u) => u.role === 'rider')!;

  // If this rider is pending Admin approval, show verification notice
  if (rider && rider.isApproved !== true) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="p-8 bg-slate-900 border border-amber-500/50 rounded-3xl shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight">
            Rider Verification Pending
          </h2>
          <p className="text-xs text-slate-300">
            Welcome, <strong>{rider.name}</strong>. Your courier account is registered with CNIC{' '}
            <span className="font-mono text-amber-400">{rider.cnicNumber || 'submitted'}</span> and vehicle{' '}
            <span className="font-mono text-white">{rider.vehicleNumber || rider.vehicleType}</span>.
          </p>
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-500 font-mono">Status Notice:</div>
            <div>• Security policy requires Admin to review and verify your courier credentials.</div>
            <div>• Once approved, you can go Online and receive delivery orders across Karachi.</div>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                const admin = users.find((u) => u.role === 'admin');
                if (admin) setCurrentUser(admin);
                setCurrentView('admin');
              }}
              className="w-full py-3 bg-[#d8ff36] hover:bg-[#cbf528] text-black font-black text-xs uppercase tracking-wider rounded-full transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Switch to Admin Panel to Review & Approve</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Find assigned orders for this rider
  const assignedOrders = orders.filter((o) => o.rider_id === rider.id);
  const activeOrder = assignedOrders.find((o) => o.order_id === selectedOrderId) || assignedOrders.find((o) => o.status !== 'Delivered') || assignedOrders[0];
  
  // Available unassigned pending orders
  const pendingPool = orders.filter((o) => o.status === 'Pending' && !o.rider_id);
  const customer = activeOrder ? getUserById(activeOrder.user_id) : undefined;
  const messages = activeOrder ? getOrderMessages(activeOrder.order_id) : [];

  return (
    <div className="space-y-5">
      {/* Top Rider Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src={rider.avatar}
            alt={rider.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white tracking-tight">{rider.name}</h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online & Dispatch Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Vehicle: <span className="text-slate-300 font-medium">{rider.vehicleType}</span> · Rating: ★ {rider.rating} · {rider.completedDeliveries} Trips
            </p>
          </div>
        </div>

        {/* Live GPS Telemetry Stream Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAutoSimulation(activeOrder?.order_id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
              isAutoSimulating
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600/30'
                : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/30'
            }`}
          >
            {isAutoSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoSimulating ? 'Pause GPS Broadcast' : 'Live GPS Broadcast'}</span>
          </button>
        </div>
      </div>

      {/* Active Mission Cockpit */}
      {activeOrder ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                Active Courier Mission #{activeOrder.order_id}
              </span>
              <h3 className="text-base font-semibold text-white">{activeOrder.package_details.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Fare: Rs. {activeOrder.fare_amount}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded ${
                  activeOrder.status === 'Delivered'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-sky-950 text-sky-300 border border-sky-800'
                }`}
              >
                {activeOrder.status}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <InteractiveMap
              order={activeOrder}
              rider={rider}
              height={compact ? 'h-52' : 'h-64'}
            />

            {/* Stepper Control Deck */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Mission Progress & Handshake Controls:</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Rider GPS: {rider.current_coordinates?.lat.toFixed(4)}, {rider.current_coordinates?.lng.toFixed(4)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Pickup button */}
                <button
                  onClick={() => updateOrderStatus(activeOrder.order_id, 'Picked Up')}
                  disabled={activeOrder.status !== 'Pending'}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                    activeOrder.status === 'Picked Up' || activeOrder.status === 'In Transit' || activeOrder.status === 'Delivered'
                      ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                      : activeOrder.status === 'Pending'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-sm cursor-pointer'
                      : 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>1. Mark Picked Up</span>
                </button>

                {/* 2. Transit button */}
                <button
                  onClick={() => updateOrderStatus(activeOrder.order_id, 'In Transit')}
                  disabled={activeOrder.status !== 'Picked Up'}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                    activeOrder.status === 'In Transit' || activeOrder.status === 'Delivered'
                      ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                      : activeOrder.status === 'Picked Up'
                      ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-sm cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>2. Start Transit</span>
                </button>

                {/* 3. Advance GPS */}
                <button
                  onClick={() => stepRiderMovement(activeOrder.order_id)}
                  disabled={activeOrder.status === 'Delivered'}
                  className="px-3 py-2 text-xs font-medium rounded-lg border bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 text-sky-400" />
                  <span>3. Advance Location</span>
                </button>

                {/* 4. Delivered button */}
                <button
                  onClick={() => updateOrderStatus(activeOrder.order_id, 'Delivered')}
                  disabled={activeOrder.status === 'Delivered'}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                    activeOrder.status === 'Delivered'
                      ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>4. Mark Delivered</span>
                </button>
              </div>
            </div>

            {/* Destination & Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Pickup Origin</span>
                    <span className="text-slate-200">{activeOrder.pickup_address}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Customer Destination</span>
                    <span className="text-slate-200">{activeOrder.dropoff_address}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Customer Info & Delivery Note
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{customer?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400">{customer?.phone || '+1 555-0199'}</div>
                    </div>
                    {activeOrder.package_details.isFragile && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800 rounded">
                        FRAGILE
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-amber-300/90 italic bg-amber-950/30 p-1.5 rounded border border-amber-900/30">
                    "{activeOrder.package_details.notes || 'Handle parcel with standard care.'}"
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setActiveChatOrderId(activeOrder.order_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-md transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Customer ({messages.length})</span>
                  </button>
                  <span className="text-slate-400 text-[11px]">
                    Weight: <strong className="text-white">{activeOrder.package_details.weightKg} kg</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
          <Bike className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium">No Active Delivery in Progress</p>
          <p className="text-xs text-slate-500 mt-1">Accept an order from the dispatch radar below to start a run.</p>
        </div>
      )}

      {/* Available Orders Dispatch Radar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Available Dispatch Radar</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-sky-950 text-sky-400 border border-sky-800">
              {pendingPool.length} available
            </span>
          </h4>
        </div>

        {pendingPool.length === 0 ? (
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/80 text-center text-xs text-slate-500">
            No pending dispatches right now. Use the Customer Dashboard to book an order.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pendingPool.map((ord) => (
              <div
                key={ord.order_id}
                className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2.5 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sky-400 font-semibold">#{ord.order_id}</span>
                  <span className="font-mono text-emerald-400 font-bold">Rs. {ord.fare_amount}</span>
                </div>

                <div>
                  <h5 className="font-medium text-white">{ord.package_details.title}</h5>
                  <p className="text-[11px] text-slate-400">
                    {ord.package_details.category} · {ord.package_details.weightKg} kg
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1.5">
                  <div className="truncate">From: {ord.pickup_address.split(',')[0]}</div>
                  <div className="truncate">To: {ord.dropoff_address.split(',')[0]}</div>
                </div>

                <button
                  onClick={() => assignRider(ord.order_id, rider.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Accept Delivery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
