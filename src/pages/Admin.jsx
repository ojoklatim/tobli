import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';
import { insforge } from '../lib/insforge';
import {
  Activity, Users, CreditCard, ShieldAlert,
  Search, CheckCircle2, XCircle,
  ChevronDown, Loader2, Download, Power
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { session, isAdmin, signOut, loading: authLoading } = useAuthStore();
  const liveUsers = useStore(state => state.liveUsers);
  const theme = useStore(state => state.theme);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authLoading) return; // Wait for session load
    if (!session?.user) {
      navigate('/login');
    } else if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [session, isAdmin, authLoading, navigate]);

  const [businesses, setBusinesses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: bizData }, { data: subData }] = await Promise.all([
          insforge.database.from('businesses').select('*').order('created_at', { ascending: false }),
          insforge.database.from('subscriptions')
            .select('*, businesses(name)')
            .order('paid_at', { ascending: false }),
        ]);
        setBusinesses(bizData || []);
        setTransactions((subData || []).map(s => ({
          ...s,
          business_name: s.businesses?.name || '—',
        })));
      } catch (err) {
        // Silently handle load failure
      } finally {
        setStatsLoading(false);
      }
    };
    if (session?.user && isAdmin) load();
  }, [session, isAdmin]);

  const registeredCount = businesses.length;
  const liveCount = businesses.filter(b => b.is_open).length;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyIncome = transactions
    .filter(t => new Date(t.paid_at) >= startOfMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const liveUserCount = Object.keys(liveUsers || {}).length;

  const stats = [
    { id: 'registered', label: 'Registered Businesses', value: registeredCount, color: 'text-white' },
    { id: 'live', label: 'Live (Open) Businesses', value: liveCount, color: 'text-green-500' },
    { id: 'users', label: 'Live Users on Platform', value: liveUserCount, color: 'text-indigo-400' },
    { id: 'income', label: 'Income This Month', value: `UGX ${monthlyIncome.toLocaleString()}`, color: 'text-emerald-400' },
  ];

  const toggleSub = async (id) => {
    const biz = businesses.find(b => b.id === id);
    const newStatus = biz.subscription_status === 'active' ? 'inactive' : 'active';
    await insforge.database
      .from('businesses')
      .update({ subscription_status: newStatus })
      .eq('id', id);
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, subscription_status: newStatus } : b));
  };

  const exportCSV = () => {
    const header = ['Business Name', 'Amount', 'Paid At', 'Method', 'Reference'];
    const rows = transactions.map(p => [p.business_name, p.amount, p.paid_at, p.method, p.reference]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tobli_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBiz = businesses.filter(b => {
    const term = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(term) ||
      (b.owner_name || '').toLowerCase().includes(term) ||
      (b.email || '').toLowerCase().includes(term) ||
      (b.phone || '').toLowerCase().includes(term);
  });

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F] text-white' : 'bg-gray-50 text-black'}`}>
      {/* Topbar */}
      <nav className={`border-b sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 bg-neutral-900/10 backdrop-blur-xl' : 'border-black/5 bg-white/70 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className={`text-2xl font-syne font-extrabold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-black'}`}>TOBLI</Link>
            <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border border-red-500/20">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <button
              onClick={() => { signOut(); navigate('/login'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors font-bold text-xs uppercase ${theme === 'dark' ? 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10' : 'bg-black/5 text-neutral-600 hover:text-black hover:bg-black/10'}`}
            >
              <Power size={14} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-12">
        {/* Tabs - Scrollable on mobile */}
        <div className={`flex gap-2 p-1.5 rounded-2xl border w-full md:w-fit overflow-x-auto no-scrollbar whitespace-nowrap transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-gray-100 border-black/5'}`}>
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={18} />} label="Overview" />
          <TabButton active={activeTab === 'businesses'} onClick={() => setActiveTab('businesses')} icon={<Users size={18} />} label="Businesses" />
          <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<CreditCard size={18} />} label="Transactions" />
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {statsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-white/20 w-12 h-12" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                  <AdminStatCard key={stat.id} {...stat} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── BUSINESSES TAB ─── */}
        {activeTab === 'businesses' && (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input
                placeholder="Search businesses..."
                className={`w-full border rounded-2xl p-4 pl-12 transition-colors outline-none ${theme === 'dark' ? 'bg-neutral-900 border-white/5 focus:border-white text-white placeholder-neutral-700' : 'bg-white border-black/10 focus:border-black text-black placeholder-neutral-400 shadow-sm'}`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={`rounded-[24px] border overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/30 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="text-neutral-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5">
                      <th className="p-6">Owner Name</th>
                      <th className="p-6">Business Name</th>
                      <th className="p-6">Phone</th>
                      <th className="p-6">Email</th>
                      <th className="p-6 text-center">Status</th>
                      <th className="p-6 text-center">Payment</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {statsLoading ? (
                      <tr>
                        <td colSpan="7" className="p-12 text-center">
                          <Loader2 className="animate-spin text-white/20 w-8 h-8 mx-auto" />
                        </td>
                      </tr>
                    ) : filteredBiz.map(b => (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6 text-sm text-neutral-300">{b.owner_name}</td>
                        <td className="p-6 font-medium">{b.name}</td>
                        <td className="p-6 text-sm text-neutral-400 font-mono">{b.phone}</td>
                        <td className="p-6 text-sm text-neutral-400">{b.email}</td>
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${b.is_open ? 'bg-green-500/20 text-green-500' : 'bg-neutral-500/20 text-neutral-500'}`}>
                            {b.is_open ? 'Open' : 'Closed'}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${b.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                            {b.subscription_status === 'active' ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => toggleSub(b.id)}
                            className={`p-2 rounded-xl border transition-colors ${b.subscription_status === 'active' ? 'border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : 'border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'}`}
                          >
                            {b.subscription_status === 'active' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TRANSACTIONS TAB ─── */}
        {activeTab === 'transactions' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-1">Total This Month</h2>
                <p className={`text-4xl font-syne font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>UGX {monthlyIncome.toLocaleString()}</p>
              </div>
              <button
                onClick={exportCSV}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200 shadow-xl' : 'bg-black text-white hover:bg-neutral-800 shadow-lg'}`}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className={`rounded-[24px] border overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/30 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="text-neutral-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5">
                      <th className="p-6">Business</th>
                      <th className="p-6">Amount</th>
                      <th className="p-6">Date</th>
                      <th className="p-6">Method</th>
                      <th className="p-6">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {statsLoading ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center">
                          <Loader2 className="animate-spin text-white/20 w-8 h-8 mx-auto" />
                        </td>
                      </tr>
                    ) : transactions.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6 font-medium">{p.business_name}</td>
                        <td className="p-6 font-mono text-indigo-400">UGX {p.amount.toLocaleString()}</td>
                        <td className="p-6 text-sm text-neutral-400">{new Date(p.paid_at).toLocaleDateString()}</td>
                        <td className="p-6 text-sm text-neutral-400">{p.method}</td>
                        <td className="p-6 text-[10px] font-mono text-neutral-600 uppercase tracking-tighter">{p.pesapal_reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  const theme = useStore(state => state.theme);
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${active ? (theme === 'dark' ? 'bg-white text-black font-bold' : 'bg-black text-white font-bold') : 'text-neutral-500 hover:text-white'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function AdminStatCard({ label, value, color }) {
  const theme = useStore(state => state.theme);
  return (
    <div className={`border p-6 rounded-[24px] transition-all cursor-pointer group ${theme === 'dark' ? 'bg-neutral-900 border-white/5 hover:border-white/20' : 'bg-white border-black/5 shadow-sm hover:border-black/20'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`text-[10px] uppercase font-black tracking-widest transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>{label}</div>
        <ChevronDown size={14} className="text-neutral-700 group-hover:text-white transition-colors" />
      </div>
      <div className={`text-3xl font-syne font-black ${theme === 'dark' ? color : (color === 'text-white' ? 'text-black' : color)}`}>{value}</div>
    </div>
  );
}
