import React, { useState } from 'react';
import { useLogiPulse } from '../context/LogiPulseContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  Bike,
  ArrowRight,
  AlertCircle,
  X,
  Phone,
  MapPin,
  FileText,
  BadgeCheck,
  Clock,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KARACHI_AREAS = [
  'Clifton Block 2 & 4, Karachi',
  'DHA Phase 5 & 6, Karachi',
  'Gulshan-e-Iqbal Block 13, Karachi',
  'North Nazimabad & Buffer Zone, Karachi',
  'PECHS & Shahrah-e-Faisal, Karachi',
  'Saddar & I.I. Chundrigar Road, Karachi',
  'Gulistan-e-Johar, Karachi',
  'Bahria Town Karachi',
  'Korangi Industrial Area, Karachi',
  'Malir Cantonment, Karachi',
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    loginUser,
    registerCustomer,
    registerRider,
  } = useLogiPulse();

  // Auth Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  // In register mode: 'user' (Customer) or 'rider' (Courier)
  const [registerRole, setRegisterRole] = useState<'user' | 'rider'>('user');

  // Sign In inputs
  const [signInRole, setSignInRole] = useState<'all' | 'user' | 'rider' | 'admin'>('all');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Customer Register inputs
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custPhone, setCustPhone] = useState('+92 300 ');
  const [custArea, setCustArea] = useState(KARACHI_AREAS[0]);

  // Rider Register inputs
  const [riderName, setRiderName] = useState('');
  const [riderEmail, setRiderEmail] = useState('');
  const [riderPassword, setRiderPassword] = useState('');
  const [riderPhone, setRiderPhone] = useState('+92 333 ');
  const [riderVehicleType, setRiderVehicleType] = useState<
    'Motorcycle' | 'Bicycle' | 'Electric Scooter' | 'Van'
  >('Motorcycle');
  const [riderVehicleNumber, setRiderVehicleNumber] = useState('KHI-');
  const [riderCnic, setRiderCnic] = useState('42101-');
  const [riderArea, setRiderArea] = useState(KARACHI_AREAS[0]);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingNotice, setPendingNotice] = useState<{
    show: boolean;
    name?: string;
    email?: string;
  }>({ show: false });

  if (!isOpen) return null;

  // Sign In Submit
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPendingNotice({ show: false });

    if (!signInEmail.trim()) {
      setErrorMsg('Please enter your email address or username.');
      return;
    }
    if (!signInPassword.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    const res = loginUser(signInEmail, signInPassword);

    if (res.success) {
      if (signInRole === 'admin' && res.user?.role !== 'admin') {
        setErrorMsg('Access denied: This account does not have Admin privileges.');
        return;
      }
      if (signInRole === 'rider' && res.user?.role !== 'rider') {
        setErrorMsg('Access denied: This account is not registered as a Courier Rider.');
        return;
      }
      onClose();
    } else {
      if (res.isPendingApproval) {
        setPendingNotice({
          show: true,
          name: res.user?.name,
          email: res.user?.email,
        });
      } else {
        setErrorMsg(res.error || 'Authentication failed.');
      }
    }
  };

  // Customer Registration Submit
  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!custName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!custEmail.trim() || !custEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!custPassword.trim() || custPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    const res = registerCustomer({
      name: custName,
      email: custEmail,
      password: custPassword,
      phone: custPhone,
      cityArea: custArea,
    });

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  // Rider Registration Submit
  const handleRiderRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!riderName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!riderEmail.trim() || !riderEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!riderPassword.trim() || riderPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    if (!riderCnic.trim() || riderCnic.length < 8) {
      setErrorMsg('Please enter your valid National CNIC number for verification.');
      return;
    }
    if (!riderVehicleNumber.trim()) {
      setErrorMsg('Please enter your vehicle registration plate number.');
      return;
    }

    const res = registerRider({
      name: riderName,
      email: riderEmail,
      password: riderPassword,
      phone: riderPhone,
      vehicleType: riderVehicleType,
      vehicleNumber: riderVehicleNumber,
      cnicNumber: riderCnic,
      cityArea: riderArea,
    });

    if (res.success) {
      setPendingNotice({
        show: true,
        name: riderName,
        email: riderEmail,
      });
      // Switch to signin view with explanation
      setAuthMode('signin');
      setSignInEmail(riderEmail);
      setSignInPassword(riderPassword);
    } else {
      setErrorMsg(res.error || 'Rider registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 border border-slate-200 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pb-3 mb-4 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d8ff36]/30 text-black text-[10px] font-black uppercase rounded-full mb-1.5">
            <span>KARACHI COURIER NETWORK</span>
            <span>·</span>
            <span>AUTHENTICATION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-[#0f0f11] font-sans tracking-tight">
            Logipulse Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized access for Karachi customers, courier riders, and dispatch operations.
          </p>
        </div>

        {/* Pending Verification Notice / Alert */}
        {pendingNotice.show && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-950">
                  Rider Verification Pending Admin Approval
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Courier account for <strong>{pendingNotice.name || 'this rider'}</strong> is registered, but requires Admin verification before dispatch access.
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Please await verification and approval from the Operations Administrator.
              </span>
            </div>
          </div>
        )}

        {/* General Error Notice */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode Switcher Tabs: [ Sign In ] vs [ Register New Account ] */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
              authMode === 'signin'
                ? 'bg-white text-black shadow-xs font-black'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Sign In to Account
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg('');
              setPendingNotice({ show: false });
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
              authMode === 'register'
                ? 'bg-white text-black shadow-xs font-black'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Register (New Account)
          </button>
        </div>

        {/* TAB 1: SIGN IN FORM */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Portal / Role
              </label>
              <select
                value={signInRole}
                onChange={(e) => setSignInRole(e.target.value as any)}
                className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
              >
                <option value="all">Auto-Detect Role (Customer, Rider, or Admin)</option>
                <option value="user">Customer</option>
                <option value="rider">Courier Rider</option>
                <option value="admin">Operations Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="Enter your email or username"
                  className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0f0f11] hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] mt-3"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 text-[#d8ff36]" />
            </button>

            <div className="text-center pt-2 text-[11px] text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg('');
                }}
                className="font-bold text-black underline cursor-pointer"
              >
                Register as Customer or Rider
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER FORM */}
        {authMode === 'register' && (
          <div>
            {/* Account Type Selection (Customer vs Rider) */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setRegisterRole('user');
                  setErrorMsg('');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  registerRole === 'user'
                    ? 'border-black bg-slate-950 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs uppercase">Customer</span>
                  <UserIcon
                    className={`w-4 h-4 ${
                      registerRole === 'user' ? 'text-[#d8ff36]' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div
                  className={`text-[10px] ${
                    registerRole === 'user' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Instant Access · Send & track parcels
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterRole('rider');
                  setErrorMsg('');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  registerRole === 'rider'
                    ? 'border-black bg-slate-950 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs uppercase">Courier Rider</span>
                  <Bike
                    className={`w-4 h-4 ${
                      registerRole === 'rider' ? 'text-[#d8ff36]' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div
                  className={`text-[10px] ${
                    registerRole === 'rider' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Requires Admin Verification
                </div>
              </button>
            </div>

            {/* CUSTOMER REGISTRATION FORM */}
            {registerRole === 'user' && (
              <form onSubmit={handleCustomerRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Customer Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="e.g. Arif Rehman"
                      className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        placeholder="e.g. arif@gmail.com"
                        className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={custPassword}
                        onChange={(e) => setCustPassword(e.target.value)}
                        placeholder="Choose password"
                        className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Karachi Area
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={custArea}
                        onChange={(e) => setCustArea(e.target.value)}
                        className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                      >
                        {KARACHI_AREAS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Your customer account will be activated immediately upon signup. You can log in anytime.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0f0f11] hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <span>Register Customer Account & Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#d8ff36]" />
                </button>
              </form>
            )}

            {/* RIDER REGISTRATION FORM (PENDING ADMIN APPROVAL) */}
            {registerRole === 'rider' && (
              <form onSubmit={handleRiderRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Courier Rider Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood / Farhan Akhtar"
                      className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={riderEmail}
                        onChange={(e) => setRiderEmail(e.target.value)}
                        placeholder="rider@example.com"
                        className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={riderPassword}
                        onChange={(e) => setRiderPassword(e.target.value)}
                        placeholder="Choose password"
                        className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      CNIC Number (Verification)
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={riderCnic}
                        onChange={(e) => setRiderCnic(e.target.value)}
                        placeholder="42101-1234567-1"
                        className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={riderPhone}
                        onChange={(e) => setRiderPhone(e.target.value)}
                        placeholder="+92 333 1234567"
                        className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={riderVehicleType}
                      onChange={(e) => setRiderVehicleType(e.target.value as any)}
                      className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                    >
                      <option value="Motorcycle">Motorcycle (e.g. Honda 125 / CD 70)</option>
                      <option value="Electric Scooter">Electric Scooter</option>
                      <option value="Van">Cargo Van</option>
                      <option value="Bicycle">Bicycle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Plate Number
                    </label>
                    <input
                      type="text"
                      required
                      value={riderVehicleNumber}
                      onChange={(e) => setRiderVehicleNumber(e.target.value)}
                      placeholder="e.g. KHI-7890"
                      className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium uppercase focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Karachi Preferred Zone
                  </label>
                  <select
                    value={riderArea}
                    onChange={(e) => setRiderArea(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#d8ff36] focus:border-black focus:outline-hidden"
                  >
                    {KARACHI_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Important Approval Warning */}
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-[11px] flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-950 font-bold">
                      Admin Approval Required Before Login
                    </strong>
                    <span>
                      After registering, your application will be routed to the Admin Dashboard. Once the Admin verifies your CNIC and vehicle, you will be authorized to log in and take delivery trips.
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0f0f11] hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <span>Submit Rider Application</span>
                  <ArrowRight className="w-4 h-4 text-[#d8ff36]" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
