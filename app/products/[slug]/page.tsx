import { getProductBySlug } from "@/lib/products";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/Navbar";
import { ListingPurchaseSection } from "@/components/ListingPurchaseSection";
import { ProductComments } from "@/components/ProductComments";
import { ArrowRight, CheckCircle2, Package, User } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: ProductPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} | Elite Marketplace`,
    description: product.shortDescription || product.description,
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description,
      images: [product.image],
    },
  };
}

export async function generateStaticParams() {
  const q = collection(db, "products");
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ slug: doc.data().slug }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: product.shortDescription || product.description,
    brand: {
      "@type": "Brand",
      name: "Elite Marketplace",
    },
    offers: {
      "@type": "Offer",
      url: `https://elite-marketplace.com/products/${product.slug}`,
      priceCurrency: "USD",
      price: product.basicPrice || product.price,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };

  return (
    <div className="min-h-screen bg-bg-app">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-12">
            <div className="aspect-[16/10] relative rounded-3xl overflow-hidden border border-border-main shadow-2xl shadow-slate-200 bg-white">
              <img 
                src={product.image} 
                alt={product.name}
                className="object-cover w-full h-full"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-12 pb-20">
              <section>
                <h3 className="text-sm font-black uppercase text-text-muted tracking-[0.2em] mb-6 flex items-center gap-3">
                  <div className="w-8 h-px bg-slate-200" />
                  Product Insight
                </h3>
                <h2 className="text-4xl font-extrabold text-text-main mb-6 leading-tight">
                  {product.shortDescription || "Powerful asset for modern developers."}
                </h2>
                <p className="text-xl text-text-muted leading-relaxed font-medium">
                  {product.fullDescription || product.description}
                </p>
              </section>

              {product.features && product.features.length > 0 && (
                <section className="bg-white p-10 rounded-3xl border border-border-main shadow-sm">
                  <h3 className="text-lg font-black text-text-main mb-8 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    Key Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="font-bold text-text-main text-base">{feature}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h3 className="text-sm font-black uppercase text-text-muted tracking-[0.2em] mb-6 flex items-center gap-3">
                    <Package className="w-5 h-5" />
                    What's Included
                  </h3>
                  <p className="text-text-muted font-medium leading-relaxed">
                    {product.whatsIncluded || "Full asset package, documentation, and support access."}
                  </p>
                </section>
                <section>
                  <h3 className="text-sm font-black uppercase text-text-muted tracking-[0.2em] mb-6 flex items-center gap-3">
                    <User className="w-5 h-5" />
                    Who it's for
                  </h3>
                  <p className="text-text-muted font-medium leading-relaxed">
                    {product.whoItsFor || "Developers, agencies, and entrepreneurs looking to scale faster."}
                  </p>
                </section>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-border-main p-10 shadow-2xl shadow-slate-200">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/10">Elite Verified</span>
                </div>
                <h1 className="text-4xl font-black text-text-main tracking-tight leading-none">
                  {product.name}
                </h1>
              </div>

              <ListingPurchaseSection 
                listingId={product.id}
                listingTitle={product.name}
                developerId={product.authorId || "system_developer"}
                basicPrice={product.basicPrice || product.price} 
                extendedPrice={product.extendedPrice}
                hasExtended={product.hasExtended}
              />
              
              <div className="mt-12 space-y-4">
                <div className="text-[10px] font-black uppercase text-text-muted tracking-widest text-center">Marketplace Statistics</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-50 border border-border-main rounded-2xl">
                    <div className="text-xl font-black text-text-main">{product.rating}</div>
                    <div className="text-[10px] font-black text-text-muted uppercase mt-1">Rating</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 border border-border-main rounded-2xl">
                    <div className="text-xl font-black text-text-main">{product.reviewCount}</div>
                    <div className="text-[10px] font-black text-text-muted uppercase mt-1">Sales</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 border border-border-main rounded-2xl">
                    <div className="text-xl font-black text-primary">Pro</div>
                    <div className="text-[10px] font-black text-text-muted uppercase mt-1">Tier</div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                        <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="user" />
                     </div>
                   ))}
                </div>
                <div className="text-xs font-bold text-text-muted">
                   Joined by <span className="text-text-main">500+ developers</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between px-4">
               <Link href="/dashboard" className="text-xs font-black uppercase text-text-muted hover:text-primary transition-all flex items-center gap-2">
                  Have a question? <ArrowRight className="w-3 h-3" />
               </Link>
               <div className="text-xs font-black text-text-muted uppercase">ID: {product.slug}</div>
            </div>
          </div>
        </div>

        {/* New Comments Section */}
        <div className="mt-32 max-w-4xl">
           <ProductComments 
             listingId={product.id} 
             listingTitle={product.name} 
             developerId={product.authorId || "system_developer"} 
           />
        </div>
      </main>
    </div>
  );
}
