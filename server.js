const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
// Upewnij się, że port dla backendu API jest poprawny (np. 3000)
const port = 3000;
// Adres IP i port, pod którym dostępny jest Twój FRONTEND
const frontendOrigin = 'http://213.73.1.69:8090'; // <--- SPRAWDŹ I ZAKTUALIZUJ PORT jeśli inny niż 8090

// === Konfiguracja CORS ===
// Pozwala frontendowi (np. z 213.73.1.69:8090) komunikować się z backendem (np. na 213.73.1.69:3000)
app.use(cors({
  // Ważne: Podaj DOKŁADNY adres URL Twojego frontendu.
  // Jeśli możesz uzyskiwać dostęp także przez localhost (np. będąc na serwerze), dodaj go też.
  origin: [frontendOrigin, 'http://localhost:8090', 'http://127.0.0.1:8090'], // <-- Dodaj wszystkie możliwe adresy frontendu
  credentials: true // Niezbędne, aby przeglądarka wysyłała ciasteczka sesji z żądaniami
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === Połączenie z bazą danych ===
// Host pozostaje '127.0.0.1', bo Node.js łączy się z MySQL na tej samej maszynie.
const db = mysql.createPool({
  connectionLimit: 10,
  host: '127.0.0.1', // <-- Zostaw '127.0.0.1' lub 'localhost'
  user: 'root',
  password: 'xi*V#BFDAxRAgB4Td6',
  database: 'rezerwacje_sali'
});

/* --Problemy z połączeniem
db.connect(err => {
  if (err) {
    console.error('❌ Błąd połączenia z MySQL:', err);
    process.exit(1);
  }
  console.log('✅ Połączono z MySQL');
});
*/

// === Konfiguracja Sesji ===
app.use(session({
  secret: 'bardzo_tajny_sekret_do_zmiany_w_przyszlosci', // ZMIEŃ TO!
  resave: false,
  saveUninitialized: false,
  cookie: {
    // secure: false JEST KONIECZNE, gdy dostęp jest przez HTTP.
    // Gdybyś przeszedł na HTTPS, musiałbyś zmienić na `true`.
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 dzień
  }
}));

// === Middleware do sprawdzania autentykacji ===
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ error: 'Brak autoryzacji. Proszę się zalogować.' });
  }
};

// === Middleware do sprawdzania roli ===
const hasRole = (roleRequired) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Brak autoryzacji.' });
    }
    // Umożliwiamy dostęp adminowi do wszystkiego, co wymaga roli wykładowcy
    if (req.session.user.rola === roleRequired || req.session.user.rola === 'administrator') {
       if (roleRequired === 'wykladowca') { // Sprawdzamy czy wymagana rola to wykładowca
          return next();
       }
    }
    // Dokładne sprawdzenie roli, jeśli nie jest to admin próbujący uzyskać dostęp do zasobów wykładowcy
    if (req.session.user.rola === roleRequired) {
      return next();
    } else {
      return res.status(403).json({ error: 'Brak uprawnień.' });
    }
  };
};


// === Endpointy API ===

