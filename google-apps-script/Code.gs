/**
 * OrderFlow — Google Apps Script Backend
 * 
 * This script acts as the free serverless backend for OrderFlow.
 * Deploy as Web App: Execute as "Me", Access: "Anyone"
 * 
 * Handles:
 * - Orders CRUD (Google Sheets)
 * - Customers CRUD (Google Sheets)
 * - Products Read (Google Sheets)
 * - Gemini AI order extraction (proxied)
 */

// ============================================================
// CONFIGURATION — Set these in Script Properties
// ============================================================
// Go to Project Settings → Script Properties and add:
// GEMINI_API_KEY = your key from aistudio.google.com
// SPREADSHEET_ID = the ID from your Google Sheet URL

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    SPREADSHEET_ID: props.getProperty('SPREADSHEET_ID') || SpreadsheetApp.getActiveSpreadsheet().getId(),
    GEMINI_API_KEY: props.getProperty('GEMINI_API_KEY') || ''
  };
}

// ============================================================
// WEB APP HANDLERS
// ============================================================

function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'getOrders':
        result = getOrders();
        break;
      case 'getCustomers':
        result = getCustomers();
        break;
      case 'getProducts':
        result = getProducts();
        break;
      case 'getStaff':
        result = getStaff();
        break;
      case 'ping':
        result = { success: true, message: 'OrderFlow API is running' };
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = data.action;
  let result;

  try {
    switch (action) {
      case 'addOrder':
        result = addOrder(data);
        break;
      case 'updateStatus':
        result = updateOrderStatus(data.order_id, data.status, data.dispatched_at);
        break;
      case 'deleteOrder':
        result = deleteOrderRow(data.order_id);
        break;
      case 'addCustomer':
        result = addCustomer(data.name);
        break;
      case 'addStaff':
        result = addStaff(data.phone, data.pin_hash, data.name);
        break;
      case 'deleteStaff':
        result = deleteStaff(data.phone);
        break;
      case 'extractOrder':
        result = extractOrderWithGemini(data.transcript, data.customers, data.products);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// SPREADSHEET HELPERS
// ============================================================

function getSpreadsheet() {
  const config = getConfig();
  return SpreadsheetApp.openById(config.SPREADSHEET_ID);
}

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1b4332')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

// ============================================================
// ORDERS
// ============================================================

const ORDER_HEADERS = [
  'order_id', 'customer_name', 'items', 'items_readable', 
  'note', 'status', 'placed_at', 'dispatched_at', 
  'placed_by', 'dispatched_by'
];

function getOrders() {
  const sheet = getOrCreateSheet('Orders', ORDER_HEADERS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, data: [] };
  }
  
  const headers = data[0];
  const orders = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const order = {};
    headers.forEach((header, idx) => {
      order[header] = row[idx];
    });
    // Parse items JSON
    try {
      order.items_parsed = JSON.parse(order.items || '[]');
    } catch (e) {
      order.items_parsed = [];
    }
    orders.push(order);
  }
  
  // Sort newest first
  orders.sort((a, b) => {
    const dateA = new Date(a.placed_at);
    const dateB = new Date(b.placed_at);
    return dateB - dateA;
  });
  
  return { success: true, data: orders };
}

function addOrder(data) {
  const sheet = getOrCreateSheet('Orders', ORDER_HEADERS);
  
  // sheetsService sends { action: 'addOrder', order: { ... } }
  const orderData = data.order || data;
  
  const orderId = orderData.order_id || generateOrderId();
  const now = orderData.placed_at || new Date().toISOString();
  
  // Build items readable string
  const items = orderData.items || [];
  const itemsReadable = orderData.items_readable || items
    .map(item => `${item.quantity || '?'} ${item.product}`)
    .join(', ');
  
  const row = [
    orderId,
    orderData.customer_name || '',
    JSON.stringify(items),
    itemsReadable,
    orderData.note || '',
    'Pending',
    now,
    '', // dispatched_at
    orderData.placed_by || 'Owner',
    '' // dispatched_by
  ];
  
  sheet.appendRow(row);
  
  return { 
    success: true, 
    data: {
      order_id: orderId,
      customer_name: orderData.customer_name,
      items: items,
      items_readable: itemsReadable,
      note: orderData.note || '',
      status: 'Pending',
      placed_at: now,
      dispatched_at: '',
      placed_by: orderData.placed_by || 'Owner',
      dispatched_by: ''
    }
  };
}

