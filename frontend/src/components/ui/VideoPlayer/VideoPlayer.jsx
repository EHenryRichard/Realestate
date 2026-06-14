import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowClockwise,
  Fullscreen,
  FullscreenExit,
  PauseFill,
  PlayFill,
  VolumeMuteFill,
  VolumeUpFill,
} from "react-bootstrap-icons";

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const paddedSecs = String(secs).padStart(2, "0");

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSecs}`;
  }

  return `${minutes}:${paddedSecs}`;
};

function VideoPlayer({ src, poster = "", className = "" }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hideControlsTimer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideControlsTimer.current);

    if (videoRef.current && !videoRef.current.paused) {
      hideControlsTimer.current = window.setTimeout(() => setControlsVisible(false), 2500);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused || video.ended) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = (event) => {
    const video = videoRef.current;
    const nextVolume = Number(event.target.value);

    if (!video) {
      return;
    }

    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  };

  const handleSeek = (event) => {
    const video = videoRef.current;

    if (!video || !duration) {
      return;
    }

    const nextTime = (Number(event.target.value) / 100) * duration;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        // unlock is best-effort; unsupported on iOS/desktop
        try {
          window.screen.orientation?.unlock?.();
        } catch {
          /* ignore */
        }
      } else {
        await container.requestFullscreen?.();
        // Rotate to landscape on mobile so the video fills the screen.
        // Rejects on iOS Safari / desktop, which is fine — ignore it.
        try {
          await window.screen.orientation?.lock?.("landscape");
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* fullscreen request was blocked or interrupted */
    }
  }, []);

  const handleKeyDown = (event) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    switch (event.key) {
      case " ":
      case "k":
        event.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        event.preventDefault();
        video.currentTime = Math.min(video.currentTime + 5, duration || video.duration);
        break;
      case "ArrowLeft":
        event.preventDefault();
        video.currentTime = Math.max(video.currentTime - 5, 0);
        break;
      case "m":
        event.preventDefault();
        toggleMute();
        break;
      case "f":
        event.preventDefault();
        toggleFullscreen();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);

      setIsFullscreen(active);

      // When the user leaves fullscreen (e.g. swipe/back/Esc), release the
      // landscape lock so the page returns to normal orientation.
      if (!active) {
        try {
          window.screen.orientation?.unlock?.();
        } catch {
          /* ignore */
        }
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => () => window.clearTimeout(hideControlsTimer.current), []);

  // Reset transient state when the source changes (e.g. carousel navigation).
  useEffect(() => {
    setIsPlaying(false);
    setIsEnded(false);
    setCurrentTime(0);
    setDuration(0);
    setControlsVisible(true);
  }, [src]);

  return (
    <div
      className={`group relative overflow-hidden bg-brand-forest ${className}`}
      ref={containerRef}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      onMouseMove={showControlsTemporarily}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        className="aspect-video w-full bg-brand-forest object-cover"
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        onClick={togglePlay}
        onContextMenu={(event) => event.preventDefault()}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={() => {
          setIsPlaying(false);
          setIsEnded(true);
          setControlsVisible(true);
        }}
        onKeyDown={handleKeyDown}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => {
          setIsPlaying(true);
          setIsEnded(false);
          showControlsTemporarily();
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        poster={poster || undefined}
        ref={videoRef}
        src={src}
        tabIndex={0}
      />

      {/* Center play / replay button */}
      {!isPlaying ? (
        <button
          aria-label={isEnded ? "Replay video" : "Play video"}
          className="absolute inset-0 grid place-items-center bg-brand-forest/20 transition hover:bg-brand-forest/30"
          onClick={togglePlay}
          type="button"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-gold text-brand-charcoal shadow-lg transition group-hover:scale-105">
            {isEnded ? <ArrowClockwise className="h-7 w-7" /> : <PlayFill className="h-8 w-8" />}
          </span>
        </button>
      ) : null}

      {/* Control bar */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-brand-forest/90 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <input
          aria-label="Seek"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-brand-gold"
          max="100"
          min="0"
          onChange={handleSeek}
          step="0.1"
          type="range"
          value={progress}
        />

        <div className="mt-2 flex items-center gap-3 text-white">
          <button
            aria-label={isPlaying ? "Pause" : "Play"}
            className="grid h-8 w-8 place-items-center transition hover:text-brand-gold"
            onClick={togglePlay}
            type="button"
          >
            {isPlaying ? <PauseFill className="h-6 w-6" /> : <PlayFill className="h-6 w-6" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="grid h-8 w-8 place-items-center transition hover:text-brand-gold"
              onClick={toggleMute}
              type="button"
            >
              {isMuted || volume === 0 ? (
                <VolumeMuteFill className="h-5 w-5" />
              ) : (
                <VolumeUpFill className="h-5 w-5" />
              )}
            </button>
            <input
              aria-label="Volume"
              className="hidden h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-brand-gold sm:block"
              max="1"
              min="0"
              onChange={handleVolumeChange}
              step="0.05"
              type="range"
              value={isMuted ? 0 : volume}
            />
          </div>

          <span className="text-xs font-bold tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="ml-auto grid h-8 w-8 place-items-center transition hover:text-brand-gold"
            onClick={toggleFullscreen}
            type="button"
          >
            {isFullscreen ? <FullscreenExit className="h-5 w-5" /> : <Fullscreen className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
