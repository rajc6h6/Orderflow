/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, ROLES } from '../config/constants';

const AuthContext = createContext(null);

/**
 * MVP: Fixed owner PIN — remove / replace with real auth before production.
 */
const MVP_OWNER_PIN = '0000';

/**
 * Simple PIN encoding using btoa — consistent, browser-native, no bitwise issues.
 * Not cryptographic, just prevents plain-text storage.
 */
export function encodePin(pin) {
  return btoa(`of:${pin}:2024`);
}

function getStored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function setStored(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage full */ }
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => {
    try { return sessionStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || null; } catch { return null; }
  });

  // Reactive — updated by setupPins and resetPins
  const [isFirstLaunch, setIsFirstLaunch] = useState(() => {
    return !getStored(STORAGE_KEYS.OWNER_PIN_HASH);
  });

  /**
   * First-time PIN setup — stores encoded PIN AND auto-logs in as owner.
   */
  const setupPins = useCallback((ownerPin) => {
    if (!/^\d{4}$/.test(String(ownerPin))) {
      return { success: false, error: 'PIN must be exactly 4 digits' };
    }

    const encoded = encodePin(String(ownerPin));
    setStored(STORAGE_KEYS.OWNER_PIN_HASH, encoded);
    setIsFirstLaunch(false);

    // Auto-login so user goes straight to dashboard after setup
    setRole(ROLES.OWNER);
    try { sessionStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, ROLES.OWNER); } catch {}

    return { success: true };
  }, []);

  /**
   * Verify PIN and log in as owner.
   * MVP: accepts the hardcoded PIN '0000' unconditionally.
   */
  const login = useCallback((targetRole, pin) => {
    const pinStr = String(pin);

    if (!/^\d{4}$/.test(pinStr)) {
      return { success: false, error: 'PIN must be 4 digits' };
    }

    if (targetRole !== ROLES.OWNER) {
      return { success: false, error: 'Invalid role for PIN login' };
    }

    // MVP: fixed PIN bypass — any stored PIN is also accepted for flexibility
    const stored = getStored(STORAGE_KEYS.OWNER_PIN_HASH);
    const isValidPin = pinStr === MVP_OWNER_PIN || (stored && encodePin(pinStr) === stored);

    if (!isValidPin) {
      return { success: false, error: 'Incorrect PIN' };
    }

    setRole(targetRole);
    try { sessionStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, targetRole); } catch {}

    return { success: true };
  }, []);

  /**
   * Verify Staff Phone + PIN.
   */
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
    } catch {}

    return { success: true, staff: staffMember };
  }, []);

  /**
   * Log out — clears role but keeps PINs.
   */
  const logout = useCallback(() => {
    setRole(null);
    try { 
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
      sessionStorage.removeItem('orderflow_current_staff');
    } catch { /* ignore */ }
  }, []);

  /**
   * Full reset — wipes everything.
   */
  const resetPins = useCallback(() => {
    setRole(null);
    setIsFirstLaunch(true);
    try {
      localStorage.removeItem(STORAGE_KEYS.OWNER_PIN_HASH);
      localStorage.removeItem(STORAGE_KEYS.STAFF_PIN_HASH);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
      sessionStorage.removeItem('orderflow_current_staff');
    } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({
    role,
    isFirstLaunch,
    isOwner: role === ROLES.OWNER,
    isStaff: role === ROLES.STAFF,
    isAuthenticated: !!role,
    setupPins,
    login,
    loginStaff,
    logout,
    resetPins,
  }), [role, isFirstLaunch, setupPins, login, loginStaff, logout, resetPins]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
