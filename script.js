// Zmienne Globalne
let currentUser = null;
const apiUrl = "http://213.73.1.69:3000";
let availableGroups = [];
let messageCheckIntervalId = null;

// Elementy DOM
const authWrapper = document.getElementById("auth-wrapper");
const loginView = document.getElementById("login-view");
const registerView = document.getElementById("register-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginErrorElement = document.getElementById("login-error");
const registerMessageElement = document.getElementById("register-message");
const logoutButton = document.getElementById("btn-logout");
const userDetailsElement = document.getElementById("user-details");
const navRezerwacje = document.getElementById("nav-rezerwacje");
const navKalendarz = document.getElementById("nav-kalendarz");
const viewRezerwacje = document.getElementById("view-rezerwacje");
const viewKalendarz = document.getElementById("view-kalendarz");
const navWiadomosci = document.getElementById("nav-wiadomosci");
const viewWiadomosci = document.getElementById("view-wiadomosci");
const messageForm = document.getElementById("message-form");
const messageStatus = document.getElementById("message-status");
const receivedMessages = document.getElementById("received-messages");
const recipientEmailInput = document.getElementById("msg-to");
const messageTextarea = document.getElementById("msg-content");
const legend = document.getElementById("legend");
const roomTableBody = document.getElementById("roomTable");
const bookingErrorElement = document.getElementById("booking-error");
const calendarGrid = document.getElementById("calendarGrid");
const calendarDaysHeader = document.getElementById("calendarDays");
const calendarTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const roleSelect = document.getElementById("register-rola");
const studentFields = document.getElementById("student-fields");
const wykladowcaFields = document.getElementById("wykladowca-fields");
const emailInput = document.getElementById("msg-to");
const emailSuggestions = document.getElementById("email-suggestions");
const sidebar = document.querySelector('.sidebar');
const toggleBtn = document.getElementById('toggle-sidebar');

const dayDetailsModal = document.getElementById("day-details-modal");
const modalDateElement = document.getElementById("modal-date");
const modalReservationsList = document.getElementById(
  "modal-reservations-list"
);
const modalCloseButton = dayDetailsModal
  ? dayDetailsModal.querySelector(".close-button")
  : null;
const notificationModal = document.getElementById("notification-modal");
const notificationTitle = document.getElementById("notification-title");
const notificationMessage = document.getElementById("notification-message");
const notificationContent = notificationModal
  ? notificationModal.querySelector(".notification-content")
  : null;
// Ustawienia kalendarza
const daysOfWeek = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];
const monthNames = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];
const calendarYear = new Date().getFullYear();
let currentMonthIndex = new Date().getMonth();

// Funkcje Pomocnicze

// Pokazuje/ukrywa widok logowania/rejestracji
function toggleAuthView(showLogin) {
  loginView.style.display = showLogin ? "block" : "none";
  registerView.style.display = showLogin ? "none" : "block";
  if (loginErrorElement) loginErrorElement.textContent = "";
  if (registerMessageElement) registerMessageElement.textContent = "";
}

// Pokazuje/ukrywa pola specyficzne dla roli w formularzu rejestracji
function toggleRoleSpecificFields() {
  const selectedRole = roleSelect.value;
  studentFields.classList.toggle("visible", selectedRole === "student");
  wykladowcaFields.classList.toggle("visible", selectedRole === "wykladowca");

  const studentInputs = studentFields.querySelectorAll("input");
  studentInputs.forEach((input) => {
    input.required = selectedRole === "student";
  });
}

// Aktualizuje UI po zalogowaniu
function updateUILoggedIn() {
  authWrapper.style.display = "none";
  dashboardView.style.display = "flex";

  userDetailsElement.textContent = currentUser?.imie
    ? `${currentUser.imie} ${currentUser.nazwisko}`
    : currentUser?.login;

  if (
    currentUser?.rola === "wykladowca" ||
    currentUser?.rola === "administrator"
  ) {
    navRezerwacje.style.display = "block";
  } else {
    navRezerwacje.style.display = "none";
  }
}