// --- Rejestracja (Poprawiona obsługa transakcji z pulą) ---
app.post('/register', async (req, res) => { // async tutaj nie jest już potrzebny, bo używamy callbacków, ale nie szkodzi
  const { login, imie, nazwisko, email, haslo, rola, nr_indeksu, grupa, kierunek, tytul_naukowy } = req.body;

  // Walidacja wejściowa (bez zmian)
  if (!login || !imie || !nazwisko || !email || !haslo || !rola) {
    return res.status(400).json({ error: 'Pola: login, imie, nazwisko, email, haslo, rola są wymagane.' });
  }
  if (rola === 'student' && (!nr_indeksu || !grupa || !kierunek)) {
    return res.status(400).json({ error: 'Dla studenta wymagane są: nr_indeksu, grupa, kierunek.' });
  }

  // 1. Pobierz połączenie z puli
  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("Błąd pobierania połączenia z puli:", connErr);
      return res.status(500).json({ error: 'Błąd serwera (nie można pobrać połączenia).' });
    }
    console.log("Pobrano połączenie z puli dla rejestracji.");

    // Funkcja pomocnicza do zwalniania połączenia
    const releaseConnection = () => {
      if (connection) {
        connection.release();
        console.log("Zwolniono połączenie z puli (rejestracja).");
      }
    };

    // 2. Sprawdź czy użytkownik istnieje (na uzyskanym połączeniu)
    const checkUserSql = 'SELECT login FROM uzytkownicy WHERE login = ? OR email = ?';
    connection.query(checkUserSql, [login, email], async (checkErr, results) => { // async dla bcrypt jest potrzebny
      if (checkErr) {
        console.error("Błąd sprawdzania użytkownika:", checkErr);
        releaseConnection(); // Zwolnij połączenie przy błędzie
        return res.status(500).json({ error: 'Błąd serwera podczas sprawdzania użytkownika.' });
      }
      if (results.length > 0) {
        releaseConnection(); // Zwolnij połączenie, bo użytkownik istnieje
        return res.status(409).json({ error: 'Użytkownik o podanym loginie lub adresie email już istnieje.' });
      }

      // Użytkownik nie istnieje, kontynuuj z transakcją

      // 3. Rozpocznij transakcję (na uzyskanym połączeniu)
      connection.beginTransaction(async (txErr) => { // async dla bcrypt
        if (txErr) {
          console.error("Błąd rozpoczynania transakcji:", txErr);
          releaseConnection(); // Zwolnij połączenie
          return res.status(500).json({ error: 'Błąd serwera podczas rozpoczynania transakcji.' });
        }

        try {
          // 4. Haszuj hasło
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(haslo, saltRounds);

          // 5. Wstaw użytkownika (w ramach transakcji)
          const insertUserSql = 'INSERT INTO uzytkownicy (login, imie, nazwisko, email, haslo, rola) VALUES (?, ?, ?, ?, ?, ?)';
          connection.query(insertUserSql, [login, imie, nazwisko, email, hashedPassword, rola], (insertErr, insertResult) => {
            if (insertErr) {
              console.error("Błąd wstawiania użytkownika:", insertErr);
              return connection.rollback(() => { // Wycofaj transakcję
                releaseConnection(); // Zwolnij połączenie
                res.status(500).json({ error: 'Błąd serwera podczas rejestracji użytkownika.' });
              });
            }

            // 6. Wstaw dane roli (jeśli potrzeba, w ramach transakcji)
            let insertRoleSql = '';
            let roleParams = [];
            if (rola === 'student') {
              insertRoleSql = 'INSERT INTO studenci (login, nr_indeksu, grupa, kierunek) VALUES (?, ?, ?, ?)';
              roleParams = [login, nr_indeksu, grupa, kierunek];
            } else if (rola === 'wykladowca') {
              if (tytul_naukowy) { insertRoleSql = 'INSERT INTO wykladowcy (login, tytul_naukowy) VALUES (?, ?)'; roleParams = [login, tytul_naukowy]; }
              else { insertRoleSql = 'INSERT INTO wykladowcy (login) VALUES (?)'; roleParams = [login]; }
            }

            if (insertRoleSql) {
              connection.query(insertRoleSql, roleParams, (roleErr, roleResult) => {
                if (roleErr) {
                  console.error(`Błąd wstawiania danych dla roli ${rola}:`, roleErr);
                  return connection.rollback(() => { // Wycofaj transakcję
                    releaseConnection(); // Zwolnij połączenie
                    res.status(500).json({ error: `Błąd serwera podczas zapisywania danych ${rola}.` });
                  });
                }
                // 7a. Zatwierdź transakcję (po obu insertach)
                connection.commit((commitErr) => {
                  if (commitErr) {
                    console.error("Błąd zatwierdzania transakcji:", commitErr);
                    return connection.rollback(() => { // Wycofaj w razie błędu commit
                      releaseConnection();
                      res.status(500).json({ error: 'Błąd serwera podczas finalizowania rejestracji.' });
                    });
                  }
                  console.log(`Zarejestrowano nowego użytkownika: ${login} (Rola: ${rola})`);
                  releaseConnection(); // Zwolnij połączenie po sukcesie
                  res.status(201).json({ success: true, message: 'Rejestracja zakończona pomyślnie.' });
                });
              });
            } else {
              // 7b. Zatwierdź transakcję (jeśli tylko jeden insert był potrzebny)
              connection.commit((commitErr) => {
                if (commitErr) {
                  console.error("Błąd zatwierdzania transakcji (brak roli):", commitErr);
                  return connection.rollback(() => {
                    releaseConnection();
                    res.status(500).json({ error: 'Błąd serwera podczas finalizowania rejestracji.' });
                  });
                }
                console.log(`Zarejestrowano nowego użytkownika: ${login} (Rola: ${rola})`);
                releaseConnection(); // Zwolnij połączenie po sukcesie
                res.status(201).json({ success: true, message: 'Rejestracja zakończona pomyślnie.' });
              });
            }
          }); // Koniec connection.query dla insertUserSql
        } catch (hashError) { // Łapanie błędu z bcrypt.hash
          console.error("Błąd podczas haszowania hasła:", hashError);
          return connection.rollback(() => { // Wycofaj transakcję
             releaseConnection();
             res.status(500).json({ error: 'Wystąpił błąd serwera podczas przetwarzania hasła.' });
          });
        }
      }); // Koniec connection.beginTransaction
    }); // Koniec connection.query dla checkUserSql
  }); // Koniec db.getConnection
}); // Koniec app.post('/register', ...)

