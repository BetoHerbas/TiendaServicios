import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://rcfrunlbyxspinzeumht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJ1bmxieXhzcGluemV1bWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTkxNTksImV4cCI6MjA3OTU5NTE1OX0.r3mjVH_x7BXfgKPz8H5_u0H-5vY6hXxBYMxi_ul4CoI';

export const supabase = createClient(supabaseUrl, supabaseKey);
