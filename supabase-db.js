(function () {
  const config = window.BusBoardSupabaseConfig || {};
  const projectUrl = normalizeProjectUrl(config.url);
  const hasClient = Boolean(window.supabase && projectUrl && config.anonKey && !projectUrl.includes("TU-PROYECTO"));
  const client = hasClient ? window.supabase.createClient(projectUrl, config.anonKey) : null;

  function normalizeProjectUrl(url) {
    return String(url || "")
      .trim()
      .replace(/\/rest\/v1\/?$/i, "")
      .replace(/\/+$/g, "");
  }

  function enabled() {
    return Boolean(client);
  }

  function tripFromRow(row) {
    return {
      id: row.id,
      company: row.company || "",
      departure_time: trimTime(row.departure_time),
      arrival_time: trimTime(row.arrival_time),
      origin: row.origin || "",
      destination: row.destination || "",
      route: row.route || "",
      status: row.status || "on_time",
      delay: Number(row.delay || 0),
      start_date: row.start_date || "",
      end_date: row.end_date || ""
    };
  }

  function rowFromTrip(day, trip) {
    return {
      id: trip.id,
      day,
      company: trip.company,
      departure_time: trip.departure_time,
      arrival_time: trip.arrival_time,
      origin: trip.origin,
      destination: trip.destination,
      route: trip.route,
      status: trip.status || "on_time",
      delay: Number(trip.delay || 0),
      start_date: trip.start_date || null,
      end_date: trip.end_date || null,
      active: true
    };
  }

  function trimTime(value) {
    return String(value || "").slice(0, 5);
  }

  function stationFromRow(row) {
    return {
      id: row.id,
      name: row.name,
      active: row.active !== false
    };
  }

  function emptySchedules() {
    const data = {};
    window.BusBoardStore.DAYS.forEach(([day]) => {
      data[day] = [];
    });
    return data;
  }

  async function loadSchedules() {
    if (!client) {
      return null;
    }

    const { data, error } = await client
      .from("trips")
      .select("*")
      .eq("active", true)
      .order("day")
      .order("departure_time");

    if (error) {
      throw error;
    }

    const schedules = emptySchedules();
    data.forEach((row) => {
      if (schedules[row.day]) {
        schedules[row.day].push(tripFromRow(row));
      }
    });
    return schedules;
  }

  async function upsertTrip(day, trip) {
    if (!client) {
      return;
    }
    const { error } = await client.from("trips").upsert(rowFromTrip(day, trip));
    if (error) {
      throw error;
    }
  }

  async function deleteTrip(id) {
    if (!client) {
      return;
    }
    const { error } = await client.from("trips").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }

  async function replaceSchedules(schedules) {
    if (!client) {
      return;
    }

    const rows = [];
    window.BusBoardStore.DAYS.forEach(([day]) => {
      (schedules[day] || []).forEach((trip) => rows.push(rowFromTrip(day, trip)));
    });

    const { error: deleteError } = await client.from("trips").delete().neq("id", "");
    if (deleteError) {
      throw deleteError;
    }

    if (rows.length) {
      const { error: insertError } = await client.from("trips").insert(rows);
      if (insertError) {
        throw insertError;
      }
    }
  }

  async function loadAds() {
    if (!client) {
      return [];
    }

    const { data, error } = await client
      .from("ads")
      .select("*")
      .eq("active", true)
      .order("display_order")
      .order("title");

    if (error) {
      throw error;
    }

    return data.map((row) => ({
      type: row.type,
      stations: row.station ? [row.station] : ["all"],
      title: row.title,
      text: row.text || "",
      src: row.image_url || "",
      youtubeUrl: row.youtube_url || "",
      tiktokUrl: row.type === "tiktok" ? row.youtube_url || "" : "",
      link: row.target_url || ""
    }));
  }

  async function loadStations() {
    if (!client) {
      return [];
    }

    const { data, error } = await client
      .from("stations")
      .select("*")
      .order("name");

    if (error) {
      throw error;
    }

    return data.map(stationFromRow);
  }

  async function upsertStation(station) {
    if (!client) {
      return station;
    }

    const row = {
      id: station.id && station.id.startsWith("station-") ? undefined : station.id,
      name: station.name,
      active: station.active !== false
    };
    Object.keys(row).forEach((key) => row[key] === undefined && delete row[key]);

    if (!row.id) {
      const { data, error } = await client.from("stations").insert(row).select("*").single();
      if (error) {
        throw error;
      }
      return stationFromRow(data);
    }

    const { data, error } = await client.from("stations").upsert(row).select("*").single();
    if (error) {
      throw error;
    }
    return stationFromRow(data);
  }

  async function deleteStation(id) {
    if (!client || String(id).startsWith("station-")) {
      return;
    }
    const { error } = await client.from("stations").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }

  async function loadAdsRaw() {
    if (!client) {
      return [];
    }

    const { data, error } = await client
      .from("ads")
      .select("*")
      .order("display_order")
      .order("title");

    if (error) {
      throw error;
    }

    return data.map((row) => ({
      id: row.id,
      station: row.station || "all",
      title: row.title,
      text: row.text || "",
      type: row.type,
      media_url: row.image_url || row.youtube_url || "",
      target_url: row.target_url || "",
      active: row.active !== false,
      display_order: Number(row.display_order || 100)
    }));
  }

  async function upsertAd(ad) {
    if (!client) {
      return ad;
    }

    const row = {
      id: ad.id && ad.id.startsWith("ad-") ? undefined : ad.id,
      station: ad.station === "all" ? null : ad.station,
      title: ad.title,
      text: ad.text || null,
      type: ad.type,
      image_url: ad.type === "image" ? ad.media_url : null,
      youtube_url: ad.type === "youtube" || ad.type === "tiktok" ? ad.media_url : null,
      target_url: ad.target_url || null,
      active: ad.active !== false,
      display_order: Number(ad.display_order || 100)
    };

    Object.keys(row).forEach((key) => row[key] === undefined && delete row[key]);

    if (!row.id) {
      const { data, error } = await client.from("ads").insert(row).select("*").single();
      if (error) {
        throw error;
      }
      return {
        ...ad,
        id: data.id,
        station: data.station || "all"
      };
    }

    const { data, error } = await client.from("ads").upsert(row).select("*").single();
    if (error) {
      throw error;
    }
    return {
      ...ad,
      id: data.id,
      station: data.station || "all"
    };
  }

  async function deleteAd(id) {
    if (!client || String(id).startsWith("ad-")) {
      return;
    }
    const { error } = await client.from("ads").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }

  async function signIn(email, password) {
    if (!client) {
      return { local: true };
    }
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    return data;
  }

  async function signOut() {
    if (!client) {
      return;
    }
    await client.auth.signOut();
  }

  async function currentUser() {
    if (!client) {
      return null;
    }
    const { data } = await client.auth.getUser();
    return data.user;
  }

  window.BusBoardBackend = {
    enabled,
    loadSchedules,
    upsertTrip,
    deleteTrip,
    replaceSchedules,
    loadStations,
    upsertStation,
    deleteStation,
    loadAds,
    loadAdsRaw,
    upsertAd,
    deleteAd,
    signIn,
    signOut,
    currentUser
  };
}());
