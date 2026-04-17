import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  addDoc,
  serverTimestamp,
  orderBy,
  QuerySnapshot
} from "firebase/firestore";
import { db } from "./firebase";
import { handleFirestoreError, OperationType } from "./firestore-utils";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  fullDescription?: string;
  features?: string[];
  whatsIncluded?: string;
  whoItsFor?: string;
  price: number;
  basicPrice?: number;
  extendedPrice?: number;
  hasExtended?: boolean;
  rating: number;
  reviewCount: number;
  image: string;
  authorId?: string;
  createdAt: any;
}

export async function getProducts() {
  const path = "products";
  console.log(`getProducts: Querying path "${path}"...`);
  
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error("Firestore fetch timed out after 5s")), 5000)
  );

  try {
    const q = query(collection(db, path), orderBy("createdAt", "desc"), limit(10));
    console.log("getProducts: Executing getDocs with 5s timeout...");
    
    const snapshot = await Promise.race([
      getDocs(q),
      timeoutPromise
    ]) as QuerySnapshot;

    console.log(`getProducts: Success! Found ${snapshot.size} documents.`);
    
    // In build/prerender environment, just return empty if none exist
    // Avoid seeding during build as it will fail due to security rules
    if (snapshot.empty && typeof window !== "undefined") {
      // Seed if empty and on client (where user might be admin)
      // Actually, seeding is best done manually or via a setup script
      // For now, let's just return empty if it fails
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  } catch (error) {
    console.warn("Firestore error in getProducts:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  const path = "products";
  try {
    const q = query(collection(db, path), where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Product;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

async function seedProducts() {
  const productsToCreate = [
    {
      name: "Premium UI Kit",
      slug: "premium-ui-kit",
      description: "A comprehensive UI kit for modern web applications.",
      price: 49.99,
      rating: 4.8,
      reviewCount: 124,
      image: "https://picsum.photos/seed/uikit/800/600",
      authorId: "seed-developer-123",
      createdAt: serverTimestamp(),
    },
    {
      name: "Marketplace Template",
      slug: "marketplace-template",
      description: "Full-stack marketplace template with auth and database.",
      price: 89.99,
      rating: 4.9,
      reviewCount: 56,
      image: "https://picsum.photos/seed/market/800/600",
      createdAt: serverTimestamp(),
    },
    {
      name: "Icon Set Pro",
      slug: "icon-set-pro",
      description: "1000+ custom icons for any project.",
      price: 19.99,
      rating: 4.7,
      reviewCount: 89,
      image: "https://picsum.photos/seed/icons/800/600",
      createdAt: serverTimestamp(),
    },
  ];

  for (const product of productsToCreate) {
    await addDoc(collection(db, "products"), product);
  }
}
