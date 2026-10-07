import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { discount, inr, type Product } from "@/lib/store";

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="inline-flex items-center gap-0.5 rounded bg-success px-1.5 py-0.5 font-semibold text-success-foreground">
        {Number(value).toFixed(1)} <Star className="h-3 w-3 fill-current" />
      </span>
      {count != null && <span className="text-muted-foreground">({count.toLocaleString("en-IN")})</span>}
    </span>
  );
}

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.brand}</span>
        <h3 className="line-clamp-2 font-sans text-sm font-medium leading-snug">{p.title}</h3>
        <Rating value={p.rating} count={p.rating_count} />
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-1">
          <span className="text-base font-bold">{inr(p.price)}</span>
          <span className="text-xs text-muted-foreground line-through">{inr(p.mrp)}</span>
          <span className="text-xs font-semibold text-success">{discount(p)}% off</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ items, loading }: { items?: Product[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-card" />)}
      </div>
    );
  }
  if (!items?.length) return <p className="py-16 text-center text-muted-foreground">No products found.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}
