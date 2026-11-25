# ITSM Desk Pro — System obsługi zgłoszeń IT oraz ewidencji zasobów CMDB

Aplikacja webowa klasy **ITSM (IT Service Management)** wspierająca pracę działu Helpdesk oraz zarządzanie cyklem życia zasobów sprzętowych (**CMDB**) i procesami kadrowo-sprzętowymi (**onboarding / offboarding**) w organizacji.

Projekt zrealizowany jako część praktyczna pracy inżynierskiej.

---

## Kluczowe funkcjonalności

1. **Zarządzanie zgłoszeniami serwisowymi (Incident & Request Management):**
   * Rejestracja incydentów i wniosków z przypisaniem priorytetu (`Niski`, `Średni`, `Wysoki`, `Krytyczny`), kategorii oraz statusu (`Nowe`, `W toku`, `Zamknięte`).
   * Powiązanie zgłoszenia z osobą zgłaszającą, technikiem realizującym oraz konkretnym zasobem sprzętowym CMDB.
   * Dziennik prac i komunikacji (komentarze automatycznie podpisywane przez zalogowanego operatora).
2. **Ewidencja zasobów sprzętowych (CMDB & Asset Lifecycle):**
   * Pełny cykl życia urządzenia: *W magazynie* (`IN_STORAGE`) $\rightarrow$ *W użyciu* (`IN_USE`) $\rightarrow$ *Odebrany / Do przygotowania* (`RETURNED`) $\rightarrow$ *Do wymiany* (`NEEDS_REPLACEMENT`).
   * Protokół odbioru sprzętu od pracownika z obowiązkową listą kontrolną weryfikacji fizycznej i bezpieczeństwa danych.
   * Automatyczna oś czasu historii powierzeń i zmian statusu (`EquipmentHistory`) wraz z rejestracją operatora IT wykonującego operację.
3. **Katalog pracowników i proces offboardingu:**
   * Ewidencja pracowników, działów oraz operatorów IT.
   * Kreator procedury offboardingu z listą kontrolną odebrania dostępów (AD/Entra ID, Microsoft 365, VPN) oraz blokadą dezaktywacji konta w przypadku nieodebranego sprzętu.
   * Zachowanie spójności historycznej danych (snapshoty imion i nazwisk na archiwalnych zgłoszeniach i wpisach historii).
4. **Uwierzytelnianie JWT i kontrola dostępu RBAC:**
   * Logowanie operatorów IT z weryfikacją haseł (`bcryptjs`) i tokenami `JWT`.
   * Rozdzielenie uprawnień pomiędzy rolę **Technik IT** (`TECHNICIAN`) oraz **Administrator** (`ADMIN` — wyłączne prawo do trwałego usuwania rekordów z bazy danych).
5. **Dashboard zarządczy:**
   * Agregacja kluczowych wskaźników KPI (otwarte incydenty, zgłoszenia krytyczne, struktura stanów magazynowych i urządzeń w użyciu).

---

## Stos technologiczny

| Warstwa | Technologie |
| :--- | :--- |
| **Frontend** | Vue 3 (Composition API), TypeScript, Vite, Vue Router, Tailwind CSS v4, Lucide Icons, Nginx |
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM 5, JSON Web Token (`jsonwebtoken`), `bcryptjs` |
| **Baza danych** | PostgreSQL 16 |
| **Testy i konteneryzacja** | Vitest, Supertest, Docker, Docker Compose |

---

## Struktura repozytorium

```text
├── docker-compose.yml          # Orkiestracja kontenerów (PostgreSQL, Backend, Frontend)
├── itsm-backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma       # Model relacyjny bazy danych
│   │   ├── migrations/         # Historia migracji schematu
│   │   └── seed.ts             # Skrypt zasilania bazy danymi demonstracyjnymi
│   ├── src/
│   │   ├── app.ts              # Konfiguracja aplikacji Express i endpointów REST API
│   │   ├── auth.ts             # Uwierzytelnianie JWT oraz middleware RBAC
│   │   └── index.ts            # Punkt startowy serwera HTTP
│   └── tests/
│       └── api.integration.test.ts  # Testy integracyjne REST API (Vitest + Supertest)
└── itsm-frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── components/         # Karty szczegółów (Drawers), formularze modalne, Sidebar
        ├── composables/        # Zarządzanie sesją JWT (useAuth) i rolami (useCurrentRole)
        ├── router/             # Konfiguracja tras i strażnik autoryzacji
        ├── utils/              # Interceptor żądań HTTP (Authorization Bearer)
        └── views/              # Widoki: Login, Dashboard, Zgłoszenia, Sprzęt, Użytkownicy
```

---

## Uruchomienie środowiska (Docker Compose)

### Wymagania wstępne
* Docker Desktop (z obsługą Docker Compose)
* Node.js 20+ (opcjonalnie — do lokalnego uruchamiania testów i skryptu `seed`)

### 1. Uruchomienie kontenerów
W głównym katalogu repozytorium wykonaj:

```bash
docker compose up --build -d
```

Po uruchomieniu usługi są dostępne pod adresami:
* **Panel użytkownika (Frontend):** `http://localhost:5173`
* **REST API (Backend):** `http://localhost:3000/api`
* **Baza danych PostgreSQL:** `localhost:5432`

### 2. Zasilenie bazy danymi demonstracyjnymi (opcjonalnie)
Aby wypełnić bazę przykładowymi pracownikami, urządzeniami na wszystkich etapach cyklu życia oraz zgłoszeniami serwisowymi:

```bash
cd itsm-backend
npm install
npm run seed
```

---

## Konta testowe

System udostępnia predefiniowane konta do weryfikacji ról RBAC:

| Rola | Adres e-mail | Hasło | Zakres uprawnień |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@itsm.local` | `Admin123!` | Pełny dostęp + trwałe usuwanie rekordów (`DELETE`) |
| **Technik IT** | `technik@itsm.local` | `Tech123!` | Obsługa zgłoszeń, wydawanie/odbiór sprzętu, offboarding |

---

## Uruchomienie testów integracyjnych

Testy integracyjne (Vitest + Supertest) weryfikują uwierzytelnianie JWT, ochronę tras RBAC, cykl życia zasobów CMDB oraz spójność referencyjną przy usuwaniu kont:

```bash
cd itsm-backend
npm test
npm run seed   # przywrócenie danych demonstracyjnych po zakończeniu testów
