'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/FirebaseProvider';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Upload, Check, Globe, Code, Layers, 
  DollarSign, Settings, Info, ChevronRight, ChevronLeft, 
  FileText, Package, CheckCircle, Plus, X, Laptop, Monitor, Database, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'web-templates', name: 'Web Templates', icon: Globe },
  { id: 'code', name: 'Code / Scripts', icon: Code },
  { id: 'mobile', name: 'Mobile Apps', icon: Layers },
  { id: 'plugins', name: 'Plugins / Add-ons', icon: Settings },
];

const STEPS = [
  { id: 1, name: 'Basic Info', icon: Info },
  { id: 2, name: 'Description', icon: FileText },
  { id: 3, name: 'Media', icon: Upload },
  { id: 4, name: 'Product Details', icon: DollarSign },
  { id: 5, name: 'Delivery', icon: Package },
  { id: 6, name: 'Review', icon: CheckCircle },
];

export default function CreateListingPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile data for first-time devs
  const [profileData, setProfileData] = useState({
    location: dbUser?.location || '',
    languages: dbUser?.languages?.join(', ') || '',
  });
  const [showProfileSetup, setShowProfileSetup] = useState(!dbUser?.location || !dbUser?.languages);
  
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    features: [] as string[],
    whatsIncluded: '',
    whoItsFor: '',
    category: 'web-templates',
    techStack: 'React',
    imageUrl: '', // Thumbnail
    images: [] as string[], // Gallery
    demoUrl: '',
    basicPrice: '',
    extendedPrice: '',
    hasExtended: false,
    tags: '',
    downloadUrl: '',
  });

  const [featureInput, setFeatureInput] = useState('');

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading auth...</div>;
  if (!user) {
    router.push('/login');
    return null;
  }
  if (dbUser?.role !== 'DEVELOPER') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-text-main mb-2">Access Denied</h1>
        <p className="text-text-muted mb-6">Only developers can create new listings.</p>
        <Link href="/" className="text-primary font-bold hover:underline">Return to Marketplace</Link>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await updateDoc(doc(db, 'users', user.uid), {
        location: profileData.location,
        languages: profileData.languages.split(',').map(l => l.trim()).filter(l => l),
        updatedAt: new Date().toISOString(),
      });
      setShowProfileSetup(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        basicPrice: Number(formData.basicPrice),
        extendedPrice: formData.hasExtended ? Number(formData.extendedPrice) : null,
      };

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create listing');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-bold text-text-main mb-3 uppercase tracking-wider">Select Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${
                      formData.category === cat.id 
                        ? 'border-primary bg-primary/5 shadow-inner' 
                        : 'border-border-main hover:border-primary/50'
                    }`}
                  >
                    <cat.icon className={`w-8 h-8 mb-3 ${formData.category === cat.id ? 'text-primary' : 'text-text-muted'}`} />
                    <span className={`text-[10px] font-black uppercase ${formData.category === cat.id ? 'text-primary' : 'text-text-main'}`}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Listing Title</label>
                <input
                  type="text"
                  placeholder="e.g. Modern React Marketplace Template"
                  className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Tech Stack</label>
                <select 
                  className="w-full px-5 py-4 rounded-xl border border-border-main outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  value={formData.techStack || 'React'}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                >
                  <option value="React">React / Vite</option>
                  <option value="Vue">Vue / Nuxt</option>
                  <option value="SaaS">SaaS Starter</option>
                  <option value="Next.js">Next.js</option>
                  <option value="Full Stack">Full Stack</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Short Description (SEO Hook)</label>
              <input
                type="text"
                placeholder="A high-performance marketplace template for developers..."
                className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.shortDescription || ''}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-6"
          >
            <div>
              <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Full Description</label>
              <textarea
                rows={5}
                placeholder="Describe your product in detail. Include benefits, use cases, and setup instructions..."
                className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                value={formData.fullDescription || ''}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-4 uppercase tracking-wider">Key Features</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="e.g. Responsive Design"
                  className="flex-1 px-5 py-4 rounded-xl border border-border-main outline-none focus:ring-2 focus:ring-primary/20"
                  value={featureInput || ''}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                />
                <button 
                  type="button"
                  onClick={addFeature}
                  className="bg-primary text-white p-4 rounded-xl hover:bg-primary-dark transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {formData.features.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-border-main group">
                    <span className="text-sm font-medium text-text-main flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {f}
                    </span>
                    <button onClick={() => removeFeature(i)} className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">What's Included</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Full source code, documentation, assets..."
                  className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  value={formData.whatsIncluded || ''}
                  onChange={(e) => setFormData({ ...formData, whatsIncluded: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Who it's for</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Agency owners, freelance developers..."
                  className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  value={formData.whoItsFor || ''}
                  onChange={(e) => setFormData({ ...formData, whoItsFor: e.target.value })}
                />
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Thumbnail URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Demo / Preview URL</label>
                <input
                  type="url"
                  placeholder="https://preview.yourasset.com"
                  className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.demoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-text-main uppercase tracking-wider">Gallery Image URLs</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="gallery-input"
                  placeholder="Paste additional image URL here..."
                  className="flex-1 px-5 py-4 rounded-xl border border-border-main outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button 
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('gallery-input') as HTMLInputElement;
                    if (input.value) {
                      setFormData({ ...formData, images: [...formData.images, input.value] });
                      input.value = '';
                    }
                  }}
                  className="bg-slate-100 p-4 rounded-xl hover:bg-slate-200 transition-all font-bold"
                >
                  Add Image
                </button>
              </div>
              <div className="flex gap-3 flex-wrap">
                {formData.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} className="w-24 h-24 object-cover rounded-xl border border-border-main shadow-sm" />
                    <button 
                      onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-border-main space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black uppercase text-text-main tracking-widest">Basic License</h4>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-text-muted font-medium mb-4">For compiled/build version only. No source code access.</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-text-muted">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 rounded-xl border border-border-main focus:outline-none focus:ring-2 focus:ring-primary/10 font-black text-2xl text-text-main"
                    value={formData.basicPrice || ''}
                    onChange={(e) => setFormData({ ...formData, basicPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className={`p-8 rounded-3xl border transition-all duration-500 ${formData.hasExtended ? 'bg-white border-primary shadow-2xl shadow-primary/10' : 'bg-slate-50 border-border-main opacity-60'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black uppercase text-text-main tracking-widest leading-none">Extended License</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.hasExtended}
                      onChange={(e) => setFormData({ ...formData, hasExtended: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs text-text-muted font-medium mb-4">Includes full source code access for deep customization.</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-text-muted">$</span>
                  <input
                    type="number"
                    disabled={!formData.hasExtended}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 rounded-xl border border-border-main focus:outline-none focus:ring-2 focus:ring-primary/10 font-black text-2xl text-text-main disabled:bg-slate-100 disabled:cursor-not-allowed"
                    value={formData.extendedPrice || ''}
                    onChange={(e) => setFormData({ ...formData, extendedPrice: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Search Keywords / Tags</label>
              <input
                type="text"
                placeholder="ecommerce, react, tailwind, dashboard, responsive"
                className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.tags || ''}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-6"
          >
            <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl flex items-start gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-blue-900 uppercase text-sm tracking-widest">Asset Delivery</h4>
                <p className="text-sm text-blue-800/70 font-medium leading-relaxed">
                  Provide a direct URL to the downloadable asset (ZIP or Source Link). 
                  In production, this is hosted securely. For now, please use a secure cloud link.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wider">Download Link</label>
              <input
                type="url"
                placeholder="https://dropbox.com/s/your-file.zip"
                className="w-full px-5 py-4 rounded-xl border border-border-main focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.downloadUrl || ''}
                onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
              />
            </div>
          </motion.div>
        );
      case 6:
        return (
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-8"
          >
            <div className="bg-slate-50 rounded-3xl border border-border-main overflow-hidden">
               <div className="h-48 relative overflow-hidden bg-slate-200">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Thumbnail" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Monitor className="w-12 h-12 text-text-muted" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                     <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                        {CATEGORIES.find(c => c.id === formData.category)?.name}
                     </span>
                  </div>
               </div>
               <div className="p-8 space-y-6">
                  <div>
                    <h3 className="text-3xl font-black text-text-main mb-2 tracking-tight">{formData.title || 'Untitled Listing'}</h3>
                    <p className="text-text-muted font-medium italic">{formData.shortDescription || 'No description provided.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 border-y border-slate-200 py-6">
                     <div>
                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Basic Access</div>
                        <div className="text-2xl font-black text-primary">${formData.basicPrice || '0'}</div>
                     </div>
                     <div>
                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Extended Source</div>
                        <div className="text-2xl font-black text-text-main">{formData.hasExtended ? `$${formData.extendedPrice}` : 'N/A'}</div>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.tags.split(',').filter(t => t.trim()).map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-border-main rounded-lg text-xs font-bold text-text-muted">#{t.trim()}</span>
                    ))}
                  </div>
               </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4">
               <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
               </div>
               <div>
                  <h4 className="text-emerald-900 font-bold mb-1">Almost There!</h4>
                  <p className="text-sm text-emerald-800/70 font-medium leading-relaxed">
                    Review your details above. Once you click "Publish", your listing will be sent to our moderators for verification.
                  </p>
               </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-app py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <Link href="/dashboard" className="group flex items-center text-sm font-bold text-text-muted hover:text-primary transition-all">
            <div className="bg-white border border-border-main p-2 rounded-lg mr-4 group-hover:border-primary group-hover:bg-primary/5">
              <ArrowLeft className="w-5 h-5" />
            </div>
            Return to Console
          </Link>
          <div className="flex gap-2">
            {STEPS.map((s) => (
              <div 
                key={s.id} 
                className={`w-8 h-1.5 rounded-full transition-all duration-500 ${currentStep >= s.id ? 'bg-primary' : 'bg-slate-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1 space-y-3">
            {STEPS.map((s) => (
              <div key={s.id} className={`flex items-center gap-4 transition-all ${currentStep === s.id ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${currentStep === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-text-muted'}`}>
                  {currentStep > s.id ? <Check className="w-5 h-5" /> : s.id}
                </div>
                <div className="hidden lg:block">
                  <div className="text-[10px] uppercase font-bold text-text-muted tracking-widest leading-none mb-1">Step {s.id}</div>
                  <div className="text-xs font-extrabold text-text-main whitespace-nowrap">{s.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-border-main shadow-2xl shadow-slate-200/50 overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-text-main tracking-tight mb-1">
                    {STEPS.find(s => s.id === currentStep)?.name}
                  </h1>
                  <p className="text-text-muted font-medium text-sm">Professional Asset Onboarding</p>
                </div>
                <div className="hidden sm:block">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-border-main">
                      {STEPS.find(s => s.id === currentStep)?.id === 1 && <Info className="w-6 h-6 text-primary" />}
                      {STEPS.find(s => s.id === currentStep)?.id === 2 && <FileText className="w-6 h-6 text-primary" />}
                      {STEPS.find(s => s.id === currentStep)?.id === 3 && <Upload className="w-6 h-6 text-primary" />}
                      {STEPS.find(s => s.id === currentStep)?.id === 4 && <DollarSign className="w-6 h-6 text-primary" />}
                      {STEPS.find(s => s.id === currentStep)?.id === 5 && <Package className="w-6 h-6 text-primary" />}
                      {STEPS.find(s => s.id === currentStep)?.id === 6 && <CheckCircle className="w-6 h-6 text-primary" />}
                   </div>
                </div>
              </div>

              <div className="p-10 min-h-[450px]">
                <AnimatePresence mode="wait">
                  {renderStep()}
                </AnimatePresence>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </div>

              <div className="p-10 bg-slate-50 flex items-center justify-between border-t border-border-main">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1 || loading}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-text-muted hover:text-text-main transition-all flex items-center gap-2 disabled:opacity-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit}
                    className="bg-primary text-white px-10 py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {loading ? 'Publishing...' : 'Publish Listing'}
                  </button>
                )}
              </div>
            </div>
            
            <p className="mt-8 text-center text-[10px] font-black uppercase text-text-muted tracking-widest leading-loose">
              Trusted by Elite Developers • Secure Delivery Infrastructure • Multi-License ready
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
