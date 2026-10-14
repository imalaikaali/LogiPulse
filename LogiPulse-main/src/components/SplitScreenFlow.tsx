import React, { useState } from 'react';
import { UserDashboard } from './UserDashboard';
import { RiderDashboard } from './RiderDashboard';
import { AdminDashboard } from './AdminDashboard';
import { useLogiPulse } from '../context/LogiPulseContext';
import { ArrowRight, Layers, Smartphone, Shield, Bike, User, Zap } from 'lucide-react';

export const SplitScreenFlow: React.FC = () => {
  const { orders, isAutoSimulating, toggleAutoSimulation } = useLogiPulse();
  const [mobileTab, setMobileTab] = useState<'user' | 'rider' | 'admin'>('user');

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const inTransitCount = orders.filter((o) => o.status === 'In Transit' || o.status === 'Picked Up').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  return (
    <div className="space-y-4">
      {/* Connected Flow Explainer Banner */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                One Connected Flow Architecture
              </h3>
              <span className="text-[10px] bg-sky-950 text-sky-400 px-2 py-0.2 rounded border border-sky-800 font-mono">
                Live State Synchronized
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Actions in any dashboard propagate instantly across User, Rider, and Admin via the shared React Context & database models.
            </p>
          </div>
        </div>

        {/* Live Flow Pipeline Badges */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-md border border-slate-800 shrink-0">
            <User className="w-3 h-3 text-sky-400" />
            <span className="text-slate-300 font-medium">1. User Books</span>
            <span className="text-amber-400">({pendingCount} Pending)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-md border border-slate-800 shrink-0">
            <Bike className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-300 font-medium">2. Rider Steers</span>
            <span className="text-sky-400">({inTransitCount} In Transit)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-md border border-slate-800 shrink-0">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span className="text-slate-300 font-medium">3. Admin Dispatches</span>
            <span className="text-emerald-400">({deliveredCount} Done)</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
        <button
          onClick={() => setMobileTab('user')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'user' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>User Interface</span>
        </button>
        <button
          onClick={() => setMobileTab('rider')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'rider' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Rider Interface</span>
        </button>
        <button
          onClick={() => setMobileTab('admin')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Interface</span>
        </button>
      </div>

      {/* Mobile Single Tab View */}
      <div className="block lg:hidden">
        {mobileTab === 'user' && <UserDashboard compact={true} />}
        {mobileTab === 'rider' && <RiderDashboard compact={true} />}
        {mobileTab === 'admin' && <AdminDashboard compact={true} />}
      </div>

      {/* Desktop 3-Column Synchronized View */}
      <div className="hidden lg:grid grid-cols-3 gap-4 items-start">
        {/* Column 1: Customer View */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Role: Customer (User)
            </h4>
          </div>
          <UserDashboard compact={true} />
        </div>

        {/* Column 2: Rider View */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Role: Courier (Rider)
            </h4>
          </div>
          <RiderDashboard compact={true} />
        </div>

        {/* Column 3: Admin View */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Role: Dispatcher (Admin)
            </h4>
          </div>
          <AdminDashboard compact={true} />
        </div>
      </div>
    </div>
  );
};
