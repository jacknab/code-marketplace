'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldCheck, Download, Code, Loader2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

interface ListingPurchaseSectionProps {
  listingId: string;
  listingTitle: string;
  developerId: string;
  basicPrice: number;
  extendedPrice?: number;
  hasExtended?: boolean;
  onPurchase?: (licenseType: 'basic' | 'extended') => void;
}

export function ListingPurchaseSection({ 
  listingId,
  listingTitle,
  developerId,
  basicPrice, 
  extendedPrice, 
  hasExtended,
  onPurchase 
}: ListingPurchaseSectionProps) {
  const [licenseType, setLicenseType] = useState<'basic' | 'extended'>('basic');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const currentPrice = licenseType === 'basic' ? basicPrice : (extendedPrice || 0);

  const handlePurchase = async () => {
    if (!auth.currentUser) {
      alert("Please log in to purchase assets.");
      return;
    }

    setIsPurchasing(true);
    try {
      // 1. Create Order
      const orderData = {
        listingId,
        listingTitle,
        developerId,
        buyerId: auth.currentUser.uid,
        buyerEmail: auth.currentUser.email,
        price: currentPrice,
        licenseType,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "orders"), orderData);

      // 2. Create Activity for Developer
      const activityData = {
        type: "sale",
        developerId,
        listingId,
        message: `You sold ${listingTitle}`,
        metadata: {
          price: currentPrice,
          buyerEmail: auth.currentUser.email,
          licenseType
        },
        isRead: false,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "activity"), activityData);

      setPurchased(true);
      onPurchase?.(licenseType);
    } catch (error) {
      console.error("Purchase error:", error);
      alert("An error occurred during purchase.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (purchased) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Check className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black text-emerald-900 tracking-tight">Purchase Successful!</h3>
        <p className="text-emerald-700 text-sm font-medium">The asset is now available in your collection. Check your email for delivery details.</p>
        <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all">
          Access Asset Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hasExtended && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-border-main">
          <button
            onClick={() => setLicenseType('basic')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              licenseType === 'basic' 
                ? 'bg-white text-primary shadow-lg shadow-slate-200 border border-border-main' 
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Basic License
          </button>
          <button
            onClick={() => setLicenseType('extended')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              licenseType === 'extended' 
                ? 'bg-white text-primary shadow-lg shadow-slate-200 border border-border-main' 
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Extended License
          </button>
        </div>
      )}

      <div className="flex items-baseline gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={licenseType}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl font-black text-text-main tracking-tighter"
          >
            ${currentPrice}
          </motion.div>
        </AnimatePresence>
        <div className="text-text-muted font-bold text-xl line-through opacity-30">
          ${(currentPrice * 1.5).toFixed(2)}
        </div>
      </div>

      <div className="space-y-4 py-6 border-y border-slate-100">
        <h4 className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">License Includes:</h4>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-sm font-bold text-text-main">
            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            {licenseType === 'basic' ? 'Ready-to-use compiled version' : 'Full source code included for customization'}
          </li>
          <li className="flex items-center gap-3 text-sm font-bold text-text-main">
            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            12 Months of Technical Updates
          </li>
          <li className="flex items-center gap-3 text-sm font-bold text-text-main">
            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            {licenseType === 'basic' ? 'Standard Support' : 'Priority Developer Support'}
          </li>
        </ul>
      </div>

      <button 
        onClick={handlePurchase}
        disabled={isPurchasing}
        className="w-full relative group disabled:opacity-50"
      >
        <div className="absolute inset-0 bg-primary translate-y-1 rounded-xl group-active:translate-y-0 transition-transform" />
        <div className="relative bg-primary text-white text-base font-black px-10 py-5 rounded-xl flex items-center justify-center gap-3 transform group-hover:-translate-y-0.5 transition-transform">
          {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : (licenseType === 'basic' ? <Download className="w-5 h-5" /> : <Code className="w-5 h-5" />)}
          {isPurchasing ? 'PROCESSING...' : 'GET THIS ASSET'}
        </div>
      </button>

      <div className="flex items-center justify-center gap-4 text-[10px] font-black text-text-muted tracking-[0.1em] uppercase">
         <ShieldCheck className="w-3 h-3" />
         Secure Checkout Verified
      </div>
    </div>
  );
}
