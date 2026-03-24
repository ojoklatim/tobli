import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  BarChart3, List, Settings, CreditCard,
  MapPin, Power, Plus, Upload, Trash2,
  Save, AlertTriangle, Loader2, X, Phone,
  Globe, Instagram, Send, Twitter, Download, Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const { session, business, loading: authLoading, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && !session?.user) {
      navigate('/login');
    }
  }, [session, authLoading, navigate]);

  // Local mutable business state for toggling open/closed
  const [biz, setBiz] = useState(null);
  useEffect(() => {
    if (business) setBiz({ ...business });
  }, [business]);

  if (authLoading || !biz) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#080A0F]">
      <Loader2 className="animate-spin text-white w-12 h-12" />
    </div>
  );

  const isSubActive = biz.subscription_status === 'active';

  const toggleOpen = () => {
    setBiz(prev => ({ ...prev, is_open: !prev.is_open }));
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-neutral-900/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Top Left: Business Name */}
          <div className="text-xl font-syne font-extrabold tracking-tighter text-white">
            {biz.name}
          </div>

          <div className="flex items-center gap-6">
            {/* Centre: Open/Closed Toggle */}
            <div className="flex items-center gap-2 bg-neutral-900/50 p-1 rounded-full border border-white/5">
              <span className={`text-[9px] uppercase font-bold tracking-widest pl-2 ${biz.is_open ? 'text-green-500' : 'text-neutral-500'}`}>
                {biz.is_open ? 'Open' : 'Closed'}
              </span>
              <button
                onClick={toggleOpen}
                className={`w-10 h-5 rounded-full relative transition-colors ${biz.is_open ? 'bg-green-500' : 'bg-neutral-800'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${biz.is_open ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Far Right: Logout */}
            <button
              onClick={() => { signOut(); navigate('/login'); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-colors font-bold text-xs uppercase"
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${activeTab === tab.id ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <section className="flex-1 bg-neutral-900/30 rounded-[24px] border border-white/5 p-6 relative min-h-[600px]">
          {activeTab === 'overview' && <OverviewTab biz={biz} />}
          {activeTab === 'listings' && <ListingsTab />}
          {activeTab === 'info' && <InfoTab biz={biz} setBiz={setBiz} />}
          {activeTab === 'subscription' && <SubscriptionTab biz={biz} />}
        </section>
      </main>
    </div>
  );
}

/* ─── OVERVIEW TAB ──────────────────────────────────────────── */
function OverviewTab({ biz }) {
  // Mock counts
  const listingsCount = 12;
  const mapAppearances = 248;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-syne font-bold">Performance Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Subscription" value={biz.subscription_status === 'active' ? 'Active' : 'Expired'} dotColor={biz.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'} />
        <StatCard label="Status" value={biz.is_open ? 'Open' : 'Closed'} dotColor={biz.is_open ? 'bg-green-500' : 'bg-neutral-500'} />
        <StatCard label="Goods / Services" value={listingsCount} />
        <StatCard label="Map Appearances" value={mapAppearances} />
      </div>
    </div>
  );
}

function StatCard({ label, value, dotColor }) {
  return (
    <div className="bg-neutral-900 border border-white/5 p-6 rounded-3xl">
      <div className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-2">{label}</div>
      <div className="flex items-center gap-2">
        {dotColor && <div className={`w-2 h-2 rounded-full ${dotColor}`} />}
        <span className="text-xl font-bold">{value}</span>
      </div>
    </div>
  );
}

/* ─── LISTINGS TAB ──────────────────────────────────────────── */
function ListingsTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({ name: '', type: 'product', price: '' });

  const [listings, setListings] = useState([
    { id: '1', name: 'Premium Coffee Beans', type: 'product', price: 25000, available: true },
    { id: '2', name: 'Cappuccino', type: 'product', price: 15000, available: true },
    { id: '3', name: 'Cold Brew Coffee', type: 'product', price: 12000, available: false },
  ]);

  const toggle = (id) => {
    setListings(prev => prev.map(item => item.id === id ? { ...item, available: !item.available } : item));
  };

  const deleteItem = (id) => {
    setListings(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    setListings(prev => [...prev, { id: crypto.randomUUID(), ...newItem, price: parseFloat(newItem.price), available: true }]);
    setNewItem({ name: '', type: 'product', price: '' });
    setShowAdd(false);
  };

  const startEdit = (item) => {
    setEditingItem({ ...item });
  };

  const saveEdit = () => {
    if (!editingItem.name || !editingItem.price) return;
    setListings(prev => prev.map(i => i.id === editingItem.id ? { ...editingItem, price: parseFloat(editingItem.price) } : i));
    setEditingItem(null);
  };

  // Excel export template
  const exportTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Item Name': 'Example Product', 'Type': 'product', 'Price': 50000 },
      { 'Item Name': 'Example Service', 'Type': 'service', 'Price': 150000 }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Tobli_Listings_Template.xlsx');
  };

  // Excel upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const newRows = json.map(r => ({
        id: crypto.randomUUID(),
        name: r['Item Name'] || r.name || '',
        price: r['Price'] || r.price || 0,
        type: r['Type'] || r.type || 'product',
        available: true,
      }));
      setListings(prev => [...prev, ...newRows]);
    };
    reader.readAsArrayBuffer(file);
  };

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
            className="bg-neutral-800 border-none rounded-2xl px-4 py-2 text-sm w-full md:w-48 focus:outline-none"
          />
          <button onClick={exportTemplate} className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-full font-bold text-xs transition-colors flex items-center gap-2">
            <Download size={14} /> Export Template
          </button>
          <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs transition-colors">
            <Upload size={14} /> Upload Excel
            <input type="file" accept=".xlsx" onChange={handleUpload} className="hidden" />
          </label>
          <button onClick={() => setShowAdd(true)} className="bg-white text-black px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs hover:bg-neutral-200 transition-colors">
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
          <div className="flex justify-between mb-6">
            <h3 className="font-bold">New Item</h3>
            <button onClick={() => setShowAdd(false)}><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input placeholder="Item Name" className="bg-neutral-800 border-none rounded-2xl p-4 focus:outline-none" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            <select className="bg-neutral-800 border-none rounded-2xl p-4 focus:outline-none" value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
            <input placeholder="Price (UGX)" type="number" className="bg-neutral-800 border-none rounded-2xl p-4 font-mono focus:outline-none" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
            <button onClick={addItem} className="bg-white text-black font-bold rounded-2xl p-4 hover:bg-neutral-200 transition-colors">Add →</button>
          </div>
        </div>
      )}
      {/* Edit form */}
      {editingItem && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 mb-6">
          <div className="flex justify-between mb-6">
            <h3 className="font-bold text-indigo-400 uppercase text-xs tracking-widest">Edit Item</h3>
            <button onClick={() => setEditingItem(null)} className="text-neutral-500 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input placeholder="Item Name" className="bg-neutral-800 border-none rounded-2xl p-4 focus:outline-none text-sm" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
            <select className="bg-neutral-800 border-none rounded-2xl p-4 focus:outline-none text-sm" value={editingItem.type} onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}>
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
            <input placeholder="Price (UGX)" type="number" className="bg-neutral-800 border-none rounded-2xl p-4 font-mono focus:outline-none text-sm" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} />
            <button onClick={saveEdit} className="bg-indigo-600 text-white font-bold rounded-2xl p-4 hover:bg-indigo-500 transition-colors text-sm shadow-xl">Update Item →</button>
          </div>
        </div>
      )}

      {/* Listings Table */}
      <div className="bg-neutral-900/40 rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="text-neutral-500 text-[10px] uppercase tracking-widest border-b border-white/5 font-black">
                <th className="p-6">Name</th>
                <th className="p-6">Type</th>
                <th className="p-6 text-right">Price</th>
                <th className="p-6 text-center">Available</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length > 0 ? filtered.map(item => (
                <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                  <td className="p-6 font-medium">{item.name}</td>
                  <td className="p-6 text-xs text-neutral-400 uppercase tracking-tighter">{item.type}</td>
                  <td className="p-6 text-right font-mono text-white/80">UGX {item.price?.toLocaleString()}</td>
                  <td className="p-6 text-center">
                    <button onClick={() => toggle(item.id)} className={`w-8 h-4 rounded-full relative transition-colors ${item.available ? 'bg-green-500' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.available ? 'left-4.5' : 'left-0.5'}`} />
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

  const save = () => {
    setBiz({ ...form });
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
        <button onClick={save} className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-neutral-200 flex items-center gap-2 transition-colors">
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
            <InfoField label="X / Twitter handle" value={form.x_handle} onChange={v => setForm({ ...form, x_handle: v })} icon={<Twitter size={16} />} />
            <InfoField label="Website" value={form.website} onChange={v => setForm({ ...form, website: v })} icon={<Globe size={16} />} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-neutral-900 p-8 rounded-[24px] border border-white/5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6">Set Location</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-black p-4 rounded-xl font-mono text-sm text-neutral-400">
            {form.lat ? `${form.lat.toFixed(4)}, ${form.lng?.toFixed(4)}` : 'Not set'}
          </div>
          <button onClick={getGeo} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-colors flex items-center gap-2">
            <MapPin size={18} /> Pin Current Location
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, onChange, icon }) {
  return (
    <div>
      <label className="block text-xs uppercase text-neutral-500 font-bold mb-2 ml-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-neutral-900 border border-white/5 rounded-2xl p-4 pl-12 font-sans text-sm focus:border-white focus:outline-none"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
        <div className="absolute left-4 inset-y-0 flex items-center text-neutral-600">
          {icon || <Globe size={16} />}
        </div>
      </div>
    </div>
  );
}

/* ─── SUBSCRIPTION TAB ──────────────────────────────────────── */
function SubscriptionTab({ biz }) {
  const isExpired = biz.subscription_expires_at && new Date(biz.subscription_expires_at) < new Date();

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-syne font-bold">Subscription</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-[24px] hover:border-white/20 transition-all cursor-pointer group">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-1">Current Plan</div>
              <h3 className="text-2xl font-bold">Premium</h3>
            </div>
            <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isExpired || biz.subscription_status !== 'active' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              {biz.subscription_status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
            <div>
              <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Date Paid</div>
              <div className="font-mono text-sm">{biz.paid_at ? new Date(biz.paid_at).toLocaleDateString() : '—'}</div>
            </div>
            <div>
              <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Expiry Date</div>
              <div className="font-mono text-sm">{biz.subscription_expires_at ? new Date(biz.subscription_expires_at).toLocaleDateString() : '—'}</div>
            </div>
          </div>

          <button
            onClick={() => window.alert('Renewal will be available online soon. Contact support.')}
            className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors text-sm"
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