// --- Logowanie ---
app.post('/login', (req, res) => {
  const { login, haslo } = req.body;

  if (!login || !haslo) {
    return res.status(400).json({ error: 'Login i hasło są wymagane.' });
  }

  const sql = 'SELECT login, imie, nazwisko, rola, haslo, email FROM uzytkownicy WHERE login = ?';
  db.query(sql, [login], async (err, results) => {
    if (err) {
      console.error("Błąd logowania (zapytanie DB):", err);
      return res.status(500).json({ error: 'Błąd serwera podczas logowania.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło.' });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(haslo, user.haslo);

      if (match) {
        req.session.user = {
          login: user.login,
          imie: user.imie,
          nazwisko: user.nazwisko,
          rola: user.rola,
          email: user.email
        };
        console.log(`Użytkownik ${user.login} zalogowany. Sesja ID: ${req.session.id}`);
        res.json({
          success: true,
          message: 'Zalogowano pomyślnie.',
          user: req.session.user // Zwracamy dane z sesji
        });
      } else {
        return res.status(401).json({ error: 'Nieprawidłowy login lub hasło.' });
      }
    } catch (compareError) {
      console.error("Błąd porównywania hasła:", compareError);
      return res.status(500).json({ error: 'Błąd serwera podczas weryfikacji hasła.' });
    }
  });
});

// --- Wylogowanie ---
app.post('/logout', (req, res) => {
   if (req.session.user) {
     const login = req.session.user.login;
     req.session.destroy(err => {
       if (err) {
         console.error("Błąd niszczenia sesji:", err);
         return res.status(500).json({ error: 'Nie udało się wylogować.' });
       }
       res.clearCookie('connect.sid'); // Upewnij się, że nazwa ciasteczka jest domyślna
       console.log(`Użytkownik ${login} wylogowany.`);
       res.json({ success: true, message: 'Wylogowano pomyślnie.' });
     });
   } else {
     // Nawet jeśli nie ma sesji, zwróć sukces, bo celem jest bycie wylogowanym
     res.json({ success: true, message: 'Użytkownik nie był zalogowany.' });
   }
});


// --- Sprawdzenie Sesji ---
app.get('/check-session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      isLoggedIn: true,
      user: req.session.user
    });
  } else {
    res.json({
      isLoggedIn: false
    });
  }
});

// --- Pobieranie sal (chronione) ---
app.get('/sale', isAuthenticated, (req, res) => {
  db.query('SELECT * FROM sala', (err, results) => {
    if (err) {
      console.error("Błąd pobierania sal:", err);
      return res.status(500).send({ error: "Błąd serwera przy pobieraniu sal." });
    }
    res.json(results);
  });
});

// === Endpoint: Pobieranie listy unikalnych grup studenckich ===
app.get('/grupy', isAuthenticated, (req, res) => {
  // Zapytanie wybiera unikalne, niepuste nazwy grup z tabeli studenci i sortuje je
  const sql = "SELECT DISTINCT grupa FROM studenci WHERE grupa IS NOT NULL AND grupa != '' ORDER BY grupa ASC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Błąd pobierania listy grup:", err);
      return res.status(500).json({ error: "Błąd serwera podczas pobierania listy grup." });
    }
    // Wynik 'results' to tablica obiektów np. [{grupa: 'Grupa 1'}, {grupa: 'Grupa 2'}]
    // Chcemy zwrócić tylko tablicę stringów z nazwami grup.
    const grupy = results.map(row => row.grupa);
    console.log("Zwrócono listę grup:", grupy);
    res.json(grupy); // Zwróć tablicę nazw grup
  });
});


