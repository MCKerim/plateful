type Props = {
  screenshotUrl: string;
}

export default function PhoneMockup({ screenshotUrl }: Readonly<Props>) {
  return (
    <div className="bg-gray-900 rounded-[2.2rem] p-2 shadow-2xl">
      <img
        src={screenshotUrl}
        alt="Mobile app interface screenshot"
        className="object-cover rounded-[1.8rem] h-[32rem]"
      />
    </div>
  );
}
