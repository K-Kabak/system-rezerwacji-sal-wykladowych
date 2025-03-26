// Ładowanie sal z bazy
fetch('http://213.73.1.69:3000/sale')
  .then(res => res.json())
  .then(rooms => {
    const tbody = document.getElementById("roomTable");
    tbody.innerHTML = "";
    rooms.forEach(room => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${room.nr_sali}</td>
        <td>${room.ilosc_miejsc}</td>
        <td>${room.typ}</td>
        <td><select><option>${room.typ}</option></select></td>
        <td><input type="date" /></td>
        <td><input type="time" /></td>
        <td><button>Zarezerwuj</button></td>
      `;
      tbody.appendChild(row);

      row.querySelector("button").addEventListener("click", () => {
        const termin = row.querySelector("input[type='date']").value;
        const godzina = row.querySelector("input[type='time']").value;
        const typ = room.typ.toLowerCase();
        const grupa = "Grupa 1"; // na razie na sztywno

        if (!termin || !godzina) {
          alert("Uzupełnij datę i godzinę.");
          return;
        }

        fetch('http://213.73.1.69:3000/rezerwacje', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nr_sali: room.nr_sali,
            grupa,
            typ,
            termin,
            godzina_od: godzina,
            godzina_do: godzina
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Zarezerwowano!");
            renderCurrentMonth(); // odśwież kalendarz
          }
        });
      });
    });
  });

// Nawigacja
const navRezerwacje = document.getElementById('nav-rezerwacje');
const navKalendarz = document.getElementById('nav-kalendarz');
const viewRezerwacje = document.getElementById('view-rezerwacje');
const viewKalendarz = document.getElementById('view-kalendarz');

navRezerwacje.onclick = () => {
  viewRezerwacje.classList.remove('hidden');
  viewKalendarz.classList.add('hidden');
  navRezerwacje.classList.add('active');
  navKalendarz.classList.remove('active');
};

navKalendarz.onclick = () => {
  viewRezerwacje.classList.add('hidden');
  viewKalendarz.classList.remove('hidden');
  navRezerwacje.classList.remove('active');
  navKalendarz.classList.add('active');
};

// Kalendarz
const calendarGrid = document.getElementById("calendarGrid");
const calendarDays = document.getElementById("calendarDays");
const calendarTitle = document.getElementById("monthTitle");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const daysOfWeek = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];
const monthNames = [
  "Styczeń", "Luty", "Marzec", "Kwiecień",
  "Maj", "Czerwiec", "Lipiec", "Sierpień",
  "Wrzesień", "Październik", "Listopad", "Grudzień"
];

const visibleMonths = [2, 3, 4, 5]; // Marzec–Czerwiec
let currentIndex = visibleMonths.indexOf(new Date().getMonth());
if (currentIndex === -1) currentIndex = 0;

renderDaysOfWeek();
renderCurrentMonth();

prevBtn.onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentMonth();
  }
};

nextBtn.onclick = () => {
  if (currentIndex < visibleMonths.length - 1) {
    currentIndex++;
    renderCurrentMonth();
  }
};

function renderDaysOfWeek() {
  calendarDays.innerHTML = '';
  daysOfWeek.forEach(d => {
    const div = document.createElement("div");
    div.textContent = d;
    calendarDays.appendChild(div);
  });
}

function renderCurrentMonth() {
  const year = 2025;
  const month = visibleMonths[currentIndex];

  const firstDay = new Date(year, month, 1);
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = (startDayOfWeek + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarTitle.textContent = `${monthNames[month]} ${year}`;
  calendarGrid.innerHTML = "";

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarGrid.innerHTML += `<div></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = day;
    cell.appendChild(number);
    calendarGrid.appendChild(cell);
  }

  // Ładowanie rezerwacji z bazy
  fetch('http://213.73.1.69:3000/rezerwacje')
    .then(res => res.json())
    .then(rezerwacje => {
      rezerwacje.forEach(r => {
        const data = new Date(r.termin);
        const miesiac = data.getMonth();
        const dzien = data.getDate();

        if (miesiac === month) {
          const index = [...calendarGrid.children].findIndex(child => {
            const num = child.querySelector('.day-number');
            return num && parseInt(num.textContent) === dzien;
          });

          if (index !== -1) {
            const dot = document.createElement('div');
            dot.classList.add('dot');

            // Kolor zależny od typu
            if (r.typ === 'aula') dot.classList.add('blue');
            else if (r.typ === 'wykladowa') dot.classList.add('violet');
            else if (r.typ === 'komputerowa') dot.classList.add('red');

            calendarGrid.children[index].appendChild(dot);
          }
        }
      });
    });
}
