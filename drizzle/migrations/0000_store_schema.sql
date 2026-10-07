CREATE TABLE public.categories (
  slug text PRIMARY KEY,
  name text NOT NULL,
  image_url text NOT NULL,
  sort int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  brand text NOT NULL,
  description text NOT NULL,
  category_slug text NOT NULL REFERENCES public.categories(slug),
  price int NOT NULL,
  mrp int NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 4.2,
  rating_count int NOT NULL DEFAULT 0,
  image_url text NOT NULL,
  highlights text[] NOT NULL DEFAULT '{}',
  stock int NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own cart select" ON public.cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own cart insert" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own cart update" ON public.cart_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own cart delete" ON public.cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  items jsonb NOT NULL,
  total int NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  pincode text NOT NULL,
  status text NOT NULL DEFAULT 'Confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orders select" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

INSERT INTO public.categories (slug, name, image_url, sort) VALUES
('mobiles','Mobiles','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',1),
('electronics','Electronics','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',2),
('fashion','Fashion','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',3),
('footwear','Footwear','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',4),
('home','Home & Furniture','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',5),
('beauty','Beauty','https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',6),
('accessories','Accessories','https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',7),
('books','Books','https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',8);

INSERT INTO public.products (title, brand, description, category_slug, price, mrp, rating, rating_count, image_url, highlights) VALUES
('iPhone 15 Pro (Natural Titanium, 256 GB)','Apple','Titanium design, A17 Pro chip and a pro camera system for stunning photos.','mobiles',129900,144900,4.7,18234,'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',ARRAY['6.1 inch Super Retina XDR','48MP Main Camera','A17 Pro Chip','USB-C']),
('Galaxy S24 Ultra (Titanium Black, 512 GB)','Samsung','Galaxy AI, built-in S Pen and a 200MP camera.','mobiles',119999,139999,4.6,9821,'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',ARRAY['6.8 inch QHD+ Display','200MP Camera','5000 mAh Battery','S Pen included']),
('Wireless Over-Ear Headphones','Sony','Industry-leading noise cancellation with 30 hours battery life.','electronics',24990,34990,4.5,6540,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',ARRAY['Active Noise Cancellation','30 Hr Battery','Quick Charge','Bluetooth 5.2']),
('MacBook Air M3 (13 inch, 16 GB, 512 GB)','Apple','Superlight laptop with all-day battery and the M3 chip.','electronics',134900,149900,4.8,4211,'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',ARRAY['Apple M3 Chip','16 GB Unified Memory','18 Hr Battery','Liquid Retina Display']),
('Mirrorless Camera with 15-45mm Lens','Canon','24.1MP sensor, 4K video and fast autofocus for creators.','electronics',58990,67995,4.4,2108,'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',ARRAY['24.1 MP APS-C','4K Video','Wi-Fi & Bluetooth','Dual Pixel AF']),
('Wireless Earbuds Pro','Apple','Adaptive audio, transparency mode and personalised spatial audio.','electronics',22900,26900,4.6,15320,'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80',ARRAY['Active Noise Cancellation','MagSafe Case','6 Hr Playback','Water Resistant']),
('Wireless Game Controller','Sony','Haptic feedback and adaptive triggers for immersive gameplay.','electronics',5490,6390,4.5,8712,'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',ARRAY['Haptic Feedback','Adaptive Triggers','Built-in Mic','USB-C Charging']),
('55 inch 4K Ultra HD Smart TV','LG','Vivid 4K picture with smart AI processor and Dolby Audio.','electronics',42990,64990,4.3,5402,'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',ARRAY['4K UHD','HDR10','WebOS Smart TV','20W Speakers']),
('Classic Crew Neck Cotton T-Shirt','Levi''s','Soft 100% cotton tee for everyday comfort.','fashion',799,1599,4.2,23011,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',ARRAY['100% Cotton','Regular Fit','Machine Wash','Crew Neck']),
('Genuine Leather Biker Jacket','Roadster','Premium leather jacket with a timeless biker silhouette.','fashion',4999,9999,4.3,1876,'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',ARRAY['Genuine Leather','Zip Closure','Slim Fit','Inner Lining']),
('Floral Summer Maxi Dress','Zara','Flowy maxi dress with a soft floral print.','fashion',2499,3999,4.4,3290,'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',ARRAY['Viscose Fabric','Maxi Length','Flared Fit','Hand Wash']),
('Air Max Running Shoes (Red)','Nike','Responsive cushioning for runs and everyday wear.','footwear',8495,10995,4.5,12045,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',ARRAY['Air Cushioning','Mesh Upper','Rubber Outsole','Lace-up']),
('Classic White Leather Sneakers','Puma','Clean white sneakers that go with everything.','footwear',3299,5999,4.3,7621,'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',ARRAY['Synthetic Leather','Cushioned Insole','Lightweight','Casual Wear']),
('3-Seater Fabric Sofa (Grey)','Wakefit','Plush, sturdy 3-seater sofa for modern living rooms.','home',24999,45999,4.4,1520,'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',ARRAY['Solid Wood Frame','High Density Foam','3 Seater','Easy Assembly']),
('Mid-Century Accent Chair','Urban Ladder','Elegant wooden accent chair with comfortable seat.','home',8999,14999,4.2,640,'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80',ARRAY['Solid Wood','Ergonomic','Modern Design','Durable Finish']),
('Modern Table Lamp','Philips','Warm ambient light with a minimal design.','home',1899,2999,4.1,2210,'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',ARRAY['Warm White LED','Fabric Shade','Energy Efficient','Inline Switch']),
('Hydrating Skincare Gift Set','The Derma Co','Complete routine for glowing, hydrated skin.','beauty',1299,1999,4.3,5432,'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80',ARRAY['Serum + Moisturizer','Dermatologist Tested','All Skin Types','Paraben Free']),
('Eau de Parfum 100ml','Bvlgari','Long-lasting luxury fragrance with woody notes.','beauty',6499,8500,4.5,1980,'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',ARRAY['100 ml','Long Lasting','Woody Notes','Unisex']),
('Minimalist Analog Watch','Fossil','Timeless analog watch with leather strap.','accessories',7995,11995,4.4,4310,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',ARRAY['Leather Strap','Water Resistant','Quartz Movement','2 Yr Warranty']),
('Polarized Aviator Sunglasses','Ray-Ban','Iconic aviators with UV protection.','accessories',6890,8590,4.5,6011,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',ARRAY['Polarized Lens','100% UV Protection','Metal Frame','Includes Case']),
('Travel Laptop Backpack 30L','Wildcraft','Water-resistant backpack with padded laptop sleeve.','accessories',1799,3499,4.3,9870,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',ARRAY['30 L Capacity','Fits 15.6 inch Laptop','Water Resistant','Padded Straps']),
('Bestseller Fiction Collection (Set of 5)','Penguin','Five award-winning novels in one box set.','books',1499,2495,4.6,3120,'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',ARRAY['Paperback','5 Books','English','Box Set']);