# Sprint 001 — Account, Household, Admin Foundation

## Sprint cilj

Postaviti čvrstu osnovu za porodično deljenje, globalnog admina, account/family settings i buduću podelu recepata na globalne i porodične.

## Kontekst

Do sada je urađeno:

- Vercel produkcija radi.
- Supabase auth radi.
- Dva postojeća naloga su uvezana u isto domaćinstvo:
  - `prekogacic@gmail.com` — household owner
  - `veradukic5@gmail.com` — household member
- Dodat je household invite model.
- Uklonjene su stare otvorene RLS politike `USING (true)`.
- Dodati su zdravi recepti i seed podaci.
- Dodata je `profiles` tabela i admin rola.
- `prekoapp@gmail.com` je postavljen kao globalni admin.

## Urađeno u ovom sprintu

### 1. Household sharing i RLS

- Dodata tabela `household_members`.
- Dodati invite kodovi na `household`.
- Dodate funkcije:
  - `create_household_for_current_user`
  - `join_household_by_invite_code`
  - `get_or_create_household`
- RLS sada izoluje podatke preko household membership-a.

### 2. Postojeći nalozi uvezani

- `prekogacic@gmail.com` je owner domaćinstva.
- `veradukic5@gmail.com` je member istog domaćinstva.

### 3. Admin foundation

- Dodata migracija `202606230003_profiles_admin_role.sql`.
- Kreirana tabela `profiles`.
- Kreirana funkcija `is_app_admin()`.
- Novi auth korisnici automatski dobijaju profil.
- `prekoapp@gmail.com` postavljen kao `app_role = admin`.

## Aktivni rad / Sledeće kartice

### A. Account settings

**Plan:** Napraviti `/account` ili `/settings/account` stranicu.

Treba da sadrži:

- email
- app role
- household role
- logout
- promena lozinke / forgot password link
- deaktivacija naloga

### B. Family settings

**Plan:** Napraviti `/settings/family` stranicu.

Treba da sadrži:

- ime porodice
- invite kod
- regenerate invite code
- lista login članova
- transfer ownership
- remove member
- leave family
- soft delete household

### C. Admin panel shell

**Plan:** Napraviti zasebnu admin rutu.

Predlog ruta:

```text
/admin
/admin/recipes
/admin/suggestions
/admin/users
/admin/households
/admin/audit-log
```

U prvoj verziji može biti jedna stranica sa karticama.

### D. Globalni vs porodični recepti

**Plan:** Dodati `scope` na `recipes` i prebaciti logiku čitanja.

Pravila:

- `scope = global`: vidi svako, uređuje admin.
- `scope = household`: vidi samo household, uređuje porodica.

### E. Recipe suggestions

**Plan:** Dodati `recipe_suggestions` i admin review flow.

Korisnički flow:

- korisnik doda porodični recept
- admin ga vidi kao kandidat
- admin može promovisati u globalni

## Validacije koje su rađene

- `npm run lint` prolazi.
- `npm run build` prolazi.
- Supabase migracije su aplicirane.
- `prekoapp@gmail.com` potvrđeno u `profiles` kao admin.

## Rizici

### Security

- Potrebno je nastaviti RLS oprezno kad se dodaju globalni recepti.
- Admin panel mora imati i frontend guard i database policy guard.

### UX

- Destruktivne akcije moraju imati jasne potvrde.
- Owner transfer mora biti razumljiv da porodica ne ostane bez owner-a.

### Data model

- Podela globalnih i porodičnih recepata mora rešiti postojeće recepte bez konflikta.
- Recipe suggestion payload treba da bude dovoljno fleksibilan, ali ne prekomplikovan.

## Definition of Done za Sprint 001

- [x] Existing family accounts linked.
- [x] Global admin profile exists.
- [x] Documentation structure created.
- [ ] Account settings UI exists.
- [ ] Family settings UI exists.
- [ ] Forgot password flow works.
- [ ] Admin route shell exists.
- [ ] Backlog updated after each implemented card.
