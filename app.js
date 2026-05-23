const store = window.BusBoardStore;
const stationName = "Terminal Central";

const els = {
  stationTitle: document.querySelector(".eyebrow"),
  publicStation: document.querySelector("#publicStation"),
  pageLabel: document.querySelector("#pageLabel"),
  dateLabel: document.querySelector("#dateLabel"),
  timeLabel: document.querySelector("#timeLabel"),
  noticeText: document.querySelector("#noticeText"),
  boardTitle: document.querySelector("#boardTitle"),
  boardCount: document.querySelector("#boardCount"),
  activeBoard: document.querySelector(".active-board"),
  placeHeader: document.querySelector("#placeHeader"),
  boardRows: document.querySelector("#boardRows"),
  adStage: document.querySelector("#adStage"),
  filterButtons: document.querySelectorAll("[data-filter]"),
};

let activeFilter = "all";
let pageIndex = 0;
let activeBoardType = "departures";
let adIndex = 0;
const pageSize = 11;
let adItems = [];
let adSignature = "";
let adTimer = null;
let youtubePlayer = null;
let youtubeApiPromise = null;
let soundEnabled = localStorage.getItem("busboard.soundEnabled.v1") === "yes";
const youtubeMaxMs = 180000;
const tiktokDisplayMs = 30000;
const fallbackAds = [
  { title: "Sin anuncios programados", text: "Este espacio esta disponible para la estacion seleccionada" }
];

function stationKey(value) {
  const key = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return key.startsWith("mancala") ? key.replace(/^mancala/, "marcala") : key;
}

function mediaType(file) {
  const ext = String(file).split(".").pop().toLowerCase();
  if (["mp4", "mov", "webm"].includes(ext)) {
    return "video";
  }
  return "image";
}

function timeToDate(time, delayMinutes = 0) {
  const [hours, minutes] = String(time).split(":").map(Number);
  const result = new Date();
  result.setHours(hours || 0, (minutes || 0) + Number(delayMinutes || 0), 0, 0);

  return result;
}

function minutesUntil(target) {
  return Math.round((target.getTime() - Date.now()) / 60000);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function getStatus(item, type) {
  const target = timeToDate(eventTime(item, type), eventDelay(item, type));
  const diff = minutesUntil(target);

  if (item.status === "cancelled") {
    return { label: "Cancelado", className: "status-cancelled" };
  }

  if (item.status === "delayed" || (type === "departures" && Number(item.delay) > 0)) {
    return { label: `Demora ${Number(item.delay || 0)} min`, className: "status-delayed" };
  }

  if (item.status === "boarding") {
    return { label: "Abordando", className: "status-boarding" };
  }

  if (item.status === "arriving") {
    return { label: "Llegando", className: "status-arriving" };
  }

  if (diff < -8) {
    return { label: type === "departures" ? "Salio" : "Llego", className: "status-departed" };
  }

  if (diff <= 5 && diff >= -8) {
    return {
      label: type === "departures" ? "Abordando" : "Llegando",
      className: type === "departures" ? "status-boarding" : "status-arriving"
    };
  }

  if (diff <= 20) {
    return { label: `En ${diff} min`, className: "status-soon" };
  }

  return { label: "A tiempo", className: "status-on-time" };
}

function daySchedule() {
  const allSchedules = store.read();
  return allSchedules[store.todayKey()];
}

function eventTime(item, type) {
  return type === "departures" ? item.departure_time : item.arrival_time;
}

function eventDelay(item, type) {
  return type === "departures" ? item.delay : 0;
}

function inActiveSeason(item) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (item.start_date) {
    const start = new Date(`${item.start_date}T00:00:00`);
    if (today < start) {
      return false;
    }
  }

  if (item.end_date) {
    const end = new Date(`${item.end_date}T23:59:59`);
    if (today > end) {
      return false;
    }
  }

  return true;
}

