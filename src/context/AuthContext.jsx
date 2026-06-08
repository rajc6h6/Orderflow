/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, ROLES } from '../config/constants';

const AuthContext = createContext(null);

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/**
 * Simple PIN encoding using btoa — consistent with the staff PIN system.
 * Not cryptographic, just prevents plain-text storage.
 */
export function encodePin(pin) {
  return btoa(`of:${pin}:2024`);
}

function readLocal(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full */ }
}

function removeLocal(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

export function AuthProvider({ children }) {
  /**
   * ownerProfile — cached locally for instant access without network.
   * Shape: { phone, name, business_name, registered_at }
   */
  const [ownerProfile, setOwnerProfile] = useState(() =>
    readLocal(STORAGE_KEYS.OWNER_PROFILE, null),
  );

  /**
   * role — 'owner' | 'staff' | null
   * We restore from localStorage (not sessionStorage) so it survives
   * app restarts on mobile (PWA / installed home-screen app).
   */
  const [role, setRole] = useState(() => {
    const profile = readLocal(STORAGE_KEYS.OWNER_PROFILE, null);
    const loggedIn = readLocal(STORAGE_KEYS.OWNER_LOGGED_IN, false);
    if (profile && loggedIn) return ROLES.OWNER;
    // Check session for staff (staff logins are session-only)
    try {
      return sessionStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || null;
    } catch {
      return null;
    }
  });

  // ---------------------------------------------------------------
  // Owner: Register (first-time setup)
  // ---------------------------------------------------------------

  /**
   * Register new owner account in Google Sheets.
   * Auto-logs in on success.
   */
  const registerOwner = useCallback(async (phone, name, businessName, pin) => {
    if (!/^\d{10}$/.test(phone)) {
      return { success: false, error: 'Phone must be exactly 10 digits' };
    }
    if (!name || !name.trim()) {
      return { success: false, error: 'Name is required' };
    }
    if (!/^\d{4}$/.test(String(pin))) {
      return { success: false, error: 'PIN must be exactly 4 digits' };
    }

    const { registerOwner: apiRegister } = await import('../services/sheetsService');
    const pinHash = encodePin(String(pin));
    const res = await apiRegister(phone, pinHash, name.trim(), businessName?.trim() || '');

    if (!res.success) return { success: false, error: res.error || 'Registration failed' };

    const profile = {
      phone,
      name: name.trim(),
      business_name: businessName?.trim() || '',
      registered_at: res.data?.registered_at || new Date().toISOString(),
    };

    writeLocal(STORAGE_KEYS.OWNER_PROFILE, profile);
    writeLocal(STORAGE_KEYS.OWNER_LOGGED_IN, true);
    setOwnerProfile(profile);
    setRole(ROLES.OWNER);

    return { success: true };
  }, []);

  // ---------------------------------------------------------------
  // Owner: Login
  // ---------------------------------------------------------------

  /**
   * Log in with phone + 4-digit PIN.
   * Fetches owner row from Sheets, verifies PIN hash, then persists session.
   */
  const loginOwner = useCallback(async (phone, pin) => {
    if (!/^\d{10}$/.test(phone)) {
      return { success: false, error: 'Phone must be 10 digits' };
    }
    if (!/^\d{4}$/.test(String(pin))) {
      return { success: false, error: 'PIN must be 4 digits' };
    }

    const { getOwner } = await import('../services/sheetsService');
    const res = await getOwner(phone);

    if (!res.success || !res.data) {
      return { success: false, error: 'Phone number not registered' };
    }

    const owner = res.data;
    if (owner.pin_hash !== encodePin(String(pin))) {
      return { success: false, error: 'Incorrect PIN' };
    }

    const profile = {
      phone: owner.phone,
      name: owner.name,
      business_name: owner.business_name || '',
      registered_at: owner.registered_at || '',
    };

    writeLocal(STORAGE_KEYS.OWNER_PROFILE, profile);
    writeLocal(STORAGE_KEYS.OWNER_LOGGED_IN, true);
    setOwnerProfile(profile);
    setRole(ROLES.OWNER);

    return { success: true };
  }, []);

  // ---------------------------------------------------------------
  // Owner: Change PIN
  // ---------------------------------------------------------------

  /**
   * Change owner PIN — verifies current PIN first.
   */
  const changeOwnerPin = useCallback(async (currentPin, newPin) => {
    if (!ownerProfile) return { success: false, error: 'Not logged in' };
    if (!/^\d{4}$/.test(String(currentPin))) return { success: false, error: 'Current PIN must be 4 digits' };
    if (!/^\d{4}$/.test(String(newPin))) return { success: false, error: 'New PIN must be 4 digits' };

    // Verify current PIN against Sheets
    const { getOwner, updateOwnerPin } = await import('../services/sheetsService');
    const res = await getOwner(ownerProfile.phone);

    if (!res.success || !res.data) return { success: false, error: 'Could not verify identity' };
    if (res.data.pin_hash !== encodePin(String(currentPin))) {
      return { success: false, error: 'Current PIN is incorrect' };
    }

    const updateRes = await updateOwnerPin(ownerProfile.phone, encodePin(String(newPin)));
    if (!updateRes.success) return { success: false, error: updateRes.error || 'Failed to update PIN' };

    return { success: true };
  }, [ownerProfile]);

  // ---------------------------------------------------------------
  // Staff: Login
  // ---------------------------------------------------------------

  const loginStaff = useCallback(async (phone, pin) => {
    if (!/^\d{10}$/.test(phone)) return { success: false, error: 'Phone must be 10 digits' };
    if (!/^\d{4}$/.test(String(pin))) return { success: false, error: 'PIN must be 4 digits' };

    const { getStaff } = await import('../services/sheetsService');
    const res = await getStaff();
    if (!res.success) return { success: false, error: 'Could not fetch staff list' };

    const staffList = res.data || [];
    const staffMember = staffList.find(s => s.phone === phone);

    if (!staffMember) return { success: false, error: 'Phone number not found' };
    if (staffMember.pin_hash !== encodePin(String(pin))) {
      return { success: false, error: 'Incorrect PIN' };
    }

    setRole(ROLES.STAFF);
    try {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, ROLES.STAFF);
      sessionStorage.setItem('orderflow_current_staff', JSON.stringify(staffMember));
    } catch { /* ignore */ }

    return { success: true, staff: staffMember };
  }, []);

  // ---------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------

  const logout = useCallback(() => {
    setRole(null);
    // Clear persistent owner session — keeps profile so login is pre-filled
    removeLocal(STORAGE_KEYS.OWNER_LOGGED_IN);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
      sessionStorage.removeItem('orderflow_current_staff');
    } catch { /* ignore */ }
  }, []);

  /**
   * Full reset — wipes owner account cache (used for "Forgot PIN" re-registration).
   */
  const resetOwnerAccount = useCallback(() => {
    setRole(null);
    setOwnerProfile(null);
    removeLocal(STORAGE_KEYS.OWNER_LOGGED_IN);
    removeLocal(STORAGE_KEYS.OWNER_PROFILE);
    removeLocal(STORAGE_KEYS.OWNER_PIN_HASH);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
      sessionStorage.removeItem('orderflow_current_staff');
    } catch { /* ignore */ }
  }, []);

  // ---------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------

  const value = useMemo(() => ({
    role,
    ownerProfile,
    isOwner: role === ROLES.OWNER,
    isStaff: role === ROLES.STAFF,
    isAuthenticated: !!role,
    // Owner auth
    registerOwner,
    loginOwner,
    changeOwnerPin,
    // Staff auth
    loginStaff,
    // Session management
    logout,
    resetOwnerAccount,
    // Legacy — kept for any remaining staff-related imports
    encodePin,
  }), [role, ownerProfile, registerOwner, loginOwner, changeOwnerPin, loginStaff, logout, resetOwnerAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
