import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Zap, Check, Truck } from "lucide-react";
import { discount, inr, useCartActions, useProduct, useProducts } from "@/lib/store";
import { ProductCard, Rating } from "@/components/ProductCard";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product details — A4MP" },
      { name: "description", content: "View specs, offers and reviews on A4MP." },
      { property: "og:title", content: "Product — A4MP" },
      { property: "og:description", content: "View specs, offers and reviews on A4MP." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useProduct(id);
  const { data: related } = useProducts({ category: p?.category_slug });
  const { add } = useCartActions();
  const navigate = useNavigate();

  if (isLoading) return <div className="mx-auto my-6 h-[60vh] max-w-7xl animate-pulse rounded-2xl bg-card" />;
  if (!p) return <p className="py-20 text-center text-muted-foreground">Product not found.</p>;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <div className="grid gap-6 rounded-2xl bg-card p-4 shadow-card md:grid-cols-2 md:p-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl bg-muted">
            <img src={p.image_url} alt={p.title} className="aspect-square w-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button disabled={add.isPending} onClick={() => add.mutate(p.id)} className="flex items-center justify-center gap-2 rounded-lg bg-accent py-3.5 font-bold text-accent-foreground transition hover:brightness-95">
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </button>
            <button onClick={() => add.mutate(p.id, { onSuccess: () => navigate({ to: "/cart" }) })} className="flex items-center justify-center gap-2 rounded-lg bg-cta py-3.5 font-bold text-cta-foreground transition hover:brightness-95">
              <Zap className="h-5 w-5" /> Buy Now
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{p.brand}</p>
          <h1 className="font-sans text-2xl font-semibold leading-snug">{p.title}</h1>
          <Rating value={p.rating} count={p.rating_count} />
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-bold">{inr(p.price)}</span>
            <span className="text-muted-foreground line-through">{inr(p.mrp)}</span>
            <span className="font-semibold text-success">{discount(p)}% off</span>
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
      {!!related?.filter((r) => r.id !== p.id).length && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Similar products</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.filter((r) => r.id !== p.id).slice(0, 5).map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
