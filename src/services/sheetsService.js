/**
 * OrderFlow — Google Apps Script HTTP Client
 *
 * Every read/write goes through a single Google Apps Script Web-App
 * that acts as middleware between this PWA and a Google Sheet.
 *
 * Important: Apps Script redirects (302) on exec — we must use
 * `redirect: 'follow'` for fetch to resolve correctly.
 */

import { GOOGLE_APPS_SCRIPT_URL } from '../config/constants';

/* ---------- Internal helpers ---------- */

const isDummyUrl = GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getMockDb = () => {
  try {
    return JSON.parse(localStorage.getItem('orderflow_mock_db') || '{"orders":[],"customers":[],"products":[],"staff":[]}');
  } catch {
    return { orders: [], customers: [], products: [], staff: [] };
  }
};

const setMockDb = (db) => {
  localStorage.setItem('orderflow_mock_db', JSON.stringify(db));
};

/**
 * Generic GET request.
 */
async function get(action, params = {}) {
  try {
    if (isDummyUrl) {
      await mockDelay(300);
      const db = getMockDb();
      let data = [];
      if (action === 'getOrders') data = db.orders;
      if (action === 'getCustomers') data = db.customers;
      if (action === 'getProducts') data = db.products;
      if (action === 'getStaff') data = db.staff || [];
      return { success: true, data, error: null };
    }

    const url = new URL(GOOGLE_APPS_SCRIPT_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const json = await res.json();
    return { success: true, data: json.data ?? json, error: null };
  } catch (err) {
    console.error(`[sheetsService] GET ${action} failed:`, err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Generic POST request.
 */
async function post(action, body = {}) {
  try {
    if (isDummyUrl) {
      await mockDelay(300);
      const db = getMockDb();
      let returnData = body;

      if (action === 'addOrder') {
        const order = body.order;
        if (!order.order_id) order.order_id = `ORD-${Date.now()}`;
        db.orders.unshift(order); // Add to front
        setMockDb(db);
        returnData = order;
      } 
      else if (action === 'updateStatus') {
        const idx = db.orders.findIndex(o => o.order_id === body.order_id);
        if (idx !== -1) {
          db.orders[idx].status = body.status;
          db.orders[idx].dispatched_at = body.dispatched_at;
          setMockDb(db);
        }
      }
      else if (action === 'deleteOrder') {
        db.orders = db.orders.filter(o => o.order_id !== body.order_id);
        setMockDb(db);
      }
      else if (action === 'addCustomer') {
        const customer = { customer_id: `CUST-${Date.now()}`, name: body.name, added_at: new Date().toISOString() };
        db.customers.push(customer);
        setMockDb(db);
        returnData = customer;
      }
      else if (action === 'addStaff') {
        if (!db.staff) db.staff = [];
        const existing = db.staff.find(s => s.phone === body.phone);
        if (existing) return { success: false, error: 'Staff exists' };
        const newStaff = { phone: body.phone, pin_hash: body.pin_hash, name: body.name, added_at: new Date().toISOString() };
        db.staff.push(newStaff);
        setMockDb(db);
        returnData = newStaff;
      }
      else if (action === 'deleteStaff') {
        if (!db.staff) db.staff = [];
        db.staff = db.staff.filter(s => s.phone !== body.phone);
        setMockDb(db);
      }

      return { success: true, data: returnData, error: null };
    }

    const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' }, // text/plain avoids CORS preflight
      body: JSON.stringify({ action, ...body }),
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const json = await res.json();
    return { success: true, data: json.data ?? json, error: null };
  } catch (err) {
    console.error(`[sheetsService] POST ${action} failed:`, err);
    return { success: false, data: null, error: err.message };
  }
}

/* ---------- Public API ---------- */

/**
 * Fetch all orders from the sheet.
 */
export function getOrders() {
  return get('getOrders');
}

/**
 * Fetch the customer list.
 */
export function getCustomers() {
  return get('getCustomers');
}

/**
 * Fetch the product catalogue.
 */
export function getProducts() {
  return get('getProducts');
}

/**
 * Add a new order row.
 *
 * @param {object} orderData — { orderId, customerName, items, status, createdAt, rawNote }
 */
export function addOrder(orderData) {
  return post('addOrder', { order: orderData });
}

/**
 * Update the status of an existing order.
 *
 * @param {string} orderId
 * @param {string} status — 'Pending' | 'Dispatched'
 * @param {string|null} dispatchedAt — ISO timestamp or null
 */
export function updateOrderStatus(orderId, status, dispatchedAt = null) {
  return post('updateStatus', { order_id: orderId, status, dispatched_at: dispatchedAt });
}

/**
 * Delete an order.
 *
 * @param {string} orderId
 */
export function deleteOrder(orderId) {
  return post('deleteOrder', { order_id: orderId });
}

/**
 * Add a new customer name.
 *
 * @param {string} name
 */
export function addCustomer(name) {
  return post('addCustomer', { name });
}

/**
 * Fetch the staff list.
 */
export function getStaff() {
  return get('getStaff');
}

/**
 * Add a new staff member.
 *
 * @param {string} phone
 * @param {string} pinHash
 * @param {string} name
 */
export function addStaff(phone, pinHash, name) {
  return post('addStaff', { phone, pin_hash: pinHash, name });
}

/**
 * Delete a staff member.
 *
 * @param {string} phone
 */
export function deleteStaff(phone) {
  return post('deleteStaff', { phone });
}
