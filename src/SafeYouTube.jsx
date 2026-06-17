import { useState, useCallback, useEffect, useRef } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaArrowLeft } from 'react-icons/fa';
import { getApiBaseUrl } from './utils/api';
import {
  loadWatchHistory,
  loadSearchHistory,
  loadLastVideo,
  addToWatchHistory,
  addToSearchHistory,
  updateWatchProgress,
  saveLastVideo,
  clearWatchHistory,
  clearSearchHistory,
  extractVideoIdFromInput,
  extractChannelFromInput,
  formatWatchTime,
} from './utils/safeYouTubeHistory';
import YouTubePlayer from './YouTubePlayer';
import './SafeYouTube.css';

const HISTORY_PREVIEW_COUNT = 1;
const CHANNEL_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'videos', label: 'Videos' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'live', label: 'Live' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'posts', label: 'Posts' },
];
const SEARCH_DEBOUNCE_MS = 650;
const CLIENT_YOUTUBE_CACHE_TTL_MS = 1000 * 60 * 30;
const CLIENT_YOUTUBE_CACHE_PREFIX = 'safe_youtube_api_cache:';

const getClientCacheKey = (url) => `${CLIENT_YOUTUBE_CACHE_PREFIX}${url}`;

const readClientCache = (url) => {
  try {
    const raw = localStorage.getItem(getClientCacheKey(url));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.expiresAt || cached.expiresAt < Date.now()) {
      localStorage.removeItem(getClientCacheKey(url));
      return null;
    }

    return cached.data;
  } catch {
    return null;
  }
};

const writeClientCache = (url, data, ttlMs = CLIENT_YOUTUBE_CACHE_TTL_MS) => {
  try {
    localStorage.setItem(
      getClientCacheKey(url),
      JSON.stringify({
        data,
        expiresAt: Date.now() + ttlMs,
      })
    );
  } catch {
    // Ignore storage failures; server-side cache still protects API quota.
  }
};