function tripsForType(type) {
  const station = store.getActiveStation();
  const activeStationKey = stationKey(station);
  return daySchedule()
    .filter(inActiveSeason)
    .filter((item) => {
      if (type === "departures") {
        return stationKey(item.origin) === activeStationKey;
      }
      return stationKey(item.destination) === activeStationKey;
    })
    .map((item) => ({ ...item, scheduledDate: timeToDate(eventTime(item, type), eventDelay(item, type)) }))
    .filter((item) => minutesUntil(item.scheduledDate) > -30 || item.status === "cancelled")
    .sort((a, b) => a.scheduledDate - b.scheduledDate)
}

function visibleTrips(type) {
  const trips = tripsForType(type);
  const maxPages = Math.max(1, Math.ceil(trips.length / pageSize));
  const safePage = pageIndex % maxPages;
  return trips.slice(safePage * pageSize, safePage * pageSize + pageSize);
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

function renderRows(type, target) {
  const trips = visibleTrips(type);
  target.innerHTML = trips.map((item) => {
    const status = getStatus(item, type);
    const place = type === "departures" ? item.destination : item.origin;
    const tripName = `${item.company} - ${place}`;
    return `
      <div class="table-row" role="row">
        <span class="time" role="cell">${formatTime(item.scheduledDate)}</span>
        <span class="place" role="cell">
          <strong>${escapeHtml(tripName)}</strong>
        </span>
        <span role="cell"><span class="status ${status.className}">${status.label}</span></span>
      </div>
    `;
  }).join("");

  return trips.length;
}

function renderClock() {
  const now = new Date();
  els.dateLabel.textContent = new Intl.DateTimeFormat("es-HN", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(now);
  els.timeLabel.textContent = new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(now);
}

function renderNotice() {
  const nextDeparture = tripsForType("departures").find((item) => item.status !== "cancelled");
  const nextArrival = tripsForType("arrivals").find((item) => item.status !== "cancelled");
  const parts = [];

  if (nextDeparture) {
    parts.push(`Proxima salida: ${nextDeparture.destination} a las ${formatTime(nextDeparture.scheduledDate)}`);
  }

  if (nextArrival) {
    parts.push(`Proxima llegada: ${nextArrival.origin} a las ${formatTime(nextArrival.scheduledDate)}`);
  }

  els.noticeText.textContent = parts.join(" | ") || `${stationName}: no hay rutas proximas publicadas.`;
}

function applyFilter(filter) {
  activeFilter = filter;
  activeBoardType = filter === "all" ? activeBoardType : filter;
  els.filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
}

function toggleBoardType() {
  activeFilter = "all";
  activeBoardType = activeBoardType === "departures" ? "arrivals" : "departures";
  pageIndex = 0;
  render();
}

function render() {
  els.stationTitle.textContent = store.getActiveStation();
  renderClock();
  const type = activeFilter === "all" ? activeBoardType : activeFilter;
  const visibleCount = renderRows(type, els.boardRows);
  const total = tripsForType(type).length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  els.boardTitle.textContent = type === "departures" ? "Salidas" : "Llegadas";
  els.activeBoard.classList.toggle("board-departures-theme", type === "departures");
  els.activeBoard.classList.toggle("board-arrivals-theme", type === "arrivals");
  els.placeHeader.textContent = type === "departures" ? "Destino" : "Origen";
  els.boardCount.textContent = `${visibleCount} de ${total}`;
  els.pageLabel.textContent = `Pagina ${(pageIndex % totalPages) + 1} de ${totalPages}`;
  renderNotice();
  applyFilter(activeFilter);
}

function renderAd() {
  clearAdPlayback();

  if (!adItems.length) {
    renderFallbackAd(fallbackAds[adIndex % fallbackAds.length]);
    return;
  }

  const item = adItems[adIndex % adItems.length];
  const fallback = fallbackAds[adIndex % fallbackAds.length];
  els.adStage.innerHTML = "";

  if (item.type === "youtube") {
    renderYoutubeAd(item, fallback);
    return;
  }

  if (item.type === "tiktok") {
    renderTikTokAd(item, fallback);
    return;
  }

  if (item.type === "link") {
    renderLinkAd(item);
    return;
  }

  if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.autoplay = true;
    video.muted = !soundEnabled;
    video.volume = 1;
    video.loop = false;
    video.playsInline = true;
    video.onerror = () => renderFallbackAd(fallback);
    video.onended = nextAd;
    els.adStage.appendChild(wrapAd(item, video));
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => renderFallbackAd(fallback));
      showSoundPrompt();
    });
    return;
  }

  const image = document.createElement("img");
  image.src = item.src;
  image.alt = item.title;
  image.onerror = () => renderFallbackAd(fallback);
  els.adStage.appendChild(wrapAd(item, image));
  scheduleNextAd();
}

