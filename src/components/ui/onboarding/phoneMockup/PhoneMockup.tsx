type Props = {
  screenshotUrl: string;
};

export default function PhoneMockup({ screenshotUrl }: Readonly<Props>) {
  return (
    <div className="bg-black rounded-[2.2rem] p-2 shadow-[5px_15px_30px_rgba(0,0,0,0.4)]">
      <img
        src={screenshotUrl}
        alt="Mobile app interface screenshot"
        className="object-cover rounded-[1.8rem] h-[28rem]"
      />
    </div>
  );
}
