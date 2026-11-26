import Image from "next/image";
import type { PublicEvent } from "@/server/public-events";

const outcomeIcons = [
  "/learning.svg",
  "/learning1.svg",
  "/learning2.svg",
  "/learning3.svg",
];

const outcomeClassName = (index: number) =>
  [
    "grid min-h-[4.7rem] min-w-0 grid-cols-[clamp(2.75rem,12vw,3.5rem)_minmax(0,1fr)] items-center gap-[clamp(.35rem,.85vw,.65rem)] px-[.55rem] py-[.55rem] text-[clamp(.65rem,2.65vw,.75rem)] leading-[1.15] lg:min-h-[4.8rem] lg:grid-cols-[clamp(3.75rem,7.5vw,5rem)_minmax(0,1fr)] lg:px-[clamp(.7rem,1.55vw,1.15rem)] lg:py-0 lg:text-[clamp(.75rem,1.42vw,1.15rem)]",
    index === 0 && "pl-0",
    index === outcomeIcons.length - 1 && "pr-0",
    index % 2 === 1 && "border-l border-white/25",
    index >= 2 && "border-t border-white/25 lg:border-t-0",
    index > 0 && "lg:border-l lg:border-white/25",
  ]
    .filter(Boolean)
    .join(" ");

export function LearningSection({ event }: { event: PublicEvent }) {
  return (
    <section
      className="mx-auto mt-[.85rem] w-[calc(100%-1.5rem)] rounded-2xl bg-[linear-gradient(105deg,#35105d,#57237c)] px-[.8rem] pt-[.85rem] pb-4 text-white lg:w-[min(calc(100%-2.5rem),91.5%)] lg:rounded-3xl lg:px-[clamp(1rem,2vw,1.35rem)] lg:pt-4 lg:pb-7"
      aria-labelledby="learning"
    >
      <h2
        id="learning"
        className="text-center font-[Arial,sans-serif] text-[.82rem] leading-[1.2] font-bold uppercase lg:text-[clamp(.9rem,1.65vw,1.5rem)]"
      >
        In every session, you will : 
      </h2>
      <ul className="mt-4 grid grid-cols-2 lg:mt-[1.65rem] lg:grid-cols-4">
        {event.learningOutcomes.map((outcome, index) => (
          <li className={outcomeClassName(index)} key={outcome}>
            <Image
              className="h-auto w-full"
              src={outcomeIcons[index % outcomeIcons.length]}
              alt=""
              width={100}
              height={100}
            />
            {outcome}
          </li>
        ))}
      </ul>
    </section>
  );
}