async function syncRemoteData() {
  if (!window.BusBoardBackend?.enabled()) {
    return;
  }

  try {
    const remoteStations = await window.BusBoardBackend.loadStations?.();
    if (remoteStations?.length) {
      store.saveStations(remoteStations);
      renderStationOptions();
    }

    const schedules = await window.BusBoardBackend.loadSchedules();
    if (schedules && hasAnyTrips(schedules)) {
      store.save(schedules);
      renderStationOptions();
    }

    const remoteAds = await window.BusBoardBackend.loadAds();
    store.saveAds(remoteAds.map((ad) => ({
      id: `remote-${ad.title}-${ad.link || ad.youtubeUrl || ad.src}`,
      station: (ad.stations || ["all"])[0],
      title: ad.title,
      text: ad.text || "",
      type: ad.type,
      media_url: ad.youtubeUrl || ad.tiktokUrl || ad.src || "",
      target_url: ad.link || "",
      active: true,
      display_order: 100
    })));

    loadAdsForStation(false);
    render();
  } catch (error) {
    console.warn("No se pudo sincronizar con Supabase", error);
  }
}

function hasAnyTrips(schedules) {
  return store.DAYS.some(([day]) => (schedules[day] || []).length > 0);
}

function renderYoutubeAd(item, fallback) {
  const videoId = youtubeId(item.youtubeUrl);
  if (!videoId) {
    renderFallbackAd(fallback);
    return;
  }

  const playerId = `youtube-player-${Date.now()}`;
  const playerOrigin = youtubePlayerOrigin();
  const playerParams = new URLSearchParams({
    enablejsapi: "1",
    autoplay: "1",
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0"
  });

  if (!soundEnabled) {
    playerParams.set("mute", "1");
  }
  if (playerOrigin) {
    playerParams.set("origin", playerOrigin);
    playerParams.set("widget_referrer", playerOrigin);
  }

  const frame = document.createElement("iframe");
  frame.id = playerId;
  frame.className = "youtube-player";
  frame.src = `https://www.youtube.com/embed/${videoId}?${playerParams.toString()}`;
  frame.title = item.title || "Video publicitario";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allowFullscreen = true;
  els.adStage.appendChild(frame);

  loadYoutubeApi().then(() => {
    scheduleNextAd(youtubeMaxMs);
    youtubePlayer = new window.YT.Player(playerId, {
      events: {
        onReady: (event) => {
          if (soundEnabled) {
            event.target.unMute();
            event.target.setVolume(100);
          } else {
            event.target.mute();
          }
          event.target.playVideo();
          if (!soundEnabled) {
            showSoundPrompt();
          }
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            nextAd();
          }
        },
        onError: () => {
          renderFallbackAd(fallback);
        },
        onAutoplayBlocked: () => {
          showSoundPrompt();
        }
      }
    });
  }).catch(() => renderFallbackAd(fallback));

  if (item.link) {
    const link = document.createElement("a");
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "ad-cta";
    link.textContent = "Ver publicidad";
    els.adStage.appendChild(link);
  }
}

