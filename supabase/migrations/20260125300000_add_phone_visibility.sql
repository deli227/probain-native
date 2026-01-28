-- Migration: Add phone visibility feature for rescuer profiles
-- This allows rescuers to share their phone number with establishments

-- Add phone column to profiles table (reusable for all user types)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add phone_visible toggle to rescuer_profiles (specific to rescuers)
ALTER TABLE rescuer_profiles ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.phone IS 'Phone number of the user';
COMMENT ON COLUMN rescuer_profiles.phone_visible IS 'Whether the phone number is visible to establishments';
