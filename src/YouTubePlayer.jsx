import { useEffect, useRef } from 'react';

const PROGRESS_INTERVAL_MS = 5000;

const YouTubePlayer = ({ videoId, startSeconds = 0, onProgress }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  const clearProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const reportProgress = () => {
    const player = playerRef.current;
    if (!player?.getCurrentTime) return;

    const current = player.getCurrentTime();
    const duration = player.getDuration?.() || 0;
    onProgressRef.current?.(videoId, current, duration);
  };

  const startProgressTimer = () => {
    clearProgressTimer();
    progressTimerRef.current = setInterval(reportProgress, PROGRESS_INTERVAL_MS);
  };

  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !containerRef.current || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          start: Math.floor(startSeconds || 0),
        },
        events: {
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

    const loadApi = () => {
      if (window.YT?.Player) {
        initPlayer();
        return;
      }

      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
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
    };

    loadApi();

    const handlePageHide = () => reportProgress();
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', handlePageHide);
      clearProgressTimer();
      reportProgress();
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player?.loadVideoById) return;

    player.loadVideoById({
      videoId,
      startSeconds: Math.floor(startSeconds || 0),
    });
  }, [videoId, startSeconds]);

  return <div ref={containerRef} className="safe-youtube-player-embed" title={videoId} />;
};

export default YouTubePlayer;