// Aktualizuje UI po wylogowaniu lub przy braku sesji
function updateUILoggedOut() {
  currentUser = null;
  authWrapper.style.display = "block";
  dashboardView.style.display = "none";

  userDetailsElement.textContent = "...";
  toggleAuthView(true);
}
// Pokazuje modal powiadomienia
function showNotification(title, message, isSuccess = true) {
  if (
    !notificationModal ||
    !notificationTitle ||
    !notificationMessage ||
    !notificationContent
  ) {
    console.error("Brakuje elementów DOM modala powiadomień.");
    alert(`<span class="math-inline">\{title\}\\n\\n</span>{message}`);
    return;
  }
  notificationTitle.textContent = title;
  notificationMessage.textContent = message;

  // Dodaj/usuń klasy dla stylizacji sukcesu/błędu
  notificationContent.classList.toggle("success", isSuccess);
  notificationContent.classList.toggle("error", !isSuccess);

  // Pokaż modal
  notificationModal.classList.remove("hidden");
  notificationModal.classList.add("visible");
}

// Modal powiadomienia dla usuwania wiadomości
function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById("confirm-modal");
  const titleEl = document.getElementById("confirm-title");
  const msgEl = document.getElementById("confirm-message");
  const okBtn = document.getElementById("confirm-ok");
  const cancelBtn = document.getElementById("confirm-cancel");

  if (!modal || !titleEl || !msgEl || !okBtn || !cancelBtn) return;

  titleEl.textContent = title;
  msgEl.textContent = message;

  modal.classList.remove("hidden");
  modal.classList.add("visible");

  const cleanup = () => {
    modal.classList.remove("visible");
    setTimeout(() => modal.classList.add("hidden"), 300);
    okBtn.removeEventListener("click", confirmHandler);
    cancelBtn.removeEventListener("click", cancelHandler);
  };

  const confirmHandler = () => {
    cleanup();
    if (typeof onConfirm === "function") onConfirm();
  };

  const cancelHandler = () => cleanup();

  okBtn.addEventListener("click", confirmHandler);
  cancelBtn.addEventListener("click", cancelHandler);
}

// Ukrywa modal powiadomienia
function hideNotification() {
  if (!notificationModal) return;
  notificationModal.classList.remove("visible");
  setTimeout(() => {
    notificationModal.classList.add("hidden");
  }, 200);
}

async function checkUnreadMessages() {
  if (!currentUser) return;

  try {
    console.log("Sprawdzam status nieprzeczytanych wiadomości...");
    const status = await fetchApi("/api/unread-status");

    const messagesMenuItem = document.getElementById("nav-wiadomosci");
    if (messagesMenuItem) {
      if (status.hasUnread) {
        console.log("Są nieprzeczytane wiadomości - pokazuję kropkę.");
        messagesMenuItem.classList.add("has-notification");
      } else {
        console.log("Brak nieprzeczytanych wiadomości - ukrywam kropkę.");
        messagesMenuItem.classList.remove("has-notification");
      }
    }
  } catch (error) {
    console.error(
      "Błąd podczas sprawdzania statusu nieprzeczytanych wiadomości:",
      error
    );
    const messagesMenuItem = document.getElementById("nav-wiadomosci");
    if (messagesMenuItem) {
      messagesMenuItem.classList.remove("has-notification");
    }
  }
}
async function markMessagesAsRead() {
  if (!currentUser) return;
  try {
    console.log("Oznaczam wiadomości jako przeczytane...");
    await fetchApi("/api/mark-read", { method: "POST" });

    // Natychmiast usuń kropkę wizualnie
    const messagesMenuItem = document.getElementById("nav-wiadomosci");
    if (messagesMenuItem) {
      messagesMenuItem.classList.remove("has-notification");
      console.log(
        "Usunięto kropkę powiadomienia (po oznaczeniu jako przeczytane)."
      );
    }
  } catch (error) {
    console.error(
      "Błąd podczas oznaczania wiadomości jako przeczytane:",
      error
    );
  }
}

// Obsługa API

// Funkcja do wysyłania żądań do API
async function fetchApi(endpoint, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const config = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
    credentials: "include",
  };

  try {
    const response = await fetch(apiUrl + endpoint, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.error || data.message || `Błąd HTTP ${response.status}`;
      console.error(`Błąd API dla ${endpoint}:`, errorMessage);
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error(`Błąd sieci lub fetch dla ${endpoint}:`, error);
    throw error;
  }
}

