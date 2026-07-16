-- =======================================================
-- Salespersons & Commission Database Setup
-- Run this in your Supabase SQL Editor
-- =======================================================

-- 1. Create sales_persons table
CREATE TABLE IF NOT EXISTS public.sales_persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_person_id TEXT UNIQUE NOT NULL, -- e.g. SP4928
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL, -- Mobile Number
  referral_code TEXT UNIQUE NOT NULL, -- e.g. SRIN3210
  commission_earned NUMERIC DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Add salesperson tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sales_person_id UUID REFERENCES public.sales_persons(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sales_person_commission NUMERIC DEFAULT 0.00 NOT NULL;

-- 3. Seed 'Bio Products' category if not exists
INSERT INTO public.categories (name, slug, description)
SELECT 'Bio Products', 'bio-products', 'Organic & biological protectants / growth promoters'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'bio-products');

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.sales_persons ENABLE ROW LEVEL SECURITY;

-- 5. Setup RLS Policies
-- Allow anyone (including guests/customers at checkout) to view salesperson records to verify referral codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales_persons' AND policyname = 'Sales persons are viewable by everyone'
  ) THEN
    CREATE POLICY "Sales persons are viewable by everyone" ON public.sales_persons
      FOR SELECT USING (true);
  END IF;

  -- Allow authenticated admins to perform all operations (CRUD) on salespersons
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales_persons' AND policyname = 'Admins can manage sales persons'
  ) THEN
    CREATE POLICY "Admins can manage sales persons" ON public.sales_persons
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
      );
  END IF;
END
$$;
