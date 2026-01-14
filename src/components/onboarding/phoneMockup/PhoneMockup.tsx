type Props = {
  mediaUrl: string;
  mediaType?: 'image' | 'video';
};

export default function PhoneMockup({ mediaUrl, mediaType = 'image' }: Readonly<Props>) {
  const isVideo = mediaType === 'video' || mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div className="bg-black rounded-[2.2rem] p-2 shadow-[5px_15px_30px_rgba(0,0,0,0.4)]">
      {isVideo ? (
        <video
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="object-cover rounded-[1.8rem] h-[28rem] w-full"
        />
      ) : (
        <img
          src={mediaUrl}
          alt="Mobile app interface screenshot"
          className="object-cover rounded-[1.8rem] h-[28rem] w-full"
        />
      )}
    </div>
  );
}
