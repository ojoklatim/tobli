import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { insforge } from '../lib/insforge';
import {
  BarChart3, List, Settings, CreditCard,
  MapPin, Power, Plus, Trash2,
  Save, AlertTriangle, Loader2, X as CloseIcon, Phone,
  Globe, Instagram, Send, Download, Edit2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import ThemeToggle from '../components/ThemeToggle';


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
  const [showSetupPrompt, setShowSetupPrompt] = useState(location.state?.isNewSignup || false);

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

  // Local mutable business state for toggling open/closed
  const [biz, setBiz] = useState(null);
  useEffect(() => {
    if (business) setBiz({ ...business });
  }, [business]);

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

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F] text-white' : 'bg-gray-50 text-black'}`}>
      {/* Header */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 bg-neutral-900/20 text-white' : 'border-black/5 bg-white/70 text-black'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Top Left: Business Name */}
          <div className="text-xl font-syne font-extrabold tracking-tighter">
            {biz.name}
          </div>

          <div className="flex items-center gap-6">
            <ThemeToggle />
            {/* Centre: Open/Closed Toggle */}
            <div className={`flex items-center gap-2 p-1.5 rounded-full border transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-gray-200 border-black/5'}`}>
              <span className={`text-[10px] uppercase font-black tracking-widest pl-2 ${biz.is_open ? 'text-green-500' : 'text-red-500'}`}>
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors font-bold text-xs uppercase ${theme === 'dark' ? 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10' : 'bg-black/5 text-neutral-600 hover:text-black hover:bg-black/10'}`}
            >
              <Power size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Subscription Notice */}
      {!isSubActive && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 py-3 text-center text-sm font-medium px-6">
          <AlertTriangle size={16} className="inline mr-2" />
          Subscription inactive. Your business is hidden from search results.
          <button onClick={() => setActiveTab('subscription')} className="underline ml-2 font-bold">Renew Access</button>
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
          {activeTab === 'overview' && <OverviewTab biz={biz} />}
          {activeTab === 'listings' && <ListingsTab biz={biz} />}
          {activeTab === 'info' && <InfoTab biz={biz} setBiz={setBiz} />}
          {activeTab === 'subscription' && <SubscriptionTab biz={biz} />}
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
    </div>
  );
}

/* ─── OVERVIEW TAB ──────────────────────────────────────────── */
function OverviewTab({ biz }) {
  const [listingsCount, setListingsCount] = useState(0);
  const [impressionsCount, setImpressionsCount] = useState(0);

  useEffect(() => {
    if (!biz?.id) return;
    
    // Fetch listings count
    insforge.database
      .from('items')
      .select('id')
      .eq('business_id', biz.id)
      .then(({ data }) => setListingsCount(data?.length || 0));

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
      <h2 className="text-xl font-syne font-bold">Performance Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Subscription" value={biz.subscription_status === 'active' ? 'Coming Soon' : 'Expired'} dotColor={biz.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'} />
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
function ListingsTab({ biz }) {
  const [newItem, setNewItem] = useState({ name: '', type: 'product', price: '', imageFile: null, imagePreview: null });
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
    setListings(prev => prev.filter(i => i.id !== id));
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
          price: parseFloat(newItem.price),
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
        setListings(prev => [...prev, finalItem]);
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
          price: parseFloat(editingItem.price),
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
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Item Name</label>
              <input placeholder="Name" className={`w-full border-none rounded-2xl p-4 focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Price (UGX)</label>
              <input placeholder="Price" type="number" className={`w-full border-none rounded-2xl p-4 font-mono focus:outline-none transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
            </div>
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
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Item Name</label>
              <input className={`w-full border-none rounded-2xl p-4 focus:outline-none text-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-neutral-500 tracking-widest px-1">Price (UGX)</label>
              <input type="number" className={`w-full border-none rounded-2xl p-4 font-mono focus:outline-none text-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`} value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} />
            </div>
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
                  <td className={`p-6 text-right font-mono ${theme === 'dark' ? 'text-white/80' : 'text-black/80'}`}>UGX {item.price?.toLocaleString()}</td>
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

/* ─── BUSINESS INFO TAB ─────────────────────────────────────── */
function InfoTab({ biz, setBiz }) {
  const [form, setForm] = useState({ ...biz });
  const [msg, setMsg] = useState('');

  useEffect(() => { setForm({ ...biz }); }, [biz]);

  const theme = useStore(state => state.theme);
  const save = async () => {
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
    navigator.geolocation.getCurrentPosition(pos => {
      setForm({ ...form, lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-syne font-bold">Business Info</h2>
        <button onClick={save} className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors duration-300 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}>
          <Save size={16} /> Save Changes
        </button>
      </div>
      {msg && <div className="text-sm text-green-500">{msg}</div>}

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
            <InfoField label="Instagram handle" value={form.instagram} onChange={v => setForm({ ...form, instagram: v })} icon={<Instagram size={16} />} />
            <InfoField label="X / Twitter handle" value={form.x_handle} onChange={v => setForm({ ...form, x_handle: v })} icon={<XIcon size={16} />} />

            <InfoField label="Website" value={form.website} onChange={v => setForm({ ...form, website: v })} icon={<Globe size={16} />} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className={`p-8 rounded-[24px] border transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-gray-50 border-black/5 shadow-sm'}`}>
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6">Set Location</h3>
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
function SubscriptionTab({ biz }) {
  const [latestSub, setLatestSub] = useState(null);
  const theme = useStore(state => state.theme);

  useEffect(() => {
    if (!biz?.id) return;
    insforge.database
      .from('subscriptions')
      .select('*')
      .eq('business_id', biz.id)
      .order('paid_at', { ascending: false })
      .limit(1)
      .then(({ data }) => setLatestSub(data?.[0] || null));
  }, [biz?.id]);

  const isExpired = latestSub?.expires_at && new Date(latestSub.expires_at) < new Date();

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-syne font-bold">Subscription</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`border p-6 rounded-[24px] transition-all cursor-pointer group ${theme === 'dark' ? 'bg-neutral-900 border-white/5 hover:border-white/20' : 'bg-white border-black/5 shadow-sm hover:border-black/20'}`}>
          <div className="flex justify-between items-start">
            <div>
              <div className={`text-xs uppercase tracking-widest font-bold mb-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Current Plan</div>
              <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Premium</h3>
            </div>
            <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isExpired || biz.subscription_status !== 'active' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              {biz.subscription_status}
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-4 border-t pt-6 transition-colors duration-300 ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
            <div>
              <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Date Paid</div>
              <div className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{latestSub?.paid_at ? new Date(latestSub.paid_at).toLocaleDateString() : '—'}</div>
            </div>
            <div>
              <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Expiry Date</div>
              <div className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{latestSub?.expires_at ? new Date(latestSub.expires_at).toLocaleDateString() : '—'}</div>
            </div>
          </div>

          <button
            onClick={() => window.alert('Renewal will be available online soon. Contact support.')}
            className={`w-full font-extrabold py-3.5 rounded-xl transition-colors text-sm ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
          >
            Renew Subscription
          </button>
        </div>

        <div className="bg-white/5 p-8 rounded-[24px] border border-dashed border-white/10 flex flex-col justify-center items-center text-center">
          <CreditCard size={48} className="text-neutral-600 mb-4" />
          <h4 className="font-bold text-neutral-400">Payment History coming soon.</h4>
          <p className="text-xs text-neutral-600 max-w-[200px] mt-2">All transactions are securely processed via Pesapal.</p>
        </div>
      </div>
    </div>
  );
}
