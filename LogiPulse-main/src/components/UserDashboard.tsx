import React, { useState } from 'react';
import { useLogiPulse } from '../context/LogiPulseContext';
import { InteractiveMap } from './InteractiveMap';
import { Order, Coordinates, PackageDetails } from '../types/courier';
import {
  Package,
  Plus,
  Clock,
  CheckCircle2,
  Bike,
  MessageSquare,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Send,
  Star,
  Check,
  X,
  Shield,
  Truck,
  Sparkles,
} from 'lucide-react';

const ADDRESS_PRESETS = [
  { name: 'Clifton Block 4, Near Do Talwar, Karachi', lat: 24.8190, lng: 67.0280 },
  { name: 'DHA Phase 6, Khayaban-e-Shahbaz, Karachi', lat: 24.7892, lng: 67.0645 },
  { name: 'I.I. Chundrigar Road, City Financial Tower, Karachi', lat: 24.8510, lng: 67.0011 },
  { name: 'PECHS Block 6, Shahrah-e-Faisal, Karachi', lat: 24.8615, lng: 67.0682 },
  { name: 'Saddar Electronics Market, Abdullah Haroon Rd, Karachi', lat: 24.8569, lng: 67.0163 },
  { name: 'Gulshan-e-Iqbal Block 13-D, University Road, Karachi', lat: 24.9214, lng: 67.0945 },
  { name: 'North Nazimabad Block H, Karachi', lat: 24.9385, lng: 67.0375 },
  { name: 'Bahria Town Karachi, Main Gate, Super Highway', lat: 24.9810, lng: 67.1120 },
];