function updateOrderStatus(orderId, status, dispatchedAt) {
  const sheet = getOrCreateSheet('Orders', ORDER_HEADERS);
  const data = sheet.getDataRange().getValues();
  
  // Find the order row
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      // Update status (column 6)
      sheet.getRange(i + 1, 6).setValue(status);
      // Update dispatched_at (column 8)
      sheet.getRange(i + 1, 8).setValue(dispatchedAt || new Date().toISOString());
      // Update dispatched_by (column 10)
      sheet.getRange(i + 1, 10).setValue('Staff');
      
      return { success: true, data: { order_id: orderId, status: status } };
    }
  }
  
  return { success: false, error: 'Order not found: ' + orderId };
}

function deleteOrderRow(orderId) {
  const sheet = getOrCreateSheet('Orders', ORDER_HEADERS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      sheet.deleteRow(i + 1);
      return { success: true, data: { order_id: orderId, deleted: true } };
    }
  }
  
  return { success: false, error: 'Order not found: ' + orderId };
}

function generateOrderId() {
  const now = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return 'ORD-' + now + '-' + rand;
}

// ============================================================
// CUSTOMERS
// ============================================================

const CUSTOMER_HEADERS = ['customer_id', 'name', 'added_at'];

function getCustomers() {
  const sheet = getOrCreateSheet('Customers', CUSTOMER_HEADERS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, data: [] };
  }
  
  const headers = data[0];
  const customers = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const customer = {};
    headers.forEach((header, idx) => {
      customer[header] = row[idx];
    });
    customers.push(customer);
  }
  
  return { success: true, data: customers };
}

function addCustomer(name) {
  if (!name || name.trim() === '') {
    return { success: false, error: 'Customer name is required' };
  }
  
  const sheet = getOrCreateSheet('Customers', CUSTOMER_HEADERS);
  
  // Check for duplicate
  const existing = sheet.getDataRange().getValues();
  for (let i = 1; i < existing.length; i++) {
    if (existing[i][1] && existing[i][1].toLowerCase() === name.trim().toLowerCase()) {
      return { success: false, error: 'Customer already exists: ' + name };
    }
  }
  
  const customerId = 'CUST-' + Date.now();
  const now = new Date().toISOString();
  
  sheet.appendRow([customerId, name.trim(), now]);
  
  return { 
    success: true, 
    data: { customer_id: customerId, name: name.trim(), added_at: now }
  };
}

// ============================================================
// PRODUCTS
// ============================================================

const PRODUCT_HEADERS = ['product_id', 'name'];

function getProducts() {
  const sheet = getOrCreateSheet('Products', PRODUCT_HEADERS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, data: [] };
  }
  
  const headers = data[0];
  const products = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const product = {};
    headers.forEach((header, idx) => {
      product[header] = row[idx];
    });
    products.push(product);
  }
  
  return { success: true, data: products };
}

// ============================================================
// STAFF
// ============================================================

const STAFF_HEADERS = ['phone', 'pin_hash', 'name', 'added_at'];

function getStaff() {
  const sheet = getOrCreateSheet('Staff', STAFF_HEADERS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, data: [] };
  }
  
  const headers = data[0];
  const staffList = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const staff = {};
    headers.forEach((header, idx) => {
      staff[header] = row[idx];
    });
    staffList.push(staff);
  }
  
  return { success: true, data: staffList };
}