async function loadMessages() {
  try {
    console.log("Próba pobrania wiadomości z:", apiUrl + "/wiadomosci");
    const messages = await fetchApi("/wiadomosci");
    console.log("Otrzymane wiadomości:", messages);

    receivedMessages.innerHTML = "";

    if (!messages.length) {
      receivedMessages.innerHTML = "<li>Brak wiadomości.</li>";
      return;
    }

    messages.forEach((msg) => {
      const li = document.createElement("li");
      li.classList.add("reservation-item");

      li.innerHTML = `
        <p><strong>Od:</strong> ${msg.imie} ${msg.nazwisko}</p>
        <p><strong>Email:</strong> ${msg.nadawca_email}</p>
        <p><strong>Treść:</strong> ${msg.tresc}</p>
        <small><em>${new Date(msg.data_wyslania).toLocaleString()}</em></small>
        <div style="text-align: right; margin-top: 10px;">
          <button class="delete-message-btn" data-id="${msg.id}" style="
            background-color: #ff3b3b;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
          ">🗑️ Usuń</button>
        </div>
      `;

      receivedMessages.appendChild(li);

      // Obsługa kliknięcia "Usuń"
      const deleteBtn = li.querySelector(".delete-message-btn");
      deleteBtn.addEventListener("click", async () => {
        showConfirmModal(
          "Potwierdzenie",
          "Czy na pewno chcesz usunąć tę wiadomość?",
          async () => {
            try {
              await fetchApi(`/wiadomosci/${msg.id}`, { method: "DELETE" });
              loadMessages();
              showNotification(
                "Usunięto wiadomość",
                "Wiadomość została pomyślnie usunięta.",
                true
              );
            } catch (err) {
              console.error("Błąd usuwania wiadomości:", err);
              showNotification(
                "Błąd",
                err.message || "Nie udało się usunąć wiadomości.",
                false
              );
            }
          }
        );
      });
    });
  } catch (err) {
    console.error("Błąd ładowania wiadomości:", err);
    receivedMessages.innerHTML = "<li>Nie udało się załadować wiadomości.</li>";
  }
}

async function loadGroups() {
  try {
    console.log("Ładowanie listy grup...");
    const groups = await fetchApi("/grupy");
    availableGroups = groups || [];
    console.log("Załadowane grupy:", availableGroups);
  } catch (error) {
    console.error("Nie udało się załadować listy grup:", error);
    availableGroups = [];
  }
}

// Logika Autentykacji

async function handleLogin(event) {
  event.preventDefault();
  loginErrorElement.textContent = "";
  const formData = new FormData(loginForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const result = await fetchApi("/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (result.success && result.user) {
      currentUser = result.user;
      updateUILoggedIn();
      initializeAppLogic();
    } else {
      loginErrorElement.textContent =
        result.error || "Logowanie nie powiodło się.";
    }
  } catch (error) {
    loginErrorElement.textContent =
      error.message || "Wystąpił błąd podczas logowania.";
  }
}

async function handleRegister(event) {
  console.log("--- Funkcja handleRegister została uruchomiona! ---");
  event.preventDefault();
  if (!registerMessageElement || !registerForm) {
    console.error("Brakuje elementów formularza rejestracji!");
    return;
  }
  registerMessageElement.textContent = "";
  registerMessageElement.className = "error-message";

  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData.entries());
  console.log("Zebrane dane formularza:", data);

  if (
    data.rola === "student" &&
    (!data.nr_indeksu || !data.grupa || !data.kierunek)
  ) {
    registerMessageElement.textContent =
      "Wypełnij wszystkie pola dla studenta (numer indeksu, grupa, kierunek).";
    return;
  }

  console.log("Próba wysłania danych rejestracji do API...");
  try {
    const result = await fetchApi("/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    console.log("Odpowiedź z API /register:", result);

    if (result.success) {
      registerMessageElement.textContent =
        result.message || "Rejestracja pomyślna! Możesz się teraz zalogować.";
      registerMessageElement.className = "success-message";
      registerForm.reset();
      toggleRoleSpecificFields();
      setTimeout(() => {
        toggleAuthView(true);
      }, 2000);
    } else {
      registerMessageElement.textContent =
        result.error || "Rejestracja nie powiodła się.";
    }
  } catch (error) {
    registerMessageElement.textContent =
      error?.message || "Wystąpił błąd podczas rejestracji.";
  }
}
async function handleLogout() {
  if (messageCheckIntervalId) {
    clearInterval(messageCheckIntervalId);
    console.log(
      `Zatrzymano interwał sprawdzania wiadomości (ID: ${messageCheckIntervalId})`
    ); // Log
    messageCheckIntervalId = null;
  }
  try {
    await fetchApi("/logout", { method: "POST" });
    updateUILoggedOut();
  } catch (error) {
    console.error("Błąd podczas wylogowywania na backendzie:", error);
    updateUILoggedOut();
    alert(
      "Wystąpił błąd podczas komunikacji z serwerem przy wylogowaniu, ale zostałeś wylogowany lokalnie."
    );
  }
}

