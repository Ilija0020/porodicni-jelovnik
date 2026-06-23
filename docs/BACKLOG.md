# Porodični Jelovnik — Backlog

> Radni backlog za implementaciju. Ovaj fajl mora biti dovoljno detaljan da slabiji model (`5.4mini`) može da uzme jednu karticu i implementira je bez dodatnog nagađanja.

## Obavezno pre rada na bilo kojoj kartici

1. Pročitati `docs/APP_OVERVIEW.md`.
2. Pročitati `docs/IMPLEMENTATION_GUIDE.md`.
3. Raditi samo jednu karticu odjednom.
4. Ne menjati product odluke bez ažuriranja `APP_OVERVIEW.md`.
5. Posle implementacije pokrenuti:

```bash
npm run lint
npm run build
```

## Status legenda

- `[ ]` nije započeto
- `[~]` u toku
- `[x]` završeno
- `[!]` blokirano / treba odluka

---

## P0 — sigurnost, nalog, porodica, admin osnova

### [x] P0-001 Account: zaboravljena šifra

**Cilj:** Korisnik može resetovati lozinku preko Supabase email flow-a bez otkrivanja da li email postoji.

**Product odluke:**

- Koristi Supabase reset password flow.
- Poruka uvek neutralna: `Ako nalog postoji, poslali smo email sa instrukcijama.`

**Fajlovi:**

- Modify: `src/pages/LoginPage.tsx`
- Create: `src/pages/ResetPasswordPage.tsx`
- Modify: `src/App.tsx`
- Docs update: `docs/sprints/SPRINT-001.md`

**Implementacioni koraci:**

1. U `LoginPage.tsx` dodati reset mode state.
2. Dodati link/dugme `Zaboravio/la sam lozinku` ispod login forme.
3. U reset mode prikazati input za email i submit dugme.
4. Na submit pozvati `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })`.
5. Uhvatiti greške, ali korisniku prikazati neutralnu poruku.
6. Kreirati `ResetPasswordPage.tsx` sa inputima `newPassword` i `confirmPassword`.
7. Validirati da se lozinke poklapaju i imaju minimum 6 karaktera.
8. Na submit pozvati `supabase.auth.updateUser({ password: newPassword })`.
9. U `App.tsx` dodati rutu `/reset-password`.

**Acceptance criteria:**

- Na login strani postoji link `Zaboravio/la sam lozinku`.
- Submit reset forme ne otkriva da li email postoji.
- Reset stranica se builduje bez TypeScript grešaka.
- `npm run lint` prolazi.
- `npm run build` prolazi.

---

### [ ] P0-002 Account settings

**Cilj:** Korisnik vidi osnovne informacije o nalogu i ima centralno mesto za nalog.

**Fajlovi:**

- Create: `src/pages/AccountSettingsPage.tsx`
- Modify: `src/types.ts`
- Modify: `src/services/dataService.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/components/Layout.css`
- Docs update: `docs/sprints/SPRINT-001.md`

**Tipovi za dodavanje u `src/types.ts`:**

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

**Data service metode:**

```ts
getCurrentProfile(): Promise<UserProfile>
getCurrentHouseholdMembership(householdId: string): Promise<HouseholdMemberAccount>
```

**UI:**

- Route: `/account`
- Desktop nav label: `👤 Nalog`
- Mobile nav može imati skraćen label `Nalog`
- Prikazati email, household role, app role ako je admin.
- Dodati logout dugme.
- Dodati `Opasna zona` sa disabled dugmetom za deaktivaciju dok backend funkcija nije gotova.

**Acceptance criteria:**

- Ulogovan korisnik može otvoriti `/account`.
- Prikazuju se email i role.
- Neulogovan korisnik i dalje vidi login.
- `npm run lint` prolazi.
- `npm run build` prolazi.

---

### [ ] P0-003 Family settings

**Cilj:** Stranica za upravljanje domaćinstvom i članovima koji imaju login nalog.

**Fajlovi:**

- Create: `src/pages/FamilySettingsPage.tsx`
- Modify: `src/types.ts`
- Modify: `src/services/dataService.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`
- Create migration: `supabase/migrations/<timestamp>_family_settings_functions.sql`
- Modify: `supabase/schema.sql`
- Docs update: `docs/sprints/SPRINT-001.md`

