import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useProducts } from "@/lib/store";
import { ProductGrid } from "@/components/ProductCard";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().catch("") }),
  head: () => ({
    meta: [
      { title: "Search results — A4MP" },
      { name: "description", content: "Find the products you love on A4MP." },
      { property: "og:title", content: "Search — A4MP" },
      { property: "og:description", content: "Find the products you love on A4MP." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data, isLoading } = useProducts({ search: q.replace(/[,()%]/g, " ") });
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Results for “{q}”</h1>
      <ProductGrid items={data} loading={isLoading} />
    </div>
  );
}