// Otwiera modal i ładuje dane dla wybranej daty
async function openDayDetailsModal(dateString) {
  if (!dayDetailsModal || !modalDateElement || !modalReservationsList) {
    console.error("Brakuje elementów DOM modala.");
    return;
  }
  console.log("Otwieram modal dla daty:", dateString);

  modalDateElement.textContent = dateString;
  modalReservationsList.innerHTML =
    '<p class="no-reservations">Ładowanie rezerwacji...</p>';

  dayDetailsModal.classList.remove("hidden");
  dayDetailsModal.classList.add("visible");

  try {
    // Pobierz rezerwacje dla tej daty z nowego endpointu
    const reservations = await fetchApi(`/rezerwacje/data/${dateString}`);

    modalReservationsList.innerHTML = "";

    if (reservations && reservations.length > 0) {
      reservations.forEach((r) => {
        const item = document.createElement("div");
        item.classList.add("reservation-item");
        const timeFrom = r.godzina_od ? r.godzina_od.substring(0, 5) : "??:??";
        const timeTo = r.godzina_do ? r.godzina_do.substring(0, 5) : "??:??";
        let bookedBy = "";
        if (r.rola === "wykladowca" && r.tytul_naukowy) {
          bookedBy += r.tytul_naukowy + " ";
        }
        if (r.rezerwujacy_imie || r.rezerwujacy_nazwisko) {
          bookedBy += `${r.rezerwujacy_imie || ""} ${
            r.rezerwujacy_nazwisko || ""
          }`.trim();
        } else {
          if (!bookedBy) {
            bookedBy = "(brak danych)";
          }
        }
        bookedBy = bookedBy.trim();
        if (!bookedBy) {
          bookedBy = "(brak danych)";
        }

        item.innerHTML = `
                  <p><strong>Sala:</strong> ${r.nr_sali || "?"}</p>
                  <p><strong>Godziny:</strong> ${timeFrom} - ${timeTo}</p>
                  <p><strong>Grupa:</strong> ${r.grupa || "?"}</p>
                  <p><strong>Typ sali:</strong> ${r.typ || "?"}</p>
                  <p><strong>Zarezerwował/a:</strong> ${bookedBy}</p>
              `;
        modalReservationsList.appendChild(item);
      });
    } else {
      modalReservationsList.innerHTML =
        '<p class="no-reservations">Brak rezerwacji na ten dzień.</p>';
    }
  } catch (error) {
    console.error(`Błąd pobierania rezerwacji dla daty ${dateString}:`, error);
    modalReservationsList.innerHTML = `<p class="error-message" style="color: #ff8080;">Nie udało się załadować rezerwacji: ${error.message}</p>`;
  }
}

// Zamyka modal
function closeDayDetailsModal() {
  if (!dayDetailsModal) return;
  dayDetailsModal.classList.remove("visible");
  setTimeout(() => {
    dayDetailsModal.classList.add("hidden");
  }, 300);
}

// Funkcja obsługująca kliknięcie dnia w kalendarzu
function handleDayClick(event) {
  const clickedCell = event.currentTarget;
  const dateString = clickedCell.dataset.date;

  if (dateString) {
    console.log(`Kliknięto dzień: ${dateString}`);
    openDayDetailsModal(dateString);
  } else {
    console.warn("Kliknięto komórkę bez daty.");
  }
}

