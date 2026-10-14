/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogiPulseProvider, useLogiPulse } from './context/LogiPulseContext';
import { Navbar } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { RiderDashboard } from './components/RiderDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SchemaViewer } from './components/SchemaViewer';
import { ChatDrawer } from './components/ChatDrawer';
import { AuthModal } from './components/AuthModal';
import { X, CheckCircle, Info, AlertTriangle, ArrowUpRight, Boxes, Bike, Shield, Database } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentView, setCurrentView, activeChatOrderId, setActiveChatOrderId, toasts, dismissToast, users, setCurrentUser } = useLogiPulse();
  
  // Clean User navigation section state: 'home' | 'orders' | 'riders'
  const [activeSection, setActiveSection] = useState<'home' | 'orders' | 'riders'>('home');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 flex flex-col font-sans selection:bg-[#d8ff36] selection:text-black">
      {/* Simple Top Navigation with 3 Buttons: Home, Orders, Active Riders */}
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenBooking={() => setIsBookingModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentView === 'user' && (
          <UserDashboard
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            isBookingModalOpen={isBookingModalOpen}
            setIsBookingModalOpen={setIsBookingModalOpen}
          />
        )}
        {currentView === 'rider' && <RiderDashboard />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'schema' && <SchemaViewer />}
      </main>

      {/* Clean High-Contrast Footer with Quiet Links for Rider & Admin Panel */}
      <footer className="mt-16 bg-[#0f0f11] text-white border-t border-slate-900 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            {/* Minimalist Brand info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-sans">
                  Logipulse
                </span>
                <span className="text-xs text-[#d8ff36] font-mono">EXPRESS</span>
              </div>
              <p className="text-xs text-slate-400">
                Next-generation courier & logistics delivery platform in Karachi.
              </p>
            </div>

            {/* Little Links in Footer for Rider and Admin Panel */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-mono uppercase text-slate-500 mr-1">
                Internal Panels:
              </span>

              <button
                onClick={() => {
                  const r = users.find((u) => u.role === 'rider' && u.isApproved) || users.find((u) => u.role === 'rider');
                  if (r) setCurrentUser(r);
                  setCurrentView('rider');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === 'rider'
                    ? 'bg-[#d8ff36] text-black border-transparent font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Rider Panel</span>
              </button>

              <button
                onClick={() => {
                  const a = users.find((u) => u.role === 'admin');
                  if (a) setCurrentUser(a);
                  setCurrentView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-[#d8ff36] text-black border-transparent font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('schema');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === 'schema'
                    ? 'bg-[#d8ff36] text-black border-transparent font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>SQL DDL</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
            <div>
              © 2026 Logipulse Logistics. Powered by LogiPulse Unified State.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentView('user');
                  setActiveSection('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Back to User Home ↑
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Live Real-time Chat Drawer */}
      {activeChatOrderId && (
        <ChatDrawer
          orderId={activeChatOrderId}
          onClose={() => setActiveChatOrderId(null)}
        />
      )}

      {/* Account Authentication & Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Floating Notifications */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-3.5 rounded-2xl bg-[#0f0f11] text-white border border-slate-800 shadow-2xl flex items-start gap-3 text-xs transition-all animate-in slide-in-from-bottom-2"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-[#d8ff36]" />
              ) : toast.type === 'alert' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <Info className="w-4 h-4 text-sky-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>{toast.title}</span>
                <span className="text-[10px] text-slate-500 font-normal font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-500 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LogiPulseProvider>
      <AppContent />
    </LogiPulseProvider>
  );
}
