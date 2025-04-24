# System rezerwacji sal wykładowych

## Cel wdrożenia projektu
Aplikacja tworzona jest na potrzeby przedmiotu Zawansowane aplikacje internetowe. 
## Opis systemu
System rezerwacji sal wykładowych to aplikacja internetowa umożliwiająca zarządzanie salami, organizowanie harmonogramu zajęć oraz powiadamianie użytkowników o nadchodzących rezerwacjach. System zapewnia również obsługę rejestracji i logowania użytkowników.
## Cele systemu
+ Umożliwienie rezerwacji sal wykładowych przez wykładowców.
+ Zarządzanie dostępnością sal oraz kalendarzem.
+ Wysyłanie powiadomień o zbliżających się rezerwacjach. (W trakcie implementacji)
+ Zabezpieczenie dostępu poprzez system logowania i rejestracji.
## Użytkownicy systemu
+ Administrator: zarządza systemem, dodaje/usuwa sale, edytuje harmonogram.
+ Wykładowca: rezerwuje sale na wykłady i inne wydarzenia.
+ Student: przegląda dostępne sale oraz harmonogram zajęć.
## Funkcjonalności
### Moduł zarządzania użytkownikami
+ Rejestracja i logowanie użytkowników.
+ Role użytkowników (administrator, wykładowca, student).
+ Możliwość zarządzania kontami użytkowników przez administratora.
### Moduł rezerwacji
+ Możliwość rezerwacji sal w oparciu o dostępne terminy.
+ Sprawdzenie dostępności sali w kalendarzu.
+ Anulowanie i edytowanie rezerwacji.
+ Historia rezerwacji.
### Kalendarz
+ Widok miesięczny.
+ Integracja z rezerwacjami.
+ Kolorowe oznaczenia typów sal.
### Powiadomienia i wiadomości
+ Wysyłanie powiadomień e-mailowych o rezerwacjach.
+ Powiadomienia o nadchodzących zajęciach.
+ Opcjonalne powiadomienia push.
### Zarządzanie salami
+ Dodawanie i edytowanie sal (pojemność, wyposażenie, lokalizacja).
+ Blokowanie sal na określony czas.
### Wiadomości
+ Wysyłanie wiadomości do innych użytkowników systemu 
+ Powiadomienia o nowych wiadomościach 
## Technologie
Frontend
 + HTML
 + Style.css - niestandardowe style w ciemnym motywie, responsywny układ.
 + Javascript - dynamiczne UI, logika aplikacji, integracja z backendem.

Backend
 + Node.js - serwer aplikacji, obsługa API i sesji użytkowników.
 + MySQL - relacyjna baza danych.
## Architektura systemu
+ Frontend: JavaScript
+ Backend: NestJS (Node.js)
+ Baza danych: MySQL
## Przypadki użycia (Use Case)

Use Case 1: Rezerwacja sali przez wykładowcę<br>
Aktor: Wykładowca <br>
Opis: Wykładowca loguje się do systemu, wybiera odpowiednią salę i dostępny termin, a następnie potwierdza rezerwację. System zapisuje rezerwację i wysyła powiadomienie.

----------------------------------

Use Case 2: Przeglądanie dostępnych sal przez studenta <br>
Aktor: Student <br>
Opis: Student loguje się do systemu, przegląda kalendarz i dostępność sal. W kalendarzu wyświetlane są tylko rezerwacji grupy do której zapisany jest student.

----------------------------------

Use Case 3: Automatyczne powiadomienie o rezerwacji<br>
Aktor: System<br>
Opis: Po dokonaniu rezerwacji system automatycznie wysyła powiadomienie e-mailowe do użytkownika o potwierdzeniu rezerwacji oraz przypomnienie na dzień przed wydarzeniem.

----------------------------------

Use Case 4: Wysyłanie wiadomości do innych użytkowników<br>
Aktor: Student/Wykładowca <br>
Opis: Aktor przechodzi w zakładke wiadomości, wprowadza email użytkownika do którego chce wysłać wiadomość. System po wpisaniu drugiej litry automatycznie podpowiada emaile, które znajdują się w bazie. Następnie użytkownik wprowadza treść wiadomości.
## Wizualizacja aplikacji 
----------------------------------
## Licencja
----------------------------------
## Podsumowanie
System rezerwacji sal wykładowych zapewni wygodny sposób na organizowanie zajęć oraz zarządzanie dostępnością sal. Dzięki nowoczesnym technologiom aplikacja będzie szybka, przystępna i łatwa w obsłudze.