// Logika Aplikacji (po zalogowaniu)

// Funkcja przełączająca między widokami Rezerwacje/Kalendarz
const toggleView = (viewName) => {
  if (!currentUser) return;

  bookingErrorElement.textContent = "";

  viewWiadomosci.classList.add("hidden");
  navWiadomosci.classList.remove("active");

  if (
    viewName === "rezerwacje" &&
    (currentUser.rola === "wykladowca" || currentUser.rola === "administrator")
  ) {
    viewRezerwacje.classList.remove("hidden");
    viewKalendarz.classList.add("hidden");
    navRezerwacje.classList.add("active");
    navKalendarz.classList.remove("active");
    legend.style.visibility = "hidden";
    loadRooms();
  } else {
    viewRezerwacje.classList.add("hidden");
    viewKalendarz.classList.remove("hidden");
    navRezerwacje.classList.remove("active");
    navKalendarz.classList.add("active");
    legend.style.visibility = "visible";
    renderCurrentMonth();
  }
};

// Ładuje listę sal i wypełnia tabelę
const loadRooms = async () => {
  if (
    !currentUser ||
    (currentUser.rola !== "wykladowca" && currentUser.rola !== "administrator")
  )
    return;
  if (availableGroups.length === 0) {
    console.log("Lista grup pusta, próba ponownego załadowania w loadRooms...");
    await loadGroups();
  }
  try {
    const rooms = await fetchApi("/sale");
    roomTableBody.innerHTML = "";
    rooms.forEach((room) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${room.nr_sali}</td>
        <td>${room.ilosc_miejsc}</td>
        <td>${room.typ}</td>
        <td>
        <select class="grupa-select" required>
        <option value="">-- Wybierz grupę --</option>
        </select>
        </td>
        <td><input type="date" class="termin-input" required></td>
        <td><input type="time" class="godzina-od-input" required step="1800"></td>
        <td><input type="time" class="godzina-do-input" required step="1800"></td>
        <td><button class="booking-button">Zarezerwuj</button></td>
      `;
      roomTableBody.appendChild(row);
      const selectElement = row.querySelector(".grupa-select");
      if (availableGroups && selectElement) {
        availableGroups.forEach((groupName) => {
          if (groupName) {
            const option = document.createElement("option");
            option.value = groupName;
            option.textContent = groupName;
            selectElement.appendChild(option);
          }
        });
      } else {
        console.warn(
          `Nie można znaleźć elementu select lub brak załadowanych grup dla sali ${room.nr_sali}`
        );
      }
      row
        .querySelector(".booking-button")
        .addEventListener("click", async () => {
          bookingErrorElement.textContent = "";
          const grupa = selectElement.value;
          if (!grupa) {
            showNotification(
              "Błąd rezerwacji",
              "Musisz wybrać grupę przed dokonaniem rezerwacji.",
              false
            );
            return;
          }
          
          const termin = row.querySelector(".termin-input").value;
          const godzina_od = row.querySelector(".godzina-od-input").value;
          const godzina_do = row.querySelector(".godzina-do-input").value;

          if (!grupa || !termin || !godzina_od || !godzina_do) {
            showNotification(
              "Błąd rezerwacji",
              "Wszystkie pola (grupa, data, godzina od, godzina do) są wymagane.",
              false
            );
            return;
          }
          
          if (godzina_do <= godzina_od) {
            showNotification(
              "Błąd rezerwacji",
              "Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia.",
              false
            );
            return;
          }
          

          try {
            let typRezerwacji = room.typ.toLowerCase();
            if (typRezerwacji === "wykładowa") typRezerwacji = "wykladowa";

            const result = await fetchApi("/rezerwacje", {
              method: "POST",
              body: JSON.stringify({
                nr_sali: room.nr_sali,
                grupa: grupa,
                typ: typRezerwacji,
                termin: termin,
                godzina_od: godzina_od,
                godzina_do: godzina_do,
              }),
            });

            showNotification(
              "Rezerwacja Udana",
              "Sala została zarezerwowana pomyślnie.",
              true
            );
            selectElement.value = "";
            row.querySelector(".termin-input").value = "";
            row.querySelector(".godzina-od-input").value = "";
            row.querySelector(".godzina-do-input").value = "";
            renderCurrentMonth();
          } catch (error) {
            console.error("Błąd podczas rezerwacji:", error);
            showNotification(
              "Błąd rezerwacji",
              error.message || "Wystąpił błąd podczas rezerwacji.",
              false
            );
            
          }
        });
    });
    document
      .querySelectorAll(".booking-button")
      .forEach((btn) => (btn.style.display = "inline-block"));
  } catch (error) {
    console.error("Nie udało się załadować sal:", error);
    if (viewRezerwacje && !viewRezerwacje.classList.contains("hidden")) {
      roomTableBody.innerHTML = `<tr><td colspan="8" style="color: red;">Błąd ładowania listy sal: ${error.message}</td></tr>`;
    }
  }
};

// Renderuje nagłówek z dniami tygodnia
const renderDaysOfWeek = () => {
  calendarDaysHeader.innerHTML = "";
  daysOfWeek.forEach((day) => {
    const div = document.createElement("div");
    div.textContent = day;
    calendarDaysHeader.appendChild(div);
  });
};

// Renderuje kalendarz na dany miesiąc i rok
const renderCurrentMonth = async () => {
  if (!currentUser) return;

  const month = currentMonthIndex;
  const year = calendarYear;

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDayOfWeek = firstDayOfMonth.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  calendarTitle.textContent = `${monthNames[month]} ${year}`;
  calendarGrid.innerHTML = "";

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarGrid.innerHTML += `<div class="empty-day"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    // Formatowanie daty na YYYY-MM-DD
    const dayString = day < 10 ? "0" + day : day;
    const monthString = month + 1 < 10 ? "0" + (month + 1) : month + 1;
    // Poprawne tworzenie stringa daty YYYY-MM-DD
    const dateString = `${year}-${monthString}-${dayString}`;

    // Zapisz poprawną datę w atrybucie data-date
    cell.dataset.date = dateString;
    cell.classList.add("calendar-day");
    const numberDiv = document.createElement("div");
    numberDiv.className = "day-number";
    numberDiv.innerHTML = `${day} <span class="dot-placeholder"></span>`;
    cell.appendChild(numberDiv);

    const today = new Date();
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }
    cell.addEventListener("click", handleDayClick);
    calendarGrid.appendChild(cell);
  }

  // Pobierz rezerwacje
  try {
    const rezerwacje = await fetchApi("/rezerwacje");

    rezerwacje.forEach((r) => {
      const rezerwacjaData = new Date(r.termin);
      const rezerwacjaMiesiac = rezerwacjaData.getMonth();
      const rezerwacjaDzien = rezerwacjaData.getDate();
      const rezerwacjaRok = rezerwacjaData.getFullYear();

      if (rezerwacjaMiesiac === month && rezerwacjaRok === year) {
        const cellIndex = rezerwacjaDzien - 1 + startDayOfWeek;
        const dayCell = calendarGrid.children[cellIndex];

        if (dayCell && dayCell.querySelector(".dot-placeholder")) {
          const dotPlaceholder = dayCell.querySelector(".dot-placeholder");
          const dot = document.createElement("span");
          dot.classList.add("dot");

          let typ = r.typ ? r.typ.toLowerCase() : "unknown";
          if (typ === "aula") dot.classList.add("blue");
          else if (typ === "wykladowa") dot.classList.add("violet");
          else if (typ === "komputerowa") dot.classList.add("red");
          else dot.classList.add("grey");

          dot.title = `Sala ${r.nr_sali}, ${r.godzina_od.substring(
            0,
            5
          )}-${r.godzina_do.substring(0, 5)}, Grupa: ${r.grupa}`;
          dotPlaceholder.appendChild(dot);
        }
      }
    });
  } catch (error) {
    console.error("Nie udało się załadować rezerwacji dla kalendarza:", error);
    calendarGrid.innerHTML = `<div style="color: red; grid-column: 1 / -1; text-align: center; padding: 20px;">Błąd ładowania rezerwacji: ${error.message}</div>`;
  }
};

