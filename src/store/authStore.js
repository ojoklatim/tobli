import { create } from 'zustand';
import { insforge } from '../lib/insforge';

const SESSION_KEY = 'tobli_session';

function saveSession(user, accessToken) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, accessToken }));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create((set) => ({
  session: null,
  business: null,
  isAdmin: false,
  loading: true,
  pendingBusiness: null,

  loadSession: async () => {
    set({ loading: true });
    try {
      // Restore persisted session into the SDK before calling getCurrentUser,
      // so the SDK can make authenticated requests and/or use the refresh flow.
      const persisted = restoreSession();
      if (persisted?.accessToken) {
        insforge.auth.tokenManager?.setAccessToken(persisted.accessToken);
        if (persisted.user) {
          insforge.auth.tokenManager?.setUser(persisted.user);
        }
      }

      const { data } = await insforge.auth.getCurrentUser();
      const user = data?.user;

      if (user) {
        // Persist the (possibly refreshed) session back to localStorage
        const freshToken =
          insforge.auth.tokenManager?.getAccessToken?.() ||
          persisted?.accessToken;
        saveSession(user, freshToken);

        const { data: adminRows } = await insforge.database
          .from('admins')
          .select('*')
          .eq('user_id', user.id);
        const isAdminUser = adminRows && adminRows.length > 0;

        const { data: rows } = await insforge.database
          .from('businesses')
          .select('*')
          .eq('auth_user_id', user.id);
        const biz = rows?.[0] || null;
        set({ session: { user }, business: biz, isAdmin: isAdminUser });
      } else {
        clearSession();
        set({ session: null, business: null, isAdmin: false });
      }
    } catch {
      clearSession();
      set({ session: null, business: null, isAdmin: false });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (name, owner_name, sector, phone, email, password) => {
    // Check if this email already has an unverified auth account but no business row.
    // If so, resend the OTP so they can complete verification rather than being stuck.
    const { data: existingRows } = await insforge.database
      .from('businesses')
      .select('id')
      .eq('email', email);

    const hasBusinessRow = existingRows && existingRows.length > 0;
    if (hasBusinessRow) {
      throw new Error('An account with this email already exists. Please log in instead.');
    }

    // Always store pending business details BEFORE calling signUp,
    // so if the user was previously stuck (unverified), a fresh signUp
    // call re-sends the OTP and they can complete from where they left off.
    set({
      pendingBusiness: { name, owner_name, sector, phone, email },
      loading: false,
    });

    const { data, error } = await insforge.auth.signUp({ email, password, name });

    // If InsForge says the user already exists but is unverified,
    // it typically re-sends the OTP — treat this the same as a fresh signup.
    if (error) {
      const msg = error.message || '';
      const isUnverified =
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('email already') ||
        msg.toLowerCase().includes('verify');
      if (isUnverified) {
        // OTP re-sent — let them proceed to the verify screen
        return { requiresEmailConfirmation: true, email };
      }
      throw new Error(msg || 'Signup failed');
    }

    // Email confirmation required (normal flow)
    if (!data?.user || !data?.accessToken) {
      return { requiresEmailConfirmation: true, email };
    }

    // Rare: InsForge returned a session immediately (no email confirmation needed)
    const { data: rows, error: dbError } = await insforge.database
      .from('businesses')
      .insert([{
        auth_user_id: data.user.id,
        name,
        owner_name,
        sector,
        phone,
        email,
        subscription_status: 'inactive',
        is_open: false,
        is_admin: false,
      }])
      .select('*');
    if (dbError) throw new Error(dbError.message || 'Failed to create business profile');
    const biz = rows?.[0];
    saveSession(data.user, data.accessToken);
    set({ session: { user: data.user }, business: biz, isAdmin: false, loading: false });
    return data;
  },

  verifyEmailAndCreateBusiness: async (email, code) => {
    const { pendingBusiness } = useAuthStore.getState();

    const { data, error } = await insforge.auth.verifyEmail({ email, otp: code });
    if (error) throw new Error(error.message || 'Invalid or expired code');

    const user = data?.user;
    if (!user) throw new Error('Verification succeeded but no user session was returned');

    const pending = pendingBusiness || {};
    const { data: rows, error: dbError } = await insforge.database
      .from('businesses')
      .insert([{
        auth_user_id: user.id,
        name: pending.name,
        owner_name: pending.owner_name,
        sector: pending.sector || null,
        phone: pending.phone,
        email: pending.email || email,
        subscription_status: 'inactive',
        is_open: false,
        is_admin: false,
      }])
      .select('*');
    if (dbError) throw new Error(dbError.message || 'Failed to create business profile');
    const biz = rows?.[0];
    saveSession(user, data.accessToken);
    set({ session: { user }, business: biz, isAdmin: false, pendingBusiness: null, loading: false });
    return biz;
  },

  signIn: async (identifier, password) => {
    let email = identifier;
    if (!identifier.includes('@')) {
      const { data: rows } = await insforge.database
        .from('businesses')
        .select('email')
        .eq('phone', identifier);
      if (!rows || rows.length === 0) throw new Error('Invalid credentials');
      email = rows[0].email;
    }
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || 'Invalid credentials');

    const { data: adminRows } = await insforge.database
      .from('admins')
      .select('*')
      .eq('user_id', data.user.id);
    const isAdminUser = adminRows && adminRows.length > 0;

    const { data: rows } = await insforge.database
      .from('businesses')
      .select('*')
      .eq('auth_user_id', data.user.id);
    const biz = rows?.[0] || null;
    saveSession(data.user, data.accessToken);
    set({ session: { user: data.user }, business: biz, isAdmin: isAdminUser, loading: false });
    return data;
  },

  signOut: async () => {
    await insforge.auth.signOut();
    clearSession();
    set({ session: null, business: null, isAdmin: false });
  },

  createBusinessProfile: async (businessData) => {
    const { session } = useAuthStore.getState();
    if (!session?.user) throw new Error('Not authenticated');

    const { data: rows, error: dbError } = await insforge.database
      .from('businesses')
      .insert([{
        auth_user_id: session.user.id,
        ...businessData,
        subscription_status: 'inactive',
        is_open: false,
        is_admin: false,
      }])
      .select('*');

    if (dbError) throw new Error(dbError.message || 'Failed to create business profile');
    const biz = rows?.[0];
    set({ business: biz });
    return biz;
  },

  sendResetPasswordEmail: async (email) => {
    const { error } = await insforge.auth.sendResetPasswordEmail({
      email,
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw new Error(error.message || 'Failed to send reset email');
  },

  resetPasswordWithCode: async (email, code, newPassword) => {
    const { data, error: exchangeError } = await insforge.auth.exchangeResetPasswordToken({
      email,
      code
    });
    if (exchangeError) throw new Error(exchangeError.message || 'Invalid or expired code');

    const { error: resetError } = await insforge.auth.resetPassword({
      newPassword,
      otp: data.token
    });
    if (resetError) throw new Error(resetError.message || 'Failed to reset password');
  },

  resetPassword: async (newPassword, token) => {
    const { error } = await insforge.auth.resetPassword({
      newPassword,
      otp: token
    });
    if (error) throw new Error(error.message || 'Failed to reset password');
  },
}));
