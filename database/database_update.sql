-- 1. Create Mandi Rates Table
CREATE TABLE IF NOT EXISTS public.mandi_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  variety TEXT NOT NULL,
  price_per_quintal NUMERIC NOT NULL,
  price_change NUMERIC DEFAULT 0,
  min_price NUMERIC,
  max_price NUMERIC,
  moisture_standard TEXT,
  market_status TEXT DEFAULT 'Stable', -- Bullish, Bearish, Stable
  description TEXT,
  emoji TEXT DEFAULT '🌾',
  historical_prices JSONB DEFAULT '[]'::jsonb, -- Array of last 7 days' prices for sparklines
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.mandi_rates ENABLE ROW LEVEL SECURITY;

-- 3. Setup RLS Policies (anyone can read, authenticated admins can write)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mandi_rates' AND policyname = 'Mandi rates are viewable by everyone'
  ) THEN
    CREATE POLICY "Mandi rates are viewable by everyone" ON public.mandi_rates 
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mandi_rates' AND policyname = 'Admins can insert mandi rates'
  ) THEN
    CREATE POLICY "Admins can insert mandi rates" ON public.mandi_rates 
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mandi_rates' AND policyname = 'Admins can update mandi rates'
  ) THEN
    CREATE POLICY "Admins can update mandi rates" ON public.mandi_rates 
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mandi_rates' AND policyname = 'Admins can delete mandi rates'
  ) THEN
    CREATE POLICY "Admins can delete mandi rates" ON public.mandi_rates 
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
      );
  END IF;
END
$$;

-- 4. Seed initial records if table is empty
INSERT INTO public.mandi_rates (crop_name, variety, price_per_quintal, price_change, min_price, max_price, moisture_standard, market_status, description, emoji, historical_prices)
SELECT 'Chilli (మిర్చి)', 'Guntur Teja (S17)', 18500, 250, 18000, 18800, '< 10%', 'Bullish', 'High export demand from China and Southeast Asia. Grade-A cold storage stocks are drawing premium rates in Guntur Yard.', '🌶️', '[18100, 18200, 18150, 18300, 18350, 18250, 18500]'
WHERE NOT EXISTS (SELECT 1 FROM public.mandi_rates WHERE crop_name = 'Chilli (మిర్చి)');

INSERT INTO public.mandi_rates (crop_name, variety, price_per_quintal, price_change, min_price, max_price, moisture_standard, market_status, description, emoji, historical_prices)
SELECT 'Cotton (పత్తి)', 'Bunny / Brahma', 7600, -100, 7400, 7800, '< 8%', 'Bearish', 'Staple length averaging 29-30mm. Price slightly soft due to high moisture arrivals in early morning transactions.', '🌾', '[7800, 7750, 7700, 7650, 7700, 7700, 7600]'
WHERE NOT EXISTS (SELECT 1 FROM public.mandi_rates WHERE crop_name = 'Cotton (పత్తి)');

INSERT INTO public.mandi_rates (crop_name, variety, price_per_quintal, price_change, min_price, max_price, moisture_standard, market_status, description, emoji, historical_prices)
SELECT 'Paddy (వరి)', 'Sona Masuri (BPT 5204)', 2800, 50, 2700, 2900, '< 14%', 'Stable', 'Superfine variety showing strong domestic consumption pull. Millers actively procuring dry, high-yield grain bags.', '🍚', '[2750, 2760, 2750, 2780, 2790, 2780, 2800]'
WHERE NOT EXISTS (SELECT 1 FROM public.mandi_rates WHERE crop_name = 'Paddy (వరి)');
