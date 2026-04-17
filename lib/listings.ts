import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

export interface Listing {
  id: string;
  title: string;
  category: string;
  techStack: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  whatsIncluded: string;
  whoItsFor: string;
  imageUrl: string; 
  images: string[];
  demoUrl: string;
  basicPrice: number;
  extendedPrice?: number;
  hasExtended: boolean;
  tags: string[];
  downloadUrl: string;
  authorId: string;
  status: 'Pending' | 'Approved';
  createdAt: any;
  // Deprecated support
  price: number;
  description: string;
}

export async function getUserListings(userId: string) {
  const path = "listings";
  try {
    const q = query(
      collection(db, path), 
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Listing[];
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return [];
  }
}

export async function createListing(data: any) {
  const path = "listings";
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      status: 'Pending',
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error creating listing:", error);
    throw error;
  }
}
