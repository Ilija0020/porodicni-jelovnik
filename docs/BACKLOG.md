# Porodični Jelovnik — Backlog

> Radni backlog. Kartice su grupisane po prioritetu i mogu se prebacivati u sprint fajlove.

## Legenda

- `P0` — neophodno za zdrav MVP / sigurnost / osnovni flow.
- `P1` — važno uskoro, ali nije blocker.
- `P2` — kasnije / polish / skaliranje.

Status:

- `[ ]` nije započeto
- `[~]` u toku
- `[x]` završeno

---

## P0

### [ ] Account: zaboravljena šifra

**Opis:** Korisnik može resetovati lozinku preko Supabase email flow-a.

**Acceptance criteria:**

- Na login strani postoji link `Zaboravio/la sam lozinku`.
- Korisnik unese email.
- Supabase šalje reset email.
- UI prikazuje neutralnu poruku: `Ako nalog postoji, poslali smo email sa instrukcijama.`
- Reset link vodi na stranicu za unos nove lozinke.
- Posle uspešnog reseta korisnik može da se prijavi novom lozinkom.

---

### [ ] Account settings

**Opis:** Stranica gde korisnik upravlja svojim nalogom.

**Acceptance criteria:**

- Korisnik vidi email.
- Korisnik vidi globalnu rolu ako je admin.
- Korisnik vidi household rolu.
- Korisnik može da se odjavi.
- Korisnik vidi opciju deaktivacije naloga.
- Destruktivne akcije imaju jasnu potvrdu.

---

### [ ] Family settings

**Opis:** Stranica za podešavanje porodice/domaćinstva.

**Acceptance criteria:**

- Owner vidi ime porodice.
- Owner vidi invite kod.
- Owner može regenerisati invite kod.
- Prikazuje se lista login članova porodice.
- Owner može izbaciti member-a.
- Member može izaći iz porodice.
- Owner ne može napustiti porodicu ako ne prebaci ownership kada postoje drugi članovi.

---

### [ ] Ownership transfer

**Opis:** Owner može prebaciti ownership na drugog member-a.

**Acceptance criteria:**

- Owner može izabrati drugog člana kao novog owner-a.
- Ako owner deaktivira nalog, mora izabrati novog owner-a ako postoje drugi članovi.
- Ne sme postojati household bez owner-a.
- Member ne može sam sebe promovisati u owner-a.

---

### [ ] Soft delete household

**Opis:** Owner može obrisati porodicu kroz soft delete 30 dana.

**Acceptance criteria:**

- Samo owner može pokrenuti brisanje porodice.
- Brisanje postavlja `deleted_at`, `delete_scheduled_for`, `deleted_by`.
- Aktivni UI ne prikazuje soft-deleted household kao normalno aktivan.
- Hard delete nije frontend akcija.

---

### [ ] Deactivate account

**Opis:** Korisnik može deaktivirati svoj nalog bez brisanja porodičnih shared podataka.

**Acceptance criteria:**

- Member deaktivacijom izlazi iz `household_members`.
- Shared podaci ostaju porodici.
- Ako je owner i postoje drugi članovi, mora izabrati novog owner-a.
- Profil dobija `is_deactivated = true`.

---

### [x] Profiles + admin role

**Opis:** Globalni profil i app role sistem.

**Acceptance criteria:**

- Postoji `profiles` tabela.
- `prekoapp@gmail.com` ima `app_role = admin`.
- Novi auth korisnici automatski dobijaju `profiles` red.
- Postoji `is_app_admin()` funkcija.

---

### [ ] Admin panel shell

**Opis:** Posebna admin stranica vidljiva samo globalnom adminu.

**Acceptance criteria:**

- Postoji `/admin` ruta za globalni admin panel.
- Non-admin ne vidi admin link.
- Non-admin koji ručno ode na `/admin` dobije `Nemaš pristup`.
- Admin vidi sekcije: recepti, predlozi, korisnici, porodice, audit log.

---

### [ ] Globalni vs porodični recepti

**Opis:** Podeliti recepte na globalne i household recepte.

**Acceptance criteria:**

- `recipes` ima `scope = global | household`.
- Globalni recepti su vidljivi svim ulogovanim korisnicima.
- Household recepti su vidljivi samo članovima porodice.
- Samo admin može direktno menjati globalne recepte.
- Korisnik može dodati porodični recept.

---

### [ ] Recipe suggestions

**Opis:** Korisnik može poslati recept ili izmenu adminima na pregled.

**Acceptance criteria:**

- Postoji `recipe_suggestions` tabela.
- Korisnik može predložiti novi globalni recept.
- Korisnik može predložiti izmenu globalnog recepta.
- Admin vidi sve pending predloge.
- Admin može odobriti/odbiti predlog.

---

### [ ] Audit log tabela i osnovni logging

**Opis:** Beležiti osetljive i važne akcije.

**Acceptance criteria:**

- Postoji `audit_log` tabela.
- Loguju se: invite regenerate, ownership transfer, member removed, account deactivated, recipe promoted.
- Admin može videti audit log u admin panelu kasnije.

---

## P1

### [ ] Pending approval za invite kod

Za sada invite kod automatski ubacuje member-a. Kasnije: pending request + owner approval.

### [ ] Read-only role

Dodati `read-only` household rolu sa ograničenim pristupom.

### [ ] Recipe copy flow

Korisnik može kopirati globalni recept u porodični recept i prilagoditi ga.

### [ ] Restore household soft delete

Owner/admin može vratiti soft-deleted household u roku od 30 dana.

### [ ] Admin users/families pregled

Admin vidi korisnike, domaćinstva, broj recepata i statuse.

---

## P2

### [ ] Notifikacije/emailovi

Email za invite, owner transfer, reset, recipe suggestion review.

### [ ] Istorija izmena jelovnika

Prikaz ko je šta promenio u jelovniku.

### [ ] Export podataka

Export porodičnih podataka pre brisanja/deaktivacije.

### [ ] Napredni recipe moderation

Admin notes, duplicate detection, nutrition review, kategorije.
