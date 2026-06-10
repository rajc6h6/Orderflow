import { useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getOrders } from '../services/sheetsService';
import { useAuth } from '../context/AuthContext';

/**
 * useNotifications
 * Periodically polls the backend for changes in orders.
 * - Staff gets notified when new orders appear.
 * - Owner gets notified when an order's status changes to 'Dispatched'.
 */
export function useNotifications() {
  const { role, isAuthenticated } = useAuth();
  const previousOrdersRef = useRef([]);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!isAuthenticated || !role) return;

    // Request permissions for push/local notifications on iOS / Android 13+
    LocalNotifications.requestPermissions().then((result) => {
      console.log('Notification permissions:', result.display);
    });

    const checkOrders = async () => {
      try {
        const res = await getOrders();
        if (!res.success) return;

        const currentOrders = res.data || [];

        // First load: just cache the current state so we don't alert on old data
        if (isFirstLoad.current) {
          previousOrdersRef.current = currentOrders;
          isFirstLoad.current = false;
          return;
        }

        const prevOrders = previousOrdersRef.current;

        /* ---------- Staff: Notify on NEW orders ---------- */
        if (role === 'staff') {
          const newOrders = currentOrders.filter(
            co => !prevOrders.some(po => po.order_id === co.order_id)
          );

          if (newOrders.length > 0) {
            newOrders.forEach((order) => {
              LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'New Order Received',
                    body: `Order from ${order.customer_name} placed by ${order.placed_by || 'Owner'}`,
                    id: Math.floor(Math.random() * 2000000000), // Must be a 32-bit int
                    schedule: { at: new Date(Date.now() + 500) },
                  }
                ]
              });
            });
          }
        }

        /* ---------- Owner: Notify on DISPATCHED orders ---------- */
        if (role === 'owner') {
          const newlyDispatched = currentOrders.filter(co => {
            if (co.status !== 'Dispatched') return false;
            const prevMatch = prevOrders.find(po => po.order_id === co.order_id);
            return prevMatch && prevMatch.status !== 'Dispatched';
          });

          if (newlyDispatched.length > 0) {
            newlyDispatched.forEach((order) => {
              LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'Order Dispatched',
                    body: `Order for ${order.customer_name} has been dispatched.`,
                    id: Math.floor(Math.random() * 2000000000), // Must be a 32-bit int
                    schedule: { at: new Date(Date.now() + 500) },
                  }
                ]
              });
            });
          }
        }

        // Update cache for the next cycle
        previousOrdersRef.current = currentOrders;
      } catch (err) {
        console.error('Error polling for notifications:', err);
      }
    };

    // Run immediately, then poll every 20 seconds
    checkOrders();
    const intervalId = setInterval(checkOrders, 20000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, role]);
}
