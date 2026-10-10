import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Boxes, Eye, EyeOff, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/admin";
import { inr, useCategories, type Product } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — A4MP" },
      { name: "description", content: "Manage A4MP products, stock and catalogue." },
      { property: "og:title", content: "Admin Dashboard — A4MP" },
      { property: "og:description", content: "Manage A4MP products, stock and catalogue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const LOW = 10;
const PAGE = 25;

type Form = {
  id?: string; title: string; brand: string; description: string; category_slug: string;
  price: number; mrp: number; stock: number; image_url: string; sku: string; is_published: boolean; highlights: string;
};
const empty: Form = { title: "", brand: "", description: "", category_slug: "", price: 0, mrp: 0, stock: 50, image_url: "", sku: "", is_published: true, highlights: "" };

function AdminPage() {
  const { isAdmin, loading, user } = useIsAdmin();
  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!user) return <Gate msg="Please login with an admin account." />;
  if (!isAdmin) return <Gate msg="You don't have admin access." />;
  return <Dashboard />;
}

function Gate({ msg }: { msg: string }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-lg font-semibold">{msg}</p>
      <Link to="/auth" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Login</Link>
    </div>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const { data: cats } = useCategories();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Form | null>(null);

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [all, low, hidden, orders] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).lt("stock", LOW),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);
      return { products: all.count ?? 0, low: low.count ?? 0, hidden: hidden.count ?? 0, orders: orders.count ?? 0 };
    },
  });

  const list = useQuery({
    queryKey: ["admin-products", q, cat, lowOnly, page],
    placeholderData: (p) => p,
    queryFn: async () => {
      let s = supabase.from("products").select("*", { count: "exact" }).order("updated_at", { ascending: false });
      const term = q.replace(/[,()%]/g, " ").trim();
      if (term) s = s.or(`title.ilike.%${term}%,brand.ilike.%${term}%,sku.ilike.%${term}%`);
      if (cat) s = s.eq("category_slug", cat);
      if (lowOnly) s = s.lt("stock", LOW);
      const { data, count, error } = await s.range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const save = useMutation({
    mutationFn: async (f: Form) => {
      if (!f.title.trim() || !f.brand.trim() || !f.category_slug || !f.image_url.trim()) throw new Error("Title, brand, category and image are required");
      if (f.price <= 0 || f.mrp < f.price) throw new Error("Price must be > 0 and MRP ≥ price");
      if (f.stock < 0) throw new Error("Stock can't be negative");
      const row = {
        title: f.title.trim(), brand: f.brand.trim(), description: f.description.trim(), category_slug: f.category_slug,
        price: Math.round(f.price), mrp: Math.round(f.mrp), stock: Math.round(f.stock), image_url: f.image_url.trim(),
        sku: f.sku.trim() || null, is_published: f.is_published,
        highlights: f.highlights.split("\n").map((h) => h.trim()).filter(Boolean), updated_at: new Date().toISOString(),
      };
      const { error } = f.id
        ? await supabase.from("products").update(row).eq("id", f.id)
        : await supabase.from("products").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Product saved"); setEditing(null); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Product> }) => {
      const { error } = await supabase.from("products").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Product deleted"); refresh(); },
    onError: () => toast.error("Can't delete — product is in carts. Unpublish it instead."),
  });

  const total = list.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={() => setEditing({ ...empty, category_slug: cats?.[0]?.slug ?? "" })} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Boxes className="h-5 w-5" />} label="Products" value={stats.data?.products} />
        <Stat icon={<Package className="h-5 w-5" />} label="Orders" value={stats.data?.orders} />
        <Stat icon={<AlertTriangle className="h-5 w-5" />} label={`Low stock (<${LOW})`} value={stats.data?.low} onClick={() => { setLowOnly(true); setPage(0); }} />
        <Stat icon={<EyeOff className="h-5 w-5" />} label="Unpublished" value={stats.data?.hidden} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex flex-1 items-center rounded-md border bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search title, brand, SKU" className="w-full bg-transparent px-2 py-2 text-sm outline-none" />
        </div>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }} className="rounded-md border bg-card px-3 py-2 text-sm">
          <option value="">All categories</option>
          {cats?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
          <input type="checkbox" checked={lowOnly} onChange={(e) => { setLowOnly(e.target.checked); setPage(0); }} /> Low stock only
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {list.isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {list.data?.rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No products found.</td></tr>}
            {list.data?.rows.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    <div className="min-w-0"><p className="line-clamp-1 font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{p.brand}{p.sku ? ` · ${p.sku}` : ""}</p></div>
                  </div>
                </td>
                <td className="p-3">{p.category_slug}</td>
                <td className="p-3">{inr(p.price)}</td>
                <td className="p-3">
                  <input
                    type="number" min={0} defaultValue={p.stock} key={p.stock}
                    onBlur={(e) => { const v = Math.max(0, Number(e.target.value)); if (v !== p.stock) patch.mutate({ id: p.id, values: { stock: v } }); }}
                    className={`w-20 rounded border bg-background px-2 py-1 ${p.stock < LOW ? "border-destructive text-destructive" : ""}`}
                    aria-label="Stock"
                  />
                </td>
                <td className="p-3">
                  <button onClick={() => patch.mutate({ id: p.id, values: { is_published: !p.is_published } })} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${p.is_published ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {p.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {p.is_published ? "Published" : "Hidden"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button aria-label="Edit" onClick={() => setEditing({ ...p, sku: p.sku ?? "", highlights: p.highlights.join("\n") })} className="rounded p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button aria-label="Delete" onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }} className="rounded p-2 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{total.toLocaleString("en-IN")} products</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Prev</button>
          <span>{page + 1} / {pages}</span>
          <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>

      {editing && <Editor form={editing} cats={cats ?? []} saving={save.isPending} onClose={() => setEditing(null)} onSave={(f) => save.mutate(f)} />}
    </div>
  );
}

function Stat({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: number | undefined; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl bg-card p-4 text-left shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <span><span className="block text-xs text-muted-foreground">{label}</span><span className="text-xl font-bold">{value?.toLocaleString("en-IN") ?? "—"}</span></span>
    </button>
  );
}

function Editor({ form, cats, saving, onClose, onSave }: { form: Form; cats: { slug: string; name: string }[]; saving: boolean; onClose: () => void; onSave: (f: Form) => void }) {
  const [f, setF] = useState(form);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const input = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-lift">
        <h2 className="mb-4 text-lg font-bold">{f.id ? "Edit product" : "Add product"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm">Title<input className={input} value={f.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} /></label>
          <label className="text-sm">Brand<input className={input} value={f.brand} onChange={(e) => set("brand", e.target.value)} required maxLength={80} /></label>
          <label className="text-sm">SKU<input className={input} value={f.sku} onChange={(e) => set("sku", e.target.value)} maxLength={60} /></label>
          <label className="text-sm">Category
            <select className={input} value={f.category_slug} onChange={(e) => set("category_slug", e.target.value)} required>
              {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Stock<input type="number" min={0} className={input} value={f.stock} onChange={(e) => set("stock", Number(e.target.value))} /></label>
          <label className="text-sm">Selling price (₹)<input type="number" min={1} className={input} value={f.price} onChange={(e) => set("price", Number(e.target.value))} /></label>
          <label className="text-sm">MRP (₹)<input type="number" min={1} className={input} value={f.mrp} onChange={(e) => set("mrp", Number(e.target.value))} /></label>
          <label className="sm:col-span-2 text-sm">Image URL<input type="url" className={input} value={f.image_url} onChange={(e) => set("image_url", e.target.value)} required placeholder="https://…" /></label>
          {f.image_url && <img src={f.image_url} alt="" className="h-24 w-24 rounded object-cover sm:col-span-2" />}
          <label className="sm:col-span-2 text-sm">Description<textarea rows={3} className={input} value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={4000} /></label>
          <label className="sm:col-span-2 text-sm">Highlights (one per line)<textarea rows={3} className={input} value={f.highlights} onChange={(e) => set("highlights", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_published} onChange={(e) => set("is_published", e.target.checked)} /> Published</label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
