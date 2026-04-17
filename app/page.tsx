import Link from "next/link";
import { getProducts } from "@/lib/products";
import { Navbar } from "@/components/Navbar";

export const revalidate = 3600; // revalidate every hour (ISR)

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-bg-app">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-5xl lg:text-6xl font-extrabold text-text-main tracking-tight mb-6">
            Build your <span className="text-primary">market dominance</span> with verified assets.
          </h2>
          <p className="text-xl text-text-muted leading-relaxed">
            The foundation for successful digital marketplaces. High-performance, SEO-optimized, and ready to scale.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
             <Link href="/register" className="bg-primary text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">Start Building</Link>
             <Link href="#" className="bg-white text-text-main border border-border-main px-8 py-4 rounded-xl text-base font-bold hover:bg-slate-50 transition-all">Documentation</Link>
          </div>
        </div>

        <section>
          <div className="flex items-end justify-between mb-12">
            <div>
              <h3 className="text-2xl font-bold text-text-main tracking-tight">Featured Collections</h3>
              <p className="text-text-muted text-sm mt-1">Hand-picked premium assets for your next project.</p>
            </div>
            <Link href="#" className="text-sm font-bold text-primary hover:underline">Browse all assets &rarr;</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="group h-full flex flex-col">
                <div className="aspect-[16/10] relative rounded-xl overflow-hidden bg-white mb-5 border border-border-main group-hover:shadow-xl group-hover:shadow-slate-200 transition-all duration-300">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-white px-3 py-1.5 rounded-lg text-sm font-bold text-text-main shadow-lg">
                      ${product.price}
                    </div>
                  </div>
                </div>
                <div className="px-1 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-text-main text-lg tracking-tight">{product.name}</h4>
                    <div className="flex items-center gap-1">
                       <span className="text-yellow-400">★</span>
                       <span className="text-xs font-bold text-text-main">{product.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mb-4">{product.description}</p>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{product.reviewCount} Reviews</span>
                     <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">Details &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-border-main mt-24 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div className="flex items-center gap-2 font-extrabold text-xl text-primary">
              <div className="bg-primary w-6 h-6 rounded" />
              MKTP CORE
            </div>
            <div className="flex gap-10 text-sm font-bold text-text-muted uppercase tracking-widest">
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/sitemap.xml" className="hover:text-primary transition-colors">Sitemap</Link>
              <Link href="#" className="hover:text-primary transition-colors">Robots</Link>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 text-sm font-medium text-text-muted text-center md:text-left">
            © 2026 Elite Marketplace Foundation. Production ready infrastructure.
          </div>
        </div>
      </footer>
    </div>
  );
}
