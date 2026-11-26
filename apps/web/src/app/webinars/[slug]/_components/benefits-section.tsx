import Image from "next/image";

const benefits = [
  {
    icon: "/icon_6 1.svg",
    text: "Free for all teachers",
    width: 61,
    height: 64,
  },
  {
    icon: "/icon_7 1.svg",
    text: "Sessions are recorded – register even if you can’t attend live",
    width: 69,
    height: 67,
  },
  {
    icon: "/icon_8 1.svg",
    text: "Live online, with time for questions in every session",
    width: 62,
    height: 66,
  },
  {
    icon: "/icon_9 1.svg",
    text: (
      <>
        Led by the PMAA 
        <br className="hidden lg:block" />
        Education Group team
      </>
    ),
    width: 66,
    height: 70,
  },
];

const benefitClassName = (index: number) =>
  [
    "flex min-w-0 items-center gap-3 px-3 py-2 text-[clamp(.72rem,2.3vw,.88rem)] leading-[1.5] lg:px-5 lg:py-1 lg:text-[clamp(.88rem,1.05vw,1rem)]",
    index % 2 === 1 && "border-l border-[#a277c6]",
    index >= 2 && "border-t border-[#a277c6] lg:border-t-0",
    index > 0 && "lg:border-l lg:border-[#a277c6]",
    index === benefits.length - 1 && "lg:pr-[clamp(2.75rem,4vw,3.75rem)]",
  ]
    .filter(Boolean)
    .join(" ");

export function BenefitsSection() {
  return (
    <ul
      className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#a277c6] bg-white px-3 py-3 text-[#35105d] lg:grid-cols-4 lg:rounded-3xl lg:px-5 lg:py-2"
      aria-label="Webinar details"
    >
      {benefits.map((benefit, index) => (
        <li className={benefitClassName(index)} key={index}>
          <Image
            className="h-auto w-[clamp(3.25rem,6vw,4.35rem)] shrink-0"
            src={benefit.icon}
            alt=""
            width={benefit.width}
            height={benefit.height}
          />
          <span>{benefit.text}</span>
        </li>
      ))}
    </ul>
  );
}