// Funkcja do autorefreshu wiadomości
async function startMessagePolling() {
  try {
    await loadMessages();
  } catch (err) {
    console.error("Błąd podczas polling wiadomości:", err);
  } finally {
    setTimeout(startMessagePolling, 5000);
  }
}

// Inicjalizuje logikę aplikacji (nawigacja, kalendarz)
const initializeAppLogic = () => {
  console.log("Inicjalizacja logiki aplikacji...");
  loadGroups();
  if (!currentUser) {
    console.warn(
      "Próba inicjalizacji logiki aplikacji bez zalogowanego użytkownika."
    );
    return;
  }
  // Pobieramy referencje do przycisków wewnątrz notification-modal
  const notificationCloseButton = notificationModal
    ? notificationModal.querySelector(".close-button")
    : null;
  const notificationOkButton = notificationModal
    ? notificationModal.querySelector("button")
    : null; // Znajdź przycisk OK

  // Listener dla przycisku 'X' w modalu powiadomień
  if (
    notificationCloseButton &&
    !notificationCloseButton.dataset.listenerAttached
  ) {
    notificationCloseButton.addEventListener("click", hideNotification);
    notificationCloseButton.dataset.listenerAttached = "true"; // Oznacz jako dodany
  }
  // Listener dla przycisku 'OK' w modalu powiadomień
  if (notificationOkButton && !notificationOkButton.dataset.listenerAttached) {
    notificationOkButton.addEventListener("click", hideNotification);
    notificationOkButton.dataset.listenerAttached = "true";
  }
  // Listener dla zamykania modala powiadomień przez kliknięcie tła (overlay)
  if (notificationModal && !notificationModal.dataset.overlayListener) {
    notificationModal.addEventListener("click", (event) => {
      if (event.target === notificationModal) {
        hideNotification();
      }
    });
    notificationModal.dataset.overlayListener = "true";
  }
  // START SPRAWDZANIA POWIADOMIEŃ
  checkUnreadMessages();

  if (messageCheckIntervalId) {
    clearInterval(messageCheckIntervalId);
  }
  // Sprawdzaj co 60 sekund
  messageCheckIntervalId = setInterval(checkUnreadMessages, 60000);
  console.log(
    `Ustawiono interwał sprawdzania wiadomości (ID: ${messageCheckIntervalId})`
  );

  // Ustaw nasłuchiwacze
  if (!navRezerwacje.dataset.listenerAttached) {
    navRezerwacje.onclick = () => toggleView("rezerwacje");
    navRezerwacje.dataset.listenerAttached = "true";
  }
  if (!navKalendarz.dataset.listenerAttached) {
    navKalendarz.onclick = () => toggleView("kalendarz");
    navKalendarz.dataset.listenerAttached = "true";
  }
  if (navWiadomosci && !navWiadomosci.dataset.listenerAttached) {
    navWiadomosci.onclick = () => {
      console.log("Kliknięto Wiadomości");
      viewRezerwacje.classList.add("hidden");
      viewKalendarz.classList.add("hidden");
      viewWiadomosci.classList.remove("hidden");
      navRezerwacje.classList.remove("active");
      navKalendarz.classList.remove("active");
      navWiadomosci.classList.add("active");
      legend.style.visibility = "hidden";

      // Wywołaj funkcję oznaczania jako przeczytane
      markMessagesAsRead();

      loadMessages();
    };
    navWiadomosci.dataset.listenerAttached = "true";
  }

  if (!prevMonthBtn.dataset.listenerAttached) {
    prevMonthBtn.onclick = () => {
      if (currentMonthIndex > 0) currentMonthIndex--;
      else return;
      renderCurrentMonth();
    };
    prevMonthBtn.dataset.listenerAttached = "true";
  }
  if (!nextMonthBtn.dataset.listenerAttached) {
    nextMonthBtn.onclick = () => {
      if (currentMonthIndex < 11) currentMonthIndex++;
      else return;
      renderCurrentMonth();
    };
    nextMonthBtn.dataset.listenerAttached = "true";
  }
  if (!logoutButton.dataset.listenerAttached) {
    logoutButton.onclick = handleLogout;
    logoutButton.dataset.listenerAttached = "true";
  }

  // Listener do zamykania modala przez przycisk X
  if (modalCloseButton) {
    if (!modalCloseButton.dataset.listenerAttached) {
      modalCloseButton.addEventListener("click", closeDayDetailsModal);
      modalCloseButton.dataset.listenerAttached = "true";
    }
  } else {
    console.warn("Nie znaleziono przycisku zamknięcia modala.");
  }

  // Listener do zamykania modala przez kliknięcie overlay'a
  if (dayDetailsModal) {
    if (!dayDetailsModal.dataset.overlayListener) {
      dayDetailsModal.addEventListener("click", (event) => {
        if (event.target === dayDetailsModal) {
          closeDayDetailsModal();
        }
      });
      dayDetailsModal.dataset.overlayListener = "true";
    }
  } else {
    console.warn("Nie znaleziono elementu modala.");
  }
  renderDaysOfWeek();

  // Ustaw początkowy widok na podstawie roli
  if (
    currentUser.rola === "wykladowca" ||
    currentUser.rola === "administrator"
  ) {
    toggleView("rezerwacje"); // Zacznij od widoku rezerwacji
  } else {
    toggleView("kalendarz"); // Zacznij od widoku kalendarza
  }
};

