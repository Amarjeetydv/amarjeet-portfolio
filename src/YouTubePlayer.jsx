import { useEffect, useRef, useCallback } from 'react';

const PROGRESS_INTERVAL_MS = 5000;

const YouTubePlayer = ({ videoId, startSeconds = 0, onProgress }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  const progressTimerRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  const currentVideoRef = useRef(videoId);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    currentVideoRef.current = videoId;
  }, [videoId]);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const reportProgress = useCallback(() => {
    const player = playerRef.current;
    if (!player?.getCurrentTime || !isReadyRef.current) return;

    const current = player.getCurrentTime();
    const duration = player.getDuration?.() || 0;
    onProgressRef.current?.(currentVideoRef.current, current, duration);
  }, []);

  const startProgressTimer = useCallback(() => {
    clearProgressTimer();
    progressTimerRef.current = setInterval(reportProgress, PROGRESS_INTERVAL_MS);
  }, [clearProgressTimer, reportProgress]);

  const loadVideo = useCallback((id, start) => {
    const player = playerRef.current;
    if (!player || !isReadyRef.current) return false;

    const startAt = Math.max(0, Math.floor(start || 0));

    if (typeof player.loadVideoById === 'function') {
      player.loadVideoById({
        videoId: id,
        startSeconds: startAt,
      });
      return true;
    }

    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !containerRef.current || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin,
          start: Math.floor(startSeconds || 0),
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            isReadyRef.current = true;
            loadVideo(videoId, startSeconds);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startProgressTimer();
            } else {
              clearProgressTimer();
              reportProgress();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      initPlayer();
    };

    if (window.YT?.Player) {
      initPlayer();
    }

    const handlePageHide = () => reportProgress();
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      cancelled = true;
      isReadyRef.current = false;
      window.removeEventListener('pagehide', handlePageHide);
      clearProgressTimer();
      reportProgress();
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [clearProgressTimer, loadVideo, reportProgress, startProgressTimer]);

  useEffect(() => {
    if (!videoId) return;

    if (loadVideo(videoId, startSeconds)) return;

    const timer = setInterval(() => {
      if (loadVideo(videoId, startSeconds)) {
        clearInterval(timer);
      }
    }, 150);

    return () => clearInterval(timer);
  }, [videoId, startSeconds, loadVideo]);

  return <div ref={containerRef} className="safe-youtube-player-embed" />;
};

export default YouTubePlayer;
