'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/FirebaseProvider';
import Link from 'next/link';
import { getUserListings, Listing } from '@/lib/listings';
import { 
  getDashboardMetrics, 
  getActivity, 
  DashboardMetrics, 
  Activity, 
  postCommentReply,
  markActivityRead 
} from '@/lib/dashboard';
import { 
  Plus, 
  LayoutDashboard, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Wallet,
  Package,
  Activity as ActivityIcon,
  MessageSquare,
  BadgeCheck,
  Clock,
  ChevronRight,
  Filter,
  Send,
  Loader2,
  Settings,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Navbar } from '@/components/Navbar';
import { 
  getTransactions, 
  getStatementSummary, 
  Transaction, 
  StatementSummary 
} from '@/lib/dashboard';
import { ListingCard } from '@/components/ListingCard';

export default function DashboardPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statementSummary, setStatementSummary] = useState<StatementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'earnings' | 'products' | 'activity' | 'statements' | 'settings'>('earnings');
  const [filter, setFilter] = useState<'all' | 'sale' | 'message' | 'system'>('all');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isReplying, setIsReplying] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    async function loadDashboardData() {
      if (user) {
        setLoading(true);
        try {
          const [m, a, l, t, s] = await Promise.all([
            getDashboardMetrics(user.uid),
            getActivity(user.uid, filter),
            getUserListings(user.uid),
            getTransactions(user.uid),
            getStatementSummary(user.uid)
          ]);
          setMetrics(m);
          setActivities(a);
          setListings(l);
          setTransactions(t);
          setStatementSummary(s);
        } catch (error) {
          console.error("Dashboard load error:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadDashboardData();
  }, [user, filter]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || dbUser?.role !== 'DEVELOPER') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl">
           <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-primary rotate-45" />
           </div>
           <h1 className="text-3xl font-black text-[#1E293B] tracking-tight">Access Restricted</h1>
           <p className="text-slate-500 font-semibold leading-relaxed">This business panel is reserved for verified developers. Please ensure you are logged in with your developer account.</p>
           <Link href="/login" className="inline-block bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
              Sign In to Continue
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Navbar />
      
      {/* CodeCanyon Style Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-2xl shadow-slate-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-4xl uppercase">
                    {user.email?.[0] || 'D'}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-[#1E293B] tracking-tight">{dbUser?.name || user.displayName || 'Developer'}</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 text-sm font-bold text-slate-500">
                   <div className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-500" /> United States</div>
                   <div className="hidden md:block">•</div>
                   <div>Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-8 py-6 rounded-3xl text-center md:text-right">
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Sales</div>
               <div className="text-4xl font-black text-[#1E293B] tracking-tighter">{metrics?.thisMonthSalesCount || 0}</div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-10 mt-12 border-b border-slate-100 -mb-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
             {[
               { id: 'earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
               { id: 'statements', label: 'Statements', icon: <Clock className="w-4 h-4" /> },
               { id: 'activity', label: 'Activity Feed', icon: <ActivityIcon className="w-4 h-4" /> },
               { id: 'products', label: 'My Listings', icon: <Package className="w-4 h-4" /> },
               { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 pb-6 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {tab.icon}
                 {tab.label}
                 {activeTab === tab.id && <motion.div layoutId="dashTab" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-primary rounded-full" />}
               </button>
             ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        
        {activeTab === 'statements' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              {/* Summary Card */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm">
                <div className="space-y-2 mb-8">
                  <h3 className="text-2xl font-black text-[#1E293B] tracking-tight">Statements</h3>
                  <p className="text-sm font-bold text-slate-400">Your sales and referral earnings over the last 30 days</p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">My funds</div>
                    <div className="text-3xl font-black text-[#1E293B] tracking-tighter">
                      <span className="text-lg opacity-40 mr-1">$</span>
                      {(statementSummary?.myFunds || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-slate-100 pl-8">
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Earnings</div>
                    <div className="text-xl font-black text-[#1E293B] tracking-tight">
                      <span className="text-sm opacity-40 mr-0.5">$</span>
                      {(statementSummary?.earnings || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-slate-100 pl-8">
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Tax Withheld</div>
                    <div className="text-xl font-black text-[#1E293B] tracking-tight">
                      <span className="text-sm opacity-40 mr-0.5">$</span>
                      {(statementSummary?.taxWithheld || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-slate-100 pl-8">
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Fees</div>
                    <div className="text-xl font-black text-[#1E293B] tracking-tight">
                      <span className="text-sm opacity-40 mr-0.5">$</span>
                      {(statementSummary?.fees || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* View Invoices Card */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm flex flex-col justify-between">
                <h4 className="text-lg font-black text-[#1E293B] tracking-tight mb-6">View Invoices</h4>
                <div className="space-y-4">
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option>Monthly Service Fees</option>
                  </select>
                  <button className="w-full bg-slate-100 text-slate-500 py-3 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <button className="px-6 py-3 bg-[#1E293B] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200">Last 30 Days</button>
                <button className="px-6 py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-all">Apr 2026</button>
                <button className="px-6 py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-all">Mar 2026</button>
                <button className="px-6 py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:text-slate-600 transition-all">
                  More options <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs font-bold text-slate-500 italic opacity-70">Please note: Transactions are based in Melbourne, Australia local time.</p>

              <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#1E293B] text-white text-[10px] font-black uppercase tracking-widest text-left">
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Order ID</th>
                      <th className="px-8 py-4">Type</th>
                      <th className="px-8 py-4">Detail</th>
                      <th className="px-8 py-4">Price</th>
                      <th className="px-8 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold">No results found.</td>
                      </tr>
                    ) : (
                      transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 text-sm font-bold text-slate-600">
                            {tx.date instanceof Timestamp ? format(tx.date.toDate(), 'MMM d, yyyy') : format(new Date(tx.date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-8 py-4 text-sm font-bold text-primary hover:underline cursor-pointer">#{tx.orderId?.slice(-6).toUpperCase() || '-'}</td>
                          <td className="px-8 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              tx.type === 'Sale' ? 'bg-emerald-50 text-emerald-600' : 
                              tx.type === 'Fee' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-sm font-bold text-slate-800">{tx.detail}</td>
                          <td className="px-8 py-4 text-sm font-black text-slate-400">
                            {tx.price ? `$${tx.price.toFixed(2)}` : '-'}
                          </td>
                          <td className={`px-8 py-4 text-right text-sm font-black ${tx.amount < 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                            {tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'earnings' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1E293B] text-white p-10 rounded-[2.5rem] space-y-6 shadow-xl shadow-slate-200 border-b-4 border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Monthly Net</div>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tighter mb-1">${(metrics?.thisMonthRevenue || 0).toFixed(2)}</div>
                  <p className="text-xs font-bold text-slate-400">After associated author fees & before taxes</p>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 p-10 rounded-[2.5rem] space-y-6 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/20 transition-all">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Account Balance</div>
                <div className="text-4xl font-black text-[#1E293B] tracking-tighter underline decoration-primary/20 decoration-4 underline-offset-8">
                   View Balance
                </div>
                <p className="text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">via Author Dashboard</p>
              </div>

              <div className="bg-[#1E293B] text-white p-10 rounded-[2.5rem] space-y-6 shadow-xl shadow-slate-200 border-b-4 border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Sales Value</div>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tighter mb-1">${(metrics?.lifetimeEarnings || 0).toFixed(2)}</div>
                  <p className="text-xs font-bold text-slate-400">Based on gross list price</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black text-[#1E293B] tracking-tight">Sales Graph</h3>
                     <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400">Apr 2026</span>
                        <button className="bg-slate-50 p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
                           <Filter className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                  
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics?.dailySales || []}>
                        <defs>
                          <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#4F46E5" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorAmt)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                  <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center relative shadow-inner overflow-hidden">
                     <div className="absolute inset-0 opacity-10">
                        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
                     </div>
                     <ActivityIcon className="w-12 h-12 text-slate-300 relative" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-[#1E293B] tracking-tight">Gray skies are going to clear up</h3>
                    <p className="text-sm font-bold text-slate-400 px-6">You have no geographic sales data for the chosen period yet.</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-sm space-y-10">
             <div className="flex items-center justify-between border-b border-slate-100 pb-8">
               <h3 className="text-2xl font-black text-[#1E293B] tracking-tight">Activity Center</h3>
               <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl">
                 {['all', 'sale', 'message', 'system'].map(f => (
                   <button 
                     key={f}
                     onClick={() => setFilter(f as any)}
                     className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-[#1E293B] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-6">
                {activities.length === 0 ? (
                  <div className="text-center py-24 space-y-4">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <ActivityIcon className="w-10 h-10 text-slate-200" />
                     </div>
                     <p className="text-slate-400 font-bold">Waiting for your first business activity...</p>
                  </div>
                ) : activities.map(activity => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity} 
                    replyText={replyText}
                    setReplyText={setReplyText}
                    isReplying={isReplying}
                    onReply={async () => {
                        if (!replyText[activity.id] || !user) return;
                        setIsReplying(prev => ({ ...prev, [activity.id]: true }));
                        try {
                          await postCommentReply(
                            activity.metadata.commentId, 
                            activity.listingId!, 
                            user.uid, 
                            user.displayName || user.email || 'Developer', 
                            replyText[activity.id]
                          );
                          setReplyText(prev => ({ ...prev, [activity.id]: '' }));
                        } catch (err) {
                          console.error("Reply error:", err);
                        } finally {
                          setIsReplying(prev => ({ ...prev, [activity.id]: false }));
                        }
                    }}
                  />
                ))}
             </div>
          </div>
        )}

        {activeTab === 'products' && (
           <div className="space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-black text-[#1E293B] tracking-tight">Active Portfolio</h3>
                 <Link href="/dashboard/create-listing" className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add New Asset
                 </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {listings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                 ))}
              </div>
           </div>
        )}

      </main>
    </div>
  );
}

function ActivityItem({ activity, replyText, setReplyText, isReplying, onReply }: { 
  activity: Activity, 
  replyText: { [key: string]: string }, 
  setReplyText: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>,
  isReplying: { [key: string]: boolean },
  onReply: () => void
}) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className={`p-8 bg-white border border-slate-100 rounded-[2rem] transition-all hover:border-primary/20 ${activity.isRead ? 'opacity-60' : ''}`}>
      <div className="flex gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
           {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
             <div className="space-y-0.5">
               <p className="text-base font-black text-[#1E293B]">{activity.message}</p>
               <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {formatDistanceToNow(activity.createdAt instanceof Timestamp ? activity.createdAt.toDate() : new Date(activity.createdAt))} ago
               </div>
             </div>
             {activity.type === 'sale' && (
               <div className="text-xl font-black text-emerald-500 tracking-tighter cursor-default">
                  +${activity.metadata?.price}
               </div>
             )}
          </div>

          {activity.type === 'message' && (
            <div className="space-y-4 pt-2">
               <p className="text-sm font-bold text-slate-500 bg-slate-50 p-4 rounded-xl italic break-words">"{activity.metadata?.text}"</p>
               {showReply ? (
                 <div className="space-y-3">
                    <textarea 
                      value={replyText[activity.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [activity.id]: e.target.value }))}
                      placeholder="Type your reply..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none h-24"
                    />
                    <div className="flex gap-2">
                       <button 
                         onClick={onReply}
                         disabled={isReplying[activity.id] || !replyText[activity.id]?.trim()}
                         className="flex-1 bg-primary text-white py-3 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
                       >
                         {isReplying[activity.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                         SEND RESPONSE
                       </button>
                       <button onClick={() => setShowReply(false)} className="px-6 py-3 bg-slate-100 text-slate-400 rounded-lg text-xs font-black uppercase">Cancel</button>
                    </div>
                 </div>
               ) : (
                 <button onClick={() => setShowReply(true)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline">
                    <MessageSquare className="w-4 h-4" /> Reply to message
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'sale': return <ShoppingBag className="w-5 h-5" />;
    case 'message': return <MessageSquare className="w-5 h-5" />;
    case 'system': return <BadgeCheck className="w-5 h-5" />;
    default: return <ActivityIcon className="w-5 h-5" />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'sale': return 'bg-emerald-50 text-emerald-600';
    case 'message': return 'bg-blue-50 text-blue-600';
    case 'system': return 'bg-amber-50 text-amber-600';
    default: return 'bg-slate-50 text-slate-600';
  }
}
