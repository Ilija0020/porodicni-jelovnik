# Porodični Jelovnik — Implementation Guide for Smaller Models

> Ovaj fajl je namenjen modelima tipa `5.4mini`: konkretan, eksplicitan, bez pretpostavki. Ako implementiraš task, prvo pročitaj ovaj fajl, zatim `APP_OVERVIEW.md`, `BACKLOG.md` i aktivni sprint fajl.

## 0. Najvažnija pravila

1. **Ne pogađaj arhitekturu.** Ako odluka nije u dokumentaciji, dodaj pitanje u sprint fajl ili pitaj korisnika.
2. **Ne prikazuj tajne.** Nikad ne ispisuj Supabase/Vercel/GitHub tokene ili env vrednosti u chat ili dokumente.
3. **Ne zaobilazi RLS.** Frontend guard nije security. Supabase policies/funkcije su izvor sigurnosti.
4. **Jedna kartica = jedan mali feature.** Ne mešaj više P0 kartica u jednom commitu osim ako korisnik izričito kaže.
5. Posle svake izmene pokreni:

```bash
npm run lint
npm run build
```

6. Posle svake kartice ažuriraj `docs/BACKLOG.md` i `docs/sprints/SPRINT-001.md`.

## 1. Projekat i komande

Root projekta:

```text
C:\Users\ILIJA\Projects\porodicni-jelovnik
```

Najčešće komande:

```bash
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
```

Git:

```bash
git status --short
git diff --stat
git add <files>
git commit -m "feat: short description"
git push origin main
```

## 2. Fajl mapa

```text
src/main.tsx                 # React entrypoint
src/App.tsx                  # Auth session, loading app data, routes, global state
src/supabaseClient.ts        # Supabase client, koristi VITE_* env varijable
src/components/Layout.tsx    # Header, mobile nav, logout, household badge
src/components/Layout.css    # Stilovi za layout/nav
src/pages/LoginPage.tsx      # Login/register UI, invite code pri registraciji
src/pages/Dashboard.tsx      # Nedeljni jelovnik
src/pages/FamilyPage.tsx     # Nutritivni family member profili
src/pages/ShoppingList.tsx   # Lista za nabavku
src/pages/AdminPage.tsx      # Trenutno recipe management; kasnije odvojiti od pravog /admin panela
src/types.ts                 # Centralni frontend tipovi
src/services/dataService.ts  # Supabase data access layer i camelCase <-> snake_case mapiranje
src/data/mockData.ts         # Seed podaci za nova domaćinstva
src/utils/calculator.ts      # Kalorijski proračuni
supabase/schema.sql          # Referentna schema za buduće rebuild-e
supabase/migrations/*.sql    # Primarne migracije koje su aplicirane na Supabase
supabase/seed.sql            # Seed recepti / family / menu
docs/APP_OVERVIEW.md         # Product + arhitektura + odluke
docs/IMPLEMENTATION_GUIDE.md # Ovaj fajl: konkretne instrukcije za implementaciju
docs/BACKLOG.md              # Kartice za rad
docs/sprints/SPRINT-001.md   # Aktivni sprint log
```

## 3. Trenutni auth i app loading flow

`src/App.tsx` radi sledeće:

1. Poziva `supabase.auth.getSession()`.
2. Sluša `supabase.auth.onAuthStateChange()`.
3. Ako nema session-a, prikazuje `LoginPage`.
4. Ako ima session, poziva `dataService.getAppData(session)`.
5. `dataService.getAppData(session)`:
   - osigurava household preko `get_or_create_household`
   - učitava household
   - učitava family members
   - učitava recipes
   - učitava weekly menu
6. Ako je household prazan, `App.tsx` seeduje default podatke iz `mockData.ts`, ali sa ID prefiksom od household ID-ja.

Bitna funkcija u `App.tsx`:

```ts
function seedDataForHousehold(householdId: string) { ... }
```

Zašto postoji: isti mock recipe ID-jevi `r1`, `r2` bi pravili konflikt između porodica. Zato se prefixuju, npr. `253cc0f8-r1`.

## 4. TypeScript tipovi

Ne uvodi lokalne duplikate tipova ako već postoje u `src/types.ts`.

Postojeći union tipovi:

```ts
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ActivityLevel = 1 | 2 | 3 | 4 | 5;
export type WeightGoal = -500 | -300 | -200 | 0 | 200 | 300 | 500;
export type IngredientCategory = 'meat' | 'vegetables' | 'dairy' | 'grains' | 'spices' | 'fruit' | 'other';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type Difficulty = 'easy' | 'medium' | 'hard';
```

