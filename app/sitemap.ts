import { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || "https://elite-marketplace.com";

  const q = collection(db, "products");
  const snapshot = await getDocs(q);
  
  const productEntries: MetadataRoute.Sitemap = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      url: `${baseUrl}/products/${data.slug}`,
      lastModified: data.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...productEntries,
  ];
}
