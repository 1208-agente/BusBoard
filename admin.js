const store = window.BusBoardStore;

const els = {
  loginView: document.querySelector("#loginView"),
  loginForm: document.querySelector("#loginForm"),
  loginUser: document.querySelector("#loginUser"),
  loginPass: document.querySelector("#loginPass"),
  loginMessage: document.querySelector("#loginMessage"),
  logout: document.querySelector("#logout"),
  form: document.querySelector("#scheduleForm"),
  tripId: document.querySelector("#tripId"),
  day: document.querySelector("#day"),
  dayChecks: document.querySelector("#dayChecks"),
  activeStation: document.querySelector("#activeStation"),
  stationForm: document.querySelector("#stationForm"),
  stationId: document.querySelector("#stationId"),
  stationName: document.querySelector("#stationName"),
  stationActive: document.querySelector("#stationActive"),
  clearStationForm: document.querySelector("#clearStationForm"),
  stationRows: document.querySelector("#stationRows"),
  departureTime: document.querySelector("#departureTime"),
  arrivalTime: document.querySelector("#arrivalTime"),
  company: document.querySelector("#company"),
  origin: document.querySelector("#origin"),
  destination: document.querySelector("#destination"),
  route: document.querySelector("#route"),
  status: document.querySelector("#status"),
  delay: document.querySelector("#delay"),
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  clearForm: document.querySelector("#clearForm"),
  tripRows: document.querySelector("#tripRows"),
  adminMessage: document.querySelector("#adminMessage"),
  csvFile: document.querySelector("#csvFile"),
  downloadTemplate: document.querySelector("#downloadTemplate"),
  exportCsv: document.querySelector("#exportCsv"),
  resetData: document.querySelector("#resetData"),
  copyMonday: document.querySelector("#copyMonday"),
  listTitle: document.querySelector("#listTitle"),
  listSubtitle: document.querySelector("#listSubtitle"),
  adForm: document.querySelector("#adForm"),
  adId: document.querySelector("#adId"),
  adStation: document.querySelector("#adStation"),
  adType: document.querySelector("#adType"),
  adTitle: document.querySelector("#adTitle"),
  adText: document.querySelector("#adText"),
  adMediaUrl: document.querySelector("#adMediaUrl"),
  adTargetUrl: document.querySelector("#adTargetUrl"),
  adOrder: document.querySelector("#adOrder"),
  adActive: document.querySelector("#adActive"),
  clearAdForm: document.querySelector("#clearAdForm"),
  adRows: document.querySelector("#adRows"),
  adCsvFile: document.querySelector("#adCsvFile"),
  downloadAdTemplate: document.querySelector("#downloadAdTemplate")
};

const LOGIN_KEY = "busboard.admin.logged.v1";
const LOGIN_USER = "admin";
const LOGIN_PASS = "1234";

function applyLoginState() {
  const logged = sessionStorage.getItem(LOGIN_KEY) === "yes";
  els.loginView.classList.toggle("hidden", logged);
  document.body.classList.toggle("locked", !logged);
}

async function syncRemoteData() {
  if (!window.BusBoardBackend?.enabled()) {
    return;
  }

  try {
    const schedules = await window.BusBoardBackend.loadSchedules();
    if (schedules && hasAnyTrips(schedules)) {
      store.save(schedules);
      renderStations();
      renderList();
    }

    const ads = await window.BusBoardBackend.loadAdsRaw?.();
    if (ads) {
      store.saveAds(ads);
      renderAds();
    }

    const stations = await window.BusBoardBackend.loadStations?.();
    if (stations?.length) {
      store.saveStations(stations);
      renderStations();
      renderStationRows();
      renderAdStationOptions();
    }
  } catch (error) {
    message(`No se pudo leer Supabase: ${error.message}`, "error");
  }
}

function hasAnyTrips(schedules) {
  return store.DAYS.some(([day]) => (schedules[day] || []).length > 0);
}

