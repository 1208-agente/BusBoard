(function () {
  const STORAGE_KEY = "busboard.schedules.v1";
  const STATION_KEY = "busboard.activeStation.v1";
  const ADS_KEY = "busboard.ads.v1";
  const STATIONS_KEY = "busboard.stations.v1";

  const DAYS = [
    ["monday", "Lunes"],
    ["tuesday", "Martes"],
    ["wednesday", "Miercoles"],
    ["thursday", "Jueves"],
    ["friday", "Viernes"],
    ["saturday", "Sabado"],
    ["sunday", "Domingo"]
  ];

  const DAY_ALIASES = {
    lunes: "monday",
    monday: "monday",
    martes: "tuesday",
    tuesday: "tuesday",
    miercoles: "wednesday",
    miércoles: "wednesday",
    wednesday: "wednesday",
    jueves: "thursday",
    thursday: "thursday",
    viernes: "friday",
    friday: "friday",
    sabado: "saturday",
    sábado: "saturday",
    saturday: "saturday",
    domingo: "sunday",
    sunday: "sunday"
  };

  const STATUS_LABELS = {
    on_time: "A tiempo",
    boarding: "Abordando",
    arriving: "Llegando",
    delayed: "Demorado",
    cancelled: "Cancelado"
  };

  const baseTrips = [
    { company: "Transportes Marcala", departure_time: "05:30", arrival_time: "06:20", origin: "Marcala", destination: "La Paz", route: "ML-01" },
    { company: "Rapidos Centro", departure_time: "06:15", arrival_time: "09:00", origin: "Marcala", destination: "Tegucigalpa", route: "CAP-04" },
    { company: "Comayagua Bus", departure_time: "07:00", arrival_time: "08:35", origin: "Marcala", destination: "Comayagua", route: "CEN-12" },
    { company: "Transportes Marcala", departure_time: "07:35", arrival_time: "08:25", origin: "La Paz", destination: "Marcala", route: "LM-02" },
    { company: "Rapidos Centro", departure_time: "08:10", arrival_time: "10:55", origin: "Tegucigalpa", destination: "Marcala", route: "CAP-03" },
    { company: "Norte Linea", departure_time: "09:00", arrival_time: "14:20", origin: "Marcala", destination: "San Pedro Sula", route: "NOR-07" },
    { company: "Comayagua Bus", departure_time: "09:45", arrival_time: "11:20", origin: "Comayagua", destination: "Marcala", route: "CEN-15" },
    { company: "Sur Express", departure_time: "10:25", arrival_time: "14:30", origin: "Marcala", destination: "Choluteca", route: "SUR-22" }
  ];

  function withDefaults(item, day, index) {
    return {
      id: item.id || `${day}-trip-${index}-${Date.now()}`,
      departure_time: item.departure_time || item.departureTime || item.time || "08:00",
      arrival_time: item.arrival_time || item.arrivalTime || item.time || "08:00",
      company: item.company || item.enterprise || "Empresa",
      origin: item.origin || item.from || "",
      destination: item.destination || item.to || item.place || "",
      route: item.route || "",
      status: item.status || "on_time",
      delay: Number(item.delay || 0),
      start_date: item.start_date || item.startDate || "",
      end_date: item.end_date || item.endDate || ""
    };
  }

  function defaultSchedules() {
    const data = {};
    DAYS.forEach(([day]) => {
      data[day] = baseTrips.map((item, index) => withDefaults(item, day, index));
    });
    return data;
  }

  function read() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = defaultSchedules();
      save(data);
      return data;
    }

    try {
      const parsed = JSON.parse(raw);
      return normalize(parsed);
    } catch {
      const data = defaultSchedules();
      save(data);
      return data;
    }
  }

  function normalize(data) {
    const normalized = {};
    DAYS.forEach(([day]) => {
      const dayData = data[day] || [];
      if (Array.isArray(dayData)) {
        normalized[day] = dayData.map((item, index) => withDefaults(item, day, index));
        return;
      }

      const legacyDepartures = (dayData.departures || []).map((item) => ({
        ...item,
        origin: getActiveStation(),
        destination: item.destination || item.place
      }));
      const legacyArrivals = (dayData.arrivals || []).map((item) => ({
        ...item,
        origin: item.origin || item.place,
        destination: getActiveStation()
      }));
      normalized[day] = [...legacyDepartures, ...legacyArrivals].map((item, index) => withDefaults(item, day, index));
    });
    return normalized;
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function todayKey() {
    const jsDay = new Date().getDay();
    return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][jsDay];
  }

  function normalizeDay(value) {
    const key = String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return DAY_ALIASES[key] || key;
  }

  function dayLabel(day) {
    return DAYS.find(([key]) => key === day)?.[1] || day;
  }

  function getActiveStation() {
    return localStorage.getItem(STATION_KEY) || "Marcala";
  }

  function setActiveStation(station) {
    localStorage.setItem(STATION_KEY, station || "Marcala");
  }

  function stations(data = read()) {
    const names = new Set();
    readStations().forEach((station) => names.add(station.name));
    DAYS.forEach(([day]) => {
      (data[day] || []).forEach((item) => {
        if (item.origin) {
          names.add(item.origin);
        }
        if (item.destination) {
          names.add(item.destination);
        }
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  function defaultStations() {
    return ["Marcala", "La Paz", "Tegucigalpa", "Comayagua"].map((name, index) => ({
      id: `station-${index + 1}`,
      name,
      active: true
    }));
  }

  function readStations() {
    const raw = localStorage.getItem(STATIONS_KEY);
    if (!raw) {
      const defaults = defaultStations();
      saveStations(defaults);
      return defaults;
    }

    try {
      return JSON.parse(raw).map(normalizeStation);
    } catch {
      const defaults = defaultStations();
      saveStations(defaults);
      return defaults;
    }
  }

  function normalizeStation(station) {
    return {
      id: station.id || `station-${Date.now()}`,
      name: String(station.name || "").trim(),
      active: station.active !== false
    };
  }

  function saveStations(stations) {
    const unique = new Map();
    stations.map(normalizeStation).forEach((station) => {
      if (station.name) {
        unique.set(station.name.toLowerCase(), station);
      }
    });
    localStorage.setItem(STATIONS_KEY, JSON.stringify(Array.from(unique.values())));
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

  function toCsv(data) {
    const rows = [["day", "company", "departure_time", "arrival_time", "origin", "destination", "route", "status", "delay", "start_date", "end_date"]];
    DAYS.forEach(([day]) => {
      (data[day] || []).forEach((item) => {
        rows.push([day, item.company, item.departure_time, item.arrival_time, item.origin, item.destination, item.route, item.status, item.delay, item.start_date, item.end_date]);
      });
    });
    return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function importCsv(text) {
    const data = defaultSchedules();
    DAYS.forEach(([day]) => {
      data[day] = [];
    });

    parseCsv(text).forEach((row, index) => {
      const day = normalizeDay(row.day);

      if (!data[day]) {
        return;
      }

      const type = String(row.type || "").toLowerCase();
      const activeStation = getActiveStation();
      const origin = row.origin || row.from || (type === "departures" ? activeStation : row.place);
      const destination = row.destination || row.to || (type === "arrivals" ? activeStation : row.place);

      data[day].push(withDefaults({
        id: `${day}-trip-${index}-${Date.now()}`,
        departure_time: row.departure_time || row.departureTime || row.time,
        arrival_time: row.arrival_time || row.arrivalTime || row.time,
        company: row.company || row.enterprise,
        origin,
        destination,
        route: row.route,
        status: row.status || "on_time",
        delay: Number(row.delay || 0),
        start_date: row.start_date || row.startDate,
        end_date: row.end_date || row.endDate
      }, day, index));
    });

    save(data);
    return data;
  }

  function defaultAds() {
    return [];
  }

  function readAds() {
    const raw = localStorage.getItem(ADS_KEY);
    if (!raw) {
      const ads = defaultAds();
      saveAds(ads);
      return ads;
    }

    try {
      return JSON.parse(raw).map(normalizeAd);
    } catch {
      const ads = defaultAds();
      saveAds(ads);
      return ads;
    }
  }

  function normalizeAd(ad) {
    return {
      id: ad.id || `ad-${Date.now()}`,
      station: ad.station || "all",
      title: ad.title || "Anuncio",
      text: ad.text || "",
      type: ad.type || "link",
      media_url: ad.media_url || ad.image_url || ad.youtube_url || "",
      target_url: ad.target_url || ad.link || "",
      active: ad.active !== false,
      display_order: Number(ad.display_order || 100)
    };
  }

  function saveAds(ads) {
    localStorage.setItem(ADS_KEY, JSON.stringify(ads.map(normalizeAd)));
  }

  window.BusBoardStore = {
    DAYS,
    DAY_ALIASES,
    STATUS_LABELS,
    defaultSchedules,
    read,
    save,
    todayKey,
    normalizeDay,
    dayLabel,
    getActiveStation,
    setActiveStation,
    stations,
    defaultStations,
    readStations,
    saveStations,
    importCsv,
    toCsv,
    defaultAds,
    readAds,
    saveAds
  };
}());
