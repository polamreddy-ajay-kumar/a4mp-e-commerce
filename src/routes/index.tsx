import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, ShieldCheck, RotateCcw, BadgePercent } from "lucide-react";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import { useCategories, useProducts } from "@/lib/store";
import { ProductCard, ProductGrid } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A4MP — Big Savings on Mobiles, Electronics & Fashion" },
      { name: "description", content: "India's premium shopping destination. Top brands, great offers and fast delivery on A4MP." },
      { property: "og:title", content: "A4MP — Big Savings on Top Brands" },
      { property: "og:description", content: "Top brands, great offers and fast delivery on A4MP." },
    ],
  }),
  component: Index,
});

const slides = [
  { img: banner1, tag: "Big Tech Days", title: "Up to 40% off on gadgets", sub: "Phones, audio, wearables & more", to: "electronics" },
  { img: banner2, tag: "Fashion Fest", title: "Style that speaks. 50–80% off", sub: "Top brands, new arrivals", to: "fashion" },
];

function Index() {
  const { data: cats } = useCategories();
  const { data: products, isLoading } = useProducts();
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);
  const deals = products?.filter((p) => (p.mrp - p.price) / p.mrp > 0.3).slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <section className="relative overflow-hidden rounded-2xl shadow-card">
        {slides.map((s, idx) => (
          <div key={idx} className={`transition-opacity duration-700 ${idx === i ? "relative opacity-100" : "absolute inset-0 opacity-0"}`}>
            <img src={s.img} alt={s.title} width={1600} height={640} className="h-56 w-full object-cover sm:h-72 md:h-96" />
            <div className="absolute inset-0 flex flex-col justify-center gap-2 bg-gradient-to-r from-primary-deep/80 via-primary-deep/30 to-transparent p-6 text-primary-foreground sm:p-12">
              <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{s.tag}</span>
              <h1 className="max-w-md text-2xl font-extrabold leading-tight sm:text-4xl md:text-5xl">{s.title}</h1>
              <p className="text-sm opacity-90 sm:text-base">{s.sub}</p>
              <Link to="/category/$slug" params={{ slug: s.to }} className="mt-2 w-fit rounded-lg bg-card px-5 py-2.5 text-sm font-bold text-primary">Shop now</Link>
            </div>
          </div>
        ))}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button key={idx} aria-label={`Slide ${idx + 1}`} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-card" : "w-1.5 bg-card/60"}`} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-card">
        <div className="scrollbar-none flex gap-4 overflow-x-auto sm:justify-between">
          {cats?.map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
              <img src={c.image_url} alt={c.name} loading="lazy" className="h-16 w-16 rounded-full object-cover ring-2 ring-secondary transition hover:ring-primary" />
              <span className="text-xs font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Truck, t: "Free Delivery", s: "On orders above ₹499" },
          { icon: RotateCcw, t: "7-Day Returns", s: "Hassle-free" },
          { icon: ShieldCheck, t: "100% Genuine", s: "Brand warranty" },
          { icon: BadgePercent, t: "Best Prices", s: "Daily new offers" },
        ].map(({ icon: Icon, t, s }) => (
          <div key={t} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
            <div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-muted-foreground">{s}</p></div>
          </div>
        ))}
      </section>

      {!!deals?.length && (
        <section className="rounded-2xl bg-brand-gradient p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between text-primary-foreground">
            <h2 className="text-xl font-bold sm:text-2xl">Deals of the Day</h2>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">30%+ off</span>
          </div>
          <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
            {deals.map((p) => <div key={p.id} className="w-44 shrink-0 sm:w-52"><ProductCard p={p} /></div>)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">Trending Now</h2>
        <ProductGrid items={products} loading={isLoading} />
      </section>
    </div>
  );
}
