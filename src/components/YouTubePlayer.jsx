import { useState } from "react";
import { postActivity } from "../lib/discordCards";
import { FaPlay } from "react-icons/fa";

/**
 * YouTubePlayer
 *
 * Clean thumbnail with a subtle play button overlay. On click, sends to Discord webhook and plays video.
 */
export default function YouTubePlayer({ videoId, title = "YouTube video" }) {
  const [playing, setPlaying] = useState(false);

  const handlePlayClick = () => {
    setPlaying(true);
    // Reported through the shared activity card rather than a webhook of its
    // own, so every play in the funnel reads the same in the feed.
    postActivity("played", { fields: { Video: title } });
  };

  if (playing) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&controls=0&fs=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePlayClick}
      aria-label={`Play video: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
      <img
        className="w-full h-full object-cover"
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt=""
        loading="lazy"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-20 items-center justify-center rounded-lg bg-black/50 backdrop-blur-[1px] shadow-lg transition-transform group-hover:bg-black/70">
          <FaPlay className="text-white text-2xl drop-shadow" />{" "}
        </span>
      </span>
    </button>
  );
}
