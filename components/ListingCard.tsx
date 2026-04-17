'use client';

import React from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Listing } from '@/lib/listings';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 transition-all duration-500">
      <div className="relative h-56 bg-slate-100 overflow-hidden">
        <img 
          src={listing.imageUrl || "https://picsum.photos/seed/product/400/300"} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-6 left-6">
           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg ${listing.status === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
             {listing.status}
           </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8 translate-y-full group-hover:translate-y-0 transition-transform">
           <Link href={`/products/${listing.id}`} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-center">View Public Page</Link>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div>
          <h4 className="text-lg font-black text-[#1E293B] tracking-tight truncate mb-1">{listing.title}</h4>
          <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">{listing.category} • {listing.techStack}</p>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
           <div className="text-2xl font-black text-primary">${listing.basicPrice}</div>
           <Link href={`/dashboard/edit/${listing.id}`} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
              <Settings className="w-4 h-4" />
           </Link>
        </div>
      </div>
    </div>
  );
}