interface UserDashboardProps {
  activeSection?: 'home' | 'orders' | 'riders';
  setActiveSection?: (sec: 'home' | 'orders' | 'riders') => void;
  isBookingModalOpen?: boolean;
  setIsBookingModalOpen?: (open: boolean) => void;
  compact?: boolean;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  activeSection,
  setActiveSection,
  isBookingModalOpen,
  setIsBookingModalOpen,
  compact = false,
}) => {
  const [localSection, setLocalSection] = useState<'home' | 'orders' | 'riders'>('home');
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const currentActiveSection = activeSection ?? localSection;
  const handleSetActiveSection = setActiveSection ?? setLocalSection;
  const currentModalOpen = isBookingModalOpen ?? localModalOpen;
  const handleSetModalOpen = setIsBookingModalOpen ?? setLocalModalOpen;
  const {
    orders,
    users,
    currentUser,
    createOrder,
    assignRider,
    selectedOrderId,
    setSelectedOrderId,
    getOrderMessages,
    sendMessage,
    getUserById,
  } = useLogiPulse();

  // Booking Form State
  const [pickupPreset, setPickupPreset] = useState<number>(0);
  const [dropoffPreset, setDropoffPreset] = useState<number>(1);
  const [customPickup, setCustomPickup] = useState('');
  const [customDropoff, setCustomDropoff] = useState('');
  const [packageTitle, setPackageTitle] = useState('Confidential Legal Envelope');
  const [category, setCategory] = useState<PackageDetails['category']>('Document');
  const [weightKg, setWeightKg] = useState<number>(1.2);
  const [notes, setNotes] = useState('Ring buzzer #402 at front gate');
  const [isFragile, setIsFragile] = useState<boolean>(false);

  // Chat Widget State
  const [chatInput, setChatInput] = useState('');

  // Orders strictly belonging to the logged-in user
  const userOrders = orders.filter((o) => o.user_id === currentUser.id);
  const activeOrder = userOrders.find((o) => o.order_id === selectedOrderId) || userOrders[0];
  const assignedRider = activeOrder?.rider_id ? getUserById(activeOrder.rider_id) : undefined;
  const messages = activeOrder ? getOrderMessages(activeOrder.order_id) : [];
  const onlineRiders = users.filter((u) => u.role === 'rider' && u.isApproved && u.isOnline);

  // Helper for generating realistic coordinates with jitter
  const generateMockCoords = (baseLat: number, baseLng: number): Coordinates => {
    const jitterLat = (Math.random() - 0.5) * 0.006;
    const jitterLng = (Math.random() - 0.5) * 0.006;
    return {
      lat: Number((baseLat + jitterLat).toFixed(6)),
      lng: Number((baseLng + jitterLng).toFixed(6)),
    };
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const pickupChoice = ADDRESS_PRESETS[pickupPreset];
    const dropoffChoice = ADDRESS_PRESETS[dropoffPreset];

    const pickupAddress = customPickup.trim() || pickupChoice.name;
    const dropoffAddress = customDropoff.trim() || dropoffChoice.name;

    // Generate hidden mock lat/lng coordinates upon submit
    const pickupCoords = generateMockCoords(pickupChoice.lat, pickupChoice.lng);
    const dropoffCoords = generateMockCoords(dropoffChoice.lat, dropoffChoice.lng);

    const calculatedFare = Number((250 + weightKg * 100 + (isFragile ? 150 : 0)).toFixed(0));

    const newOrder = createOrder({
      pickup_address: pickupAddress,
      pickup_coords: pickupCoords,
      dropoff_address: dropoffAddress,
      dropoff_coords: dropoffCoords,
      package_details: {
        title: packageTitle.trim() || 'Express Courier Package',
        category,
        weightKg,
        notes: notes.trim(),
        isFragile,
      },
      fare_amount: calculatedFare,
    });

    handleSetModalOpen(false);
    setSelectedOrderId(newOrder.order_id);
    handleSetActiveSection('orders');
  };

  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeOrder) return;
    sendMessage(activeOrder.order_id, currentUser.id, chatInput.trim());
    setChatInput('');
  };

  const quickChatChips = [
    'Bhai main gate per agaya hoon',
    'Security guard ko handover karden',
    'Buzzer press kardiya hai',
    'Parcel safely receive hogaya, shukriya!',
  ];

  const getStepProgress = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Picked Up':
        return 1;
      case 'In Transit':
        return 2;
      case 'Delivered':
        return 3;
    }
  };

  const currentStep = activeOrder ? getStepProgress(activeOrder.status) : 0;

  return (
    <div className="space-y-12">
      {/* =========================================================================
          SECTION 1: HERO SECTION (Styled exactly like the reference image)
          ========================================================================= */}
      {currentActiveSection === 'home' && (
        <section className="relative bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content (Matches exact typography and layout of reference image) */}
            <div className="lg:col-span-6 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0f0f11] tracking-tight uppercase leading-[1.05] font-sans">
                LOGIPULSE LOGISTICS <br />
                EASY TRUSTWORTHY.
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg">
                Logistics is the process of planning and executing the efficient transportation as well as delivery of goods from the point of origin to the point of consumption across Karachi.
              </p>

              {/* Action Buttons: BOOK SHIPPING + LOGIPULSE SUPPLY CHAIN */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => handleSetModalOpen(true)}
                  className="px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#0f0f11] hover:bg-black text-white shadow-md transition-all hover:scale-105 cursor-pointer"
                >
                  Book Shipping
                </button>

                <button
                  onClick={() => handleSetActiveSection('orders')}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f0f11] hover:text-slate-700 transition-colors cursor-pointer group"
                >
                  <span>Logipulse Supply Chain</span>
                  <div className="w-6 h-6 rounded-full bg-[#0f0f11] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              {/* Neon Green Decorative Chevrons (Signature graphic from reference image) */}
              <div className="pt-4 flex items-center gap-2">
                <svg width="70" height="40" viewBox="0 0 70 40" fill="none" className="opacity-90">
                  <path
                    d="M 10 35 L 30 5 L 45 5 L 25 35 Z"
                    fill="#d8ff36"
                  />
                  <path
                    d="M 35 35 L 55 5 L 70 5 L 50 35 Z"
                    fill="#d8ff36"
                  />
                </svg>
              </div>
            </div>

            {/* Right Hero Image: Courier delivering courier package box */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-4/3 sm:aspect-16/11 bg-slate-100 border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80"
                  alt="Courier courier delivering courier parcel box to customer"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />

                {/* Stat Badge Overlay matching reference bottom section */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 flex items-center justify-around text-center shadow-lg">
                  <div>
                    <span className="text-lg font-black text-[#0f0f11] block font-sans">
                      10,000+
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Delivery Complete
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-lg font-black text-[#0f0f11] block font-sans">
                      12 MIN
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Avg City Transit
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-lg font-black text-emerald-600 block font-sans">
                      {onlineRiders.length} ACTIVE
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Couriers On Duty
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Summary Cards (Under Hero) */}
      {currentActiveSection === 'home' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured Lime Highlight Card (Styled like "ROAD FREIGHT" card from reference image) */}
          <div className="bg-[#d8ff36] rounded-3xl p-8 border border-black/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-black font-mono">
                RAPID DISPATCH
              </span>
              <h3 className="text-2xl font-black uppercase text-black font-sans">
                SAME-DAY POINT-TO-POINT COURIER
              </h3>
              <p className="text-xs text-black/80 font-medium leading-relaxed max-w-md">
                Direct motorcycle & electric courier dispatches with continuous GPS coordinates and verified customer handover.
              </p>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                onClick={() => {
                  handleSetActiveSection('orders');
                  const el = document.getElementById('orders-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider bg-[#0f0f11] text-white hover:bg-black transition-all cursor-pointer shadow-sm"
              >
                Track Shipments
              </button>

              {/* Decorative White Zigzag Line from Reference Image */}
              <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className="opacity-90">
                <path
                  d="M0 12 L 15 2 L 30 18 L 45 4 L 60 20 L 75 8"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Quick Active Order Glance */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            {activeOrder ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Active Delivery Status
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                      #{activeOrder.order_id}
                    </span>
                  </div>

                  <h4 className="text-xl font-black uppercase text-[#0f0f11]">
                    {activeOrder.package_details.title}
                  </h4>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>From: <strong className="text-slate-900">{activeOrder.pickup_address.split(',')[0]}</strong></div>
                    <div>To: <strong className="text-slate-900">{activeOrder.dropoff_address.split(',')[0]}</strong></div>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-slate-100 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d8ff36] border border-black/40 animate-ping" />
                    <span className="text-xs font-black uppercase text-slate-900">
                      {activeOrder.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSetActiveSection('orders')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[#0f0f11] hover:text-black cursor-pointer group"
                  >
                    <span>Full Tracking</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col justify-between py-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    Customer Account · {currentUser.name}
                  </span>
                  <h4 className="text-xl font-black uppercase text-[#0f0f11]">
                    No Active Shipments
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Schedule a rapid intra-city courier with real-time GPS telemetry and certified handover.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleSetModalOpen(true)}
                    className="px-5 py-2.5 bg-[#0f0f11] text-white rounded-full text-xs font-bold uppercase hover:bg-black transition-all cursor-pointer"
                  >
                    Create Dispatch Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 2: ORDERS SECTION (Live Tracking + Stepper + Assigned Rider + Chat + History)
          ========================================================================= */}
      {(currentActiveSection === 'orders' || currentActiveSection === 'home') && (
        <section id="orders-section" className="space-y-6">
          {!activeOrder ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200/90 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0f0f11] text-[#d8ff36] flex items-center justify-center mx-auto shadow-md">
                <Package className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-black uppercase text-[#0f0f11]">
                  Welcome back, {currentUser.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You do not have any active shipments in transit right now. Book a courier below to track delivery in real time.
                </p>
              </div>
              <button
                onClick={() => handleSetModalOpen(true)}
                className="px-7 py-3 rounded-full text-xs font-black uppercase tracking-wider bg-[#d8ff36] text-black hover:bg-[#c6f135] transition-all cursor-pointer shadow-sm hover:scale-105"
              >
                Book Shipping Now
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    Active Dispatch · {currentUser.name}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-[#0f0f11]">
                    Order #{activeOrder.order_id} · {activeOrder.package_details.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-slate-900 font-mono">
                    Rs. {activeOrder.fare_amount}
                  </span>
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      activeOrder.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeOrder.status === 'In Transit'
                        ? 'bg-[#d8ff36] text-black font-extrabold'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {activeOrder.status}
                  </span>
                </div>
              </div>

            {/* Stepper: Pending -> Picked Up -> In Transit -> Delivered */}
            <div className="py-6">
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { title: 'Pending', desc: 'Rider dispatch' },
                  { title: 'Picked Up', desc: 'Package secured' },
                  { title: 'In Transit', desc: 'On city route' },
                  { title: 'Delivered', desc: 'Handed over' },
                ].map((step, idx) => {
                  const isCurrent = currentStep === idx;
                  const isPassed = currentStep >= idx;

                  return (
                    <div key={step.title} className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#d8ff36] text-black ring-4 ring-[#d8ff36]/30 font-black scale-110'
                            : isPassed
                            ? 'bg-[#0f0f11] text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isPassed && !isCurrent ? (
                          <Check className="w-4 h-4 text-[#d8ff36]" />
                        ) : (
                          <span>0{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs font-bold uppercase mt-2 ${isCurrent ? 'text-black' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.title}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:block">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Line */}
              <div className="relative mt-3 px-8">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-black via-black to-[#d8ff36] transition-all duration-500"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Live Map Frame */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <InteractiveMap
                  order={activeOrder}
                  rider={assignedRider}
                  height="h-64 sm:h-72"
                />
              </div>

              {/* Pickup & Dropoff Address Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{activeOrder.pickup_address}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                    GPS: {activeOrder.pickup_coords.lat.toFixed(4)}, {activeOrder.pickup_coords.lng.toFixed(4)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Dropoff</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{activeOrder.dropoff_address}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                    GPS: {activeOrder.dropoff_coords.lat.toFixed(4)}, {activeOrder.dropoff_coords.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ASSIGNED RIDER UI: Hidden until rider_id is populated!
              ========================================================================= */}
          {!activeOrder.rider_id ? (
            /* Unassigned / Searching State */
            <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-300 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#0f0f11] text-[#d8ff36] flex items-center justify-center mx-auto shadow-md">
                <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase">
                  Awaiting Courier Acceptance
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your order is broadcasting to all nearby certified riders in the network.
                </p>
              </div>

              {/* Instant Auto-Dispatch Action */}
              {onlineRiders.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nearestRider = onlineRiders[0];
                      if (nearestRider) assignRider(activeOrder.order_id, nearestRider.id);
                    }}
                    className="px-6 py-3 bg-[#0f0f11] hover:bg-black text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center gap-2 hover:scale-[1.02]"
                  >
                    <Bike className="w-4 h-4 text-[#d8ff36]" />
                    <span>Auto-Dispatch Nearest Available Courier</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Nearest certified courier located 1.2 km away ({onlineRiders[0]?.name || 'Available courier'})
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Assigned Rider Card + Chat Widget (Revealed when rider_id exists) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Rider Profile Card */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Assigned Courier
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#d8ff36] text-black">
                    Active On Duty
                  </span>
                </div>

                {assignedRider && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={assignedRider.avatar}
                        alt={assignedRider.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-black shadow-md"
                      />
                      <div>
                        <h4 className="text-lg font-black uppercase text-[#0f0f11]">
                          {assignedRider.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                          <span className="font-bold text-slate-900">{assignedRider.vehicleType}</span>
                          <span>·</span>
                          <span className="flex items-center text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                            {assignedRider.rating}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {assignedRider.completedDeliveries}+ Completed Deliveries
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0f0f11] text-white flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Live Route ETA
                        </span>
                        <div className="text-xl font-black text-[#d8ff36] font-sans">
                          {activeOrder.status === 'Delivered'
                            ? 'Delivered'
                            : activeOrder.estimated_delivery_time || '8 Minutes'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Direct Contact
                        </span>
                        <div className="text-xs font-mono text-slate-200 mt-0.5">
                          {assignedRider.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Widget */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[380px]">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0f0f11] text-[#d8ff36] flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black uppercase text-slate-900">
                      Chat with {assignedRider?.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Order #{activeOrder.order_id}
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fbfbfa]">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <MessageSquare className="w-6 h-6 mb-1 opacity-30 text-slate-900" />
                      <p className="text-xs font-semibold text-slate-700">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === currentUser.id;
                      const sender = getUserById(m.sender_id);
                      return (
                        <div
                          key={m.message_id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#0f0f11] text-white rounded-tr-xs'
                                : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-xs'
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Chips */}
                <div className="p-2 bg-slate-50 border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {quickChatChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(activeOrder.order_id, currentUser.id, chip)}
                      className="text-[10px] whitespace-nowrap px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-medium transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message to courier..."
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#d8ff36]"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="w-8 h-8 rounded-full bg-[#0f0f11] hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

          {/* Order History Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black uppercase text-[#0f0f11]">
                Past Delivery Records ({userOrders.length})
              </h3>
              <span className="text-xs text-slate-400">Click to track order</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#f8f9fa] text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Order</th>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Fare</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userOrders.map((ord) => (
                    <tr
                      key={ord.order_id}
                      onClick={() => setSelectedOrderId(ord.order_id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{ord.order_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {ord.package_details.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {ord.dropoff_address.split(',')[0]}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'In Transit'
                              ? 'bg-[#d8ff36] text-black font-extrabold'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        Rs. {ord.fare_amount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrderId(ord.order_id)}
                          className="px-3 py-1 bg-[#0f0f11] hover:bg-black text-white rounded-full text-[10px] font-bold uppercase transition-transform cursor-pointer"
                        >
                          Track
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 3: ACTIVE RIDERS SECTION (`activeSection === 'riders'`)
          ========================================================================= */}
      {currentActiveSection === 'riders' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Fleet Radar
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-[#0f0f11]">
                Active City Couriers Online ({onlineRiders.length})
              </h2>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-mono text-xs font-bold rounded-full">
              GPS STREAM: LIVE
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200">
            <InteractiveMap
              allRiders={users.filter((u) => u.role === 'rider' && u.isApproved)}
              allOrders={orders}
              showAllFleet={true}
              height="h-80"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {onlineRiders.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-[#f8f9fa] border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={r.avatar}
                    alt={r.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300"
                  />
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900">{r.name}</h4>
                    <p className="text-xs text-slate-500">{r.vehicleType}</p>
                    <span className="text-[10px] text-amber-500 font-bold">★ {r.rating}</span>
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-1" />
                  <div>ONLINE</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          BOOKING MODAL / DRAWER (Triggered by "Book Shipping" or Navbar)
          ========================================================================= */}
      {currentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => handleSetModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-4 mb-4 border-b border-slate-100">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Instant Courier Booking
              </span>
              <h3 className="text-2xl font-black uppercase text-[#0f0f11]">
                Book Rapid Delivery
              </h3>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Pickup Location (Origin)
                  </label>
                  <select
                    value={pickupPreset}
                    onChange={(e) => setPickupPreset(Number(e.target.value))}
                    className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                  >
                    {ADDRESS_PRESETS.map((item, idx) => (
                      <option key={`m-pick-${idx}`} value={idx} disabled={idx === dropoffPreset}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Dropoff Destination
                  </label>
                  <select
                    value={dropoffPreset}
                    onChange={(e) => setDropoffPreset(Number(e.target.value))}
                    className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                  >
                    {ADDRESS_PRESETS.map((item, idx) => (
                      <option key={`m-drop-${idx}`} value={idx} disabled={idx === pickupPreset}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Package Description
                  </label>
                  <input
                    type="text"
                    value={packageTitle}
                    onChange={(e) => setPackageTitle(e.target.value)}
                    required
                    placeholder="e.g. Legal documents, prototype electronics"
                    className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const newCat = e.target.value as any;
                        setCategory(newCat);
                        if (newCat === 'Fragile') setIsFragile(true);
                      }}
                      className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                    >
                      <option value="Document">Document</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Food">Food / Pastry</option>
                      <option value="Fragile">Fragile Specimen</option>
                      <option value="Parcel">Parcel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Weight ({weightKg} kg)
                    </label>
                    <input
                      type="range"
                      min="0.2"
                      max="15.0"
                      step="0.2"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                      className="w-full accent-black cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Fragile Item Care</div>
                      <div className="text-[10px] text-slate-500">Extra cushioning & priority handling (+Rs. 150)</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFragile}
                    onChange={(e) => setIsFragile(e.target.checked)}
                    className="w-4 h-4 accent-black cursor-pointer rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Delivery Instructions / Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Gate code, buzzer, contact..."
                    className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0f0f11] text-white rounded-2xl mt-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Estimated Fee</span>
                  <span className="text-xl font-black text-[#d8ff36]">Rs. {(250 + weightKg * 100 + (isFragile ? 150 : 0))}</span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider bg-[#d8ff36] text-black hover:bg-[#c6f135] transition-all cursor-pointer"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
