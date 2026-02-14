type Props = {
  mediaUrl: string;
  mediaType?: "image" | "video";
};

export default function PhoneMockup({ mediaUrl, mediaType = "image" }: Readonly<Props>) {
  const isVideo = mediaType === "video" || mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div className="bg-white rounded-[18px] p-2 shadow-[0px_0px_77px_rgba(0,0,0,0.1)]">
      {isVideo ? (
        <video
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="object-cover rounded-[12px] h-[28rem] w-full"
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