**Backend funkcije:**

```sql
public.regenerate_household_invite_code(target_household_id uuid)
public.transfer_household_ownership(target_household_id uuid, new_owner_user_id uuid)
public.leave_household(target_household_id uuid)
public.remove_household_member(target_household_id uuid, target_user_id uuid)
```

**Security:**

- Samo owner može regenerisati invite kod.
- Owner može izbaciti member-a.
- Member može izbaciti samo sebe.
- Owner ne može izaći ako postoje drugi članovi bez transfera.
- Ne sme ostati household bez owner-a.

**UI:**

- Route: `/settings/family`
- Prikazati household name i invite code.
- Owner vidi dugme `Regeneriši kod`.
- Lista login članova: email + role.
- Owner vidi `Prebaci ownership` i `Izbaci` za member-e.
- Member vidi `Izađi iz porodice` samo za sebe.

**Acceptance criteria:**

- Owner može regenerisati invite kod.
- Member ne vidi regenerate dugme.
- Owner može videti listu članova.
- `npm run lint` prolazi.
- `npm run build` prolazi.

---

### [ ] P0-004 Ownership transfer

**Cilj:** Owner može bezbedno prebaciti ownership drugom member-u.

**Zavisnost:** Može biti deo P0-003, ali ako je veliko, raditi odvojeno.

**Backend:** koristiti `transfer_household_ownership` funkciju.

**Pravila:**

- Samo trenutni owner može transfer.
- Novi owner mora biti član istog household-a.
- Stari owner postaje member.
- Uvek mora postojati bar jedan owner.

**Acceptance criteria:**

- Posle transfera novi owner vidi owner-only akcije.
- Stari owner više ne vidi owner-only akcije.
- Member ne može pozvati transfer uspešno ni preko frontend-a ni direktno preko Supabase-a.

---

### [ ] P0-005 Soft delete household

**Cilj:** Owner može pokrenuti soft delete porodice na 30 dana.

**DB promene:**

Dodati u `household`:

```sql
deleted_at timestamptz null
delete_scheduled_for timestamptz null
deleted_by uuid references auth.users(id) on delete set null
```

**Backend funkcija:**

```sql
public.soft_delete_household(target_household_id uuid)
```

**Pravila:**

- Samo owner može pokrenuti.
- Ako postoje drugi članovi, mora prvo transfer/uklanjanje prema product pravilima.
- Aktivni app flow ne treba da tretira soft-deleted household kao aktivan.

**Acceptance criteria:**

- Soft delete ne briše odmah podatke.
- `delete_scheduled_for = deleted_at + interval '30 days'`.
- `npm run lint` i `npm run build` prolaze.

---

### [ ] P0-006 Deactivate account

**Cilj:** Korisnik može deaktivirati nalog, shared podaci ostaju porodici.

**DB postojeće:**

- `profiles.is_deactivated` već postoji.

**Potrebna funkcija:**

```sql
public.deactivate_current_account(new_owner_user_id uuid default null)
```

**Pravila:**

- Member deaktivacijom izlazi iz `household_members`.
- Shared podaci ostaju.
- Ako je owner i ima drugih članova, mora izabrati novog owner-a.
- Profil dobija `is_deactivated = true`.

**Acceptance criteria:**

- Deaktiviran user više ne treba normalno koristiti aplikaciju.
- Household ne ostaje bez owner-a.
- Shared recepti/jelovnik ostaju.

---

### [x] P0-007 Profiles + admin role

**Cilj:** Globalni profil i app role sistem.

**Urađeno:**

- Migracija: `supabase/migrations/202606230003_profiles_admin_role.sql`
- Tabela: `profiles`
- Funkcija: `is_app_admin()`
- Admin nalog: `prekoapp@gmail.com`

**Acceptance criteria:**

- `prekoapp@gmail.com` ima `app_role = admin`.
- Novi auth korisnici automatski dobijaju `profiles` red.

---

### [ ] P0-008 Admin panel shell

**Cilj:** Posebna `/admin` ruta za globalnog admina.