Planirani novi tipovi:

```ts
export type AppRole = 'user' | 'admin';
export type HouseholdRole = 'owner' | 'member' | 'read-only';
export type RecipeScope = 'global' | 'household';
export type RecipeStatus = 'active' | 'archived';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type SuggestionType = 'new_global' | 'edit_global';
```

## 5. Supabase naming convention

Frontend koristi camelCase. Supabase koristi snake_case. Uvek mapiraj u `src/services/dataService.ts`, ne po komponentama.

| Frontend | Supabase |
|---|---|
| `weightKg` | `weight_kg` |
| `heightCm` | `height_cm` |
| `activityLevel` | `activity_level` |
| `dailyCalories` | `daily_calories` |
| `mealType` | `meal_type` |
| `prepTimeMin` | `prep_time_min` |
| `standardProteinG` | `standard_protein_g` |
| `standardCarbsG` | `standard_carbs_g` |
| `standardFatG` | `standard_fat_g` |
| `standardFiberG` | `standard_fiber_g` |
| `imageUrl` | `image_url` |
| `youtubeUrl` | `youtube_url` |
| `inviteCode` | `invite_code` |
| `appRole` | `app_role` |
| `isDeactivated` | `is_deactivated` |

## 6. Supabase security model

Tabele koje već postoje:

```text
household
household_members
profiles
family_members
recipes
recipe_ingredients
recipe_steps
weekly_menu
```

Ključne funkcije:

```sql
public.generate_household_invite_code()
public.is_household_member(target_household_id uuid)
public.is_household_owner(target_household_id uuid)
public.get_or_create_household(invite_code_input text)
public.is_app_admin()
```

RLS pravila:

- Household podaci moraju biti vidljivi samo članovima tog household-a.
- Admin role ne znači automatski član svake porodice; za admin panele treba posebna policies logika.
- Globalni recepti će biti izuzetak: vidljivi svim authenticated korisnicima, menjaju ih samo admini.

## 7. Kako dodati novu Supabase funkciju

1. Kreiraj novu migraciju u `supabase/migrations/` sa timestamp imenom.
2. U migraciji definiši funkciju kao `SECURITY DEFINER` samo ako stvarno mora da zaobiđe RLS za kontrolisanu akciju.
3. Uvek dodaj `SET search_path = public`.
4. Uvek proveri `auth.uid()` gde je potrebno.
5. Grantuj samo potrebnu funkciju:

```sql
GRANT EXECUTE ON FUNCTION public.some_function(...) TO authenticated;
```

6. Ažuriraj `supabase/schema.sql` da referentna schema ne zaostaje.
7. Ažuriraj `docs/APP_OVERVIEW.md` ako funkcija menja product pravila.

## 8. Kako dodati novi frontend feature

1. Ako feature uvodi nove podatke, dodaj tipove u `src/types.ts`.
2. Dodaj metode u `src/services/dataService.ts`. Komponente ne treba direktno da pišu komplikovane Supabase upite.
3. Ako je stranica nova, napravi je u `src/pages/`.
4. Rute se dodaju u `src/App.tsx`.
5. Navigacija se dodaje u `src/components/Layout.tsx` i `Layout.css`.
6. Uvek pokreni `npm run lint` i `npm run build`.

Dobar pattern:

```ts
await dataService.regenerateInviteCode(household.id)
```

Loš pattern:

```ts
await supabase.from('household').update(...)
```

po svakoj komponenti.

## 9. Feature recipe: Forgot password

### Cilj

Dodati reset lozinke bez otkrivanja da li email postoji.

### Fajlovi

```text
Modify: src/pages/LoginPage.tsx
Create: src/pages/ResetPasswordPage.tsx
Modify: src/App.tsx
```

### Implementacija

U `LoginPage.tsx` dodati state:

```ts
const [isResetMode, setIsResetMode] = useState(false);
const [resetEmail, setResetEmail] = useState('');
```

Za slanje reset email-a koristiti:

```ts
await supabase.auth.resetPasswordForEmail(resetEmail, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

Poruka korisniku mora uvek biti neutralna:

```text
Ako nalog postoji, poslali smo email sa instrukcijama.
```

Ne prikazivati `User not found`.

`ResetPasswordPage.tsx` treba da koristi:

```ts
await supabase.auth.updateUser({ password: newPassword });
```

Ruta u `App.tsx` mora omogućiti `/reset-password` i kada session postoji iz recovery linka.

## 10. Feature recipe: Account settings

### Cilj

Korisnik vidi i upravlja svojim nalogom.

### Fajlovi

```text
Create: src/pages/AccountSettingsPage.tsx
Modify: src/App.tsx
Modify: src/components/Layout.tsx
Modify: src/components/Layout.css
Modify: src/services/dataService.ts
Modify: src/types.ts
```

### Potrebni tipovi

```ts
export type AppRole = 'user' | 'admin';
export type HouseholdRole = 'owner' | 'member' | 'read-only';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  appRole: AppRole;
  isDeactivated: boolean;
}

