import { useState, useCallback, useEffect } from 'react';
import { FaSearch, FaPlay, FaHistory, FaClock } from 'react-icons/fa';
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
  formatWatchTime,
} from './utils/safeYouTubeHistory';
import YouTubePlayer from './YouTubePlayer';
import './SafeYouTube.css';

const formatPublishedDate = (isoDate) => {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const SafeYouTube = () => {
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
  const [continueVideo, setContinueVideo] = useState(null);

  useEffect(() => {
    setWatchHistory(loadWatchHistory());
    setSearchHistory(loadSearchHistory());

    const last = loadLastVideo();
    if (last?.id) {
      setContinueVideo(last);
      setActiveVideo(last);
      setStartSeconds(last.progressSeconds || 0);
    }
  }, []);

  const playVideo = useCallback((video, resumeAt = 0) => {
    const resumeSeconds = Math.max(0, Math.floor(resumeAt || 0));
    setActiveVideo(video);
    setStartSeconds(resumeSeconds);
    setContinueVideo({ ...video, progressSeconds: resumeSeconds });
    setWatchHistory(addToWatchHistory(video, resumeSeconds));
    saveLastVideo(video, resumeSeconds);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleProgress = useCallback((videoId, currentSeconds) => {
    if (!videoId || currentSeconds < 1) return;
    updateWatchProgress(videoId, currentSeconds);
    saveLastVideo(
      activeVideo?.id === videoId ? activeVideo : { id: videoId, title: 'YouTube Video' },
      currentSeconds
    );
    setContinueVideo((prev) =>
      prev?.id === videoId ? { ...prev, progressSeconds: Math.floor(currentSeconds) } : prev
    );
    setWatchHistory((prev) =>
      prev.map((item) =>
        item.id === videoId
          ? { ...item, progressSeconds: Math.floor(currentSeconds), watchedAt: new Date().toISOString() }
          : item
      )
    );
  }, [activeVideo]);

  const runSearch = async (searchQuery, token = null) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (!token) {
      setQuery(trimmed);
    }

    const directId = extractVideoIdFromInput(trimmed);
    if (directId && !token) {
      setError('');
      setHasSearched(true);
      setResults([]);
      setPageToken(null);
      setLoading(true);

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/youtube/video/${directId}`);
        const data = await res.json();

        if (res.ok) {
          playVideo(data, 0);
        } else {
          playVideo({
            id: directId,
            title: 'YouTube Video',
            channel: '',
            thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
            publishedAt: '',
            description: '',
          }, 0);
          if (res.status !== 404) {
            setError(data.message || 'Could not load video details.');
          }
        }
      } catch {
        playVideo({
          id: directId,
          title: 'YouTube Video',
          channel: '',
          thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
          publishedAt: '',
          description: '',
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
      setSearchHistory(addToSearchHistory(trimmed));
    }

    try {
      const params = new URLSearchParams({ q: trimmed });
      if (token) params.set('pageToken', token);

      const res = await fetch(`${getApiBaseUrl()}/api/youtube/search?${params}`);
      const data = await res.json();

      if (!res.ok) {
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
    runSearch(query);
  };

  const handleClearWatchHistory = () => {
    clearWatchHistory();
    setWatchHistory([]);
    setContinueVideo(null);
  };

  const handleClearSearchHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const renderVideoCard = (video, { resumeAt = 0, showProgress = false } = {}) => (
    <button
      type="button"
      className={`safe-youtube-card ${activeVideo?.id === video.id ? 'active' : ''}`}
      onClick={() => playVideo(video, resumeAt)}
    >
      <div className="safe-youtube-thumb-wrap">
        <img
          src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
          alt=""
          loading="lazy"
        />
        {showProgress && resumeAt > 0 && (
          <span className="safe-youtube-resume-badge">
            Resume {formatWatchTime(resumeAt)}
          </span>
        )}
        <span className="safe-youtube-play-badge" aria-hidden="true">
          <FaPlay />
        </span>
      </div>
      <div className="safe-youtube-card-body">
        <h4>{video.title}</h4>
        {video.channel && <p className="safe-youtube-card-channel">{video.channel}</p>}
        {video.publishedAt && (
          <p className="safe-youtube-card-date">{formatPublishedDate(video.publishedAt)}</p>
        )}
      </div>
    </button>
  );

  return (
    <section className="safe-youtube-section" id="learn">
      <h1 className="work-title">Learn</h1>
      <p className="work-desc safe-youtube-desc">
        Search and watch any YouTube video here — no login, no comments, no likes, and no uploads.
        Your searches and watched videos are saved on this device so you can continue later.
      </p>

      <form className="safe-youtube-search" onSubmit={handleSubmit}>
        <div className="safe-youtube-search-box">
          <FaSearch className="safe-youtube-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube or paste a video link..."
            aria-label="Search YouTube"
            autoComplete="off"
          />
          <button type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <p className="safe-youtube-error" role="alert">{error}</p>}

      {continueVideo && (
        <div className="safe-youtube-history-block safe-youtube-continue">
          <div className="safe-youtube-history-header">
            <h3><FaClock aria-hidden="true" /> Continue watching</h3>
          </div>
          <ul className="safe-youtube-grid safe-youtube-grid-single">
            <li>
              {renderVideoCard(continueVideo, {
                resumeAt: continueVideo.progressSeconds,
                showProgress: true,
              })}
            </li>
          </ul>
        </div>
      )}

      {activeVideo && (
        <div className="safe-youtube-player-wrap">
          <div className="safe-youtube-player">
            <YouTubePlayer
              key={activeVideo.id}
              videoId={activeVideo.id}
              startSeconds={startSeconds}
              onProgress={handleProgress}
            />
          </div>
          <div className="safe-youtube-now-playing">
            <h2>{activeVideo.title}</h2>
            {activeVideo.channel && <p className="safe-youtube-channel">{activeVideo.channel}</p>}
            {startSeconds > 0 && (
              <p className="safe-youtube-resume-note">
                Resuming from {formatWatchTime(startSeconds)}
              </p>
            )}
          </div>
        </div>
      )}

      {searchHistory.length > 0 && (
        <div className="safe-youtube-history-block">
          <div className="safe-youtube-history-header">
            <h3><FaSearch aria-hidden="true" /> Recent searches</h3>
            <button type="button" className="safe-youtube-clear-btn" onClick={handleClearSearchHistory}>
              Clear
            </button>
          </div>
          <div className="safe-youtube-search-chips">
            {searchHistory.map((term) => (
              <button
                key={term}
                type="button"
                className="safe-youtube-chip"
                onClick={() => runSearch(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {watchHistory.length > 0 && (
        <div className="safe-youtube-history-block">
          <div className="safe-youtube-history-header">
            <h3><FaHistory aria-hidden="true" /> Watch history</h3>
            <button type="button" className="safe-youtube-clear-btn" onClick={handleClearWatchHistory}>
              Clear
            </button>
          </div>
          <ul className="safe-youtube-grid">
            {watchHistory.map((video) => (
              <li key={video.id}>
                {renderVideoCard(video, {
                  resumeAt: video.progressSeconds,
                  showProgress: true,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && !error && !extractVideoIdFromInput(query) && (
        <p className="safe-youtube-empty">No videos found. Try a different search.</p>
      )}

      {results.length > 0 && (
        <div className="safe-youtube-results">
          <h3 className="safe-youtube-results-title">Results</h3>
          <ul className="safe-youtube-grid">
            {results.map((video) => (
              <li key={video.id}>
                {renderVideoCard(video)}
              </li>
            ))}
          </ul>

          {pageToken && (
            <button
              type="button"
              className="safe-youtube-load-more"
              onClick={() => runSearch(query, pageToken)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default SafeYouTube;