function renderTikTokAd(item, fallback) {
  const videoId = tiktokId(item.tiktokUrl || item.youtubeUrl || item.src || item.link);
  if (!videoId) {
    renderFallbackAd(fallback);
    return;
  }

  const frame = document.createElement("iframe");
  const mute = soundEnabled ? "0" : "1";
  frame.src = `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&controls=0&loop=0&mute=${mute}`;
  frame.title = item.title || "Video TikTok";
  frame.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allowFullscreen = true;
  frame.onerror = () => renderFallbackAd(fallback);
  els.adStage.appendChild(frame);

  if (!soundEnabled) {
    showSoundPrompt();
  }

  scheduleNextAd(tiktokDisplayMs);

  if (item.link) {
    const link = document.createElement("a");
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "ad-cta";
    link.textContent = "Ver publicidad";
    els.adStage.appendChild(link);
  }
}

function loadYoutubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") {
        previousReady();
      }
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function youtubePlayerOrigin() {
  if (window.location.origin && window.location.origin !== "null") {
    return window.location.origin;
  }
  return "";
}

function renderLinkAd(item) {
  const target = item.link || "#";
  els.adStage.innerHTML = `
    <a class="ad-fallback ad-link" href="${escapeHtml(target)}" target="_blank" rel="noopener">
      <span>Publicidad</span>
      <strong>${escapeHtml(item.title || "Anuncio")}</strong>
      <p>${escapeHtml(item.text || "Toca para abrir mas informacion")}</p>
    </a>
  `;
  scheduleNextAd();
}

function showSoundPrompt() {
  if (document.querySelector(".sound-prompt")) {
    return;
  }

  const button = document.createElement("button");
  button.className = "sound-prompt";
  button.type = "button";
  button.textContent = "Activar audio";
  button.addEventListener("click", () => {
    soundEnabled = true;
    localStorage.setItem("busboard.soundEnabled.v1", "yes");
    if (youtubePlayer?.unMute) {
      youtubePlayer.unMute();
      youtubePlayer.setVolume(100);
      youtubePlayer.playVideo();
    }
    const video = els.adStage.querySelector("video");
    if (video) {
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {});
    }
    button.remove();
  });
  els.adStage.appendChild(button);
}

function removeSoundPrompt() {
  document.querySelector(".sound-prompt")?.remove();
}

function clearAdPlayback() {
  removeSoundPrompt();
  if (adTimer) {
    clearTimeout(adTimer);
    adTimer = null;
  }

  if (youtubePlayer?.destroy) {
    youtubePlayer.destroy();
  }
  youtubePlayer = null;
}

function scheduleNextAd(ms = 10000) {
  if (adTimer) {
    clearTimeout(adTimer);
  }
  adTimer = setTimeout(nextAd, ms);
}

function nextAd() {
  if (adItems.length) {
    adIndex = (adIndex + 1) % adItems.length;
  } else {
    adIndex += 1;
  }
  renderAd();
}

function wrapAd(item, node) {
  if (!item.link) {
    return node;
  }

  const link = document.createElement("a");
  link.href = item.link;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "ad-link";
  link.title = item.title || "Publicidad";
  link.appendChild(node);
  return link;
}

function youtubeId(url) {
  const text = String(url || "");
  try {
    const parsed = new URL(text);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (host.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") || "";
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) {
        return parts[1] || "";
      }
    }
  } catch {
    const match = text.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return match ? match[1] : "";
  }
  return "";
}

function tiktokId(url) {
  const text = String(url || "");
  const match = text.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return match ? match[1] : "";
}

function renderFallbackAd(item) {
  els.adStage.innerHTML = `
    <div class="ad-fallback">
      <span>Publicidad</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.text)}</p>
    </div>
  `;
  scheduleNextAd();
}

