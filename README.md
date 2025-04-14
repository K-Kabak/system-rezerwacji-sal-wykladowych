# System rezerwacji sal wykładowych

## Cel wdrożenia projektu
Aplikacja tworzona jest na potrzeby przedmiotu Zawansowane aplikacje internetowe. 
## Opis systemu
System rezerwacji sal wykładowych to aplikacja internetowa umożliwiająca zarządzanie salami, organizowanie harmonogramu zajęć oraz powiadamianie użytkowników o nadchodzących rezerwacjach. System zapewnia również obsługę autoryzacji i uwierzytelniania użytkowników za pomocą Auth0.
## Cele systemu
+ Umożliwienie rezerwacji sal wykładowych przez użytkowników.
+ Zarządzanie dostępnością sal oraz kalendarzem.
+ Wysyłanie powiadomień o zbliżających się rezerwacjach.
+ Zabezpieczenie dostępu poprzez system logowania i autoryzacji.
+ Możliwość przeglądania historii rezerwacji.
## Użytkownicy systemu
+ Administrator: zarządza systemem, dodaje/usuwa sale, edytuje harmonogram.
+ Wykładowca: rezerwuje sale na wykłady i inne wydarzenia.
+ Student: przegląda dostępne sale oraz harmonogram zajęć.
## Funkcjonalności
### Moduł zarządzania użytkownikami
+ Rejestracja i logowanie użytkowników przez Auth0.
+ Role użytkowników (administrator, wykładowca, student).
+ Możliwość zarządzania kontami użytkowników przez administratora.
### Moduł rezerwacji
+ Możliwość rezerwacji sal w oparciu o dostępne terminy.
+ Sprawdzenie dostępności sali w kalendarzu.
+ Anulowanie i edytowanie rezerwacji.
+ Historia rezerwacji.
### Kalendarz
+ Widok miesięczny, tygodniowy i dzienny.
+ Integracja z rezerwacjami.
+ Możliwość filtrowania po salach i terminach.
### Powiadomienia
+ Wysyłanie powiadomień e-mailowych o rezerwacjach.
+ Powiadomienia o nadchodzących zajęciach.
+ Opcjonalne powiadomienia push.
### Zarządzanie salami
+ Dodawanie i edytowanie sal (pojemność, wyposażenie, lokalizacja).
+ Blokowanie sal na określony czas.
## Technologie
Frontend
 + Style.css - niestandardowe style w ciemnym motywie, responsywny układ.
 + Javascript - dynamiczne UI, logika aplikacji, integracja z backendem.

Backend
 + Node.js - serwer aplikacji, obsługa API i sesji użytkowników.
 + MySQL - relacyjna baza danych.

Autoryzacja
 + Auth0 - obsługa OAuth i JWT do logowania.
## Architektura systemu
+ Frontend: Next.js + React
+ Backend: NestJS (Node.js)
+ Baza danych: PostgreSQL (Prisma ORM)
## Przypadki użycia (Use Case)

Use Case 1: Rezerwacja sali przez wykładowcę<br>
Aktor: Wykładowca <br>
Opis: Wykładowca loguje się do systemu, wybiera odpowiednią salę i dostępny termin, a następnie potwierdza rezerwację. System zapisuje rezerwację i wysyła powiadomienie.

----------------------------------

Use Case 2: Przeglądanie dostępnych sal przez studenta <br>
Aktor: Student <br>
Opis: Student loguje się do systemu, przegląda kalendarz i dostępność sal. Może filtrować wyniki według daty, nazwy sali lub lokalizacji.

----------------------------------

Use Case 3: Anulowanie rezerwacji przez administratora<br>
Aktor: Administrator<br>
Opis: Administrator loguje się do systemu, wyszukuje istniejącą rezerwację i anuluje ją. System wysyła powiadomienie do wykładowcy o anulowaniu rezerwacji.

----------------------------------

Use Case 4: Automatyczne powiadomienie o rezerwacji<br>
Aktor: System<br>
Opis: Po dokonaniu rezerwacji system automatycznie wysyła powiadomienie e-mailowe do użytkownika o potwierdzeniu rezerwacji oraz przypomnienie na dzień przed wydarzeniem.
## Wizualizacja aplikacji 
----------------------------------
## Licencja
----------------------------------
## Podsumowanie
System rezerwacji sal wykładowych zapewni wygodny sposób na organizowanie zajęć oraz zarządzanie dostępnością sal. Dzięki nowoczesnym technologiom aplikacja będzie szybka, responsywna i łatwa w obsłudze.
