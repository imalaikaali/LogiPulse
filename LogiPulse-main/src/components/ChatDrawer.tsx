import React, { useState, useRef, useEffect } from 'react';
import { useLogiPulse } from '../context/LogiPulseContext';
import { Send, X, MessageSquare, CheckCheck, Clock, UserCheck } from 'lucide-react';

interface ChatDrawerProps {
  orderId: string;
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ orderId, onClose }) => {
  const {
    getOrderById,
    getUserById,
    getOrderMessages,
    sendMessage,
    currentUser,
    markMessagesAsRead,
  } = useLogiPulse();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const order = getOrderById(orderId);
  const messages = getOrderMessages(orderId);
  const customer = order ? getUserById(order.user_id) : undefined;
  const rider = order && order.rider_id ? getUserById(order.rider_id) : undefined;

  // Mark unread messages on mount
  useEffect(() => {
    if (orderId && currentUser) {
      markMessagesAsRead(orderId, currentUser.id);
    }
  }, [orderId, currentUser, markMessagesAsRead, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || !order) return;

    sendMessage(order.order_id, currentUser.id, inputVal.trim());
    setInputVal('');
  };

  const handleQuickResponse = (preset: string) => {
    if (!order) return;
    sendMessage(order.order_id, currentUser.id, preset);
  };

  const quickPresets =
    currentUser.role === 'rider'
      ? ['On my way now', 'Arrived at the location', 'Heavy traffic, delay +3m', 'Package handed over safely']
      : ['Buzzer code is #402', 'Please leave at reception', 'Waiting by the front doors', 'Thank you so much!'];

  if (!order) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span>Order Chat</span>
              <span className="text-xs font-mono text-sky-400">#{order.order_id}</span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>Customer: {customer?.name.split(' ')[0]}</span>
              <span>·</span>
              <span>Rider: {rider ? rider.name.split(' ')[0] : 'Unassigned'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-sky-400" />
            <p className="text-sm font-medium text-slate-400">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Real-time chat is active between customer and rider. Send a quick update below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            const sender = getUserById(msg.sender_id);
            const time = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.message_id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300">
                    {isMe ? 'You' : sender?.name || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-500">({sender?.role})</span>
                  <span>·</span>
                  <span className="text-[10px]">{time}</span>
                </div>
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-sky-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
                {isMe && (
                  <span className="text-[9px] text-slate-500 flex items-center gap-0.5 mt-0.5 px-1">
                    <CheckCheck className="w-3 h-3 text-sky-400" /> Delivered
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick response chips */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
        {quickPresets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickResponse(preset)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`Message as ${currentUser.name.split(' ')[0]} (${currentUser.role})...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
