/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  STORAGE_KEYS,
  DEFAULT_PRODUCTS,
  DEFAULT_CUSTOMERS,
} from '../config/constants';
import * as sheetsService from '../services/sheetsService';

const AppContext = createContext(null);

/* ---------- localStorage helpers ---------- */

function readCache(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage quota — silently fail */
  }
}

/* ---------- Provider ---------- */

export function AppProvider({ children }) {
  const [orders, setOrders] = useState(() =>
    readCache(STORAGE_KEYS.CACHED_ORDERS, []),
  );
  const [customers, setCustomers] = useState(() =>
    readCache(STORAGE_KEYS.CACHED_CUSTOMERS, DEFAULT_CUSTOMERS),
  );
  const [products, setProducts] = useState(() =>
    readCache(STORAGE_KEYS.CACHED_PRODUCTS, DEFAULT_PRODUCTS),
  );

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isLoading, setIsLoading] = useState(false);

  /* ---------- Online / Offline detection ---------- */
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /* ---------- Fetch helpers ---------- */

  const fetchOrders = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsLoading(true);
    try {
      const res = await sheetsService.getOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        writeCache(STORAGE_KEYS.CACHED_ORDERS, res.data);
      }
    } catch (err) {
      console.error('[AppContext] fetchOrders failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const res = await sheetsService.getCustomers();
      if (res.success && Array.isArray(res.data)) {
        setCustomers(res.data);
        writeCache(STORAGE_KEYS.CACHED_CUSTOMERS, res.data);
      }
    } catch (err) {
      console.error('[AppContext] fetchCustomers failed:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const res = await sheetsService.getProducts();
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data);
        writeCache(STORAGE_KEYS.CACHED_PRODUCTS, res.data);
      }
    } catch (err) {
      console.error('[AppContext] fetchProducts failed:', err);
    }
  }, []);

  /* ---------- Mutations ---------- */

  const addOrder = useCallback(
    async (order) => {
      // Optimistic update
      setOrders((prev) => {
        const next = [order, ...prev];
        writeCache(STORAGE_KEYS.CACHED_ORDERS, next);
        return next;
      });

      if (!navigator.onLine) return { success: true, offline: true };

      try {
        const res = await sheetsService.addOrder(order);
        if (res.success) {
          // Re-fetch to get server-canonical data
          await fetchOrders();
        }
        return res;
      } catch (err) {
        console.error('[AppContext] addOrder failed:', err);
        return { success: false, error: err.message };
      }
    },
    [fetchOrders],
  );

  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      const dispatchedAt = status === 'Dispatched' ? new Date().toISOString() : null;

      // Optimistic update
      setOrders((prev) => {
        const next = prev.map((o) =>
          (o.order_id || o.id) === orderId ? { ...o, status, dispatched_at: dispatchedAt } : o,
        );
        writeCache(STORAGE_KEYS.CACHED_ORDERS, next);
        return next;
      });

      if (!navigator.onLine) return { success: true, offline: true };

      try {
        const res = await sheetsService.updateOrderStatus(
          orderId,
          status,
          dispatchedAt,
        );
        if (res.success) {
          await fetchOrders();
        }
        return res;
      } catch (err) {
        console.error('[AppContext] updateOrderStatus failed:', err);
        return { success: false, error: err.message };
      }
    },
    [fetchOrders],
  );

  const deleteOrder = useCallback(
    async (orderId) => {
      // Optimistic update
      setOrders((prev) => {
        const next = prev.filter((o) => (o.order_id || o.id) !== orderId);
        writeCache(STORAGE_KEYS.CACHED_ORDERS, next);
        return next;
      });

      if (!navigator.onLine) return { success: true, offline: true };

      try {
        const res = await sheetsService.deleteOrder(orderId);
        if (res.success) {
          await fetchOrders();
        }
        return res;
      } catch (err) {
        console.error('[AppContext] deleteOrder failed:', err);
        return { success: false, error: err.message };
      }
    },
    [fetchOrders],
  );

  const addCustomer = useCallback(
    async (name) => {
      if (!name || !name.trim()) return { success: false, error: 'Name required' };

      const trimmed = name.trim();

      // Optimistic update
      setCustomers((prev) => {
        if (prev.includes(trimmed)) return prev;
        const next = [...prev, trimmed];
        writeCache(STORAGE_KEYS.CACHED_CUSTOMERS, next);
        return next;
      });

      if (!navigator.onLine) return { success: true, offline: true };

      try {
        const res = await sheetsService.addCustomer(trimmed);
        if (res.success) {
          await fetchCustomers();
        }
        return res;
      } catch (err) {
        console.error('[AppContext] addCustomer failed:', err);
        return { success: false, error: err.message };
      }
    },
    [fetchCustomers],
  );

  /* ---------- Context value ---------- */

  const value = useMemo(
    () => ({
      orders,
      customers,
      products,
      isOnline,
      isLoading,
      fetchOrders,
      fetchCustomers,
      fetchProducts,
      addOrder,
      updateOrderStatus,
      deleteOrder,
      addCustomer,
    }),
    [
      orders,
      customers,
      products,
      isOnline,
      isLoading,
      fetchOrders,
      fetchCustomers,
      fetchProducts,
      addOrder,
      updateOrderStatus,
      deleteOrder,
      addCustomer,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within <AppProvider>');
  }
  return ctx;
}