function loadAdsForStation(forceRender = true) {
  const key = stationKey(store.getActiveStation());
  const configured = Array.isArray(window.BusBoardMediaConfig)
    ? window.BusBoardMediaConfig
    : (Array.isArray(window.BusBoardAdConfig) ? window.BusBoardAdConfig : []);
  const managed = store.readAds().map((ad) => ({
    type: ad.type,
    stations: [ad.station || "all"],
    title: ad.title,
    text: ad.text,
    src: ad.type === "image" ? ad.media_url : "",
    youtubeUrl: ad.type === "youtube" ? ad.media_url : "",
    tiktokUrl: ad.type === "tiktok" ? ad.media_url : "",
    link: ad.target_url,
    display_order: ad.display_order,
    active: ad.active
  }));
  const files = Array.isArray(window.BusBoardAssetCatalog)
    ? window.BusBoardAssetCatalog
    : (Array.isArray(window.BusBoardPantallaLista)
      ? window.BusBoardPantallaLista
      : (Array.isArray(window.BusBoardMediaList)
      ? window.BusBoardMediaList
      : (Array.isArray(window.BusBoardAds) ? window.BusBoardAds : [])));
  const configuredAds = [...managed, ...configured]
    .filter((item) => item.active !== false)
    .filter((item) => {
    const stations = item.stations || ["all"];
    return stations.includes("all") || stations.some((station) => stationKey(station) === key);
  })
    .sort((a, b) => Number(a.display_order || 100) - Number(b.display_order || 100));
  const fileAds = files
    .map((file) => (typeof file === "string" ? { file } : file))
    .filter((item) => {
      if (!item.file) {
        return false;
      }
      if (item.station) {
        const stations = Array.isArray(item.station) ? item.station : [item.station];
        return stations.some((station) => stationKey(station) === key || stationKey(station) === "all");
      }
      return stationKey(item.file).startsWith(key);
    })
    .map((item) => ({
      type: mediaType(item.file),
      src: item.basePath ? `${item.basePath.replace(/\/$/, "")}/${item.file}` : `./pantalla/${item.file}`,
      title: item.title || item.file,
      link: item.link || ""
    }));

  const nextItems = [...configuredAds, ...fileAds];
  const nextSignature = JSON.stringify(nextItems.map((item) => ({
    type: item.type,
    title: item.title,
    src: item.src,
    youtubeUrl: item.youtubeUrl,
    tiktokUrl: item.tiktokUrl,
    link: item.link,
    display_order: item.display_order
  })));

  if (!forceRender && nextSignature === adSignature) {
    return;
  }

  adItems = nextItems;
  adSignature = nextSignature;

  adIndex = randomAdIndex(adItems.length);
  renderAd();
}

function randomAdIndex(length) {
  if (!length) {
    return 0;
  }
  return Math.floor(Math.random() * length);
}

function renderStationOptions() {
  const active = store.getActiveStation();
  const stations = new Set(store.stations());
  stations.add(active);
  store.readAds().forEach((ad) => {
    if (ad.station && ad.station !== "all") {
      stations.add(ad.station);
    }
  });

  els.publicStation.innerHTML = Array.from(stations).sort((a, b) => a.localeCompare(b)).map((station) => (
    `<option value="${escapeHtml(station)}">${escapeHtml(station)}</option>`
  )).join("");
  els.publicStation.value = active;
}

els.filterButtons.forEach((button) => {
  button.addEventListener("click", () => applyFilter(button.dataset.filter));
});

els.activeBoard.addEventListener("click", (event) => {
  if (event.target.closest("button, select, a")) {
    return;
  }
  toggleBoardType();
});

els.publicStation.addEventListener("change", () => {
  store.setActiveStation(els.publicStation.value);
  pageIndex = 0;
  loadAdsForStation(true);
  render();
});

window.addEventListener("storage", render);
renderStationOptions();
loadAdsForStation(true);
render();
syncRemoteData();
setInterval(render, 1000);
setInterval(syncRemoteData, 30000);
setInterval(() => {
  pageIndex += 1;
  render();
}, 12000);
setInterval(() => {
  if (activeFilter === "all") {
    activeBoardType = activeBoardType === "departures" ? "arrivals" : "departures";
    pageIndex = 0;
  }
  render();
}, 10000);
