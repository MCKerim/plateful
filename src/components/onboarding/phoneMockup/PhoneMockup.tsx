import { useEffect, useRef, useState } from "react";

type Props = {
  mediaUrl: string;
  mediaType?: "image" | "video";
  loopDelay?: number;
};

export default function PhoneMockup({ mediaUrl, mediaType = "image", loopDelay = 2000 }: Readonly<Props>) {
  const isVideo = mediaType === "video" || mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setTimeout(() => {
        video.play();
      }, loopDelay);
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [loopDelay]);

  return (
    <div className="bg-white rounded-[18px] p-2 shadow-[0px_0px_77px_rgba(0,0,0,0.1)]">
      {isVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          className={`object-cover rounded-[12px] h-[28rem] w-full transition-opacity duration-300 ${videoReady ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <img
          src={mediaUrl}
          alt="Mobile app interface screenshot"
          className="object-cover rounded-[12px] h-[28rem] w-full"
        />
      )}
    </div>
  );
}
