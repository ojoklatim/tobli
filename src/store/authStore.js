import { create } from 'zustand';
import { insforge } from '../lib/insforge';

export const useAuthStore = create((set) => ({
  session: null,
  business: null,
  isAdmin: false,
  loading: true,
  pendingBusiness: null,

  loadSession: async () => {
    set({ loading: true });
    try {
      const { data } = await insforge.auth.getCurrentUser();
      const user = data?.user;
      
      if (user) {
        // Check if user is in the admins table
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
        set({ session: { user }, business: biz, isAdmin: isAdminUser || biz?.is_admin || false });
      } else {
        set({ session: null, business: null, isAdmin: false });
      }
    } catch {
      set({ session: null, business: null, isAdmin: false });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (name, owner_name, sector, phone, email, password) => {
    const { data, error } = await insforge.auth.signUp({ email, password, name });
    if (error) throw new Error(error.message || 'Signup failed');

    // If email confirmation is required, user/accessToken won't be present yet.
    // Return a flag so the UI can show the OTP input screen.
    if (!data?.user || !data?.accessToken) {
      // Store pending business data so we can create the profile after verification
      set({
        pendingBusiness: { name, owner_name, sector, phone, email },
        loading: false,
      });
      return { requiresEmailConfirmation: true, email };
    }

    // Email confirmation not required — create business profile immediately
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
    set({ session: { user: data.user }, business: biz, isAdmin: false, loading: false });
    return data;
  },

  verifyEmailAndCreateBusiness: async (email, code) => {
    const { pendingBusiness } = useAuthStore.getState();

    const { data, error } = await insforge.auth.verifyEmail({ email, otp: code });
    if (error) throw new Error(error.message || 'Invalid or expired code');

    // After verification the user should be authenticated
    const user = data?.user;
    if (!user) throw new Error('Verification succeeded but no user session was returned');

    // Create the business profile now that the user is confirmed
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
    set({ session: { user }, business: biz, isAdmin: false, pendingBusiness: null, loading: false });
    return biz;
  },

  signIn: async (identifier, password) => {
    // Try email login directly
    let email = identifier;
    // If identifier looks like a phone number, look up the email first
    if (!identifier.includes('@')) {
      const { data: rows } = await insforge.database
        .from('businesses')
        .select('email')
        .eq('phone', identifier);
      if (!rows || rows.length === 0) throw new Error('No account found with that phone number');
      email = rows[0].email;
    }
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || 'Invalid credentials');

    // Check if user is in the admins table
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
    set({ session: { user: data.user }, business: biz, isAdmin: isAdminUser || biz?.is_admin || false, loading: false });
    return data;
  },

  signOut: async () => {
    await insforge.auth.signOut();
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
    // 1. Exchange the code for a session/token
    const { data, error: exchangeError } = await insforge.auth.exchangeResetPasswordToken({
      email,
      code
    });
    
    if (exchangeError) throw new Error(exchangeError.message || 'Invalid or expired code');

    // 2. Reset the password
    const { error: resetError } = await insforge.auth.resetPassword({
      newPassword,
      otp: data.token // The token we got from exchanging the code
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
