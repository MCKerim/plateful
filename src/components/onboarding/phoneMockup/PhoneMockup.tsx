import { useEffect, useRef, useState } from "react";
import "./PhoneMockup.css";

type Props = {
  mediaUrl: string;
  loopDelay?: number;
};

/** Must sit inside a `.phone-stage`, whose size it fills. */
export default function PhoneMockup({ mediaUrl, loopDelay = 2000 }: Readonly<Props>) {
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
    <div className="phone-mockup">
      <video
        ref={videoRef}
        src={mediaUrl}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={() => setVideoReady(true)}
        className={`transition-opacity duration-300 ${videoReady ? "opacity-100" : "opacity-0"}`}
      />
      <div className="phone-mockup-camera" />
    </div>
  );
}