// Inicjalizacja Strony
window.onload = async () => {
  console.log("DOM załadowany, sprawdzanie sesji...");

  // Dodaj listener do formularza logowania
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  // Dodaj listener do formularza rejestracji
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  } else {
    console.warn("Nie znaleziono formularza rejestracji.");
  }
  // Dodaj listener do zmiany roli w rejestracji
  if (roleSelect) {
    roleSelect.addEventListener("change", toggleRoleSpecificFields);
    toggleRoleSpecificFields();
  }

  // Sprawdź, czy użytkownik ma aktywną sesję na backendzie
  try {
    const sessionData = await fetchApi("/check-session");
    if (sessionData.isLoggedIn && sessionData.user) {
      console.log("Znaleziono aktywną sesję dla:", sessionData.user.login);
      currentUser = sessionData.user;
      updateUILoggedIn();
      initializeAppLogic();
    } else {
      console.log("Brak aktywnej sesji.");
      updateUILoggedOut();
    }
  } catch (error) {
    console.error("Błąd podczas sprawdzania sesji:", error);
    updateUILoggedOut();
    loginErrorElement.textContent = "Nie można połączyć się z serwerem.";
  }

  if (messageForm) {
    messageForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("msg-to").value;
      const tresc = document.getElementById("msg-content").value;

      console.log("Wysyłanie wiadomości:");
      console.log("URL:", apiUrl + "/wiadomosci");
      console.log("Dane:", { email, tresc });

      try {
        const result = await fetchApi("/wiadomosci", {
          method: "POST",
          body: JSON.stringify({ email, tresc }),
        });

        console.log("Odpowiedź z API:", result);

        messageStatus.textContent = result.message;
        messageStatus.style.color = "lightgreen";
        messageForm.reset();
        await loadMessages();
      } catch (err) {
        console.error("Błąd wysyłania wiadomości:", err);
        messageStatus.textContent =
          err.message || "Błąd podczas wysyłania wiadomości.";
        messageStatus.style.color = "red";
      }
    });
  }

  emailInput.addEventListener("input", async () => {
    const query = emailInput.value;

    if (query.length < 2) return;

    try {
      const suggestions = await fetchApi(
        `/users/emails?query=${encodeURIComponent(query)}`
      );
      emailSuggestions.innerHTML = "";

      suggestions.forEach((email) => {
        const option = document.createElement("option");
        option.value = email;
        emailSuggestions.appendChild(option);
      });
    } catch (err) {
      console.error("Błąd pobierania sugestii email:", err);
    }
  });
};

    document.querySelector('.hamburger').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
  });
  

  toggleBtn.addEventListener('click', () => {
    const isActive = sidebar.classList.toggle('active');
    toggleBtn.textContent = isActive ? '✖' : '☰';

    // Blokowanie lub przywracanie scrolla
    if (isActive && window.innerWidth <= 768) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  });



  