// --- Pobieranie rezerwacji (chronione, logika filtrowania) ---
app.get('/rezerwacje', isAuthenticated, (req, res) => {
    const user = req.session.user;
    let sql = 'SELECT * FROM rezerwacje';
    let params = [];

    console.log(`Pobieranie rezerwacji dla użytkownika ${user.login} (rola: ${user.rola})`);

    if (user.rola === 'student') {
        const getGroupSql = 'SELECT grupa FROM studenci WHERE login = ?';
        db.query(getGroupSql, [user.login], (groupErr, groupResults) => {
            if (groupErr) {
                console.error(`Błąd pobierania grupy dla studenta ${user.login}:`, groupErr);
                return res.status(500).json({ error: 'Błąd serwera przy pobieraniu grupy studenta.' });
            }
            if (groupResults.length > 0 && groupResults[0].grupa) {
                const grupaStudenta = groupResults[0].grupa;
                console.log(`Student ${user.login} należy do grupy ${grupaStudenta}. Filtrowanie rezerwacji.`);
                sql += ' WHERE grupa = ?';
                params.push(grupaStudenta);
                executeQuery();
            } else {
                console.warn(`Nie znaleziono grupy dla studenta ${user.login} w tabeli studenci. Zwracam puste rezerwacje.`);
                res.json([]);
            }
        });
    } else if (user.rola === 'wykladowca' || user.rola === 'administrator') {
        console.log(`Użytkownik ${user.login} (rola: ${user.rola}) pobiera wszystkie rezerwacje.`);
        executeQuery();
    } else {
         console.warn(`Nieobsługiwana rola użytkownika: ${user.rola}`);
         res.status(403).json({error: "Nie masz uprawnień do przeglądania rezerwacji."});
    }

    function executeQuery() {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error(`Błąd pobierania rezerwacji (SQL: ${sql}, Params: ${params}):`, err);
                return res.status(500).json({ error: 'Błąd serwera przy pobieraniu rezerwacji.' });
            }
            console.log(`Zwrócono ${results.length} rezerwacji dla użytkownika ${user.login}.`);
            res.json(results);
        });
    }
});