function initDays() {
  els.dayChecks.innerHTML = store.DAYS.map(([key, label]) => (
    `<label class="day-check"><input type="checkbox" value="${key}"> ${label}</label>`
  )).join("");
  setSelectedDays([store.todayKey()]);
}

function selectedDays() {
  const days = Array.from(els.dayChecks.querySelectorAll("input:checked")).map((input) => input.value);
  return days.length ? days : [store.todayKey()];
}

function setSelectedDays(days) {
  const selected = new Set(days);
  els.dayChecks.querySelectorAll("input").forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function primarySelectedDay() {
  return selectedDays()[0];
}

function renderStations() {
  const stationNames = store.stations(data());
  const active = store.getActiveStation();
  if (!stationNames.includes(active)) {
    stationNames.unshift(active);
  }

  els.activeStation.innerHTML = stationNames.map((station) => (
    `<option value="${escapeHtml(station)}">${escapeHtml(station)}</option>`
  )).join("");
  els.activeStation.value = active;
  renderTripStationOptions();
  renderAdStationOptions();
}

function renderTripStationOptions() {
  const stations = store.readStations().filter((station) => station.active);
  const originValue = els.origin.value || store.getActiveStation();
  const destinationValue = els.destination.value || stations.find((station) => station.name !== originValue)?.name || originValue;
  const options = stations.map((station) => (
    `<option value="${escapeHtml(station.name)}">${escapeHtml(station.name)}</option>`
  )).join("");
  els.origin.innerHTML = options;
  els.destination.innerHTML = options;
  els.origin.value = stations.some((station) => station.name === originValue) ? originValue : stations[0]?.name || "";
  els.destination.value = stations.some((station) => station.name === destinationValue) ? destinationValue : stations[0]?.name || "";
}

function renderAdStationOptions() {
  const currentValue = els.adStation.value || store.getActiveStation();
  const options = [
    ["all", "Todas las estaciones"],
    ...store.readStations().filter((station) => station.active).map((station) => [station.name, station.name])
  ];
  els.adStation.innerHTML = options.map(([value, label]) => (
    `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
  )).join("");
  els.adStation.value = options.some(([value]) => value === currentValue) ? currentValue : "all";
}

function data() {
  return store.read();
}

function save(dataToSave) {
  store.save(dataToSave);
  renderList();
}

function message(text, type = "ok") {
  els.adminMessage.textContent = text;
  els.adminMessage.dataset.type = type;
}

function resetForm() {
  els.tripId.value = "";
  els.departureTime.value = "";
  els.arrivalTime.value = "";
  els.company.value = "";
  els.origin.value = "";
  els.destination.value = "";
  els.route.value = "";
  els.status.value = "on_time";
  els.delay.value = "0";
  els.startDate.value = "";
  els.endDate.value = "";
}

function selectedTrips() {
  const current = data();
  return (current[primarySelectedDay()] || []).sort((a, b) => a.departure_time.localeCompare(b.departure_time));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function renderList() {
  const dayLabel = store.dayLabel(primarySelectedDay());
  const rows = selectedTrips();
  els.listTitle.textContent = `Itinerarios de ${dayLabel}`;
  els.listSubtitle.textContent = `${rows.length} viaje(s) unico(s) cargado(s) para este dia.`;

  els.tripRows.innerHTML = rows.map((item) => `
    <tr>
      <td>${escapeHtml(item.company)}</td>
      <td>${escapeHtml(item.departure_time)}</td>
      <td>${escapeHtml(item.arrival_time)}</td>
      <td>${escapeHtml(item.origin)}</td>
      <td>${escapeHtml(item.destination)}</td>
      <td>${escapeHtml(item.route)}</td>
      <td>${store.STATUS_LABELS[item.status] || item.status}</td>
      <td>${Number(item.delay || 0)} min</td>
      <td>${seasonLabel(item)}</td>
      <td class="actions-cell">
        <button data-action="edit" data-id="${item.id}" type="button">Editar</button>
        <button data-action="delete" data-id="${item.id}" class="danger" type="button">Borrar</button>
      </td>
    </tr>
  `).join("");
}

function renderStationRows() {
  els.stationRows.innerHTML = store.readStations().map((station) => `
    <tr>
      <td>${escapeHtml(station.name)}</td>
      <td>${station.active ? "Si" : "No"}</td>
      <td class="actions-cell">
        <button data-station-action="edit" data-id="${station.id}" type="button">Editar</button>
        <button data-station-action="delete" data-id="${station.id}" class="danger" type="button">Borrar</button>
      </td>
    </tr>
  `).join("");
}

function resetStationForm() {
  els.stationId.value = "";
  els.stationName.value = "";
  els.stationActive.checked = true;
}

async function saveStation(event) {
  event.preventDefault();
  const stations = store.readStations();
  const id = els.stationId.value || `station-${Date.now()}`;
  const station = {
    id,
    name: els.stationName.value.trim(),
    active: els.stationActive.checked
  };

  const next = stations.filter((item) => item.id !== id && item.name.toLowerCase() !== station.name.toLowerCase());
  next.push(station);
  store.saveStations(next);

  try {
    const savedStation = await window.BusBoardBackend?.upsertStation?.(station);
    if (savedStation?.id && savedStation.id !== station.id) {
      const updated = store.readStations().filter((item) => item.id !== station.id);
      updated.push(savedStation);
      store.saveStations(updated);
    }
  } catch (error) {
    message(`Estacion guardada local, pero fallo Supabase: ${error.message}`, "error");
    return;
  }

  renderStations();
  renderStationRows();
  renderTripStationOptions();
  renderAdStationOptions();
  resetStationForm();
  message("Estacion guardada.");
}

function editStation(id) {
  const station = store.readStations().find((item) => item.id === id);
  if (!station) {
    return;
  }
  els.stationId.value = station.id;
  els.stationName.value = station.name;
  els.stationActive.checked = station.active;
  message("Editando estacion seleccionada.");
}

async function deleteStation(id) {
  const next = store.readStations().filter((item) => item.id !== id);
  store.saveStations(next);

  try {
    await window.BusBoardBackend?.deleteStation?.(id);
  } catch (error) {
    message(`Estacion borrada local, pero fallo Supabase: ${error.message}`, "error");
    return;
  }

  renderStations();
  renderStationRows();
  renderTripStationOptions();
  renderAdStationOptions();
  message("Estacion borrada.");
}

function adsData() {
  return store.readAds().sort((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title));
}

function renderAds() {
  els.adRows.innerHTML = adsData().map((ad) => `
    <tr>
      <td>${escapeHtml(ad.station)}</td>
      <td>${escapeHtml(ad.type)}</td>
      <td>${escapeHtml(ad.title)}</td>
      <td>${escapeHtml(ad.media_url || "")}</td>
      <td>${escapeHtml(ad.target_url || "")}</td>
      <td>${Number(ad.display_order || 0)}</td>
      <td>${ad.active ? "Si" : "No"}</td>
      <td class="actions-cell">
        <button data-ad-action="edit" data-id="${ad.id}" type="button">Editar</button>
        <button data-ad-action="delete" data-id="${ad.id}" class="danger" type="button">Borrar</button>
      </td>
    </tr>
  `).join("");
}

function resetAdForm() {
  els.adId.value = "";
  els.adStation.value = store.getActiveStation();
  renderAdStationOptions();
  els.adType.value = "youtube";
  els.adTitle.value = "";
  els.adText.value = "";
  els.adMediaUrl.value = "";
  els.adTargetUrl.value = "";
  els.adOrder.value = "100";
  els.adActive.checked = true;
}

async function saveAd(event) {
  event.preventDefault();
  const ads = store.readAds();
  const id = els.adId.value || `ad-${Date.now()}`;
  const ad = {
    id,
    station: els.adStation.value.trim() || "all",
    title: els.adTitle.value.trim(),
    text: els.adText.value.trim(),
    type: els.adType.value,
    media_url: els.adMediaUrl.value.trim(),
    target_url: els.adTargetUrl.value.trim(),
    active: els.adActive.checked,
    display_order: Number(els.adOrder.value || 100)
  };

  const next = ads.filter((item) => item.id !== id);
  next.push(ad);
  store.saveAds(next);

  try {
    const savedAd = await window.BusBoardBackend?.upsertAd?.(ad);
    if (savedAd?.id && savedAd.id !== ad.id) {
      const updated = store.readAds().filter((item) => item.id !== ad.id);
      updated.push(savedAd);
      store.saveAds(updated);
    }
  } catch (error) {
    message(`Anuncio guardado local, pero fallo Supabase: ${error.message}`, "error");
    return;
  }

  renderAds();
  resetAdForm();
  message("Anuncio guardado.");
}

function editAd(id) {
  const ad = store.readAds().find((item) => item.id === id);
  if (!ad) {
    return;
  }
  els.adId.value = ad.id;
  els.adStation.value = ad.station;
  els.adType.value = ad.type;
  els.adTitle.value = ad.title;
  els.adText.value = ad.text;
  els.adMediaUrl.value = ad.media_url;
  els.adTargetUrl.value = ad.target_url;
  els.adOrder.value = ad.display_order;
  els.adActive.checked = ad.active;
  message("Editando anuncio seleccionado.");
}

async function deleteAd(id) {
  const ads = store.readAds();
  const ad = ads.find((item) => item.id === id);
  const next = ads.filter((item) => item.id !== id);

  try {
    await window.BusBoardBackend?.deleteAd?.(ad || id);
  } catch (error) {
    message(`No se pudo borrar en Supabase: ${error.message}`, "error");
    return;
  }

  store.saveAds(next);
  renderAds();
  message("Anuncio borrado.");
}

function seasonLabel(item) {
  if (!item.start_date && !item.end_date) {
    return "Normal";
  }
  return `${item.start_date || "..."} a ${item.end_date || "..."}`;
}

async function upsertTrip(event) {
  event.preventDefault();
  const current = data();
  const days = selectedDays();
  const day = days[0];
  const id = els.tripId.value || `${day}-trip-${Date.now()}`;
  const trip = {
    id,
    departure_time: els.departureTime.value,
    arrival_time: els.arrivalTime.value,
    company: els.company.value.trim(),
    origin: els.origin.value.trim(),
    destination: els.destination.value.trim(),
    route: els.route.value.trim(),
    status: els.status.value,
    delay: Number(els.delay.value || 0),
    start_date: els.startDate.value,
    end_date: els.endDate.value
  };

  days.forEach((targetDay, index) => {
    const tripForDay = {
      ...trip,
      id: index === 0 ? id : `${targetDay}-trip-${Date.now()}-${index}`
    };
    current[targetDay] = current[targetDay].filter((item) => item.id !== id);
    current[targetDay].push(tripForDay);
    current[targetDay].sort((a, b) => a.departure_time.localeCompare(b.departure_time));
  });
  save(current);

  try {
    for (const [index, targetDay] of days.entries()) {
      await window.BusBoardBackend?.upsertTrip(targetDay, {
        ...trip,
        id: index === 0 ? id : `${targetDay}-trip-${Date.now()}-${index}`
      });
    }
  } catch (error) {
    message(`Guardado local, pero fallo Supabase: ${error.message}`, "error");
    return;
  }

  renderStations();
  resetForm();
  message("Registro guardado.");
}

function editTrip(id) {
  const current = data();
  const day = primarySelectedDay();
  const trip = current[day].find((item) => item.id === id);
  if (!trip) {
    return;
  }

  els.tripId.value = trip.id;
  setSelectedDays([day]);
  els.departureTime.value = trip.departure_time;
  els.arrivalTime.value = trip.arrival_time;
  els.company.value = trip.company;
  els.origin.value = trip.origin;
  els.destination.value = trip.destination;
  els.route.value = trip.route;
  els.status.value = trip.status;
  els.delay.value = trip.delay;
  els.startDate.value = trip.start_date;
  els.endDate.value = trip.end_date;
  message("Editando registro seleccionado.");
  els.form.scrollIntoView({ behavior: "smooth", block: "start" });
  requestAnimationFrame(() => els.origin.focus({ preventScroll: true }));
}

async function deleteTrip(id) {
  const current = data();
  const day = primarySelectedDay();
  current[day] = current[day].filter((item) => item.id !== id);
  save(current);

  try {
    await window.BusBoardBackend?.deleteTrip(id);
  } catch (error) {
    message(`Borrado local, pero fallo Supabase: ${error.message}`, "error");
    return;
  }

  renderStations();
  message("Registro borrado.");
}

function download(filename, content, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function templateCsv() {
  return [
    "day,company,departure_time,arrival_time,origin,destination,route,status,delay,start_date,end_date",
    "Lunes,Transportes Marcala,07:00,07:50,Marcala,La Paz,ML-01,on_time,0,,",
    "Martes,Rapidos Centro,08:30,09:20,La Paz,Marcala,LM-02,delayed,10,2026-12-01,2026-12-31"
  ].join("\n");
}

function adTemplateCsv() {
  return [
    "station,type,title,text,media_url,target_url,display_order,active",
    "Marcala,youtube,Video Marcala,Promocion local,https://www.youtube.com/watch?v=dQw4w9WgXcQ,https://youtube.com,10,true",
    "Comayagua,youtube,Short Comayagua,Promocion corta,https://www.youtube.com/shorts/dQw4w9WgXcQ,https://youtube.com,15,true",
    "La Paz,tiktok,TikTok La Paz,Video social,https://www.tiktok.com/@tiktok/video/7106594312292453678,https://www.tiktok.com,18,true",
    "La Paz,image,Anuncio La Paz,Imagen promocional,https://example.com/lapaz.jpg,https://example.com/lapaz,20,true",
    "all,link,Anunciate aqui,Visible en todas las estaciones,,https://example.com,100,true"
  ].join("\n");
}

function parseCsv(text) {
  const rows = text.replace(/\r/g, "").split("\n").filter(Boolean);
  const headers = splitCsvLine(rows.shift()).map((value) => value.trim());
  return rows.map((row) => {
    const values = splitCsvLine(row);
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] || "";
      return acc;
    }, {});
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (window.BusBoardBackend?.enabled()) {
    try {
      await window.BusBoardBackend.signIn(els.loginUser.value, els.loginPass.value);
      sessionStorage.setItem(LOGIN_KEY, "yes");
      els.loginMessage.textContent = "";
      applyLoginState();
      await syncRemoteData();
      return;
    } catch (error) {
      els.loginMessage.textContent = `No se pudo ingresar: ${error.message}`;
      els.loginMessage.dataset.type = "error";
      return;
    }
  }

  if (els.loginUser.value === LOGIN_USER && els.loginPass.value === LOGIN_PASS) {
    sessionStorage.setItem(LOGIN_KEY, "yes");
    els.loginMessage.textContent = "";
    applyLoginState();
    return;
  }
  els.loginMessage.textContent = "Usuario o clave incorrectos. Prueba admin / 1234.";
  els.loginMessage.dataset.type = "error";
});

els.logout.addEventListener("click", () => {
  sessionStorage.removeItem(LOGIN_KEY);
  window.BusBoardBackend?.signOut();
  applyLoginState();
});

els.form.addEventListener("submit", upsertTrip);
els.clearForm.addEventListener("click", resetForm);
els.dayChecks.addEventListener("change", renderList);
document.querySelectorAll("[data-day-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const preset = button.dataset.dayPreset;
    if (preset === "weekdays") {
      setSelectedDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
    }
    if (preset === "weekend") {
      setSelectedDays(["saturday", "sunday"]);
    }
    if (preset === "all") {
      setSelectedDays(store.DAYS.map(([day]) => day));
    }
    renderList();
  });
});
els.activeStation.addEventListener("change", () => {
  store.setActiveStation(els.activeStation.value);
  renderList();
  message(`Estacion activa: ${els.activeStation.value}.`);
});

els.tripRows.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;
  if (action === "edit") {
    editTrip(id);
  }
  if (action === "delete") {
    deleteTrip(id);
  }
});

els.stationForm.addEventListener("submit", saveStation);
els.clearStationForm.addEventListener("click", resetStationForm);
els.stationRows.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const { stationAction, id } = button.dataset;
  if (stationAction === "edit") {
    editStation(id);
  }
  if (stationAction === "delete") {
    deleteStation(id);
  }
});

els.adForm.addEventListener("submit", saveAd);
els.clearAdForm.addEventListener("click", resetAdForm);
els.adRows.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const { adAction, id } = button.dataset;
  if (adAction === "edit") {
    editAd(id);
  }
  if (adAction === "delete") {
    deleteAd(id);
  }
});

els.csvFile.addEventListener("change", async () => {
  const file = els.csvFile.files[0];
  if (!file) {
    return;
  }

  const text = await file.text();
  const schedules = store.importCsv(text);
  try {
    await window.BusBoardBackend?.replaceSchedules(schedules);
  } catch (error) {
    message(`CSV cargado local, pero fallo Supabase: ${error.message}`, "error");
    return;
  }

  els.csvFile.value = "";
  renderStations();
  renderList();
  message("CSV importado. La pantalla usara los nuevos horarios.");
});

els.downloadTemplate.addEventListener("click", () => {
  download("plantilla-busboard.csv", templateCsv());
});

els.downloadAdTemplate.addEventListener("click", () => {
  download("plantilla-anuncios-busboard.csv", adTemplateCsv());
});

els.adCsvFile.addEventListener("change", async () => {
  const file = els.adCsvFile.files[0];
  if (!file) {
    return;
  }

  const rows = parseCsv(await file.text());
  const ads = rows.map((row, index) => ({
    id: row.id || `ad-import-${Date.now()}-${index}`,
    station: row.station || "all",
    title: row.title || "Anuncio",
    text: row.text || "",
    type: row.type || "link",
    media_url: row.media_url || row.youtube_url || row.image_url || "",
    target_url: row.target_url || row.link || "",
    display_order: Number(row.display_order || 100),
    active: String(row.active || "true").toLowerCase() !== "false"
  }));

  try {
    const savedAds = await window.BusBoardBackend?.replaceAds?.(ads);
    if (savedAds) {
      store.saveAds(savedAds);
    } else {
      store.saveAds(ads);
      for (const ad of ads) {
        const savedAd = await window.BusBoardBackend?.upsertAd?.(ad);
        if (savedAd?.id) {
          ad.id = savedAd.id;
        }
      }
      store.saveAds(ads);
    }
  } catch (error) {
    message(`Anuncios cargados local, pero fallo Supabase: ${error.message}`, "error");
    return;
  }

  els.adCsvFile.value = "";
  renderAds();
  message("Anuncios importados.");
});

els.exportCsv.addEventListener("click", () => {
  download("horarios-busboard.csv", store.toCsv(data()));
});

els.resetData.addEventListener("click", () => {
  const schedules = store.defaultSchedules();
  store.save(schedules);
  window.BusBoardBackend?.replaceSchedules(schedules).catch((error) => {
    message(`Ejemplo local restaurado, pero fallo Supabase: ${error.message}`, "error");
  });
  resetForm();
  renderStations();
  renderList();
  message("Datos de ejemplo restaurados.");
});

els.copyMonday.addEventListener("click", async () => {
  const current = data();
  const monday = JSON.stringify(current.monday);
  store.DAYS.forEach(([day]) => {
    current[day] = JSON.parse(monday);
    current[day] = current[day].map((item, index) => ({
      ...item,
      id: `${day}-trip-${index}-${Date.now()}`
    }));
  });
  save(current);
  try {
    await window.BusBoardBackend?.replaceSchedules(current);
  } catch (error) {
    message(`Copiado local, pero fallo Supabase: ${error.message}`, "error");
    return;
  }
  message("Horario de lunes copiado a todos los dias.");
});

initDays();
renderStations();
renderList();
resetStationForm();
renderStationRows();
resetAdForm();
renderAds();
applyLoginState();
syncRemoteData();
