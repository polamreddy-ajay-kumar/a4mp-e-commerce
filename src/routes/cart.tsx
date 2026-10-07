import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { inr, useCart, useCartActions } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "My Cart — A4MP" },
      { name: "description", content: "Review items in your A4MP cart and checkout securely." },
      { property: "og:title", content: "My Cart — A4MP" },
      { property: "og:description", content: "Review items in your A4MP cart." },
    ],
  }),
  component: CartPage,
});

export function Summary({ mrp, price, children }: { mrp: number; price: number; children?: React.ReactNode }) {
  return (
    <aside className="h-fit space-y-3 rounded-2xl bg-card p-5 shadow-card md:sticky md:top-32">
      <h2 className="border-b pb-3 font-sans text-sm font-bold uppercase text-muted-foreground">Price details</h2>
      <div className="flex justify-between text-sm"><span>Price</span><span>{inr(mrp)}</span></div>
      <div className="flex justify-between text-sm"><span>Discount</span><span className="text-success">− {inr(mrp - price)}</span></div>
      <div className="flex justify-between text-sm"><span>Delivery</span><span className="text-success">FREE</span></div>
      <div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{inr(price)}</span></div>
      <p className="text-sm font-semibold text-success">You save {inr(mrp - price)} on this order</p>
      {children}
    </aside>
  );
}

function CartPage() {
  const { user, loading } = useAuth();
  const { data: cart, isLoading } = useCart();
  const { setQty } = useCartActions();

  if (!loading && !user)
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is waiting</h1>
        <p className="mt-2 text-muted-foreground">Login to see items you added.</p>
        <Link to="/auth" className="mt-6 inline-flex rounded-lg bg-cta px-8 py-3 font-bold text-cta-foreground">Login</Link>
      </div>
    );
  if (isLoading || loading) return <div className="mx-auto my-6 h-64 max-w-7xl animate-pulse rounded-2xl bg-card" />;
  if (!cart?.length)
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-8 py-3 font-bold text-primary-foreground">Shop now</Link>
      </div>
    );

  const mrp = cart.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
  const price = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[1fr_340px]">
      <div className="divide-y rounded-2xl bg-card shadow-card">
        {cart.map((i) => (
          <div key={i.id} className="flex gap-4 p-4">
            <Link to="/product/$id" params={{ id: i.product.id }}>
              <img src={i.product.image_url} alt={i.product.title} className="h-24 w-24 rounded-lg object-cover" />
            </Link>
            <div className="flex flex-1 flex-col gap-1">
              <p className="line-clamp-2 text-sm font-medium">{i.product.title}</p>
              <p className="text-xs text-muted-foreground">{i.product.brand}</p>
              <p className="flex items-baseline gap-2"><b>{inr(i.product.price)}</b><span className="text-xs text-muted-foreground line-through">{inr(i.product.mrp)}</span></p>
              <div className="mt-auto flex items-center gap-3">
                <div className="flex items-center rounded-full border">
                  <button aria-label="Decrease" onClick={() => setQty.mutate({ id: i.id, quantity: i.quantity - 1 })} className="p-1.5"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                  <button aria-label="Increase" onClick={() => setQty.mutate({ id: i.id, quantity: i.quantity + 1 })} className="p-1.5"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <button onClick={() => setQty.mutate({ id: i.id, quantity: 0 })} className="flex items-center gap-1 text-xs font-semibold text-destructive"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Summary mrp={mrp} price={price}>
        <Link to="/checkout" className="block rounded-lg bg-cta py-3 text-center font-bold text-cta-foreground">Place Order</Link>
      </Summary>
    </div>
  );
}
