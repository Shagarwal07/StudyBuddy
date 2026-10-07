const axios = require("axios");

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const HTTP_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 100;

const cache = new Map();

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { timestamp: Date.now(), data });
}

function getApiKey() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "your_youtube_data_api_v3_key") {
    throw new Error("YOUTUBE_KEY_INVALID");
  }
  return apiKey;
}

exports.extractPlaylistId = (url) => {
  // Strictly reject shorts and live streams
  if (!url || typeof url !== "string" || url.includes("/shorts/") || url.includes("/live/")) return null;
  const trimmed = url.trim();

  // Extract from URL query parameter
  const match = trimmed.match(/[&?]list=([^&]+)/);
  if (match) return match[1];

  // If raw string: only allow recognized playlist ID prefixes (PL, UU, LL, FL, RD, OLAK5uy_)
  if (!trimmed.includes("http") && !trimmed.includes("youtube.com")) {
    if (/^(PL|UU|LL|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/i.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
};

exports.extractVideoId = (url) => {
  // Strictly reject shorts and live streams
  if (!url || typeof url !== "string" || url.includes("/shorts/") || url.includes("/live/")) return null;
  const trimmed = url.trim();

  const match = trimmed.match(/(?:[?&]v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !trimmed.startsWith("PL") ? trimmed : null;
};

exports.convertDurationToSeconds = (duration = "") => {
  const m = String(duration).match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : 0;
};

exports.fetchSingleVideoMetadata = async (videoId) => {
  const cacheKey = `video_${videoId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const apiKey = getApiKey();
  const url = `${BASE_URL}/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;

  try {
    const res = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
    const item = res.data?.items?.[0];

    if (!item) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    const thumbs = item.snippet.thumbnails;
    const data = {
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description || "",
      channelTitle: item.snippet.channelTitle || "",
      thumbnailUrl:
        thumbs?.maxres?.url ||
        thumbs?.high?.url ||
        thumbs?.medium?.url ||
        thumbs?.default?.url ||
        `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
      durationInSeconds: exports.convertDurationToSeconds(item.contentDetails?.duration),
    };

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    if (error.message === "VIDEO_NOT_FOUND" || error.message === "YOUTUBE_KEY_INVALID") throw error;
    const errReason = error.response?.data?.error?.errors?.[0]?.reason;
    if (errReason === "quotaExceeded") throw new Error("YOUTUBE_QUOTA_EXCEEDED");
    if (errReason === "keyInvalid") throw new Error("YOUTUBE_KEY_INVALID");
    throw new Error(error.response?.data?.error?.message || error.message || "YOUTUBE_API_ERROR");
  }
};

exports.fetchPlaylistMetadata = async (playlistId) => {
  const cacheKey = `metadata_${playlistId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const apiKey = getApiKey();
  const url = `${BASE_URL}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${apiKey}`;

  try {
    const response = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
    if (!response.data.items?.length) throw new Error("PLAYLIST_NOT_FOUND");

    const item = response.data.items[0];
    const data = {
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl:
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url ||
        "",
      totalVideos: item.contentDetails?.itemCount || 0,
    };

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    if (error.message === "PLAYLIST_NOT_FOUND" || error.message === "YOUTUBE_KEY_INVALID") throw error;
    const errReason = error.response?.data?.error?.errors?.[0]?.reason;
    if (errReason === "quotaExceeded") throw new Error("YOUTUBE_QUOTA_EXCEEDED");
    if (errReason === "keyInvalid") throw new Error("YOUTUBE_KEY_INVALID");
    throw new Error(error.response?.data?.error?.message || error.message || "YOUTUBE_API_ERROR");
  }
};

exports.fetchAllPlaylistVideos = async (playlistId) => {
  const cacheKey = `videos_${playlistId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const apiKey = getApiKey();
  const videosArray = [];
  let pageToken = "";

  try {
    do {
      const pageParam = pageToken ? `&pageToken=${pageToken}` : "";
      const url = `${BASE_URL}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${pageParam}`;
      const response = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });

      if (response.data.items?.length) {
        for (const item of response.data.items) {
          const title = item.snippet?.title;
          const videoId = item.snippet?.resourceId?.videoId;
          if (videoId && title !== "Private video" && title !== "Deleted video") {
            videosArray.push(item);
          }
        }
      }

      pageToken = response.data.nextPageToken || "";
    } while (pageToken);

    setCache(cacheKey, videosArray);
    return videosArray;
  } catch (error) {
    if (error.response?.data?.error?.errors?.[0]?.reason === "quotaExceeded") {
      throw new Error("YOUTUBE_QUOTA_EXCEEDED");
    }
    throw new Error(error.response?.data?.error?.message || error.message || "YOUTUBE_API_ERROR");
  }
};

exports.fetchVideoDurations = async (videoIds = []) => {
  if (!videoIds.length) return [];
  const apiKey = getApiKey();
  const chunks = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50).join(","));
  }

  const batchResults = await Promise.all(
    chunks.map(async (ids) => {
      try {
        const url = `${BASE_URL}/videos?part=contentDetails&id=${ids}&key=${apiKey}`;
        const response = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
        return response.data?.items || [];
      } catch (error) {
        console.error("[YouTube Duration Fetch Error]", error.message);
        return [];
      }
    })
  );

  return batchResults.flat();
};