export interface HouseholdMemberAccount {
  id: string;
  householdId: string;
  userId: string;
  email: string;
  role: HouseholdRole;
}
```

### Data service metode

```ts
getCurrentProfile(): Promise<UserProfile>
getCurrentHouseholdMembership(householdId: string): Promise<HouseholdMemberAccount>
```

### UI zahtevi

Stranica prikazuje:

- email
- app role, samo ako je admin ili za debug
- household role
- dugme za logout
- sekcija `Opasna zona` sa deaktivacijom naloga, ali može biti disabled dok backend funkcija ne postoji

## 11. Feature recipe: Family settings

### Cilj

Owner/member mogu upravljati porodicom u skladu sa pravilima.

### Fajlovi

```text
Create: src/pages/FamilySettingsPage.tsx
Modify: src/App.tsx
Modify: src/components/Layout.tsx
Modify: src/services/dataService.ts
Modify: src/types.ts
Create: supabase/migrations/<timestamp>_family_settings_functions.sql
Modify: supabase/schema.sql
```

### Backend funkcije koje treba napraviti

```sql
public.regenerate_household_invite_code(target_household_id uuid)
public.transfer_household_ownership(target_household_id uuid, new_owner_user_id uuid)
public.leave_household(target_household_id uuid)
public.remove_household_member(target_household_id uuid, target_user_id uuid)
```

### Security pravila

- Samo owner može regenerisati invite kod.
- Samo owner može izbaciti drugog member-a.
- Member može izbaciti samo sebe.
- Owner ne može napustiti household ako postoje drugi članovi bez transfera.
- Ne sme postojati household bez owner-a.

## 12. Feature recipe: Admin panel shell

### Cilj

Napraviti `/admin` koji vidi samo globalni admin.

### Fajlovi

```text
Create: src/pages/AdminDashboardPage.tsx
Modify: src/App.tsx
Modify: src/components/Layout.tsx
Modify: src/services/dataService.ts
Modify: src/types.ts
```

### Pravila

- `prekoapp@gmail.com` je admin preko `profiles.app_role = 'admin'`.
- Ne hardkodovati email u frontend kao jedini security mehanizam.
- Frontend može sakriti link, ali Supabase RLS/funkcije moraju štititi podatke.

### UI prve verzije

Admin vidi kartice:

```text
Globalni recepti
Predlozi recepata
Korisnici
Porodice
Audit log
```

Kartice mogu biti placeholder dok se ne implementiraju podstranice.

## 13. Feature recipe: Globalni vs porodični recepti

### DB migracija

```sql
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'household' CHECK (scope IN ('global', 'household'));
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'));
```

RLS koncept:

- `scope = 'global'`: SELECT za authenticated.
- `scope = 'global'`: INSERT/UPDATE/DELETE samo admin.
- `scope = 'household'`: SELECT/INSERT/UPDATE/DELETE za household members.

Frontend promene:

```ts
scope: RecipeScope;
status: RecipeStatus;
createdBy?: string;
sourceRecipeId?: string;
```

`dataService.getRecipes(householdId)` treba da vrati:

- sve active global recepte
- sve active household recepte za taj household

## 14. Feature recipe: Recipe suggestions

### DB tabela

```sql
CREATE TABLE recipe_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES household(id) ON DELETE SET NULL,
  source_recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('new_global', 'edit_global')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payload JSONB NOT NULL,
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Payload treba da bude camelCase jer dolazi iz frontend forme.

## 15. Feature recipe: Audit log

### DB tabela

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  household_id UUID REFERENCES household(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Prve akcije:

```text
invite_code_regenerated
owner_transferred_ownership
member_removed
member_left_household
account_deactivated
household_soft_deleted
admin_promoted_recipe_to_global
recipe_suggestion_approved
recipe_suggestion_rejected
```

## 16. Kako završiti task

Na kraju svake kartice:

1. Pokreni `npm run lint` i `npm run build`.
2. Ažuriraj `docs/BACKLOG.md`.
3. Ažuriraj `docs/sprints/SPRINT-001.md`.
4. Commit:

```bash
git add <files>
git commit -m "feat: implement <card name>"
```

5. Push:

```bash
git push origin main
```
