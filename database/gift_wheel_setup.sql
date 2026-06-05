-- ==========================================
-- 3D Lucky Wheel & Voucher Pool Database Setup
-- ==========================================

-- 1. Create campaign_vouchers table
CREATE TABLE IF NOT EXISTS public.campaign_vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL DEFAULT 'first_order_wheel',
  code TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_by_user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.campaign_vouchers ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
-- Only authenticated users can read their own claimed vouchers
-- Admins can view/edit everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaign_vouchers' AND policyname = 'Users can view their own claimed vouchers'
  ) THEN
    CREATE POLICY "Users can view their own claimed vouchers" ON public.campaign_vouchers
      FOR SELECT USING (auth.uid() = claimed_by_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'campaign_vouchers' AND policyname = 'Admins can manage vouchers'
  ) THEN
    CREATE POLICY "Admins can manage vouchers" ON public.campaign_vouchers
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
      );
  END IF;
END
$$;

-- 2. Create function to generate a random voucher code
CREATE OR REPLACE FUNCTION public.generate_voucher_code(prefix TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN prefix || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- 3. Stored procedure to seed the campaign vouchers pool (100 total: 90 low, 10 high)
CREATE OR REPLACE FUNCTION public.seed_first_order_wheel_campaign() 
RETURNS VOID AS $$
DECLARE
  i INT;
  val NUMERIC;
  cnt INT;
BEGIN
  -- Count current vouchers for the campaign
  SELECT COUNT(*) INTO cnt FROM public.campaign_vouchers WHERE campaign_name = 'first_order_wheel';
  
  -- Seed only if campaign hasn't been seeded yet
  IF cnt = 0 THEN
    -- Seed 90 vouchers with amounts between ₹20 and ₹100
    FOR i IN 1..90 LOOP
      val := floor(random() * (100 - 20 + 1) + 20);
      INSERT INTO public.campaign_vouchers (code, amount, campaign_name) 
      VALUES (public.generate_voucher_code('WELCOME'), val, 'first_order_wheel');
    END LOOP;

    -- Seed 10 vouchers with amounts between ₹101 and ₹250
    FOR i IN 1..10 LOOP
      val := floor(random() * (250 - 101 + 1) + 101);
      INSERT INTO public.campaign_vouchers (code, amount, campaign_name) 
      VALUES (public.generate_voucher_code('LUCKY'), val, 'first_order_wheel');
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Run the seeder
SELECT public.seed_first_order_wheel_campaign();

-- 4. Allocation database function to claim a voucher securely
CREATE OR REPLACE FUNCTION public.claim_first_order_voucher(user_uuid UUID)
RETURNS TABLE (voucher_code TEXT, voucher_amount INT) AS $$
DECLARE
  order_count INT;
  already_claimed INT;
  selected_id UUID;
  sel_code TEXT;
  sel_amount INT;
BEGIN
  -- Verify user exists and is eligible (0 orders)
  SELECT COUNT(*) INTO order_count FROM public.orders WHERE user_id = user_uuid;
  IF order_count > 0 THEN
    RAISE EXCEPTION 'User has already placed an order and is not eligible.';
  END IF;

  -- Verify user hasn't already claimed a voucher in this campaign
  SELECT COUNT(*) INTO already_claimed 
  FROM public.campaign_vouchers 
  WHERE claimed_by_user_id = user_uuid AND campaign_name = 'first_order_wheel';
  
  IF already_claimed > 0 THEN
    RAISE EXCEPTION 'User has already claimed a campaign voucher.';
  END IF;

  -- Fetch one random unclaimed voucher from the pool
  SELECT id, code, amount::INT INTO selected_id, sel_code, sel_amount
  FROM public.campaign_vouchers
  WHERE is_claimed = FALSE AND campaign_name = 'first_order_wheel'
  ORDER BY RANDOM()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF selected_id IS NULL THEN
    RAISE EXCEPTION 'No vouchers remaining in the pool.';
  END IF;

  -- Mark the voucher as claimed
  UPDATE public.campaign_vouchers
  SET is_claimed = TRUE, 
      claimed_by_user_id = user_uuid, 
      claimed_at = NOW()
  WHERE id = selected_id;

  -- Return the values
  voucher_code := sel_code;
  voucher_amount := sel_amount;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
