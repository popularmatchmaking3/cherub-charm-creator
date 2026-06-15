# Demo Plan: Notes Table + Migration

Aapne bola tha — proof chahiye ki main khud migration run karta hun, sirf SQL likh ke nahi deta. To ye chhota demo karunga jisse aap khud Supabase dashboard me ja ke verify kar sako.

## Kya banega

Ek `notes` table jisme har user apne notes save kar sake — proper security ke saath (RLS).

**Table structure:**
- `id` (uuid, primary key)
- `user_id` (uuid, auth.users se linked)
- `title` (text)
- `content` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Security (RLS policies):**
- User sirf apne notes dekh sakta hai
- User sirf apne notes create / update / delete kar sakta hai
- Auto `updated_at` trigger

**Grants:**
- `authenticated` role ko SELECT/INSERT/UPDATE/DELETE
- `service_role` ko full access

## Steps (jo MAIN karunga, aap nahi)

1. **Migration file likhunga** — `CREATE TABLE` + GRANTs + RLS enable + 4 policies + trigger
2. **Migration tool se run karunga** aapke connected Supabase pe — confirmation aapko dikhega
3. **Verify** — aap Supabase dashboard → Table Editor me ja ke `notes` table dekh sakte ho, aur Authentication → Policies me 4 RLS policies dekh sakte ho

## UI (optional, is plan me nahi)

Is plan me sirf **backend proof** hai — table + migration. UI (notes likhne ka form, list dikhana, auth page) baad me alag step me banayenge agar aap bolo. Pehle aapko prove karna hai ki migration kaam karti hai.

## Aapko kya karna hai

Kuch nahi — bas "Implement plan" dabao. Main migration tool call karunga, aap approve karoge (ek click), aur table ban jayegi. Phir aap dashboard me khud check karna.

Ready ho to approve karo.