// --- Dodawanie rezerwacji (chronione, tylko dla wykładowcy/admina) ---
app.post('/rezerwacje', isAuthenticated, hasRole('wykladowca'), (req, res) => {
  const { nr_sali, grupa, typ, termin, godzina_od, godzina_do } = req.body;
  const rezerwujacyLogin = req.session.user.login;

  // Prosta walidacja danych wejściowych
  if (!nr_sali || !grupa || !typ || !termin || !godzina_od || !godzina_do) {
    return res.status(400).json({ error: 'Brakuje wymaganych danych rezerwacji.' });
  }
  if (new Date(`1970-01-01T${godzina_do}:00`) <= new Date(`1970-01-01T${godzina_od}:00`)) {
      return res.status(400).json({ error: 'Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia.' });
  }

  console.log(`Próba rezerwacji przez ${rezerwujacyLogin}: Sala ${nr_sali}, Grupa ${grupa}, Termin ${termin} ${godzina_od}-${godzina_do}`);

  const checkConflictSql = `
    SELECT id FROM rezerwacje
    WHERE nr_sali = ?
      AND termin = ?
      AND godzina_od < ?
      AND godzina_do > ?
    LIMIT 1
`;
  db.query(checkConflictSql, [nr_sali, termin, godzina_do, godzina_od], (conflictErr, conflictResults) => {
    // ... reszta kodu (obsługa conflictErr, conflictResults) pozostaje bez zmian ...
    if (conflictErr) {
      console.error("Błąd podczas sprawdzania konfliktu:", conflictErr);
      console.error("!!! Błąd SQL podczas sprawdzania konfliktu !!!");
        console.error("Wykonano SQL:", checkConflictSql);
        console.error("Użyte Parametry:", [nr_sali, termin, godzina_do, godzina_od]);
        console.error("Kod Błędu MySQL:", conflictErr.code); // np. ER_PARSE_ERROR, ER_BAD_FIELD_ERROR
        console.error("Numer Błędu MySQL:", conflictErr.errno);
        console.error("Wiadomość Błędu MySQL:", conflictErr.sqlMessage); // Szczegółowy komunikat z MySQL
        console.error("Pełny Obiekt Błędu:", conflictErr); // Cały obiekt błędu
        // Zmieńmy lekko odpowiedź dla użytkownika, aby wskazać na logi
        return res.status(500).send({error: "Błąd serwera podczas sprawdzania konfliktu. Sprawdź logi serwera po szczegóły."});
        // ===========================================================
    }

    if (conflictResults.length > 0) {
       const conflict = conflictResults[0];
      console.warn(`Konflikt rezerwacji dla sali ${nr_sali} w terminie ${termin} ${godzina_od}-${godzina_do}. Istniejąca rezerwacja ID: ${conflict.id}, Grupa: ${conflict.grupa}, Rezerwujący: ${conflict.rezerwujacy_login}`);
      return res.status(409).json({ error: `Sala jest już zajęta w podanym terminie (konflikt z rezerwacją grupy ${conflict.grupa}).` });
    }

    const insertSql = `
      INSERT INTO rezerwacje (nr_sali, grupa, typ, termin, godzina_od, godzina_do, rezerwujacy_login, rezerwujacy_imie, rezerwujacy_nazwisko)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

    db.query(insertSql, [
      nr_sali,
      grupa,
      typ.toLowerCase(),
      termin,
      godzina_od,
      godzina_do,
      req.session.user.login,     // <-- DODANO LOGIN
      req.session.user.imie,
      req.session.user.nazwisko], 
      (insertErr, result) => {
       if (insertErr) {
          // Obsługa błędów pozostaje taka sama, ale teraz logujemy inne parametry w razie czego
          console.error("Błąd wstawiania rezerwacji:", insertErr);
          console.error("Użyte Parametry:", [nr_sali, grupa, typ.toLowerCase(), termin, godzina_od, godzina_do, req.session.user.imie, req.session.user.nazwisko]); // Zaktualizowane logowanie parametrów
          // ... reszta obsługi błędów ...
           // Sprawdź błędy związane z kluczem obcym lub typem ENUM
           if (insertErr.code === 'ER_NO_REFERENCED_ROW_2' && insertErr.message.includes('rezerwacje_ibfk_1')) {
               return res.status(400).json({ error: `Podana sala (${nr_sali}) nie istnieje.` });
           } else if (insertErr.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || insertErr.code === 'ER_DATA_TOO_LONG' || insertErr.code === 'WARN_DATA_TRUNCATED') {
               console.error(`Nieprawidłowa wartość dla pola 'typ': ${typ.toLowerCase()}`);
               return res.status(400).json({ error: `Nieprawidłowy typ sali: '${typ}'. Dopuszczalne: aula, wykladowa, komputerowa.` });
           }
          return res.status(500).send({error: "Błąd serwera podczas dodawania rezerwacji."});
       }
       // Sukces
       console.log(`Dodano rezerwację (ID: ${result.insertId}) przez ${req.session.user.imie} ${req.session.user.nazwisko}.`); // Zaktualizowano log sukcesu
       res.status(201).json({ success: true, id: result.insertId });
    });
  });
});
// === Nowy Endpoint: Pobieranie rezerwacji dla konkretnej daty ===
app.get('/rezerwacje/data/:termin', isAuthenticated, (req, res) => {
  const user = req.session.user;
  const { termin } = req.params; // Pobierz datę z parametru URL

  // Prosta walidacja formatu daty (YYYY-MM-DD) - można dodać bardziej rygorystyczną
  if (!termin || !/^\d{4}-\d{2}-\d{2}$/.test(termin)) {
    return res.status(400).json({ error: 'Nieprawidłowy format daty. Oczekiwano YYYY-MM-DD.' });
  }

  console.log(`Pobieranie rezerwacji dla daty ${termin}, użytkownik ${user.login} (rola: ${user.rola})`);

  let sql = `
    SELECT
        r.nr_sali, r.grupa, r.typ, r.termin, r.godzina_od, r.godzina_do,
        r.rezerwujacy_imie, r.rezerwujacy_nazwisko,
        u.rola,
        w.tytul_naukowy
    FROM
        rezerwacje r
    JOIN
        uzytkownicy u ON r.rezerwujacy_login = u.login
    LEFT JOIN
        wykladowcy w ON u.login = w.login
    WHERE
        r.termin = ?
`;
  let params = [termin];

  // Dodatkowe filtrowanie dla studenta (jeśli ma widzieć tylko swoją grupę w modalu)
  if (user.rola === 'student') {
    const getGroupSql = 'SELECT grupa FROM studenci WHERE login = ?';
    db.query(getGroupSql, [user.login], (groupErr, groupResults) => {
      if (groupErr) {
        console.error(`Błąd pobierania grupy dla studenta ${user.login} (modal):`, groupErr);
        return res.status(500).json({ error: 'Błąd serwera przy pobieraniu grupy studenta.' });
      }
      if (groupResults.length > 0 && groupResults[0].grupa) {
        const grupaStudenta = groupResults[0].grupa;
        console.log(`Student ${user.login} (modal) należy do grupy ${grupaStudenta}. Filtrowanie rezerwacji.`);
        // Dodajemy warunek AND grupa = ? do istniejącego zapytania
        sql += ' AND grupa = ?';
        params.push(grupaStudenta); // Dodajemy grupę do parametrów
        executeQuery();
      } else {
        console.warn(`Nie znaleziono grupy dla studenta ${user.login} (modal). Zwracam puste rezerwacje dla tej daty.`);
        res.json([]); // Zwróć pustą listę, jeśli student nie ma grupy
      }
    });
  } else {
    // Wykładowca/Admin widzi wszystkie rezerwacje dla danego dnia
    executeQuery();
  }

  function executeQuery() {
    // Sortuj wyniki po godzinie rozpoczęcia
    sql += ' ORDER BY godzina_od';
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error(`Błąd pobierania rezerwacji dla daty ${termin}:`, err);
        return res.status(500).json({ error: 'Błąd serwera przy pobieraniu rezerwacji dla podanej daty.' });
      }
      console.log(`Zwrócono ${results.length} rezerwacji dla daty ${termin} (użytkownik: ${user.login}).`);
      res.json(results); // Zwróć znalezione rezerwacje (lub pustą tablicę)
    });
  }
});

// === Wysyłanie wiadomości ===
app.post('/wiadomosci', isAuthenticated, (req, res) => {
  const { email, tresc } = req.body;
  const nadawca_email = req.session.user.email;

  if (!email || !tresc) {
    return res.status(400).json({ error: 'Email odbiorcy i treść wiadomości są wymagane.' });
  }

  const sql = 'SELECT email FROM uzytkownicy WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Nie znaleziono użytkownika o podanym adresie email.' });
    }

    const odbiorca_email = results[0].email;
    const insertSql = 'INSERT INTO wiadomosci (nadawca_email, odbiorca_email, tresc) VALUES (?, ?, ?)';
    db.query(insertSql, [nadawca_email, odbiorca_email, tresc], (insertErr) => {
      if (insertErr) return res.status(500).json({ error: 'Błąd zapisu wiadomości.' });
      res.json({ success: true, message: 'Wiadomość została wysłana.' });
    });
  });
});
// === Nowy Endpoint: Sprawdzanie statusu nieprzeczytanych wiadomości ===
app.get('/api/unread-status', isAuthenticated, (req, res) => {
  const odbiorcaEmail = req.session.user.email; // Pobierz email z sesji

  // Zapytanie liczące nieprzeczytane wiadomości dla danego odbiorcy
  const sql = 'SELECT COUNT(*) AS unreadCount FROM wiadomosci WHERE odbiorca_email = ? AND is_read = FALSE';

  db.query(sql, [odbiorcaEmail], (err, results) => {
      if (err) {
          console.error(`Błąd sprawdzania nieprzeczytanych wiadomości dla ${odbiorcaEmail}:`, err);
          return res.status(500).json({ error: 'Błąd serwera podczas sprawdzania wiadomości.' });
      }

      // Sprawdź, czy liczba nieprzeczytanych jest większa od 0
      const hasUnread = results[0].unreadCount > 0;
      console.log(`[Unread Check] User: ${odbiorcaEmail}, Has Unread: ${hasUnread}`); // Log do debugowania
      res.json({ hasUnread: hasUnread }); // Zwróć { hasUnread: true } lub { hasUnread: false }
  });
});
// === Nowy Endpoint: Oznaczanie wiadomości jako przeczytane ===
app.post('/api/mark-read', isAuthenticated, (req, res) => {
  const odbiorcaEmail = req.session.user.email; // Pobierz email z sesji

  // Zapytanie aktualizujące status is_read na TRUE dla wiadomości użytkownika, które są nieprzeczytane
  const sql = 'UPDATE wiadomosci SET is_read = TRUE WHERE odbiorca_email = ? AND is_read = FALSE';

  db.query(sql, [odbiorcaEmail], (err, result) => {
      if (err) {
          console.error(`Błąd oznaczania wiadomości jako przeczytane dla ${odbiorcaEmail}:`, err);
          return res.status(500).json({ error: 'Błąd serwera podczas aktualizacji statusu wiadomości.' });
      }

      // result.affectedRows zawiera liczbę zaktualizowanych wierszy
      console.log(`[Mark Read] User: ${odbiorcaEmail}, Marked: ${result.affectedRows} messages as read.`);
      // Odpowiedź 204 No Content jest odpowiednia, bo nie zwracamy żadnych danych
      res.sendStatus(204);
  });
});




// === Pobieranie wiadomości (ZMODYFIKOWANE: dodano is_read) ===
app.get('/wiadomosci', isAuthenticated, (req, res) => {
  const email = req.session.user.email;
  const sql = `
    SELECT w.id, u.imie, u.nazwisko, u.email AS nadawca_email, w.tresc, w.data_wyslania, w.is_read -- Dodano w.is_read
    FROM wiadomosci w
    JOIN uzytkownicy u ON u.email = w.nadawca_email
    WHERE w.odbiorca_email = ?
    ORDER BY w.data_wyslania DESC
  `; // Poprawiono alias dla email nadawcy, żeby uniknąć konfliktu z emailem odbiorcy z sesji
  db.query(sql, [email], (err, results) => {
    if (err) {
        console.error(`Błąd pobierania wiadomości dla ${email}:`, err);
        return res.status(500).json({ error: 'Błąd pobierania wiadomości.' });
    }
    // Zwróć wyniki (teraz zawierają pole is_read)
    res.json(results);
  });
});
// WAŻNE: Upewnij się, że zastępujesz istniejący blok `app.get('/wiadomosci', ...)` tym nowym.

// === Usuwanie wiadomości ===
app.delete('/wiadomosci/:id', isAuthenticated, (req, res) => {
  const id = req.params.id;
  const odbiorcaEmail = req.session.user.email;

  const sql = 'DELETE FROM wiadomosci WHERE id = ? AND odbiorca_email = ?';
  db.query(sql, [id, odbiorcaEmail], (err, result) => {
    if (err) {
      console.error("Błąd usuwania wiadomości:", err);
      return res.status(500).json({ error: 'Błąd serwera przy usuwaniu wiadomości.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Wiadomość nie istnieje lub nie jesteś jej odbiorcą.' });
    }

    res.json({ success: true, message: 'Wiadomość została usunięta.' });
  });
});

// Pobieranie emaili do listy podpowiedzi
app.get('/users/emails', async (req, res) => {
  const query = req.query.query;
  if (!query) return res.json([]);

  try {
    const [rows] = await db.promise().query(
      "SELECT email FROM uzytkownicy WHERE email LIKE ? LIMIT 5",
      [`%${query}%`]
    );
    const emails = rows.map(r => r.email);
    res.json(emails);
  } catch (err) {
    console.error("Błąd pobierania e-maili:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});





// === Uruchomienie serwera ===
// Serwer nasłuchuje na wszystkich interfejsach (0.0.0.0) na podanym porcie,
// więc będzie dostępny przez localhost ORAZ przez publiczny adres IP.
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Serwer działa i nasłuchuje na porcie ${port}`);
  console.log(`   Dostępny pod adresem: http://localhost:${port} oraz http://${getPublicIp()}:${port}`); // Wyświetl oba adresy dla informacji
});

// Funkcja pomocnicza do uzyskania publicznego IP (dla celów informacyjnych w logach)
// Wymaga instalacji: npm install os
const os = require('os');
function getPublicIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Pomijaj adresy inne niż IPv4 oraz adresy wewnętrzne (127.x.x.x)
            if ('IPv4' !== iface.family || iface.internal !== false) {
                continue;
            }
            // Proste sprawdzenie czy to nie jest adres z zakresu prywatnego (może wymagać rozbudowy)
            if (!iface.address.startsWith('192.168.') && !iface.address.startsWith('10.') && !iface.address.startsWith('172.16.')) {
                 // Zakładamy, że pierwszy znaleziony nie-prywatny IPv4 to publiczny IP
                 // UWAGA: To może nie być w 100% niezawodne w złożonych konfiguracjach sieciowych
                 return iface.address;
            }
        }
    }
    return 'NIE_ZNALEZIONO_PUBLICZNEGO_IP'; // Lub zwróć null/pusty string
}