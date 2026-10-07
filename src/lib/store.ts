import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./auth";

export type Product = Tables<"products">;
export type Category = Tables<"categories">;

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const discount = (p: Pick<Product, "price" | "mrp">) => Math.round(((p.mrp - p.price) / p.mrp) * 100);

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });
}

export function useProducts(opts: { category?: string | undefined; search?: string | undefined } = {}) {
  return useQuery({
    queryKey: ["products", opts],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("rating_count", { ascending: false });
      if (opts.category) q = q.eq("category_slug", opts.category);
      if (opts.search) q = q.or(`title.ilike.%${opts.search}%,brand.ilike.%${opts.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCart() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(*)")
        .order("created_at");
      if (error) throw error;
      return data as { id: string; quantity: number; product: Product }[];
    },
  });
}

export function useCartActions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const refresh = () => qc.invalidateQueries({ queryKey: ["cart"] });

  const add = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("login");
      const { data: existing } = await supabase
        .from("cart_items").select("id, quantity").eq("product_id", productId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({ product_id: productId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { refresh(); toast.success("Added to cart"); },
    onError: (e) => {
      if (e.message === "login") { toast("Please login to continue"); navigate({ to: "/auth" }); }
      else toast.error(e.message);
    },
  });

  const setQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = quantity < 1
        ? await supabase.from("cart_items").delete().eq("id", id)
        : await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { add, setQty };
}
