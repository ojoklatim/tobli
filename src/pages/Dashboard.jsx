import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { insforge } from '../lib/insforge';
import {
  BarChart3, List, Settings, CreditCard,
  MapPin, Power, Plus, Trash2,
  Save, AlertTriangle, Loader2, X as CloseIcon, Phone,
  Globe, Instagram, Send, Download, Edit2, HelpCircle, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import ThemeToggle from '../components/ThemeToggle';

function normalizePhone(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('256') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) 
    return '256' + digits.slice(1);
  throw new Error('Invalid Ugandan phone number');
}

function detectNetwork(normalized) {
  try {
    const prefix = normalized.slice(3, 6); // after 256
    if (['076','077','078','039'].includes(prefix)) return 'MTN Mobile Money';
    if (['075','070'].includes(prefix)) return 'Airtel Money';
    return null;
  } catch(e) {
    return null;
  }
}


const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function Dashboard() {

  const navigate = useNavigate();
  const location = useLocation();
  const { session, business, isAdmin, loading: authLoading, signOut } = useAuthStore();
  const theme = useStore(state => state.theme);
  const [activeTab, setActiveTab] = useState('overview');

  const [showTour, setShowTour] = useState(false);
  const [history, setHistory] = useState([]);
  const [latestSub, setLatestSub] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSwallowing, setIsSwallowing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const hasSeenDashboardTour = localStorage.getItem('tobli_has_seen_dashboard_tour');
    if (!hasSeenDashboardTour) {
      setShowTour(true);
      localStorage.setItem('tobli_has_seen_dashboard_tour', 'true');
    }
  }, []);
  const [showSetupPrompt, setShowSetupPrompt] = useState(location.state?.isNewSignup || false);
  const [listingsCount, setListingsCount] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!session?.user) {
        navigate('/login');
      } else if (isAdmin) {
        // Admins should use the Admin panel, not the business dashboard
        navigate('/admin');
      } else if (!business) {
        // Non-admin users without a business profile are redirected to login/signup
        navigate('/login');
      }
    }
  }, [session, business, isAdmin, authLoading, navigate]);

  // Handle Pesapal callback redirect — Pesapal appends OrderTrackingId (and we
  // store merchantRef in sessionStorage) so when the user lands back on /dashboard
  // we can check status AND trigger the DB update in one call, without waiting
  // for the IPN webhook which may be delayed or fail silently.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackingId = params.get('OrderTrackingId');
    if (!trackingId) return;

    // Retrieve the merchantRef we saved before the redirect
    const merchantRef = sessionStorage.getItem('tobli_merchant_ref') || '';
    sessionStorage.removeItem('tobli_merchant_ref');

    // Remove the query params from the URL without a page reload
    window.history.replaceState({}, '', window.location.pathname);

    let attempts = 0;
    const maxAttempts = 24; // 2 minutes at 5s intervals

    const checkAndActivate = async () => {
      attempts++;
      try {
        // Pass merchantRef so the server updates the DB when payment is confirmed
        const qs = merchantRef
          ? `orderTrackingId=${trackingId}&merchantRef=${encodeURIComponent(merchantRef)}`
          : `orderTrackingId=${trackingId}`;
        const res = await fetch(`/api/pesapal-status?${qs}`);
        const data = await res.json();

        if (data.statusCode === 1) {
          clearInterval(poll);
          // Give the DB a moment to commit, then reload everything
          await new Promise(r => setTimeout(r, 1500));
          await useAuthStore.getState().loadSession();
          if (window._tobli_refresh) await window._tobli_refresh();
          setActiveTab('subscription');
        } else if (data.statusCode === 2 || data.statusCode === 3 || attempts >= maxAttempts) {
          clearInterval(poll);
        }
      } catch {
        if (attempts >= maxAttempts) clearInterval(poll);
      }
    };

    // Check immediately on arrival, then every 5 seconds
    checkAndActivate();
    const poll = setInterval(checkAndActivate, 5000);

    return () => clearInterval(poll);
  }, []);

  // Local mutable business state for toggling open/closed
  const [biz, setBiz] = useState(null);
  useEffect(() => {
    if (business) setBiz({ ...business });
  }, [business]);

  useEffect(() => {
    if (!biz?.id) return;
    insforge.database
      .from('items')
      .select('id', { count: 'exact' })
      .eq('business_id', biz.id)
      .then(({ count }) => setListingsCount(count || 0));

    const fetchHistory = async () => {
      const { data } = await insforge.database
        .from('subscriptions')
        .select('*')
        .eq('business_id', biz.id)
        .order('paid_at', { ascending: false });
      
      setHistory(data || []);
      setLatestSub(data?.[0] || null);
      setLoadingHistory(false);
    };

    const refreshData = async () => {
      await fetchHistory();
      await useAuthStore.getState().loadSession();
    };

    fetchHistory();
    // Expose refreshData for use in tabs
    window._tobli_refresh = refreshData;
  }, [biz?.id]);

  // Don't show the business loader if we are an admin (we'll be redirected anyway)
  // or if we are still loading the auth state.
  if (authLoading || (!biz && !isAdmin)) return (
    <div className={`h-screen w-full flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F]' : 'bg-gray-100'}`}>
      <Loader2 className={`animate-spin w-12 h-12 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
    </div>
  );

  const isSubActive = biz.subscription_status === 'active';

  const toggleOpen = async () => {
    const newState = !biz.is_open;
    await insforge.database
      .from('businesses')
      .update({ is_open: newState })
      .eq('id', biz.id);
    setBiz(prev => ({ ...prev, is_open: newState }));
  };

  const checklist = [
    { id: 'name', label: 'Set business & owner name', done: !!(biz.name && biz.owner_name), action: () => setActiveTab('info') },
    { id: 'contact', label: 'Add contact info', done: !!(biz.phone || biz.whatsapp), action: () => setActiveTab('info') },
    { id: 'location', label: 'Pin business location', done: !!(biz.lat && biz.lng), action: () => setActiveTab('info') },
    { id: 'listing', label: 'Add first listing', done: listingsCount > 0, action: () => setActiveTab('listings') }
  ];
  const completedSteps = checklist.filter(item => item.done).length;
  const completionPercent = Math.round((completedSteps / checklist.length) * 100);

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F] text-white' : 'bg-gray-50 text-black'}`}>
      {/* Header */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 bg-neutral-900/20 text-white' : 'border-black/5 bg-white/70 text-black'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-2 sm:gap-4">
          {/* Top Left: Business Name */}
          <div className="text-xl font-syne font-extrabold tracking-tighter flex-1 min-w-0 truncate">
            {biz.name}
          </div>

          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <ThemeToggle />
            {/* Centre: Open/Closed Toggle */}
            <div className={`flex items-center gap-2 p-1.5 rounded-full border transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-gray-200 border-black/5'}`}>
              <span className={`text-[10px] uppercase font-black tracking-widest pl-2 hidden sm:inline ${biz.is_open ? 'text-green-500' : 'text-red-500'}`}>
                {biz.is_open ? 'Open' : 'Closed'}
              </span>
              <button
                onClick={toggleOpen}
                className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${biz.is_open ? 'bg-green-500' : 'bg-red-500'}`}
              >
                <motion.div 
                  animate={{ x: biz.is_open ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg" 
                />
              </button>
            </div>

            {/* Far Right: Logout */}
            <button
              onClick={() => { signOut(); navigate('/login'); }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-colors font-bold text-xs uppercase ${theme === 'dark' ? 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10' : 'bg-black/5 text-neutral-600 hover:text-black hover:bg-black/10'}`}
            >
              <Power size={14} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {completionPercent < 100 && (
          <div className="w-full h-1 bg-gray-200 dark:bg-neutral-800">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${completionPercent}%` }}
              title={`Setup ${completionPercent}% complete`}
            />
          </div>
        )}
      </header>

      {/* Subscription Notice */}
      {!isSubActive && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 py-3 text-center text-sm font-bold px-6">
           <AlertCircle size={16} className="inline mr-2" />
           Action Required: Your listings will not appear on the map.
           <button onClick={() => setActiveTab('subscription')} className="underline font-black ml-2 hover:text-red-600 transition-colors">
             {latestSub ? 'Renew Access' : 'Get Access'}
           </button>
        </div>
      )}

      {/* Dashboard Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <nav className="w-full md:w-64 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'listings', label: 'Manage Listings', icon: List },
              { id: 'info', label: 'Business Info', icon: Settings },
              { id: 'subscription', label: 'Subscription', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${activeTab === tab.id 
                  ? (theme === 'dark' ? 'bg-white text-black font-bold' : 'bg-black text-white font-bold shadow-md') 
                  : (theme === 'dark' ? 'text-neutral-400 hover:bg-white/5 hover:text-white' : 'text-neutral-500 hover:bg-black/5 hover:text-black')}`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
        </nav>

        {/* Content */}
        <section className={`flex-1 rounded-[24px] border p-6 relative min-h-[600px] transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/30 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
          {activeTab === 'overview' && <OverviewTab biz={biz} setActiveTab={setActiveTab} checklist={checklist} completionPercent={completionPercent} listingsCount={listingsCount} theme={theme} />}
          {activeTab === 'listings' && <ListingsTab biz={biz} setListingsCount={setListingsCount} />}
          {activeTab === 'info' && <InfoTab biz={biz} setBiz={setBiz} />}
          {activeTab === 'subscription' && <SubscriptionTab biz={biz} history={history} latestSub={latestSub} loadingHistory={loadingHistory} setHistory={setHistory} setLatestSub={setLatestSub} setLoadingHistory={setLoadingHistory} onRefresh={() => window._tobli_refresh?.()} />}
        </section>
      </main>

      {/* Full screen setup prompt for new signups */}
      {showSetupPrompt && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className={`border p-8 md:p-12 rounded-[32px] max-w-lg w-full text-center shadow-2xl transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/10'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`}>
              <Settings size={36} className={theme === 'dark' ? 'text-white' : 'text-black'} />
            </div>
            <h2 className={`text-3xl font-syne font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Welcome to TOBLI!</h2>
            <p className={`mb-8 leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              To get the most out of your business profile and help customers find you easily, please take a moment to fully set up your business info, contact details, and location.
            </p>
            <button
              onClick={() => {
                setShowSetupPrompt(false);
                setActiveTab('info');
                // Replace state to avoid showing it again on refresh
                window.history.replaceState({}, document.title);
              }}
              className={`w-full font-bold py-4 rounded-xl transition-colors ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
            >
              Set Up Business Info
            </button>
            <button
              onClick={() => {
                setShowSetupPrompt(false);
                window.history.replaceState({}, document.title);
              }}
              className={`mt-4 text-sm transition-colors ${theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* How to use button */}
      <div className="fixed bottom-8 right-8 z-[1000] pointer-events-auto">
        <button
          onClick={() => setShowTour(true)}
          className={`w-14 h-14 backdrop-blur-2xl border rounded-full flex items-center justify-center transition-all ${isSwallowing ? (theme === 'dark' ? 'scale-[1.5] shadow-[0_0_50px_rgba(255,255,255,0.8)] bg-white text-black border-transparent' : 'scale-[1.5] shadow-[0_0_50px_rgba(0,0,0,0.6)] bg-black text-white border-transparent') : 'shadow-[0_8px_30px_rgb(0,0,0,0.5)] active:scale-90 group ' + (theme === 'dark' ? 'bg-neutral-900/95 border-white/10 text-white hover:bg-neutral-800 hover:border-white/20' : 'bg-white/95 border-black/10 text-black hover:bg-neutral-100 hover:border-black/20')}`}
          title="Dashboard Guide"
        >
          <HelpCircle size={24} className={isSwallowing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
        </button>
      </div>

      {/* Tour Overlay */}
      <AnimatePresence onExitComplete={() => setIsSwallowing(false)}>
        {showTour && <DashboardTourOverlay onClose={() => {
          setIsSwallowing(true);
          setShowTour(false);
        }} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── OVERVIEW TAB ──────────────────────────────────────────── */
function OverviewTab({ biz, checklist, completionPercent, listingsCount }) {
  const [impressionsCount, setImpressionsCount] = useState(0);
  const theme = useStore(state => state.theme);

  useEffect(() => {
    if (!biz?.id) return;
    

    // Fetch impressions count for last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    insforge.database
      .from('search_impressions')
      .select('id')
      .eq('business_id', biz.id)
      .gte('created_at', yesterday)
      .then(({ data }) => setImpressionsCount(data?.length || 0));
  }, [biz?.id]);

  return (
    <div className="space-y-8">

      {completionPercent < 100 && (
        <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-neutral-800/50 border-white/10' : 'bg-blue-50 border-blue-100'}`}>
          <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>Getting Started</h3>
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-neutral-400' : 'text-blue-700'}`}>Complete these steps to get your business ready for customers.</p>
          <div className="space-y-3">
            {checklist.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${item.done ? 'bg-green-500 border-green-500 text-white' : (theme === 'dark' ? 'border-neutral-500 text-transparent' : 'border-blue-300 text-transparent')}`}>
                  {item.done && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <button onClick={item.action} className={`text-sm ${item.done ? (theme === 'dark' ? 'text-neutral-500 line-through' : 'text-blue-400 line-through') : (theme === 'dark' ? 'text-white hover:underline' : 'text-blue-900 font-medium hover:underline')}`}>
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl font-syne font-bold">Performance Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => setActiveTab('subscription')}>
          <StatCard label="Subscription" value={biz.subscription_status === 'active' ? 'Active' : 'Inactive'} dotColor={biz.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'} />
        </div>
        <StatCard label="Status" value={biz.is_open ? 'Open' : 'Closed'} dotColor={biz.is_open ? 'bg-green-500' : 'bg-red-500'} />
        <StatCard label="Total Listings" value={listingsCount} />
        <StatCard label="Map Appearances" value={impressionsCount} />
      </div>
    </div>
  );
}

function StatCard({ label, value, dotColor }) {
  const theme = useStore(state => state.theme);
  return (
    <div className={`border p-6 rounded-3xl transition-all duration-300 ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
      <div className={`text-xs uppercase tracking-widest font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>{label}</div>
      <div className="flex items-center gap-2">
        {dotColor && <div className={`w-2 h-2 rounded-full ${dotColor}`} />}
        <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{value}</span>
      </div>
    </div>
  );
}

/* ─── LISTINGS TAB ──────────────────────────────────────────── */
function ListingsTab({ biz, setListingsCount }) {
  const [newItem, setNewItem] = useState({ name: '', type: 'product', price: '', price_type: 'fixed', price_suffix: '', imageFile: null, imagePreview: null });
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!biz?.id) return;
    const load = async () => {
      setListingsLoading(true);
      const { data } = await insforge.database
        .from('items')
        .select('*')
        .eq('business_id', biz.id);
      setListings(data || []);
      setListingsLoading(false);
    };
    load();
  }, [biz?.id]);

  const toggle = async (id) => {
    const item = listings.find(i => i.id === id);
    await insforge.database
      .from('items')
      .update({ available: !item.available })
      .eq('id', id);
    setListings(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
  };

  const deleteItem = async (id) => {
    await insforge.database.from('items').delete().eq('id', id);
    setListings(prev => {
      const updated = prev.filter(i => i.id !== id);
      if (setListingsCount) setListingsCount(updated.length);
      return updated;
    });
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  const handleItemImageChange = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WebP, and GIF images are allowed.');
      return;
    }
    const url = URL.createObjectURL(file);
    if (isEdit) {
      setEditingItem(prev => ({ ...prev, imageFile: file, imagePreview: url }));
    } else {
      setNewItem(prev => ({ ...prev, imageFile: file, imagePreview: url }));
    }
  };

  const uploadItemImage = async (file, itemId) => {
    const imageCompression = (await import('browser-image-compression')).default;
    const compressed = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true });
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error('Invalid file type');
    const path = `items/${biz.id}/${itemId}.${ext}`;
    const { data, error } = await insforge.storage.from('tobli-media').upload(path, compressed);
    if (error) throw new Error('Failed to upload image. Please try again.');
    return data?.url;
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.price || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { data, error: dbError } = await insforge.database
        .from('items')
        .insert([{
          business_id: biz.id,
          name: newItem.name,
          type: newItem.type,
          price: newItem.price_type === 'negotiable' ? null : parseFloat(newItem.price),
          price_type: newItem.price_type,
          price_suffix: newItem.price_suffix,
          available: true,
        }])
        .select('*');
      
      if (dbError) throw dbError;

      if (data?.[0]) {
        let finalItem = data[0];
        if (newItem.imageFile) {
          const url = await uploadItemImage(newItem.imageFile, finalItem.id);
          if (url) {
            await insforge.database.from('items').update({ image_url: url }).eq('id', finalItem.id);
            finalItem.image_url = url;
          }
        }
        setListings(prev => {
          const updated = [...prev, finalItem];
          if (setListingsCount) setListingsCount(updated.length);
          return updated;
        });
      }
      setNewItem({ name: '', type: 'product', price: '', imageFile: null, imagePreview: null });
      setShowAdd(false);
    } catch (err) {
      setError('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingItem({ ...item });
  };

  const saveEdit = async () => {
    if (!editingItem || !editingItem.name || !editingItem.price || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      let imageUrl = editingItem.image_url;
      if (editingItem.imageFile) {
        imageUrl = await uploadItemImage(editingItem.imageFile, editingItem.id);
      }

      const { error: dbError } = await insforge.database
        .from('items')
        .update({ 
          name: editingItem.name, 
          type: editingItem.type, 
          price: editingItem.price_type === 'negotiable' ? null : parseFloat(editingItem.price),
          price_type: editingItem.price_type,
          price_suffix: editingItem.price_suffix,
          image_url: imageUrl
        })
        .eq('id', editingItem.id);
      
      if (dbError) throw dbError;

      setListings(prev => prev.map(i => i.id === editingItem.id ? { ...editingItem, price: parseFloat(editingItem.price), image_url: imageUrl } : i));
      setEditingItem(null);
    } catch (err) {
      setError('Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = useStore(state => state.theme);
  const filtered = listings.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-syne font-bold">Manage Listings</h2>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`border-none rounded-2xl px-4 py-2 text-sm w-full md:w-48 focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white placeholder-neutral-500' : 'bg-gray-100 text-black placeholder-neutral-400'}`}
          />
          <button onClick={() => setShowAdd(true)} className={`px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs transition-colors duration-300 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className={`border rounded-3xl p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/10 shadow-lg'}`}>
          <div className="flex justify-between mb-6">
            <h3 className="font-bold">New Item</h3>
            <button onClick={() => setShowAdd(false)} className={theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}><CloseIcon size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Item Name</label>
              <input placeholder="Name" className={`w-full border-none rounded-2xl p-4 focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Pricing Mode</label>
              <select className={`w-full border-none rounded-2xl p-4 focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={newItem.price_type} onChange={e => setNewItem({ ...newItem, price_type: e.target.value })}>
                <option value="fixed">Fixed Price</option>
                <option value="starting">Starting From</option>
                <option value="negotiable">Negotiable / Varied</option>
              </select>
            </div>
            {newItem.price_type !== 'negotiable' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Price (UGX)</label>
                  <input placeholder="Price" type="number" className={`w-full border-none rounded-2xl p-4 font-mono focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Unit (Optional)</label>
                  <input placeholder="e.g. /hr, /day" className={`w-full border-none rounded-2xl p-4 focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={newItem.price_suffix} onChange={e => setNewItem({ ...newItem, price_suffix: e.target.value })} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Image</label>
              <label className={`w-full h-[56px] flex items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden relative ${theme === 'dark' ? 'bg-neutral-800 border-white/10 hover:border-white/30' : 'bg-gray-100 border-black/10 hover:border-black/30'}`}>
                {newItem.imagePreview ? (
                  <img src={newItem.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <Plus size={20} className="text-neutral-500" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleItemImageChange} />
              </label>
            </div>
            <button 
              onClick={addItem} 
              disabled={isSubmitting}
              className={`h-[56px] font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Add Item →'}
            </button>
          </div>
          {error && <div className="mt-4 text-red-500 text-xs font-bold">{error}</div>}
        </div>
      )}

      {/* Edit form */}
      {editingItem && (
        <div className={`border rounded-3xl p-6 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900 border-white/20' : 'bg-white border-black/20 shadow-lg'}`}>
          <div className="flex justify-between mb-6">
            <h3 className={`font-bold uppercase text-xs tracking-widest ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Edit Item</h3>
            <button onClick={() => setEditingItem(null)} className="text-neutral-500 hover:text-white transition-colors"><CloseIcon size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Item Name</label>
              <input className={`w-full border-none rounded-2xl p-4 focus:outline-none text-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Pricing Mode</label>
              <select className={`w-full border-none rounded-2xl p-4 focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={editingItem.price_type} onChange={e => setEditingItem({ ...editingItem, price_type: e.target.value })}>
                <option value="fixed">Fixed Price</option>
                <option value="starting">Starting From</option>
                <option value="negotiable">Negotiable / Varied</option>
              </select>
            </div>
            {editingItem.price_type !== 'negotiable' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Price (UGX)</label>
                  <input type="number" className={`w-full border-none rounded-2xl p-4 font-mono focus:outline-none text-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Unit (Optional)</label>
                  <input placeholder="e.g. /hr" className={`w-full border-none rounded-2xl p-4 focus:outline-none text-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={editingItem.price_suffix} onChange={e => setEditingItem({ ...editingItem, price_suffix: e.target.value })} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Image</label>
              <label className={`w-full h-[56px] flex items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden relative ${theme === 'dark' ? 'bg-neutral-800 border-white/10 hover:border-white/30' : 'bg-gray-100 border-black/10 hover:border-black/30'}`}>
                {editingItem.imagePreview || editingItem.image_url ? (
                  <img src={editingItem.imagePreview || editingItem.image_url} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <Plus size={20} className="text-neutral-500" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleItemImageChange(e, true)} />
              </label>
            </div>
            <button 
              onClick={saveEdit} 
              disabled={isSubmitting}
              className={`h-[56px] font-bold rounded-2xl transition-all duration-300 text-sm shadow-xl flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Update Item →'}
            </button>
          </div>
          {error && <div className="mt-4 text-red-500 text-xs font-bold">{error}</div>}
        </div>
      )}

      {/* Listings Table */}
      <div className={`rounded-3xl border overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/40 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
        {/* Mobile scroll hint */}
        <div className={`md:hidden text-[10px] text-center py-3 border-b font-bold tracking-widest uppercase ${theme === 'dark' ? 'text-neutral-400 bg-neutral-800/50 border-white/5' : 'text-neutral-500 bg-gray-50 border-black/5'}`}>
          Swipe horizontally to view more ↔
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className={`text-[10px] uppercase tracking-widest border-b font-black ${theme === 'dark' ? 'text-neutral-500 border-white/5' : 'text-neutral-600 border-black/5'}`}>
                <th className="p-6">Image</th>
                <th className="p-6">Name</th>
                <th className="p-6 text-right">Price</th>
                <th className="p-6 text-center">Available</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listingsLoading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <Loader2 className="animate-spin text-white/20 w-8 h-8 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length > 0 ? filtered.map(item => (
                <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                  <td className="p-6">
                    <div className={`w-12 h-12 rounded-xl overflow-hidden border ${theme === 'dark' ? 'bg-neutral-800 border-white/5' : 'bg-gray-100 border-black/5'}`}>
                      {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />}
                    </div>
                  </td>
                  <td className="p-6 font-medium">{item.name}</td>
                  <td className="p-4">
                    <div className="font-mono text-xs font-bold text-right">
                      {item.price_type === 'negotiable' ? (
                        <span className="text-neutral-500 uppercase text-[10px] tracking-widest">Negotiable</span>
                      ) : (
                        <>
                          {item.price_type === 'starting' && <span className="text-[9px] uppercase opacity-50 block leading-none mb-1">From</span>}
                          UGX {item.price?.toLocaleString() || '—'}
                          {item.price_suffix && <span className="opacity-50 ml-1 text-[10px]">{item.price_suffix}</span>}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => toggle(item.id)} 
                      className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${item.available ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                      <motion.div 
                        animate={{ x: item.available ? 16 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-md" 
                      />
                    </button>
                  </td>
                  <td className="p-6 text-right space-x-2">
                    <button onClick={() => startEdit(item)} className="p-2 text-neutral-500 hover:text-white transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => deleteItem(item.id)} className="p-2 text-neutral-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-12 text-center text-neutral-500">No items found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoTab({ biz, setBiz }) {
  const [form, setForm] = useState({ ...biz });
  const [msg, setMsg] = useState('');

  useEffect(() => { setForm({ ...biz }); }, [biz]);

  const theme = useStore(state => state.theme);
  const save = async () => {
    if (!form.lat || !form.lng) {
      setMsg('Business location is mandatory. Please pin your location.');
      return;
    }
    setMsg('');
    const { error } = await insforge.database
      .from('businesses')
      .update({
        owner_name: form.owner_name,
        name: form.name,
        whatsapp: form.whatsapp,
        phone: form.phone,
        instagram: form.instagram,
        x_handle: form.x_handle,
        website: form.website,
        lat: form.lat,
        lng: form.lng,
      })
      .eq('id', biz.id);
    if (error) { setMsg('Save failed'); return; }
    setBiz({ ...form });
    // Also update the store so the header reflects the new name immediately
    useAuthStore.setState(state => ({ business: { ...state.business, ...form } }));
    setMsg('Changes saved');
    setTimeout(() => setMsg(''), 3000);
  };

  const getGeo = () => {
    if (!('geolocation' in navigator)) {
      setMsg('Geolocation is not supported by your browser.');
      return;
    }
    setMsg('Detecting location…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm({ ...form, lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMsg('Location detected. Save to confirm.');
        setTimeout(() => setMsg(''), 4000);
      },
      err => {
        if (err.code === 1) {
          setMsg('Location access denied. Please enable it in your browser settings.');
        } else if (err.code === 3) {
          // Timeout — retry without high accuracy
          navigator.geolocation.getCurrentPosition(
            pos => {
              setForm({ ...form, lat: pos.coords.latitude, lng: pos.coords.longitude });
              setMsg('Location detected. Save to confirm.');
              setTimeout(() => setMsg(''), 4000);
            },
            () => {
              setMsg('Could not detect location. Please try again or enter manually.');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
          );
        } else {
          setMsg('Unable to detect location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-syne font-bold">Business Info</h2>
        <button onClick={save} className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors duration-300 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}>
          <Save size={16} /> Save Changes
        </button>
      </div>
      {msg && <div className={`text-sm font-bold mb-4 ${msg.includes('mandatory') ? 'text-red-500' : 'text-green-500'}`}>{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Identity */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Identity</h3>
          <div className="space-y-4">
            <InfoField label="Owner's Name" value={form.owner_name} onChange={v => setForm({ ...form, owner_name: v })} />
            <InfoField label="Business Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Contact Info</h3>
          <div className="space-y-4">
            <InfoField label="WhatsApp (e.g. 256...)" value={form.whatsapp} onChange={v => setForm({ ...form, whatsapp: v })} icon={<Send size={16} />} />
            <InfoField label="Phone Number" value={form.phone} onChange={v => setForm({ ...form, phone: v })} icon={<Phone size={16} />} />
            <InfoField label="Instagram handle (Optional)" value={form.instagram} onChange={v => setForm({ ...form, instagram: v })} icon={<Instagram size={16} />} />
            <InfoField label="X / Twitter handle (Optional)" value={form.x_handle} onChange={v => setForm({ ...form, x_handle: v })} icon={<XIcon size={16} />} />

            <InfoField label="Website (Optional)" value={form.website} onChange={v => setForm({ ...form, website: v })} icon={<Globe size={16} />} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className={`p-8 rounded-[24px] border transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-gray-50 border-black/5 shadow-sm'}`}>
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6">Set Business Location</h3>
        <div className="flex items-center gap-4">
          <div className={`flex-1 p-4 rounded-xl font-mono text-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-neutral-400' : 'bg-white border border-black/5 text-neutral-600'}`}>
            {form.lat ? `${form.lat.toFixed(4)}, ${form.lng?.toFixed(4)}` : 'Not set'}
          </div>
          <button onClick={getGeo} className={`p-4 rounded-xl transition-colors flex items-center gap-2 ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
            <MapPin size={18} /> Pin Current Location
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, onChange, icon }) {
  const theme = useStore(state => state.theme);
  return (
    <div>
      <label className={`block text-xs uppercase font-bold mb-2 ml-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-700'}`}>{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full border rounded-2xl p-4 pl-12 font-sans text-sm focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900 border-white/5 focus:border-white text-white' : 'bg-white border-black/10 focus:border-black text-black'}`}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
        <div className={`absolute left-4 inset-y-0 flex items-center ${theme === 'dark' ? 'text-neutral-600' : 'text-neutral-400'}`}>
          {icon || <Globe size={16} />}
        </div>
      </div>
    </div>
  );
}

/* ─── SUBSCRIPTION TAB ──────────────────────────────────────── */
function SubscriptionTab({ biz, history, latestSub, loadingHistory, setHistory, setLatestSub, setLoadingHistory, onRefresh }) {
  const theme = useStore(state => state.theme);

  // Renewal flow state
  const [step, setStep] = useState('view'); // 'view' | 'fee_info' | 'waiting' | 'success'
  const [paymentPhone, setPaymentPhone] = useState(biz?.phone || '');
  const [orderTrackingId, setOrderTrackingId] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!biz?.id) return;
    const fetchHistory = async () => {
      const { data } = await insforge.database
        .from('subscriptions')
        .select('*')
        .eq('business_id', biz.id)
        .order('paid_at', { ascending: false });
      
      setHistory(data || []);
      setLatestSub(data?.[0] || null);
      setLoadingHistory(false);
    };
    fetchHistory();
  }, [biz?.id, step]); // refresh when step changes (e.g. success -> view)

  const isExpired = biz.subscription_status === 'inactive' || (latestSub?.expires_at && new Date(latestSub.expires_at) < new Date());
  
  let daysRemaining = 0;
  if (latestSub?.expires_at) {
    const expiresAt = new Date(latestSub.expires_at);
    const now = new Date();
    const diff = expiresAt - now;
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }



  const submitPayment = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const normalized = normalizePhone(paymentPhone);
      const res = await fetch('/api/pesapal-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: biz.id,
          phone_number: normalized,
          first_name: biz.owner_name?.split(' ')[0] || 'Business',
          last_name: biz.owner_name?.split(' ').slice(1).join(' ') || 'Owner',
          email: biz.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment request failed');
      
      setOrderTrackingId(data.orderTrackingId);
      setRedirectUrl(data.redirectUrl);
      // Save merchantRef before the redirect so the return handler can pass it
      // to pesapal-status and trigger the DB update on the way back.
      if (data.merchantRef) {
        sessionStorage.setItem('tobli_merchant_ref', data.merchantRef);
      }
      setStep('waiting');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (step === 'waiting' && redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [step, redirectUrl]);

  useEffect(() => {
    let interval;
    let timeout;
    if (step === 'waiting' && orderTrackingId) {
      const checkStatus = async () => {
        try {
          const res = await fetch(`/api/pesapal-status?orderTrackingId=${orderTrackingId}`);
          const data = await res.json();
          if (data.statusCode === 1) { // COMPLETED
            clearInterval(interval);
            clearTimeout(timeout);
            if (onRefresh) await onRefresh();
            setStep('success');
            setTimeout(() => setStep('view'), 3000);
          } else if (data.statusCode === 2 || data.statusCode === 3) {
            clearInterval(interval);
            clearTimeout(timeout);
            setError(`Payment failed. Please try again. (${data.status || "Unknown status"})`);
            setStep('view');
          } else if (data.error) {
            clearInterval(interval);
            clearTimeout(timeout);
            setError(`Backend error: ${data.error}`);
            setStep('view');
          }
        } catch (err) {
          // silent error, keep polling
        }
      };
      
      interval = setInterval(checkStatus, 5000);
      
      timeout = setTimeout(() => {
        clearInterval(interval);
        setError('Payment timeout. Please try again.');
        setStep('view');
      }, 300000); // 5 minutes timeout
    }
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step, orderTrackingId]);

  let networkName = null;
  if (paymentPhone.length >= 10) {
    try {
      networkName = detectNetwork(normalizePhone(paymentPhone));
    } catch(e) {
      networkName = null;
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-syne font-bold">Subscription</h2>

      {isExpired && step === 'view' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
          <AlertCircle size={18} />
          {latestSub
            ? 'Renew your subscription to appear on the map and search results.'
            : 'Activate your subscription to appear on the map and search results.'}
        </div>
      )}

      {!isExpired && daysRemaining > 0 && daysRemaining <= 5 && step === 'view' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
          <AlertTriangle size={18} />
          Expiring soon — renew to stay visible ({daysRemaining} days remaining)
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`border p-6 rounded-[24px] transition-all group ${theme === 'dark' ? 'bg-neutral-900 border-white/5 hover:border-white/20' : 'bg-white border-black/5 shadow-sm hover:border-black/20'}`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className={`text-xs uppercase tracking-widest font-bold mb-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Current Plan</div>
              <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{isExpired ? 'Standard' : 'Premium'}</h3>
            </div>
            <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isExpired ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              {isExpired ? 'Inactive' : 'Active'}
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-4 border-t pt-6 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
            <div>
              <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Date Paid</div>
              <div className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{latestSub?.paid_at ? new Date(latestSub.paid_at).toLocaleDateString() : '—'}</div>
            </div>
            <div>
              <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Expiry Date</div>
              <div className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{latestSub?.expires_at ? new Date(latestSub.expires_at).toLocaleDateString() : '—'}</div>
            </div>
          </div>

          {!isExpired && daysRemaining > 0 && (
            <div className={`text-sm font-bold text-center mb-6 ${daysRemaining <= 5 ? 'text-yellow-500' : (theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600')}`}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </div>
          )}

          {step === 'view' && isExpired && (
            <button
              onClick={() => setStep('fee_info')}
              className={`w-full font-extrabold py-4 rounded-xl transition-colors text-sm flex justify-center items-center gap-2 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
            >
              Renew — UGX 1,000
            </button>
          )}

          {step === 'fee_info' && (
            <div className="mt-4 space-y-4">
              <div className={`p-5 rounded-2xl border text-sm space-y-3 ${theme === 'dark' ? 'bg-neutral-800/60 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                <div className="flex justify-between items-center">
                  <span className={theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}>Subscription fee</span>
                  <span className="font-mono font-bold">UGX 890</span>
                </div>
                <div className={`border-t border-dashed ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}></div>
                <div className={`space-y-2 text-xs leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  <div className="flex items-start gap-2">
                    <span><strong className={theme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}>Mobile Money</strong> — UGX 110 transaction fee → <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Total: UGX 1,000</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span><strong className={theme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}>Card</strong> — Processing fees vary by bank</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span><strong className={theme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}>Pesapal E-Wallet</strong> — No extra fee → <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Total: UGX 890</strong></span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('view')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${theme === 'dark' ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                >
                  Back
                </button>
                <button
                  onClick={submitPayment}
                  disabled={isSubmitting}
                  className={`flex-[2] py-3 rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Proceed to payment →'}
                </button>
              </div>
            </div>
          )}

          {error && <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold leading-relaxed">{error}</div>}

          {step === 'waiting' && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="animate-spin mx-auto w-8 h-8 opacity-50" />
              <p className="text-sm font-bold">Redirecting to Pesapal...</p>
              <p className="text-xs opacity-50">Please complete the payment on the secure page.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-4 space-y-4 text-emerald-500">
              <CheckCircle2 className="mx-auto w-12 h-12" />
              <p className="text-lg font-bold">Renewal Successful!</p>
              <p className="text-sm opacity-80">Your subscription is now active.</p>
            </div>
          )}


        </div>

        {/* Payment History */}
        <div className={`border rounded-[24px] overflow-hidden flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/40 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
          <div className={`p-6 border-b font-bold font-syne ${theme === 'dark' ? 'border-white/5 text-white' : 'border-black/5 text-black'}`}>
            Payment History
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {loadingHistory ? (
              <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto opacity-50" /></div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-50">No payment history yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`text-[10px] uppercase tracking-widest font-black ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'}`}>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-black/5'}`}>
                  {history.map(tx => (
                    <tr key={tx.id} className="group">
                      <td className="px-6 py-4">
                        <div className="font-medium">{new Date(tx.paid_at).toLocaleDateString()}</div>
                        <div className="text-[10px] opacity-50 mt-1 font-mono">{tx.pesapal_reference || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${
                          tx.method === 'MTN' ? 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400' :
                          tx.method === 'Airtel' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                          'bg-neutral-400/20 text-neutral-500'
                        }`}>
                          {tx.method || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium">
                        UGX {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Tour Overlay ────────────────────────────────────── */
function DashboardTourOverlay({ onClose }) {
  const theme = useStore(state => state.theme);
  const [step, setStep] = useState(0);

  const steps = [
    { title: "Dashboard Overview", desc: "This tab gives you a summary of your business performance. You can see your subscription status, open/closed status, total listings, and how many times your business appeared on the map." },
    { title: "Theme Toggle", desc: "Use the sun/moon icon at the top to toggle between light and dark modes." },
    { title: "Open/Closed Status", desc: "Toggle your business open or closed. When closed, your listings won't appear on the map. You have full control — toggle whenever you like." },
    { title: "Manage Listings", desc: "Add, edit, or remove your products/services here. You can also temporarily hide items by toggling their availability." },
    { title: "Business Info", desc: "Update your contact details and location. A pinned GPS location is mandatory to appear on the map, while social links are optional." },
    { title: "Subscription", desc: "Check your current plan and expiry date. Renew your subscription here to stay live on the map!" },
    { title: "Logout", desc: "Use the power icon at the top right to securely sign out of your dashboard." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, delay: 0.3 } }}
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ 
          scale: 0, 
          borderRadius: "100%",
          x: "calc(50vw - 60px)", 
          y: "calc(50vh - 60px)", 
          opacity: [1, 1, 0], 
          transition: { duration: 0.9, ease: "anticipate" } 
        }}
        className={`w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900 border border-white/10 text-white' : 'bg-white border border-black/10 text-black'}`}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-neutral-500 hover:text-current transition-colors">
          <CloseIcon size={20} />
        </button>
        <div className="mb-8 mt-2">
          <h2 className="text-2xl font-syne font-bold mb-2">{steps[step].title}</h2>
          <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>{steps[step].desc}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? (theme === 'dark' ? 'bg-white' : 'bg-black') : (theme === 'dark' ? 'bg-white/20' : 'bg-black/20')}`} />
            ))}
          </div>
          <button
            onClick={() => {
              if (step < steps.length - 1) setStep(step + 1);
              else onClose();
            }}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-colors ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
          >
            {step < steps.length - 1 ? 'Next' : 'Got it!'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
