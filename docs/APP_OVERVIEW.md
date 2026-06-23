# Porodični Jelovnik — App Overview

> Živi dokument za proizvod, arhitekturu i odluke. Ažurirati posle svake veće odluke ili sprinta.

## Vizija

Porodični Jelovnik je aplikacija za planiranje nedeljnog jelovnika, recepata, kalorija/porcija po članovima porodice i liste za nabavku.

Ključna ideja: aplikacija mora da radi i za samca i za porodicu. Svaki login korisnik ima svoj email, ali više korisnika može pripadati istom domaćinstvu i deliti isti jelovnik.

Primer:

- Ilija se prijavi preko svog emaila.
- Vera se prijavi preko svog emaila.
- Oboje vide isti porodični jelovnik i mogu da ga uređuju.
- Druga porodica vidi svoje zasebne podatke.
- Samac bez invite koda dobija svoje zasebno domaćinstvo.

## Tehnologije

- Frontend: React + TypeScript + Vite
- Routing: React Router
- Backend/Baza/Auth: Supabase
- Deploy: Vercel
- Repo: GitHub `Ilija0020/porodicni-jelovnik`

## Trenutni production URL

```text
https://porodicni-jelovnik.vercel.app
```

## Korisnički model

### Auth korisnik vs nutritivni član porodice

Razdvojiti ova dva pojma:

- **Auth korisnik**: osoba koja se prijavljuje emailom i lozinkom.
- **Family member profil**: osoba za koju računamo kalorije/porcije; ne mora imati login.

Primer: dete može biti family member za kalorije, ali nema login nalog.

## Household model

Jedan nalog trenutno pripada jednom domaćinstvu.

Tabela/koncepti:

- `household` — porodica/domaćinstvo.
- `household_members` — veza auth korisnika i domaćinstva.
- `family_members` — nutritivni profili članova porodice.

### Pravila

- Korisnik bez invite koda dobija novo domaćinstvo i postaje owner.
- Korisnik sa invite kodom ulazi u postojeće domaćinstvo kao member.
- Jedan nalog = jedno domaćinstvo za MVP.
- Domaćinstvo ima invite kod koji owner može regenerisati.

## Role i permissions

### Globalne role

- `admin` — globalni admin cele aplikacije.
- `user` — standardni korisnik.

Admin se čuva u `profiles.app_role`.

Trenutni admin nalog:

```text
prekoapp@gmail.com
```

### Household role

- `owner`
- `member`
- `read-only` kasnije

### MVP permissions

Owner:

- menja jelovnik
- menja porodične recepte
- menja članove porodice
- regeneriše invite kod
- izbacuje member-e
- prenosi ownership
- pokreće soft delete porodice

Member za sada:

- menja jelovnik
- menja porodične recepte
- može da izađe iz porodice
- ne može da izbaci druge
- ne može da obriše porodicu
- ne može da regeneriše invite kod

Kasnije:

- menjanje jelovnika prebaciti samo na owner-a, osim ako owner dozvoli member-u.
- globalne recepte može uređivati samo admin.

## Recepti

Planirani model:

- **Globalni recepti** — vide ih svi korisnici, uređuje ih admin.
- **Porodični recepti** — vidi ih samo jedna porodica, trenutno ih mogu uređivati owner/member.

Korisnik može:

- koristiti globalni recept u jelovniku
- kopirati globalni recept u porodični recept
- poslati predlog izmene globalnog recepta
- dodati porodični recept

Admin može:

- pregledati predloge
- odobriti/odbiti predloge
- promovisati porodični recept u globalni

## Account i recovery odluke

### Zaboravljena šifra

- Koristi Supabase reset password flow.
- UI poruka mora biti neutralna: `Ako nalog postoji, poslali smo email sa instrukcijama.`

### Deaktivacija naloga

Za MVP ide deaktivacija, ne hard delete.

- Member deaktivacijom izlazi iz porodice.
- Shared podaci ostaju porodici.
- Owner ako ima druge članove mora u istom flow-u izabrati novog owner-a.

### Brisanje porodice

- Soft delete 30 dana.
- Dodati `deleted_at`, `delete_scheduled_for`, `deleted_by`.
- Hard delete kasnije, verovatno cron/admin proces.

## Security/RLS pravila

- Frontend permissions nisu dovoljni; baza mora enforce-ovati prava.
- Svaka household tabela mora biti izolovana preko `household_members`.
- Globalni admin se proverava preko `profiles.app_role = 'admin'`.
- Stare `All access` politike su uklonjene.

## Audit log

Treba dodati `audit_log` rano.

Akcije za logovanje:

- `user_created_recipe`
- `user_updated_menu`
- `owner_removed_member`
- `owner_transferred_ownership`
- `invite_code_regenerated`
- `admin_promoted_recipe_to_global`
- `account_deactivated`
- `household_soft_deleted`

## Dokumentacija rada

Preporučena struktura:

```text
docs/
  APP_OVERVIEW.md       # ova datoteka: proizvod + arhitektura + odluke
  BACKLOG.md            # kartice za rad i prioriteti
  sprints/
    SPRINT-001.md       # aktivni sprint / urađeno / odluke / testovi
```

## Otvorena pitanja

- Tačan UX za Account settings.
- Tačan UX za Family settings.
- Da li member trenutno sme da dodaje/briše family member nutritivne profile ili samo owner?
- Kada tačno uvodimo `read-only`?
- Kako admin panel izgleda u prvoj verziji?
- Da li recipe suggestions treba da podrže slike/video linkove već u MVP-u?
