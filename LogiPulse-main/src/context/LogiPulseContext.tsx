import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { User, Order, Message, OrderStatus, Coordinates, ViewMode, UserRole } from '../types/courier';
import { INITIAL_USERS, INITIAL_ORDERS, INITIAL_MESSAGES } from '../db/seedData';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert';
  timestamp: string;
}

interface LogiPulseContextType {
  // State
  users: User[];
  orders: Order[];
  messages: Message[];
  currentUser: User;
  currentView: ViewMode;
  selectedOrderId: string | null;
  activeChatOrderId: string | null;
  toasts: ToastNotification[];
  isAutoSimulating: boolean;

  // Actions
  setCurrentUser: (user: User) => void;
  setCurrentView: (view: ViewMode) => void;
  setSelectedOrderId: (orderId: string | null) => void;
  setActiveChatOrderId: (orderId: string | null) => void;
  
  // Core Business Mutations
  createOrder: (payload: {
    pickup_address: string;
    pickup_coords: Coordinates;
    dropoff_address: string;
    dropoff_coords: Coordinates;
    package_details: Order['package_details'];
    fare_amount?: number;
  }) => Order;
  
  assignRider: (orderId: string, riderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateRiderCoordinates: (riderId: string, coords: Coordinates) => void;
  sendMessage: (orderId: string, senderId: string, text: string) => Message;
  markMessagesAsRead: (orderId: string, readerId: string) => void;
  
  // Simulation Helpers
  stepRiderMovement: (orderId: string) => void;
  toggleAutoSimulation: (orderId?: string) => void;
  resetDatabase: () => void;
  dismissToast: (id: string) => void;
  
  // Auth & Registration & Verification
  registerCustomer: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cityArea?: string;
  }) => { success: boolean; user?: User; error?: string };

  registerRider: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicleType: 'Motorcycle' | 'Bicycle' | 'Electric Scooter' | 'Van';
    vehicleNumber: string;
    cnicNumber: string;
    cityArea: string;
  }) => { success: boolean; user?: User; error?: string };

  approveRider: (riderId: string) => void;
  rejectRider: (riderId: string) => void;
  
  loginUser: (email: string, password: string) => {
    success: boolean;
    user?: User;
    error?: string;
    isPendingApproval?: boolean;
    isRejected?: boolean;
  };

  logoutUser: () => void;

  // Selectors
  getOrderById: (orderId: string) => Order | undefined;
  getUserById: (userId: string) => User | undefined;
  getOrderMessages: (orderId: string) => Message[];
  getAvailableRiders: () => User[];
  getPendingOrders: () => Order[];
  getPendingRiderApprovals: () => User[];
}

const LogiPulseContext = createContext<LogiPulseContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'logipulse_v1_';

