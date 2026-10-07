import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCategories, useProducts } from "@/lib/store";
import { ProductGrid } from "@/components/ProductCard";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Shop ${params.slug} online — A4MP` },
      { name: "description", content: `Best deals on ${params.slug} from top brands at A4MP.` },
      { property: "og:title", content: `Shop ${params.slug} — A4MP` },
      { property: "og:description", content: `Best deals on ${params.slug} from top brands at A4MP.` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: cats } = useCategories();
  const { data, isLoading } = useProducts({ category: slug });
  const [sort, setSort] = useState("popular");
  const name = cats?.find((c) => c.slug === slug)?.name ?? slug;
  const items = useMemo(() => {
    const a = [...(data ?? [])];
    if (sort === "low") a.sort((x, y) => x.price - y.price);
    if (sort === "high") a.sort((x, y) => y.price - x.price);
    if (sort === "rating") a.sort((x, y) => Number(y.rating) - Number(x.rating));
    return a;
  }, [data, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-sm text-muted-foreground">{items.length} products</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-card p-1 text-sm shadow-card">
          {[["popular", "Popular"], ["low", "Price ↑"], ["high", "Price ↓"], ["rating", "Rating"]].map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} className={`rounded-md px-3 py-1.5 font-medium ${sort === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>
      <ProductGrid items={items} loading={isLoading} />
    </div>
  );
}