**Fajlovi:**

- Create: `src/pages/AdminDashboardPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/services/dataService.ts`
- Modify: `src/types.ts`

**Data service:**

- Iskoristiti `getCurrentProfile()` iz P0-002.
- Helper u frontend-u: `const isAdmin = profile?.appRole === 'admin'`.

**UI:**

- Non-admin ne vidi admin link.
- Non-admin na `/admin` vidi `Nemaš pristup`.
- Admin vidi kartice: globalni recepti, predlozi, korisnici, porodice, audit log.

**Acceptance criteria:**

- Admin nalog vidi `/admin`.
- Običan user ne vidi admin link.
- Direktan odlazak običnog user-a na `/admin` ne prikazuje admin podatke.

---

### [ ] P0-009 Globalni vs porodični recepti

**Cilj:** Podeliti recepte na globalne i household recepte.

**DB promene:**

```sql
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'household' CHECK (scope IN ('global', 'household'));
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'));
```

**RLS:**

- Globalni recept: SELECT za authenticated.
- Globalni recept: write samo admin.
- Household recept: SELECT/write za household members.

**Frontend:**

- Dodati `RecipeScope`, `RecipeStatus` u `types.ts`.
- Proširiti `Recipe` interface.
- Ažurirati `RecipeRow`, `recipeFromRow`, `recipeToRow` u `dataService.ts`.
- `getRecipes(householdId)` mora vraćati global + household recepte.

**Acceptance criteria:**

- Običan korisnik vidi globalne recepte i svoje porodične recepte.
- Običan korisnik ne može menjati globalni recept.
- Admin može menjati globalni recept.

---

### [ ] P0-010 Recipe suggestions

**Cilj:** Korisnici predlažu recepte/izmene, admini odobravaju.

**DB tabela:** vidi `docs/IMPLEMENTATION_GUIDE.md`, sekcija `Recipe suggestions`.

**UI korisnik:**

- Sa porodičnog recepta može kliknuti `Predloži za globalno`.
- Sa globalnog recepta može kliknuti `Predloži izmenu`.

**UI admin:**

- Admin panel prikazuje pending suggestions.
- Admin može `Odobri` ili `Odbij`.

**Acceptance criteria:**

- Suggestion dobija status `pending`.
- Svi admini vide pending suggestions.
- Approval može kreirati ili izmeniti globalni recept.

---

### [ ] P0-011 Audit log tabela i osnovni logging

**Cilj:** Beležiti bitne akcije za debugging i sigurnost.

**DB tabela:** vidi `docs/IMPLEMENTATION_GUIDE.md`, sekcija `Audit log`.

**Prve akcije:**

- `invite_code_regenerated`
- `owner_transferred_ownership`
- `member_removed`
- `member_left_household`
- `account_deactivated`
- `household_soft_deleted`
- `admin_promoted_recipe_to_global`

**Acceptance criteria:**

- Tabela postoji.
- Backend funkcije upisuju audit log za destruktivne akcije.
- Admin panel može kasnije čitati audit log.

---

## P1

### [ ] P1-001 Pending approval za invite kod

Za sada invite kod automatski ubacuje member-a. Kasnije: pending request + owner approval.

### [ ] P1-002 Read-only role

Dodati `read-only` household rolu sa ograničenim pristupom.

### [ ] P1-003 Recipe copy flow

Korisnik može kopirati globalni recept u porodični recept i prilagoditi ga.

### [ ] P1-004 Restore household soft delete

Owner/admin može vratiti soft-deleted household u roku od 30 dana.

### [ ] P1-005 Admin users/families pregled

Admin vidi korisnike, domaćinstva, broj recepata i statuse.

---

## P2

### [ ] P2-001 Notifikacije/emailovi

Email za invite, owner transfer, reset, recipe suggestion review.

### [ ] P2-002 Istorija izmena jelovnika

Prikaz ko je šta promenio u jelovniku.

### [ ] P2-003 Export podataka

Export porodičnih podataka pre brisanja/deaktivacije.

### [ ] P2-004 Napredni recipe moderation

Admin notes, duplicate detection, nutrition review, kategorije.
