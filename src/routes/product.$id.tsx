import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingCart, Zap, Check, Truck, Sparkles } from "lucide-react";
import { discount, inr, useCartActions, useProduct, useProducts } from "@/lib/store";
import { ProductCard, Rating } from "@/components/ProductCard";
import { Viewer3D } from "@/components/Viewer3D";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product details — A4MP" },
      { name: "description", content: "View in 360°, pick colours and see offers on A4MP." },
      { property: "og:title", content: "Product — A4MP" },
      { property: "og:description", content: "View in 360°, pick colours and see offers on A4MP." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

const COLORS = [
  { name: "Original", swatch: "conic-gradient(from 0deg, #e5e5e5, #9ca3af, #e5e5e5)", filter: "none" },
  { name: "Midnight", swatch: "#1f2937", filter: "grayscale(0.6) brightness(0.65) contrast(1.1)" },
  { name: "Ocean Blue", swatch: "#2563eb", filter: "hue-rotate(200deg) saturate(1.3)" },
  { name: "Ruby Red", swatch: "#dc2626", filter: "hue-rotate(320deg) saturate(1.6)" },
  { name: "Forest", swatch: "#16a34a", filter: "hue-rotate(90deg) saturate(1.3)" },
  { name: "Gold", swatch: "#d4a017", filter: "sepia(0.8) saturate(1.6) hue-rotate(-10deg)" },
];

function ProductPage() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useProduct(id);
  const { data: related } = useProducts({ category: p?.category_slug, limit: 13 });
  const { data: brandMore } = useProducts({ search: p?.brand, limit: 11 });
  const { add } = useCartActions();
  const navigate = useNavigate();
  const [color, setColor] = useState(0);

  if (isLoading) return <div className="mx-auto my-6 h-[60vh] max-w-7xl animate-pulse rounded-2xl bg-card" />;
  if (!p) return <p className="py-20 text-center text-muted-foreground">Product not found.</p>;

  const c = COLORS[color]!;
  const similar = related?.filter((r) => r.id !== p.id).slice(0, 10) ?? [];
  const brand = brandMore?.filter((r) => r.id !== p.id && r.category_slug !== p.category_slug).slice(0, 10) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <div className="grid gap-6 rounded-3xl bg-card p-4 shadow-card md:grid-cols-2 md:p-8">
        <div className="space-y-4 md:sticky md:top-32 md:self-start">
          <Viewer3D key={p.id} src={p.image_url} alt={p.title} filter={c.filter} />
          <div className="grid grid-cols-2 gap-3">
            <button disabled={add.isPending} onClick={() => add.mutate(p.id)} className="flex items-center justify-center gap-2 rounded-lg bg-accent py-3.5 font-bold text-accent-foreground transition hover:brightness-95">
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </button>
            <button onClick={() => add.mutate(p.id, { onSuccess: () => navigate({ to: "/cart" }) })} className="flex items-center justify-center gap-2 rounded-lg bg-cta py-3.5 font-bold text-cta-foreground transition hover:brightness-95">
              <Zap className="h-5 w-5" /> Buy Now
            </button>
          </div>
        </div>
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{p.brand}</p>
          <h1 className="font-display text-2xl font-bold leading-snug md:text-3xl">{p.title}</h1>
          <Rating value={p.rating} count={p.rating_count} />
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold">{inr(p.price)}</span>
            <span className="text-muted-foreground line-through">{inr(p.mrp)}</span>
            <span className="font-semibold text-success">{discount(p)}% off</span>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold">Colour: <span className="font-medium text-muted-foreground">{c.name}</span></p>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((col, idx) => (
                <button
                  key={col.name}
                  aria-label={col.name}
                  onClick={() => setColor(idx)}
                  className={`h-10 w-10 rounded-full border-2 transition hover:scale-110 ${idx === color ? "border-primary ring-2 ring-primary/30 ring-offset-2" : "border-border"}`}
                  style={{ background: col.swatch }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="mb-2 font-sans text-sm font-bold">Highlights</h2>
            <ul className="space-y-1.5 text-sm">
              {p.highlights.map((h) => <li key={h} className="flex gap-2"><Check className="h-4 w-4 text-success" />{h}</li>)}
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>
          <p className="flex items-center gap-2 text-sm"><Truck className="h-4 w-4 text-primary" /> Free delivery in 2–4 days · 7-day replacement</p>
        </div>
      </div>

      {!!similar.length && <Rail title="Similar products" items={similar} />}
      {!!brand.length && <Rail title={`More from ${p.brand}`} items={brand} />}
    </div>
  );
}

function Rail({ title, items }: { title: string; items: NonNullable<ReturnType<typeof useProducts>["data"]> }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Sparkles className="h-5 w-5 text-cta" />{title}</h2>
      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
        {items.map((r) => <div key={r.id} className="w-44 shrink-0 sm:w-52"><ProductCard p={r} /></div>)}
      </div>
    </section>
  );
}