function addStaff(phone, pinHash, name) {
  if (!phone || !pinHash) {
    return { success: false, error: 'Phone and PIN are required' };
  }
  
  const sheet = getOrCreateSheet('Staff', STAFF_HEADERS);
  const existing = sheet.getDataRange().getValues();
  
  // Check for duplicate phone
  for (let i = 1; i < existing.length; i++) {
    if (existing[i][0] && existing[i][0].toString() === phone.toString()) {
      return { success: false, error: 'Staff with this phone already exists' };
    }
  }
  
  const now = new Date().toISOString();
  sheet.appendRow([phone.toString(), pinHash, name || '', now]);
  
  return { 
    success: true, 
    data: { phone: phone.toString(), pin_hash: pinHash, name: name || '', added_at: now }
  };
}

function deleteStaff(phone) {
  const sheet = getOrCreateSheet('Staff', STAFF_HEADERS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString() === phone.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, data: { phone: phone.toString(), deleted: true } };
    }
  }
  
  return { success: false, error: 'Staff not found: ' + phone };
}

// ============================================================
// GEMINI AI — Order Extraction
// ============================================================

function extractOrderWithGemini(transcript, customers, products) {
  const config = getConfig();
  
  if (!config.GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }
  
  if (!transcript || transcript.trim() === '') {
    return { success: false, error: 'No transcript provided' };
  }
  
  const customerList = (customers || []).join(', ') || 'None';
  const productList = (products || []).join(', ') || 'None';
  
  const prompt = `You are an order extraction assistant for a small plastic factory in India.

Extract order details from the following voice message. The message may be in Hindi, English, or a mix of both.

Return ONLY a valid JSON object. No explanation. No markdown. No backticks. Just the JSON.

Known customers: ${customerList}
Known products: ${productList}

Voice message: "${transcript}"

Return this exact JSON structure:
{"customer_name": "exact name or best match from known customers", "is_new_customer": true or false, "items": [{"product": "product name", "quantity": number}], "raw_note": "anything in the message that did not fit into the above fields"}

Rules:
- If quantity is not mentioned for a product, set quantity to null.
- If customer name does not closely match any known customer, set is_new_customer to true and still include the name you heard.
- Match product names to the known products list when possible.
- If the message mentions a product not in the list, include it anyway.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024
      }
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (responseData.error) {
      return { success: false, error: 'Gemini API error: ' + responseData.error.message };
    }
    
    let text = responseData.candidates[0].content.parts[0].text;
    
    // Clean the response — remove markdown backticks if any
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const extracted = JSON.parse(text);
    
    return { success: true, data: extracted };
    
  } catch (err) {
    return { success: false, error: 'Gemini extraction failed: ' + err.message };
  }
}

// ============================================================
// INITIALIZATION — Run once to set up the spreadsheet
// ============================================================

function initializeSpreadsheet() {
  // Create all sheets with headers
  getOrCreateSheet('Orders', ORDER_HEADERS);
  getOrCreateSheet('Customers', CUSTOMER_HEADERS);
  getOrCreateSheet('Staff', STAFF_HEADERS);
  const productsSheet = getOrCreateSheet('Products', PRODUCT_HEADERS);
  
  // Pre-fill products if empty
  const productData = productsSheet.getDataRange().getValues();
  if (productData.length <= 1) {
    const defaultProducts = ['Bucket', 'Mug', 'Soap Box', 'Comb'];
    defaultProducts.forEach((name, idx) => {
      productsSheet.appendRow(['PROD-' + (idx + 1), name]);
    });
  }
  
  // Pre-fill customers if empty
  const customersSheet = getOrCreateSheet('Customers', CUSTOMER_HEADERS);
  const customerData = customersSheet.getDataRange().getValues();
  if (customerData.length <= 1) {
    const defaultCustomers = [
      'Ramesh Trading', 'Gupta Enterprises', 'Sanjay Wholesale',
      'Mohan & Sons', 'Vikash Traders', 'Sunil Plastics',
      'Rajesh Store', 'Pawan Distributors'
    ];
    const now = new Date().toISOString();
    defaultCustomers.forEach((name, idx) => {
      customersSheet.appendRow(['CUST-' + (idx + 1), name, now]);
    });
  }
  
  Logger.log('Spreadsheet initialized successfully!');
  Logger.log('Spreadsheet ID: ' + getSpreadsheet().getId());
}