export const LogiPulseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state or use seeds with guaranteed Admin account preservation
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
      if (saved) {
        let parsed: User[] = JSON.parse(saved);
        const adminIndex = parsed.findIndex(
          (u) => u.role === 'admin' || u.email.toLowerCase() === 'admin@logipulse.pk'
        );
        const defaultAdmin = INITIAL_USERS.find((u) => u.role === 'admin') || {
          id: 'a-301',
          name: 'Rehman Malik',
          email: 'admin@logipulse.pk',
          password: 'admin123',
          role: 'admin' as const,
          phone: '+92 21 35824900',
          cityArea: 'Karachi HQ, I.I. Chundrigar Road',
          isApproved: true,
          verificationStatus: 'approved' as const,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        };

        if (adminIndex >= 0) {
          parsed[adminIndex] = {
            ...parsed[adminIndex],
            email: 'admin@logipulse.pk',
            password: 'admin123',
            role: 'admin',
            isApproved: true,
            verificationStatus: 'approved',
          };
        } else {
          parsed.push(defaultAdmin);
        }
        return parsed;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}messages`);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  // Current logged in user (default: User Arif Khan)
  const [currentUser, setCurrentUser] = useState<User>(() => users[0] || INITIAL_USERS[0]);
  const [currentView, setCurrentView] = useState<ViewMode>('user');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>('LP-KHI-4091');
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);

  const autoSimRef = useRef<number | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(orders));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}messages`, JSON.stringify(messages));
    } catch {
      // storage unavailable or quota exceeded
    }
  }, [users, orders, messages]);

  const addToast = useCallback((title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Create Order
  const createOrder = useCallback((payload: {
    pickup_address: string;
    pickup_coords: Coordinates;
    dropoff_address: string;
    dropoff_coords: Coordinates;
    package_details: Order['package_details'];
    fare_amount?: number;
  }): Order => {
    const newId = `LP-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    
    const newOrder: Order = {
      order_id: newId,
      user_id: currentUser.role === 'user' ? currentUser.id : 'u-101',
      rider_id: null,
      pickup_address: payload.pickup_address,
      pickup_coords: payload.pickup_coords,
      dropoff_address: payload.dropoff_address,
      dropoff_coords: payload.dropoff_coords,
      package_details: payload.package_details,
      status: 'Pending',
      fare_amount: payload.fare_amount || 22.00,
      created_at: nowIso,
      updated_at: nowIso,
      estimated_delivery_time: 'Awaiting Rider',
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSelectedOrderId(newId);
    addToast('New Order Placed', `Order #${newId} is now Pending dispatch.`, 'info');

    return newOrder;
  }, [currentUser, addToast]);

  // 2. Assign Rider
  const assignRider = useCallback((orderId: string, riderId: string) => {
    const validRiderId = riderId && riderId.trim().length > 0 ? riderId.trim() : null;
    const rider = validRiderId ? users.find((u) => u.id === validRiderId) : null;
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.order_id === orderId) {
          if (!validRiderId) {
            return {
              ...ord,
              rider_id: null,
              status: ord.status === 'Delivered' ? 'Delivered' : 'Pending',
              updated_at: nowIso,
              estimated_delivery_time: 'Awaiting Rider',
            };
          }
          return {
            ...ord,
            rider_id: validRiderId,
            status: ord.status === 'Pending' ? 'Picked Up' : ord.status,
            picked_up_at: ord.status === 'Pending' ? nowIso : ord.picked_up_at,
            updated_at: nowIso,
            estimated_delivery_time: '15 mins',
          };
        }
        return ord;
      })
    );

    if (validRiderId) {
      addToast(
        'Rider Assigned',
        `${rider?.name || 'Rider'} assigned to Order #${orderId}`,
        'success'
      );
    } else {
      addToast('Order Unassigned', `Order #${orderId} is now pending dispatch.`, 'info');
    }
  }, [users, addToast]);

  // 3. Update Order Status
  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.order_id === orderId) {
          return {
            ...ord,
            status: newStatus,
            updated_at: nowIso,
            picked_up_at: newStatus === 'Picked Up' ? nowIso : ord.picked_up_at,
            delivered_at: newStatus === 'Delivered' ? nowIso : ord.delivered_at,
            estimated_delivery_time: newStatus === 'Delivered' ? 'Delivered' : ord.estimated_delivery_time,
          };
        }
        return ord;
      })
    );

    addToast('Status Changed', `Order #${orderId} marked as "${newStatus}"`, 'info');
  }, [addToast]);

  // 4. Update Rider Coordinates
  const updateRiderCoordinates = useCallback((riderId: string, coords: Coordinates) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === riderId) {
          return {
            ...u,
            current_coordinates: coords,
          };
        }
        return u;
      })
    );
  }, []);

  // 5. Send Real-time Chat Message
  const sendMessage = useCallback((orderId: string, senderId: string, text: string): Message => {
    const messageId = `msg-${Date.now().toString().slice(-4)}`;
    const newMsg: Message = {
      message_id: messageId,
      order_id: orderId,
      sender_id: senderId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, newMsg]);

    const sender = users.find((u) => u.id === senderId);
    addToast(`New Message`, `${sender?.name || 'User'}: "${text.length > 30 ? text.slice(0, 30) + '...' : text}"`, 'info');

    return newMsg;
  }, [users, addToast]);

  const markMessagesAsRead = useCallback((orderId: string, readerId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.order_id === orderId && m.sender_id !== readerId) {
          return { ...m, is_read: true };
        }
        return m;
      })
    );
  }, []);

  // 6. Step Rider Movement Simulation
  const stepRiderMovement = useCallback((orderId: string) => {
    const order = orders.find((o) => o.order_id === orderId);
    if (!order || !order.rider_id) return;

    const rider = users.find((u) => u.id === order.rider_id);
    if (!rider || !rider.current_coordinates) return;

    const targetCoords = order.status === 'Picked Up' ? order.dropoff_coords : order.dropoff_coords;
    
    // Linear interpolation step towards destination
    const current = rider.current_coordinates;
    const dLat = targetCoords.lat - current.lat;
    const dLng = targetCoords.lng - current.lng;
    const distance = Math.sqrt(dLat * dLat + dLng * dLng);

    if (distance < 0.001) {
      // Reached destination!
      if (order.status !== 'Delivered') {
        updateOrderStatus(orderId, 'Delivered');
      }
      return;
    }

    // Step fraction (15% per tick for smooth visible progress)
    const stepRatio = Math.min(0.2, 0.003 / (distance || 1));
    const nextLat = current.lat + dLat * stepRatio;
    const nextLng = current.lng + dLng * stepRatio;

    updateRiderCoordinates(order.rider_id, {
      lat: Number(nextLat.toFixed(6)),
      lng: Number(nextLng.toFixed(6)),
    });

    // Auto update status from Picked Up to In Transit after first move
    if (order.status === 'Picked Up') {
      updateOrderStatus(orderId, 'In Transit');
    }
  }, [orders, users, updateOrderStatus, updateRiderCoordinates]);

  // Toggle Continuous Auto Simulation
  const toggleAutoSimulation = useCallback((orderId?: string) => {
    const targetOrderId = orderId || selectedOrderId || orders.find((o) => o.rider_id && o.status !== 'Delivered')?.order_id;
    if (!targetOrderId) {
      addToast('Simulation Note', 'Select an order with an assigned rider to simulate GPS cruise.', 'alert');
      return;
    }

    setIsAutoSimulating((prev) => {
      const nextState = !prev;
      if (nextState) {
        addToast('Live GPS Cruise Started', `Simulating real-time vehicle telemetry for #${targetOrderId}`, 'success');
      } else {
        addToast('GPS Cruise Paused', 'Simulation paused.', 'info');
      }
      return nextState;
    });
  }, [selectedOrderId, orders, addToast]);

  // Auto sim ticker
  useEffect(() => {
    if (isAutoSimulating) {
      const activeOrd = orders.find((o) => o.order_id === selectedOrderId) || orders.find((o) => o.rider_id && o.status !== 'Delivered');
      if (!activeOrd || activeOrd.status === 'Delivered') {
        setIsAutoSimulating(false);
        return;
      }

      autoSimRef.current = window.setInterval(() => {
        stepRiderMovement(activeOrd.order_id);
      }, 1200);
    } else {
      if (autoSimRef.current) {
        clearInterval(autoSimRef.current);
        autoSimRef.current = null;
      }
    }

    return () => {
      if (autoSimRef.current) clearInterval(autoSimRef.current);
    };
  }, [isAutoSimulating, selectedOrderId, orders, stepRiderMovement]);

  // Reset database to seeds
  const resetDatabase = useCallback(() => {
    setUsers(INITIAL_USERS);
    setOrders(INITIAL_ORDERS);
    setMessages(INITIAL_MESSAGES);
    setCurrentUser(INITIAL_USERS[0]);
    setSelectedOrderId('LP-KHI-4091');
    setIsAutoSimulating(false);
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}users`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}orders`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}messages`);
    } catch {
      // ignore
    }
    addToast('State Reset', 'Database re-seeded with initial records.', 'success');
  }, [addToast]);

  // 1. Customer Self-Registration (can login anytime)
  const registerCustomer = useCallback(
    (data: {
      name: string;
      email: string;
      password: string;
      phone: string;
      cityArea?: string;
    }) => {
      const emailNormalized = data.email.trim().toLowerCase();
      const existing = users.find((u) => u.email.toLowerCase() === emailNormalized);
      if (existing) {
        return { success: false, error: 'An account with this email already exists. Please log in.' };
      }

      const newId = `u-${Date.now().toString().slice(-4)}`;
      const newUser: User = {
        id: newId,
        name: data.name.trim(),
        email: emailNormalized,
        password: data.password.trim(),
        role: 'user',
        phone: data.phone.trim() || '+92 300 1234567',
        cityArea: data.cityArea?.trim() || 'Clifton, Karachi',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        isApproved: true,
        verificationStatus: 'approved',
        registeredAt: new Date().toISOString(),
      };

      setUsers((prev) => [newUser, ...prev]);
      setCurrentUser(newUser);
      setCurrentView('user');
      addToast(
        'Account Registered!',
        `Welcome ${newUser.name}! Your customer account is ready and you can log in anytime.`,
        'success'
      );
      return { success: true, user: newUser };
    },
    [users, addToast]
  );

  // 2. Courier Rider Registration (Pending Admin Approval)
  const registerRider = useCallback(
    (data: {
      name: string;
      email: string;
      password: string;
      phone: string;
      vehicleType: 'Motorcycle' | 'Bicycle' | 'Electric Scooter' | 'Van';
      vehicleNumber: string;
      cnicNumber: string;
      cityArea: string;
    }) => {
      const emailNormalized = data.email.trim().toLowerCase();
      const existing = users.find((u) => u.email.toLowerCase() === emailNormalized);
      if (existing) {
        return { success: false, error: 'An account with this email already exists. Please log in.' };
      }

      const newId = `r-${Date.now().toString().slice(-4)}`;
      const initialCoords = {
        lat: Number((24.8607 + (Math.random() - 0.5) * 0.04).toFixed(6)),
        lng: Number((67.0011 + (Math.random() - 0.5) * 0.04).toFixed(6)),
      };

      const newRider: User = {
        id: newId,
        name: data.name.trim(),
        email: emailNormalized,
        password: data.password.trim(),
        role: 'rider',
        phone: data.phone.trim(),
        cityArea: data.cityArea.trim(),
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber.trim().toUpperCase(),
        cnicNumber: data.cnicNumber.trim(),
        isApproved: false, // REQUIRES ADMIN APPROVAL & VERIFICATION
        verificationStatus: 'pending',
        isOnline: false,
        rating: 5.0,
        completedDeliveries: 0,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        current_coordinates: initialCoords,
        registeredAt: new Date().toISOString(),
      };

      setUsers((prev) => [newRider, ...prev]);
      addToast(
        'Rider Application Submitted',
        `Rider ${newRider.name} submitted for review. Admin must approve your profile before login.`,
        'info'
      );
      return { success: true, user: newRider };
    },
    [users, addToast]
  );

  // 3. Admin Approves Rider
  const approveRider = useCallback(
    (riderId: string) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === riderId) {
            return {
              ...u,
              isApproved: true,
              verificationStatus: 'approved',
              isOnline: true,
            };
          }
          return u;
        })
      );

      setCurrentUser((prev) => {
        if (prev.id === riderId) {
          return {
            ...prev,
            isApproved: true,
            verificationStatus: 'approved',
            isOnline: true,
          };
        }
        return prev;
      });

      const approvedRider = users.find((u) => u.id === riderId);
      addToast(
        'Rider Verified & Approved',
        `Courier ${approvedRider?.name || 'Rider'} is now approved! They can now log in and take delivery orders.`,
        'success'
      );
    },
    [users, addToast]
  );

  // 4. Admin Rejects Rider
  const rejectRider = useCallback(
    (riderId: string) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === riderId) {
            return {
              ...u,
              isApproved: false,
              verificationStatus: 'rejected',
              isOnline: false,
            };
          }
          return u;
        })
      );

      setCurrentUser((prev) => {
        if (prev.id === riderId) {
          return {
            ...prev,
            isApproved: false,
            verificationStatus: 'rejected',
            isOnline: false,
          };
        }
        return prev;
      });

      addToast('Application Rejected', 'Rider application has been rejected.', 'alert');
    },
    [addToast]
  );

  // 5. Universal Login Check (with robust & private Admin authentication)
  const loginUser = useCallback(
    (identifier: string, passwordInput: string) => {
      const cleanId = identifier.trim().toLowerCase();
      const cleanPass = passwordInput.trim();

      // Check if this is Admin authentication
      const isAdminIdentifier =
        cleanId === 'admin@logipulse.pk' ||
        cleanId === 'admin' ||
        cleanId === 'admin@logip.com' ||
        cleanId === 'admin@logipulse.com';

      if (isAdminIdentifier) {
        if (cleanPass === 'admin123' || cleanPass === 'Admin123' || cleanPass === 'admin') {
          // Find or create canonical admin user
          let admin = users.find(
            (u) => u.role === 'admin' || u.email.toLowerCase() === 'admin@logipulse.pk'
          );
          if (!admin) {
            admin = {
              id: 'a-301',
              name: 'Rehman Malik',
              email: 'admin@logipulse.pk',
              password: 'admin123',
              role: 'admin',
              phone: '+92 21 35824900',
              cityArea: 'Karachi HQ, I.I. Chundrigar Road',
              isApproved: true,
              verificationStatus: 'approved',
              avatar:
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
            };
            setUsers((prev) => [admin!, ...prev]);
          } else {
            admin = { ...admin, role: 'admin', isApproved: true, verificationStatus: 'approved' };
          }

          setCurrentUser(admin);
          setCurrentView('admin');
          addToast('Admin Portal Access', `Welcome ${admin.name}. Admin Dashboard unlocked.`, 'success');
          return { success: true, user: admin };
        } else {
          return {
            success: false,
            error: 'Invalid admin password. Please verify your credentials and try again.',
          };
        }
      }

      // Customer or Courier Rider lookup (by email or name)
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === cleanId ||
          u.name.toLowerCase() === cleanId
      );

      if (!user) {
        return {
          success: false,
          error: 'No account registered with this email or username. Please register as a Customer or Rider first.',
        };
      }

      if (user.password && user.password !== cleanPass) {
        return {
          success: false,
          error: 'Invalid password. Please check your password and try again.',
        };
      }

      // Check rider approval status
      if (user.role === 'rider') {
        if (user.verificationStatus === 'rejected') {
          return {
            success: false,
            error: 'Your rider account application was not approved. Please contact Admin support.',
            isRejected: true,
          };
        }

        if (user.isApproved !== true || user.verificationStatus === 'pending') {
          return {
            success: false,
            error:
              '⏳ Rider verification pending: Your registration is submitted, but courier rider accounts require Admin approval before you can access the dispatch system.',
            isPendingApproval: true,
            user,
          };
        }
      }

      // Login Successful!
      setCurrentUser(user);
      setCurrentView(user.role);
      addToast(
        'Welcome Back',
        `Logged in as ${user.name} (${user.role === 'user' ? 'Customer' : user.role.toUpperCase()})`,
        'success'
      );
      return { success: true, user };
    },
    [users, addToast]
  );

  const logoutUser = useCallback(() => {
    const defaultUser = users.find((u) => u.role === 'user') || INITIAL_USERS[0];
    setCurrentUser(defaultUser);
    setCurrentView('user');
    addToast('Logged Out', 'You have been logged out.', 'info');
  }, [users, addToast]);

  // Selectors
  const getOrderById = useCallback((orderId: string) => orders.find((o) => o.order_id === orderId), [orders]);
  const getUserById = useCallback((userId: string) => users.find((u) => u.id === userId), [users]);
  const getOrderMessages = useCallback((orderId: string) => messages.filter((m) => m.order_id === orderId), [messages]);
  const getAvailableRiders = useCallback(() => users.filter((u) => u.role === 'rider' && u.isApproved && u.isOnline), [users]);
  const getPendingOrders = useCallback(() => orders.filter((o) => o.status === 'Pending'), [orders]);
  const getPendingRiderApprovals = useCallback(() => {
    return users.filter((u) => u.role === 'rider' && u.isApproved !== true && u.verificationStatus !== 'rejected');
  }, [users]);

  const value = {
    users,
    orders,
    messages,
    currentUser,
    currentView,
    selectedOrderId,
    activeChatOrderId,
    toasts,
    isAutoSimulating,
    setCurrentUser,
    setCurrentView,
    setSelectedOrderId,
    setActiveChatOrderId,
    createOrder,
    assignRider,
    updateOrderStatus,
    updateRiderCoordinates,
    sendMessage,
    markMessagesAsRead,
    stepRiderMovement,
    toggleAutoSimulation,
    resetDatabase,
    dismissToast,
    registerCustomer,
    registerRider,
    approveRider,
    rejectRider,
    loginUser,
    logoutUser,
    getOrderById,
    getUserById,
    getOrderMessages,
    getAvailableRiders,
    getPendingOrders,
    getPendingRiderApprovals,
  };

  return <LogiPulseContext.Provider value={value}>{children}</LogiPulseContext.Provider>;
};

export const useLogiPulse = () => {
  const context = useContext(LogiPulseContext);
  if (!context) {
    throw new Error('useLogiPulse must be used within a LogiPulseProvider');
  }
  return context;
};
