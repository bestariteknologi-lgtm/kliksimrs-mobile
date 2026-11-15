import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { api, currentToken, restoreToken, setToken, setUnauthorizedHandler } from './api';
import { loadToken } from './session';
import { registerPush, unregisterPush } from './push';
import type { AuthResult, CaraBayarJenis, PayMetode, Pembayaran, Profil } from './types';

export type Screen =
  | 'splash' | 'login' | 'register' | 'forgot' | 'home' | 'queue' | 'ticket' | 'records' | 'lab'
  | 'pay' | 'payDetail' | 'success' | 'profile' | 'notif' | 'akun' | 'live' | 'kunjungan' | 'ringkasan';

type State = {
  screen: Screen;
  user: Profil | null;
  poliId: string | null; dokterId: string | null;
  cara: CaraBayarJenis; asuransiId: string | null;
  payMethod: PayMetode; recTab: number;
  antrianId: string | null; labId: string | null; tagihanId: string | null; ringkasanId: string | null;
  payment: Pembayaran | null;
};

const initial: State = {
  screen: 'splash', user: null, poliId: null, dokterId: null, cara: 'UMUM', asuransiId: null,
  payMethod: 'QRIS', recTab: 0, antrianId: null, labId: null, tagihanId: null, ringkasanId: null, payment: null,
};

const BACK: Partial<Record<Screen, Screen>> = {
  ticket: 'live', live: 'home', kunjungan: 'home', ringkasan: 'records', lab: 'records', payDetail: 'pay', success: 'pay',
  queue: 'home', records: 'home', pay: 'home', profile: 'home', register: 'login', forgot: 'login',
  notif: 'home', akun: 'profile',
};

type Store = State & {
  go: (screen: Screen, patch?: Partial<State>) => void;
  set: (patch: Partial<State>) => void;
  signIn: (auth: AuthResult) => void;
  logout: () => void;
  /** Dipanggil Splash: pulihkan sesi dari penyimpanan, lalu arahkan ke home/login. */
  bootstrap: () => Promise<void>;
};

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const loggingOut = useRef(false);

  const set = useCallback((patch: Partial<State>) => setS(p => ({ ...p, ...patch })), []);
  const go = useCallback((screen: Screen, patch: Partial<State> = {}) => setS(p => ({ ...p, ...patch, screen })), []);

  const signIn = useCallback((auth: AuthResult) => {
    setToken(auth.token);
    setS({ ...initial, screen: 'home', user: auth.profil });
    void registerPush();
  }, []);

  const logout = useCallback(() => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    const old = currentToken();
    setS({ ...initial, screen: 'login' });
    // Lepas token push dan cabut sesi di server (butuh token lama), baru hapus token lokal.
    // Bila pengguna sudah login lagi sebelum selesai, token baru tidak boleh ikut terhapus.
    void (async () => {
      await unregisterPush();
      await api.logout().catch(() => undefined);
      if (currentToken() === old) setToken(null);
      loggingOut.current = false;
    })();
  }, []);

  const bootstrap = useCallback(async () => {
    const saved = await loadToken();
    if (!saved) { go('login'); return; }
    restoreToken(saved);
    try {
      const user = await api.me();
      setS(p => ({ ...p, screen: 'home', user }));
      void registerPush();
    } catch {
      setToken(null);
      go('login');
    }
  }, [go]);

  // Token ditolak server (kedaluwarsa/dicabut): kembali ke login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setS(p => (p.screen === 'login' || p.screen === 'splash' ? p : { ...initial, screen: 'login' }));
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Tombol back Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const target = BACK[s.screen];
      if (!target) return false;
      go(target);
      return true;
    });
    return () => sub.remove();
  }, [s.screen, go]);

  const value = useMemo<Store>(() => ({ ...s, go, set, signIn, logout, bootstrap }), [s, go, set, signIn, logout, bootstrap]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