const SafeYouTube = () => {
  const playerWrapRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const apiMemoryCacheRef = useRef(new Map());
  const apiInFlightRef = useRef(new Map());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [pageToken, setPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [watchHistory, setWatchHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeChannelTab, setActiveChannelTab] = useState('home');
  const [channelItems, setChannelItems] = useState([]);
  const [channelPageToken, setChannelPageToken] = useState(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelLoadingMore, setChannelLoadingMore] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistPageToken, setPlaylistPageToken] = useState(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistLoadingMore, setPlaylistLoadingMore] = useState(false);

  useEffect(() => {
    setWatchHistory(loadWatchHistory());
    setSearchHistory(loadSearchHistory());

    const last = loadLastVideo();
    if (last?.id) {
      setActiveVideo(last);
      setStartSeconds(last.progressSeconds || 0);
    }
  }, []);

  useEffect(() => () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  const fetchYouTubeJson = useCallback(async (url) => {
    const memoryCached = apiMemoryCacheRef.current.get(url);
    if (memoryCached?.expiresAt > Date.now()) {
      return { ok: true, status: 200, data: memoryCached.data, cached: true };
    }

    const localCached = readClientCache(url);
    if (localCached) {
      apiMemoryCacheRef.current.set(url, {
        data: localCached,
        expiresAt: Date.now() + CLIENT_YOUTUBE_CACHE_TTL_MS,
      });
      return { ok: true, status: 200, data: localCached, cached: true };
    }

    if (apiInFlightRef.current.has(url)) {
      return apiInFlightRef.current.get(url);
    }

    const request = fetch(url)
      .then(async (res) => {
        const data = await res.json();

        if (res.ok) {
          apiMemoryCacheRef.current.set(url, {
            data,
            expiresAt: Date.now() + CLIENT_YOUTUBE_CACHE_TTL_MS,
          });
          writeClientCache(url, data);
        }

        return { ok: res.ok, status: res.status, data, cached: false };
      })
      .finally(() => {
        apiInFlightRef.current.delete(url);
      });

    apiInFlightRef.current.set(url, request);
    return request;
  }, []);

  const playVideo = useCallback((video, resumeAt = 0) => {
    const resumeSeconds = Math.max(0, Math.floor(resumeAt || 0));
    setActiveVideo(video);
    setStartSeconds(resumeSeconds);
    setWatchHistory(addToWatchHistory(video, resumeSeconds));
    saveLastVideo(video, resumeSeconds);

    requestAnimationFrame(() => {
      playerWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleProgress = useCallback((videoId, currentSeconds) => {
    if (!videoId || currentSeconds < 1) return;
    updateWatchProgress(videoId, currentSeconds);
    saveLastVideo(
      activeVideo?.id === videoId ? activeVideo : { id: videoId, title: 'YouTube Video' },
      currentSeconds
    );
    setWatchHistory((prev) =>
      prev.map((item) =>
        item.id === videoId
          ? { ...item, progressSeconds: Math.floor(currentSeconds), watchedAt: new Date().toISOString() }
          : item
      )
    );
  }, [activeVideo]);

  const closeChannel = () => {
    setActiveChannel(null);
    setActiveChannelTab('home');
    setChannelItems([]);
    setChannelPageToken(null);
    closePlaylist();
  };

  const closePlaylist = () => {
    setActivePlaylist(null);
    setPlaylistVideos([]);
    setPlaylistPageToken(null);
  };

  const loadChannelContent = async (channelId, tab = activeChannelTab, token = null) => {
    if (tab === 'posts') {
      setChannelItems([]);
      setChannelPageToken(null);
      return;
    }

    if (token) {
      setChannelLoadingMore(true);
    } else {
      setChannelLoading(true);
      setChannelItems([]);
      setChannelPageToken(null);
    }

    try {
      const params = new URLSearchParams();
      if (token) params.set('pageToken', token);
      if (tab !== 'playlists') params.set('section', tab);

      const endpoint = tab === 'playlists' ? 'playlists' : 'videos';
      const { ok, data } = await fetchYouTubeJson(
        `${getApiBaseUrl()}/api/youtube/channel/${channelId}/${endpoint}?${params}`
      );

      if (!ok) {
        throw new Error(data.message || 'Could not load channel content.');
      }

      const items = data.items || [];
      setChannelItems((prev) => (token ? [...prev, ...items] : items));
      setChannelPageToken(data.nextPageToken || null);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      if (!token) setChannelItems([]);
    } finally {
      setChannelLoading(false);
      setChannelLoadingMore(false);
    }
  };

  const openChannel = async (channel, token = null) => {
    if (!channel?.channelId) return;

    if (!token) {
      setActiveChannel(channel);
      setResults([]);
      setPageToken(null);
      setHasSearched(true);
      setHistoryExpanded(false);
      setActiveChannelTab('home');
      setError('');
    }

    await loadChannelContent(channel.channelId, token ? activeChannelTab : 'home', token);
  };

  const changeChannelTab = async (tab) => {
    if (!activeChannel || tab === activeChannelTab) return;

    setActiveChannelTab(tab);
    closePlaylist();
    setError('');
    await loadChannelContent(activeChannel.channelId, tab);
  };

  const loadPlaylistVideos = async (playlist, token = null) => {
    if (!playlist?.id) return;

    if (token) {
      setPlaylistLoadingMore(true);
    } else {
      setActivePlaylist(playlist);
      setPlaylistLoading(true);
      setPlaylistVideos([]);
      setPlaylistPageToken(null);
    }

    setError('');

    try {
      const params = new URLSearchParams();
      if (token) params.set('pageToken', token);

      const { ok, data } = await fetchYouTubeJson(
        `${getApiBaseUrl()}/api/youtube/playlist/${playlist.id}/videos?${params}`
      );

      if (!ok) {
        throw new Error(data.message || 'Could not load playlist videos.');
      }

      const videos = data.items || [];
      setPlaylistVideos((prev) => (token ? [...prev, ...videos] : videos));
      setPlaylistPageToken(data.nextPageToken || null);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      if (!token) setPlaylistVideos([]);
    } finally {
      setPlaylistLoading(false);
      setPlaylistLoadingMore(false);
    }
  };

  const resolveAndOpenChannel = async (channelQuery) => {
    const trimmed = channelQuery.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoading(true);
    setError('');
    setHasSearched(true);
    setResults([]);
    setPageToken(null);
    setHistoryExpanded(false);
    setSearchHistory(addToSearchHistory(trimmed));

    try {
      const params = new URLSearchParams({ q: trimmed });
      const { ok, data } = await fetchYouTubeJson(`${getApiBaseUrl()}/api/youtube/channel/resolve?${params}`);

      if (!ok) {
        throw new Error(data.message || 'Channel not found.');
      }

      await openChannel(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      closeChannel();
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (searchQuery, token = null) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (!token) {
      setQuery(trimmed);
    }

    const channelInput = extractChannelFromInput(trimmed);
    if (channelInput && !token) {
      await resolveAndOpenChannel(trimmed);
      return;
    }

    if (!token) {
      closeChannel();
    }

    const directId = extractVideoIdFromInput(trimmed);
    if (directId && !token) {
      setError('');
      setHasSearched(true);
      setResults([]);
      setPageToken(null);
      setLoading(true);

      try {
        const { ok, status, data } = await fetchYouTubeJson(`${getApiBaseUrl()}/api/youtube/video/${directId}`);

        if (ok) {
          playVideo(data, 0);
        } else {
          playVideo({
            id: directId,
            title: 'YouTube Video',
            channel: '',
            thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
          }, 0);
          if (status !== 404) {
            setError(data.message || 'Could not load video details.');
          }
        }
      } catch {
        playVideo({
          id: directId,
          title: 'YouTube Video',
          channel: '',
          thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
        }, 0);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (token) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
      setHasSearched(true);
      setResults([]);
      setPageToken(null);
      setHistoryExpanded(false);
      setSearchHistory(addToSearchHistory(trimmed));
    }

    try {
      const params = new URLSearchParams({ q: trimmed });
      if (token) params.set('pageToken', token);

      const { ok, data } = await fetchYouTubeJson(`${getApiBaseUrl()}/api/youtube/search?${params}`);

      if (!ok) {
        throw new Error(data.message || 'Search failed. Please try again.');
      }

      const videos = data.items || [];
      setResults((prev) => (token ? [...prev, ...videos] : videos));
      setPageToken(data.nextPageToken || null);

      if (!token && videos.length > 0) {
        playVideo(videos[0], 0);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      if (!token) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSearchChipClick = (term) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runSearch(term);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleClearWatchHistory = () => {
    clearWatchHistory();
    setWatchHistory([]);
    setHistoryExpanded(false);
  };

  const handleClearSearchHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const renderChannelLink = (video) => {
    if (!video.channel) return null;

    if (!video.channelId) {
      return <p>{video.channel}</p>;
    }

    return (
      <button
        type="button"
        className="yt-channel-link"
        onClick={(e) => {
          e.stopPropagation();
          openChannel({
            channelId: video.channelId,
            title: video.channel,
            thumbnail: '',
          });
        }}
      >
        {video.channel}
      </button>
    );
  };

  const renderVideoRow = (video, { resumeAt = 0, badge = null } = {}) => {
    const isActive = activeVideo?.id === video.id;

    return (
      <button
        type="button"
        className={`yt-video-row ${isActive ? 'active' : ''}`}
        onClick={() => playVideo(video, resumeAt)}
      >
        <div className="yt-video-thumb">
          <img
            src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
            alt=""
            loading="lazy"
          />
          {resumeAt > 0 && (
            <span className="yt-video-duration">{formatWatchTime(resumeAt)}</span>
          )}
        </div>
        <div className="yt-video-meta">
          {badge && <span className="yt-video-badge">{badge}</span>}
          <h4>{video.title}</h4>
          {renderChannelLink(video)}
        </div>
      </button>
    );
  };

  const renderPlaylistCard = (playlist) => (
    <button
      type="button"
      className="yt-playlist-card"
      key={playlist.id}
      onClick={() => loadPlaylistVideos(playlist)}
    >
      <div className="yt-playlist-thumb">
        <img src={playlist.thumbnail} alt="" loading="lazy" />
        <span>{playlist.itemCount ?? 0} videos</span>
      </div>
      <div className="yt-playlist-meta">
        <h4>{playlist.title}</h4>
        <p>{playlist.description || 'Playlist'}</p>
      </div>
    </button>
  );

  const getChannelEmptyText = () => {
    if (activeChannelTab === 'posts') {
      return 'Posts are not available here because YouTube does not provide community posts through its public API.';
    }

    if (activeChannelTab === 'shorts') return 'No Shorts found on this channel.';
    if (activeChannelTab === 'live') return 'No live streams found right now.';
    if (activeChannelTab === 'playlists') return 'No playlists found on this channel.';
    return 'No videos found on this channel.';
  };

  return (
    <section className="safe-youtube-section" id="learn">
      <div className="yt-app">
        <header className="yt-header">
          <h1 className="yt-logo">Learn</h1>
          <form className="yt-search-form" onSubmit={handleSubmit}>
            <div className="yt-search-bar">
              <FaSearch className="yt-search-icon" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search videos or paste a channel link"
                aria-label="Search YouTube videos or channels"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="yt-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" className="yt-search-submit" disabled={loading || !query.trim()}>
              {loading ? '...' : 'Go'}
            </button>
          </form>
        </header>

        {error && <p className="yt-error" role="alert">{error}</p>}

        {activeVideo && (
          <div className="yt-player-section" ref={playerWrapRef}>
            <div className="yt-player">
              <YouTubePlayer
                videoId={activeVideo.id}
                startSeconds={startSeconds}
                onProgress={handleProgress}
              />
            </div>
            <div className="yt-now-playing">
              <h2>{activeVideo.title}</h2>
              {renderChannelLink(activeVideo)}
            </div>
          </div>
        )}

        {hasSearched && !loading && !channelLoading && results.length === 0 && !activeChannel && !error && !extractVideoIdFromInput(query) && !extractChannelFromInput(query) && (
          <p className="yt-empty">No videos found. Try a different search.</p>
        )}

        {activeChannel && (
          <section className="yt-section yt-channel-section">
            <div className="yt-channel-header">
              <button type="button" className="yt-channel-back" onClick={closeChannel}>
                <FaArrowLeft aria-hidden="true" />
                <span>Back</span>
              </button>
              <div className="yt-channel-info">
                {activeChannel.thumbnail && (
                  <img src={activeChannel.thumbnail} alt="" className="yt-channel-avatar" />
                )}
                <div>
                  <h3>{activeChannel.title}</h3>
                  <p>Browse this channel</p>
                </div>
              </div>
            </div>

            <div className="yt-channel-tabs" role="tablist" aria-label="Channel sections">
              {CHANNEL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeChannelTab === tab.id}
                  className={`yt-channel-tab ${activeChannelTab === tab.id ? 'active' : ''}`}
                  onClick={() => changeChannelTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {channelLoading && !activePlaylist && (
              <p className="yt-empty">
                Loading {CHANNEL_TABS.find((tab) => tab.id === activeChannelTab)?.label.toLowerCase()}...
              </p>
            )}

            {!channelLoading && !activePlaylist && channelItems.length === 0 && !error && (
              <p className="yt-empty">{getChannelEmptyText()}</p>
            )}

            {channelItems.length > 0 && activeChannelTab !== 'playlists' && (
              <div className="yt-video-list">
                {channelItems.map((video) => renderVideoRow(video))}
              </div>
            )}

            {activePlaylist && activeChannelTab === 'playlists' && (
              <div className="yt-playlist-view">
                <button type="button" className="yt-playlist-back" onClick={closePlaylist}>
                  <FaArrowLeft aria-hidden="true" />
                  <span>Playlists</span>
                </button>

                <div className="yt-playlist-view-head">
                  <div className="yt-playlist-view-thumb">
                    <img src={activePlaylist.thumbnail} alt="" />
                  </div>
                  <div className="yt-playlist-view-meta">
                    <h4>{activePlaylist.title}</h4>
                    <p>
                      {activePlaylist.itemCount ?? playlistVideos.length} videos
                      {activePlaylist.channel ? ` - ${activePlaylist.channel}` : ''}
                    </p>
                  </div>
                </div>

                {playlistLoading && <p className="yt-empty">Loading playlist videos...</p>}

                {!playlistLoading && playlistVideos.length === 0 && !error && (
                  <p className="yt-empty">No public videos found in this playlist.</p>
                )}

                {playlistVideos.length > 0 && (
                  <div className="yt-video-list">
                    {playlistVideos.map((video) => renderVideoRow(video))}
                  </div>
                )}

                {playlistPageToken && (
                  <button
                    type="button"
                    className="yt-load-more"
                    onClick={() => loadPlaylistVideos(activePlaylist, playlistPageToken)}
                    disabled={playlistLoadingMore}
                  >
                    {playlistLoadingMore ? 'Loading...' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {!activePlaylist && channelItems.length > 0 && activeChannelTab === 'playlists' && (
              <div className="yt-playlist-grid">
                {channelItems.map((playlist) => renderPlaylistCard(playlist))}
              </div>
            )}

            {!activePlaylist && channelPageToken && (
              <button
                type="button"
                className="yt-load-more"
                onClick={() => loadChannelContent(activeChannel.channelId, activeChannelTab, channelPageToken)}
                disabled={channelLoadingMore}
              >
                {channelLoadingMore ? 'Loading...' : 'Show more'}
              </button>
            )}
          </section>
        )}

        {results.length > 0 && !activeChannel && (
          <section className="yt-section yt-section-results">
            <div className="yt-section-head">
              <h3>Results</h3>
            </div>
            <div className="yt-video-list">
              {results.map((video) => renderVideoRow(video))}
            </div>
            {pageToken && (
              <button
                type="button"
                className="yt-load-more"
                onClick={() => runSearch(query, pageToken)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Show more'}
              </button>
            )}
          </section>
        )}

        {searchHistory.length > 0 && (
          <section className="yt-section">
            <div className="yt-section-head">
              <h3>Recent searches</h3>
              <button type="button" onClick={handleClearSearchHistory}>Clear</button>
            </div>
            <div className="yt-chip-row">
              {searchHistory.map((term) => (
                <button key={term} type="button" className="yt-chip" onClick={() => handleSearchChipClick(term)}>
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}

        {watchHistory.length > 0 && (
          <section className={`yt-section yt-history-section ${historyExpanded ? 'expanded' : 'collapsed'}`}>
            <button
              type="button"
              className="yt-history-toggle"
              onClick={() => setHistoryExpanded((prev) => !prev)}
              aria-expanded={historyExpanded}
            >
              <span className="yt-history-toggle-label">
                <h3>Watch history</h3>
                <span className="yt-history-count">{watchHistory.length}</span>
              </span>
              <span className="yt-history-toggle-actions">
                {!historyExpanded && watchHistory.length > HISTORY_PREVIEW_COUNT && (
                  <span className="yt-history-hint">Show all</span>
                )}
                {historyExpanded ? (
                  <FaChevronUp aria-hidden="true" />
                ) : (
                  <FaChevronDown aria-hidden="true" />
                )}
              </span>
            </button>

            <div className="yt-history-body">
              <div className="yt-video-list">
                {(historyExpanded
                  ? watchHistory
                  : watchHistory.slice(0, HISTORY_PREVIEW_COUNT)
                ).map((video, index) =>
                  renderVideoRow(video, {
                    resumeAt: video.progressSeconds,
                    badge: index === 0 && video.progressSeconds > 0 ? 'Continue' : null,
                  })
                )}
              </div>

              {!historyExpanded && watchHistory.length > HISTORY_PREVIEW_COUNT && (
                <button
                  type="button"
                  className="yt-history-expand-btn"
                  onClick={() => setHistoryExpanded(true)}
                >
                  Show all {watchHistory.length} videos
                </button>
              )}
            </div>

            {historyExpanded && (
              <div className="yt-history-footer">
                <button type="button" onClick={handleClearWatchHistory}>Clear history</button>
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
};

export default SafeYouTube;
