const WATCH_KEY = 'safe_youtube_watch_history';
const SEARCH_KEY = 'safe_youtube_search_history';
const LAST_KEY = 'safe_youtube_last_video';
const MAX_WATCH = 30;
const MAX_SEARCH = 15;

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — ignore silently
  }
};

export const loadWatchHistory = () => readJson(WATCH_KEY, []);

export const loadSearchHistory = () => readJson(SEARCH_KEY, []);

export const loadLastVideo = () => readJson(LAST_KEY, null);

export const addToWatchHistory = (video, progressSeconds = 0) => {
  if (!video?.id) return loadWatchHistory();

  const entry = {
    id: video.id,
    title: video.title || 'YouTube Video',
    channel: video.channel || '',
    channelId: video.channelId || '',
    thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    progressSeconds: Math.max(0, Math.floor(progressSeconds || 0)),
    watchedAt: new Date().toISOString(),
  };

  const history = loadWatchHistory().filter((item) => item.id !== video.id);
  history.unshift(entry);
  writeJson(WATCH_KEY, history.slice(0, MAX_WATCH));
  return history.slice(0, MAX_WATCH);
};

export const updateWatchProgress = (videoId, progressSeconds) => {
  if (!videoId) return;

  const history = loadWatchHistory();
  const index = history.findIndex((item) => item.id === videoId);
  if (index === -1) return;

  history[index] = {
    ...history[index],
    progressSeconds: Math.max(0, Math.floor(progressSeconds || 0)),
    watchedAt: new Date().toISOString(),
  };

  writeJson(WATCH_KEY, history);
};

export const addToSearchHistory = (query) => {
  const trimmed = query?.trim();
  if (!trimmed || extractVideoIdFromInput(trimmed)) return loadSearchHistory();

  const history = loadSearchHistory().filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase()
  );
  history.unshift(trimmed);
  writeJson(SEARCH_KEY, history.slice(0, MAX_SEARCH));
  return history.slice(0, MAX_SEARCH);
};

export const saveLastVideo = (video, progressSeconds = 0) => {
  if (!video?.id) return;

  writeJson(LAST_KEY, {
    id: video.id,
    title: video.title || 'YouTube Video',
    channel: video.channel || '',
    channelId: video.channelId || '',
    thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    progressSeconds: Math.max(0, Math.floor(progressSeconds || 0)),
    updatedAt: new Date().toISOString(),
  });
};

export const clearWatchHistory = () => {
  localStorage.removeItem(WATCH_KEY);
  localStorage.removeItem(LAST_KEY);
};

export const clearSearchHistory = () => {
  localStorage.removeItem(SEARCH_KEY);
};

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export const extractVideoIdFromInput = (input) => {
  const trimmed = input.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return YOUTUBE_ID_RE.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && YOUTUBE_ID_RE.test(v)) return v;

      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];

      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    return null;
  }

  return null;
};

const CHANNEL_ID_RE = /^UC[\w-]{22}$/;

export const extractChannelFromInput = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (CHANNEL_ID_RE.test(trimmed)) return trimmed;

  if (trimmed.startsWith('@')) return trimmed;

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const channelMatch = url.pathname.match(/^\/channel\/(UC[\w-]{22})/);
      if (channelMatch) return channelMatch[1];

      const handleMatch = url.pathname.match(/^\/@([\w.-]+)/);
      if (handleMatch) return `@${handleMatch[1]}`;

      const userMatch = url.pathname.match(/^\/user\/([\w.-]+)/);
      if (userMatch) return userMatch[1];
    }
  } catch {
    return null;
  }

  return null;
};

export const formatWatchTime = (seconds) => {
  if (!seconds || seconds < 1) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
