/**
 * OrderFlow — Application Constants
 */

// Google Apps Script Web-App URL (replace after deployment)
export const GOOGLE_APPS_SCRIPT_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxfnqh_wzn3G7evcd3PQHJPdCrkUVruNzXyD5OJI3IYZB79E2f9srAZHKa80l4RCZAl/exec';

// Gemini API Key (used server-side via Apps Script — kept here for local dev)
export const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

// Default product catalogue
export const DEFAULT_PRODUCTS = ['Bucket', 'Mug', 'Soap Box', 'Comb'];

// Default customer list
export const DEFAULT_CUSTOMERS = [
  'Ramesh Trading',
  'Gupta Enterprises',
  'Sanjay Wholesale',
  'Mohan & Sons',
  'Vikash Traders',
  'Sunil Plastics',
  'Rajesh Store',
  'Pawan Distributors',
];

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'Pending',
  DISPATCHED: 'Dispatched',
};

// User roles
export const ROLES = {
  OWNER: 'owner',
  STAFF: 'staff',
};

// LocalStorage keys
export const STORAGE_KEYS = {
  OWNER_PIN_HASH: 'orderflow_owner_pin',
  STAFF_PIN_HASH: 'orderflow_staff_pin',
  CACHED_ORDERS: 'orderflow_orders',
  CACHED_CUSTOMERS: 'orderflow_customers',
  CACHED_PRODUCTS: 'orderflow_products',
  CURRENT_ROLE: 'orderflow_role',
};
