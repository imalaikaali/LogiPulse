import React, { useState } from 'react';
import { useLogiPulse } from '../context/LogiPulseContext';
import { Boxes, UserCheck, LogOut, ChevronDown } from 'lucide-react';

interface NavbarProps {
  activeSection: 'home' | 'orders' | 'riders';
  setActiveSection: (section: 'home' | 'orders' | 'riders') => void;
  onOpenBooking: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  setActiveSection,
  onOpenBooking,
  onOpenAuth,
}) => {
  const { currentView, setCurrentView, currentUser, users, setCurrentUser, logoutUser } = useLogiPulse();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand */}
          <div
            onClick={() => {
              setCurrentView('user');
              setActiveSection('home');
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-full bg-[#0f0f11] flex items-center justify-center text-white">
              <Boxes className="w-4 h-4 text-[#d8ff36]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0f0f11] font-sans">
                Logipulse
              </span>
              <span className="w-2 h-2 rounded-full bg-[#d8ff36]" />
            </div>
          </div>

          {/* Simple Navigation: Home, Orders, Active Riders */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                if (currentView !== 'user') setCurrentView('user');
                setActiveSection('home');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                currentView === 'user' && activeSection === 'home'
                  ? 'bg-[#0f0f11] text-white shadow-xs'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                if (currentView !== 'user') setCurrentView('user');
                setActiveSection('orders');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                currentView === 'user' && activeSection === 'orders'
                  ? 'bg-[#0f0f11] text-white shadow-xs'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              Orders
            </button>

            <button
              onClick={() => {
                if (currentView !== 'user') setCurrentView('user');
                setActiveSection('riders');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                currentView === 'user' && activeSection === 'riders'
                  ? 'bg-[#0f0f11] text-white shadow-xs'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              Active Riders
            </button>
          </nav>

          {/* User Account & Action Button */}
          <div className="flex items-center gap-3">
            {/* Real Logged In User Pill */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-white shadow-2xs"
                />
                <div className="hidden sm:block text-xs font-bold text-slate-900 leading-tight pr-1">
                  <div>{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 font-normal capitalize">
                    {currentUser.role === 'user' ? 'Customer' : currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* User Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                  <div className="p-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <span>Switch Account / Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logoutUser();
                        onOpenAuth();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Book Courier CTA */}
            <button
              onClick={() => {
                if (currentView !== 'user') setCurrentView('user');
                onOpenBooking();
              }}
              className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#d8ff36] hover:bg-[#c6f135] text-black transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
            >
              Book Courier
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
