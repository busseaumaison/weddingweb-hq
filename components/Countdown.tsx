"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const WEDDING_DATE = new Date(
  "2027-07-17T15:00:00-04:00"
).getTime();

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calculateTimeLeft(): TimeLeft {
  const difference = Math.max(
    0,
    WEDDING_DATE - Date.now()
  );

  return {
    days: Math.floor(
      difference / (1000 * 60 * 60 * 24)
    ),

    hours: Math.floor(
      (difference / (1000 * 60 * 60)) % 24
    ),

    minutes: Math.floor(
      (difference / (1000 * 60)) % 60
    ),

    seconds: Math.floor(
      (difference / 1000) % 60
    ),
  };
}

export default function Countdown() {
  const { t } = useLanguage();

  const [mounted, setMounted] = useState(false);

  const [timeLeft, setTimeLeft] =
    useState<TimeLeft>({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });

  useEffect(() => {
    setMounted(true);

    // Premier calcul seulement dans le navigateur.
    setTimeLeft(calculateTimeLeft());

    const interval = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const values = [
    [t.days, timeLeft.days],
    [t.hours, timeLeft.hours],
    [t.minutes, timeLeft.minutes],
    [t.seconds, timeLeft.seconds],
  ] as const;

  return (
    <div className="stats">
      {values.map(([label, number]) => (
        <div
          className="card stat"
          key={label}
        >
          <strong>
            {mounted
              ? String(number).padStart(2, "0")
              : "--"}
          </strong>

          <span className="eyebrow">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}