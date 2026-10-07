import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/store";
import { Summary } from "./cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — A4MP" },
      { name: "description", content: "Enter delivery details and place your A4MP order." },
      { property: "og:title", content: "Checkout — A4MP" },
      { property: "og:description", content: "Place your A4MP order." },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().min(10, "Enter full address").max(500),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

function Checkout() {
  const { user } = useAuth();
  const { data: cart } = useCart();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", pincode: "" });

  if (!cart?.length) return <p className="py-20 text-center text-muted-foreground">Your cart is empty.</p>;
  const mrp = cart.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
  const price = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return toast.error(r.error.issues[0].message);
    if (!user) return;
    setBusy(true);
    const items = cart.map((i) => ({ id: i.product.id, title: i.product.title, image_url: i.product.image_url, price: i.product.price, quantity: i.quantity }));
    const { error } = await supabase.from("orders").insert({ ...r.data, items, total: price, user_id: user.id });
    if (!error) await supabase.from("cart_items").delete().eq("user_id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["cart"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    toast.success("Order placed successfully!");
    navigate({ to: "/orders" });
  };

  const field = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input {...props} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </label>
  );

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[1fr_340px]">
      <div className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
        <h1 className="text-xl font-bold">Delivery address</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("full_name", "Full name")}
          {field("phone", "Mobile number", { inputMode: "numeric", maxLength: 10 })}
        </div>
        {field("address", "Address (house no, street, area, city)")}
        {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6 })}
        <div className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">Payment: <b>Cash on Delivery</b></div>
      </div>
      <Summary mrp={mrp} price={price}>
        <button disabled={busy} className="w-full rounded-lg bg-cta py-3 font-bold text-cta-foreground disabled:opacity-60">{busy ? "Placing order…" : "Confirm Order"}</button>
      </Summary>
    </form>
  );
}
