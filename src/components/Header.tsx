import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, User, Package, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";
import { useCart, useCategories } from "@/lib/store";

export function Header() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: cart } = useCart();
  const { data: cats } = useCategories();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const count = cart?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand-gradient text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:gap-6">
          <Link to="/" className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-extrabold tracking-tight">A4MP</span>
            <span className="text-xs font-semibold italic text-accent">Plus</span>
          </Link>
          <div className="order-last flex w-full flex-1 md:order-none">
            <form
              className="flex w-full items-center rounded-lg bg-card px-3 shadow-card"
              onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } }); }}
            >
              <Search className="h-4 w-4 text-primary" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </form>
          </div>
          <nav className="ml-auto flex items-center gap-1 md:ml-0">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary-foreground/10">
                    <Shield className="h-4 w-4" /> <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <Link to="/orders" className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary-foreground/10">
                  <Package className="h-4 w-4" /> <span className="hidden sm:inline">Orders</span>
                </Link>
                <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary-foreground/10">
                  <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 rounded-md bg-card px-4 py-2 text-sm font-semibold text-primary">
                <User className="h-4 w-4" /> Login
              </Link>
            )}
            <Link to="/cart" className="relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary-foreground/10">
              <ShoppingCart className="h-5 w-5" /> <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -top-0.5 left-6 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{count}</span>
              )}
            </Link>
          </nav>
        </div>
      </div>
      <div className="border-b bg-card">
        <div className="scrollbar-none mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-2 text-sm font-medium">
          {cats?.map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="whitespace-nowrap text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
