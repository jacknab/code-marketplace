'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ProductCommentsProps {
  listingId: string;
  listingTitle: string;
  developerId: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  parentId?: string;
  createdAt: any;
}

export function ProductComments({ listingId, listingTitle, developerId }: ProductCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("listingId", "==", listingId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        listingId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
        message: message.trim(),
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "comments"), commentData);

      // Create Activity for Developer
      const activityData = {
        type: "message",
        developerId,
        listingId,
        message: `${auth.currentUser.displayName || auth.currentUser.email || 'A user'} asked a question on ${listingTitle}`,
        metadata: {
          commentId: docRef.id,
          userName: auth.currentUser.displayName || auth.currentUser.email || 'A user',
          text: message.trim().substring(0, 100)
        },
        isRead: false,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "activity"), activityData);

      setMessage('');
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group replies
  const rootComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          Questions & Discussions
        </h3>
        <div className="text-xs font-black text-text-muted uppercase tracking-widest">{comments.length} Comments</div>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : rootComments.length === 0 ? (
          <div className="bg-slate-50 border border-border-main rounded-3xl p-12 text-center">
            <p className="text-text-muted font-bold opacity-50">No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          rootComments.map(comment => (
            <div key={comment.id} className="space-y-6">
              <div className="bg-white border border-border-main p-8 rounded-3xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-text-main text-sm">{comment.userName}</div>
                    <div className="text-[10px] font-black uppercase text-text-muted tracking-widest">
                      {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate()) + ' ago' : 'Just now'}
                    </div>
                  </div>
                </div>
                <p className="text-text-muted font-medium leading-relaxed">{comment.message}</p>
              </div>

              {/* Replies */}
              <div className="ml-12 space-y-4">
                {replies.filter(r => r.parentId === comment.id).map(reply => (
                  <div key={reply.id} className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded font-black uppercase tracking-widest">Developer</span>
                       <span className="font-black text-text-main text-xs">{reply.userName}</span>
                       <span className="text-[10px] font-black text-text-muted uppercase opacity-50">
                          {reply.createdAt ? formatDistanceToNow(reply.createdAt.toDate()) + ' ago' : 'Just now'}
                       </span>
                    </div>
                    <p className="text-sm text-text-muted font-bold tracking-tight">{reply.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {auth.currentUser ? (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-primary/10 p-8 rounded-[2.5rem] shadow-2xl shadow-primary/5">
          <label className="block text-sm font-black text-text-main uppercase tracking-widest mb-4">Ask the Developer</label>
          <div className="relative">
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to know about this asset?"
              className="w-full bg-slate-50 border border-border-main rounded-2xl p-6 text-base font-medium focus:ring-4 focus:ring-primary/5 outline-none h-32 transition-all resize-none"
            />
            <button 
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="absolute bottom-4 right-4 bg-primary text-white p-4 rounded-xl shadow-xl shadow-primary/20 hover:scale-110 active:scale-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center opacity-50">Your question will be visible to everyone</p>
        </form>
      ) : (
        <div className="bg-slate-50 border border-border-main rounded-3xl p-8 text-center">
           <p className="text-text-muted font-bold text-sm">Please <Link href="/login" className="text-primary hover:underline">log in</Link> to ask questions.</p>
        </div>
      )}
    </div>
  );
}
