import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — A4MP" },
      { name: "description", content: "Track and view your A4MP orders." },
      { property: "og:title", content: "My Orders — A4MP" },
      { property: "og:description", content: "Track and view your A4MP orders." },
    ],
  }),
  component: Orders,
});

type Item = { id: string; title: string; image_url: string; price: number; quantity: number };

function Orders() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!loading && !user) return <div className="py-20 text-center"><Link to="/auth" className="rounded-lg bg-cta px-8 py-3 font-bold text-cta-foreground">Login to view orders</Link></div>;
  if (isLoading || loading) return <div className="mx-auto my-6 h-64 max-w-4xl animate-pulse rounded-2xl bg-card" />;

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">My Orders</h1>
      {!data?.length && <p className="text-muted-foreground">No orders yet.</p>}
      {data?.map((o) => (
        <div key={o.id} className="rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-success"><CheckCircle2 className="h-4 w-4" /> {o.status}</span>
            <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })} · #{o.id.slice(0, 8).toUpperCase()}</span>
            <b>{inr(o.total)}</b>
          </div>
          <div className="space-y-3">
            {(o.items as Item[]).map((i) => (
              <Link key={i.id} to="/product/$id" params={{ id: i.id }} className="flex items-center gap-3">
                <img src={i.image_url} alt={i.title} className="h-14 w-14 rounded-lg object-cover" />
                <span className="flex-1 text-sm">{i.title} <span className="text-muted-foreground">× {i.quantity}</span></span>
                <span className="text-sm font-semibold">{inr(i.price * i.quantity)}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Deliver to {o.full_name}, {o.address} - {o.pincode}</p>
        </div>
      ))}
    </div>
  );
}
