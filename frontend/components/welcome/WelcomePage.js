"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

/*
 * The welcome page is built on one fact: from Mars, Earth is a dot up to 22 minutes away by radio
 * (MARS_DELAY_MAX_MINUTES, research/CHECKS.md). Every section shows what the crew can do on board
 * in that gap. Numbers on this page are copied from src/core/constants.ts and content/cards.json;
 * the page itself scores nothing.
 */

const IS_DEMO_BUILD = process.env.NEXT_PUBLIC_DEMO === "1";
const DELAY_MAX_MIN = 22; // MARS_DELAY_MAX_MINUTES
const EASE = [0.22, 1, 0.36, 1];

function Rise({ children, i = 0, className, as = "div" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
    >
      {children}
    </M>
  );
}

function Mark({ className = "h-8 w-8", beat = false }) {
  return (
    <svg viewBox="0 -4 76 72" className={className} aria-hidden>
      <g transform="translate(6,0)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="26" stroke="#4D8DFF" strokeWidth="6" />
        <path
          d="M-4 34 H18 L24 22 L31 46 L38 16 L44 34 H68"
          stroke="#F7F8FB"
          strokeWidth="5"
          className={beat ? "welcome-beat" : undefined}
        />
      </g>
    </svg>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ---------------------------------------------------------------- header */

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-5 sm:px-8 lg:px-12">
        <Link href="/welcome" className="flex items-center gap-2.5 text-[20px] font-semibold tracking-tight">
          <Mark className="h-8 w-8" />
          <span>Nabz</span>
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-7 text-[15px] text-soft md:flex">
          <a href="#story" className="hover:text-primary">Story</a>
          <a href="#demo" className="hover:text-primary">Demo</a>
          <a href="#rules" className="hover:text-primary">Rules</a>
          <a href="#data" className="hover:text-primary">NASA data</a>
          <a href="#emergency" className="hover:text-primary">Emergency</a>
        </nav>
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-[15px] font-semibold text-canvas hover:bg-soft"
        >
          Open the app
        </Link>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- hero */

// The blue dot in PIA17936 sits at (643, 423) of 1920x1200. With object-position set to that same
// fraction, object-cover keeps the dot at that fraction of the box at any width.
const DOT_X = (643 / 1920) * 100;
const DOT_Y = (423 / 1200) * 100;

function Countdown() {
  const [left, setLeft] = useState(DELAY_MAX_MIN * 60);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const s = DELAY_MAX_MIN * 60 - Math.floor((Date.now() - start) / 1000);
      setLeft(Math.max(0, s));
      if (s <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="max-w-[46ch] text-[15px] leading-6 text-soft" aria-live="off">
      {left > 0 ? (
        <>
          A message sent from the far side of Mars&apos;s orbit when you opened this page is still
          travelling.{" "}
          <span className="font-semibold tabular-nums text-primary">{fmt(left)}</span> until it
          reaches Earth.
        </>
      ) : (
        <>That message has just reached Earth. An answer would need another 22 minutes.</>
      )}
    </p>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative isolate flex min-h-[max(100svh,820px)] flex-col justify-end overflow-hidden" aria-labelledby="hero-h">
      {/* On phones the photo fills the top part only, so Earth stays clear of the headline. */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[64%] overflow-hidden sm:h-full">
        <motion.img
          src="/welcome/PIA17936.jpg"
          alt="The evening sky over Mars from the Curiosity rover, with Earth as a small bright dot."
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${DOT_X}% ${DOT_Y}%` }}
          initial={{ scale: reduce ? 1 : 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: EASE }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,15,0.35)_0%,rgba(12,13,15,0)_30%,rgba(12,13,15,0.55)_62%,#0c0d0f_100%)]" />
        {/* The marker on Earth */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${DOT_X}%`, top: `${DOT_Y}%` }}
          aria-hidden
        >
          <span className="block h-14 w-14 rounded-full border-2 border-[#4D8DFF] welcome-ping" />
          <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[13px] font-medium text-primary">
            Earth
          </span>
        </div>
      </div>

      <Header />

      <div className="mx-auto w-full max-w-[1440px] px-4 pb-14 sm:px-8 sm:pb-20 lg:px-12">
        <motion.h1
          id="hero-h"
          className="max-w-[14ch] text-[clamp(44px,8.4vw,128px)] font-semibold leading-[0.95] tracking-[-0.035em]"
          initial={{ opacity: 0, y: reduce ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
        >
          That dot is Earth. The doctor is on it.
        </motion.h1>
        <motion.div
          className="mt-8 grid gap-8 lg:grid-cols-12"
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
        >
          <div className="lg:col-span-6">
            <p className="max-w-[40ch] text-[clamp(18px,1.5vw,22px)] leading-[1.45] text-primary">
              Nabz is a crew health app for Mars missions. It checks each astronaut against their
              own normal and says what to do on board, without waiting for Earth.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#demo"
                className="inline-flex min-h-12 items-center rounded-full bg-[#4D8DFF] px-6 text-[16px] font-semibold text-white hover:bg-[#3b78e8]"
              >
                Watch it run
              </a>
              <Link
                href="/sign-in"
                className="inline-flex min-h-12 items-center rounded-full border border-line-strong px-6 text-[16px] font-semibold text-primary hover:border-soft hover:bg-white/5"
              >
                {IS_DEMO_BUILD ? "Try it as Sara, code 4120" : "Open the app"}
              </Link>
            </div>
          </div>
          <div className="flex items-end lg:col-span-5 lg:col-start-8">
            <Countdown />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- story */

// What happens on board, against the clock of one question sent to Earth when it starts.
// Each beat shows the screen it describes (stills from the demo recordings).
const BEATS = [
  { min: 0, img: "s-today", alt: "Nabz Today screen for Sara, day 120 of the Mars transit.", t: "Day 120 of the Mars transit. Sara opens Nabz for her morning check-in." },
  { min: 3, img: "s-checkin", alt: "Check-in result: slower than your personal normal.", t: "Three minutes of tapping. Her reaction time is slower than her own normal, learned from her last 14 check-ins." },
  { min: 5, img: "s-bp-typed", alt: "Blood pressure form with 186 over 122 entered.", t: "She measures her blood pressure. 186 over 122." },
  { min: 6, img: "s-bp-card", alt: "Card: very high reading, measure again. Act now with the crew medical officer.", t: "Nabz shows the rule straight away: rest five minutes, measure again, and act now with the crew medical officer." },
  { min: 11, img: "iss047e134605", alt: "An astronaut at work inside the International Space Station.", t: "The crew has acted. Earth hears about it afterwards, as the card says." },
  { min: 22, img: "PIA17936", alt: "Earth as a small dot in the Mars evening sky.", t: "The question she could have sent Earth at minute zero arrives now. The answer needs another 22 minutes." },
];

function Story() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [i, setI] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setI(Math.min(BEATS.length - 1, Math.max(0, Math.floor(p * BEATS.length))));
  });
  const b = BEATS[i];
  const pct = `${(b.min / DELAY_MAX_MIN) * 100}%`;
  const move = { duration: reduce ? 0 : 0.7, ease: EASE };

  return (
    <section id="story" ref={ref} aria-label="One morning on the way to Mars" style={{ height: `${BEATS.length * 70 + 30}svh` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden py-6">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12">
          {/* The radio track: Mars on the left, Earth on the right, the question in between. */}
          <div className="relative" aria-hidden>
            <div className="flex items-center justify-between gap-3 text-[14px] font-medium text-secondary">
              <span>Mars</span>
              <span className="text-center tabular-nums text-primary">
                {b.min < DELAY_MAX_MIN ? `Question to Earth: ${b.min} of ${DELAY_MAX_MIN} min` : "Reached Earth"}
              </span>
              <span>Earth</span>
            </div>
            <div className="relative mt-4 h-[2px] bg-line-strong">
              <motion.div className="absolute inset-y-0 left-0 bg-[#4D8DFF]" animate={{ width: pct }} transition={move} />
              <motion.span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4D8DFF] shadow-[0_0_0_6px_rgba(77,141,255,0.18)]"
                animate={{ left: pct }}
                transition={move}
              />
              <span className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-[#4D8DFF] bg-canvas" />
            </div>
          </div>

          <div className="mt-[clamp(28px,6vh,72px)] grid items-center gap-6 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <p className="text-[15px] font-medium tabular-nums text-secondary">Minute {b.min}</p>
              <div className="relative mt-3 min-h-[7.5em] text-[clamp(24px,3vw,46px)] font-semibold leading-[1.1] tracking-[-0.02em] sm:min-h-[6.5em]">
                {BEATS.map((x, k) => (
                  <p
                    key={k}
                    className="absolute inset-x-0 top-0 transition-[opacity,transform] duration-500"
                    style={{ opacity: k === i ? 1 : 0, transform: `translateY(${k === i ? 0 : k < i ? -14 : 14}px)` }}
                    aria-hidden={k !== i}
                  >
                    {x.t}
                  </p>
                ))}
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[14px] border border-line-strong bg-surface lg:col-span-7">
              {BEATS.map((x, k) => (
                <img
                  key={x.img}
                  src={`/welcome/${x.img}.jpg`}
                  alt={k === i ? x.alt : ""}
                  aria-hidden={k !== i}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                  style={{ opacity: k === i ? 1 : 0, objectPosition: x.img === "PIA17936" ? `${DOT_X}% ${DOT_Y}%` : "top" }}
                  loading={k < 2 ? "eager" : "lazy"}
                />
              ))}
              {/* Same ring as the hero, so Earth is findable in the last beat. */}
              <span
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500"
                style={{ left: `${DOT_X}%`, top: `${DOT_Y}%`, opacity: b.img === "PIA17936" ? 1 : 0 }}
                aria-hidden
              >
                <span className="block h-10 w-10 rounded-full border-2 border-[#4D8DFF] welcome-ping" />
              </span>
            </div>
          </div>
          <ol className="mt-6 flex gap-2" aria-hidden>
            {BEATS.map((_, k) => (
              <li key={k} className={`h-1 flex-1 rounded-full transition-colors ${k <= i ? "bg-primary" : "bg-line-strong"}`} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- demo reel */

// Recordings of the current app (demo build, crew member Sara). `from` skips the page load.
const CHAPTERS = [
  { id: "checkin", label: "Check-in", from: 2.0, text: "The three-minute reaction test, tapped for real, then scored against Sara's own normal." },
  { id: "bp", label: "Blood pressure", from: 0.8, text: "186 over 122 typed in. The card says what to do now and who to call." },
  { id: "realdata", label: "NASA data", from: 1.2, text: "Blood counts from the four Inspiration4 astronauts, run through the same engine." },
  { id: "emergency", label: "Emergency", from: 0.3, text: "Who needs help, what happened, then the steps, with a CPR beat at 110 per minute." },
];

function DemoReel() {
  const box = useRef(null);
  const video = useRef(null);
  const reduce = useReducedMotion();
  const [c, setC] = useState(0);
  const [inView, setInView] = useState(false);
  // Reduced motion starts paused; after that the visitor's own choice wins.
  const [userPaused, setUserPaused] = useState(null);
  const paused = userPaused ?? Boolean(reduce);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (inView && !paused) v.play().catch(() => {});
    else v.pause();
  }, [inView, paused, c]);

  const ch = CHAPTERS[c];
  return (
    <section id="demo" aria-labelledby="demo-h" className="border-t border-line bg-surface py-[clamp(72px,11vw,160px)]">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-4">
          <Rise as="h2" className="text-[clamp(34px,4.6vw,72px)] font-semibold leading-[0.98] tracking-[-0.03em]">
            <span id="demo-h">Watch it run.</span>
          </Rise>
          <Rise as="p" i={1} className="mt-6 max-w-[40ch] text-[18px] leading-[1.55] text-soft">
            Recorded from the app as it is today. Four flows, a little under a minute, playing on
            their own.
          </Rise>
          <Rise i={2} className="mt-8">
            <div role="tablist" aria-label="Demo chapters" className="flex flex-col gap-1.5">
              {CHAPTERS.map((x, k) => (
                <button
                  key={x.id}
                  role="tab"
                  type="button"
                  aria-selected={k === c}
                  onClick={() => {
                    setC(k);
                    setProgress(0);
                  }}
                  className={`relative overflow-hidden rounded-[12px] border px-4 py-3 text-left transition-colors ${
                    k === c ? "border-line-strong bg-raised" : "border-transparent hover:bg-raised/60"
                  }`}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="text-[13px] tabular-nums text-muted">0{k + 1}</span>
                    <span className="text-[17px] font-semibold">{x.label}</span>
                  </span>
                  {k === c ? <span className="mt-1 block pl-7 text-[15px] leading-6 text-secondary">{x.text}</span> : null}
                  {k === c ? (
                    <span className="absolute bottom-0 left-0 h-[2px] bg-[#4D8DFF]" style={{ width: `${progress * 100}%` }} aria-hidden />
                  ) : null}
                </button>
              ))}
            </div>
          </Rise>
          <Rise i={3} className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setUserPaused(!paused)}
              className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-5 text-[15px] font-semibold hover:bg-white/5"
            >
              {paused ? "Play" : "Pause"}
            </button>
            <Link
              href="/sign-in"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-[15px] font-semibold text-canvas hover:bg-soft"
            >
              Try it yourself
            </Link>
          </Rise>
        </div>

        <Rise i={1} className="lg:col-span-8">
          <div ref={box} className="overflow-hidden rounded-[16px] border border-line-strong bg-canvas">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="ml-3 text-[13px] text-muted">nabz-drab.vercel.app</span>
            </div>
            <video
              key={ch.id}
              ref={video}
              className="block aspect-video w-full bg-canvas"
              src={`/welcome/${ch.id}.mp4#t=${ch.from}`}
              muted
              playsInline
              preload="metadata"
              aria-label={`Screen recording: ${ch.label}. ${ch.text}`}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress((v.currentTime - ch.from) / (v.duration - ch.from));
              }}
              onEnded={() => {
                setProgress(0);
                setC((k) => (k + 1) % CHAPTERS.length);
              }}
            />
          </div>
        </Rise>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- rules */

const RULES = [
  {
    when: "Blood pressure above 180 over 120",
    card: "Very high reading: measure again",
    then: "Rest about 5 minutes and measure again. With chest pain or trouble speaking, alert a crewmate now.",
    source: "AHA/ACC blood pressure classification",
  },
  {
    when: "Reaction speed 1.5 standard deviations below your own normal",
    card: "Slower than your personal normal",
    then: "Put off precision tasks that can wait.",
    source: "Cognition on the ISS (PMC11614644)",
  },
  {
    when: "Slow after 6 hours of sleep or less",
    card: "Slower than your normal after short sleep",
    then: "Ask a crewmate to double-check critical steps, and plan a full sleep tonight.",
    source: "Jones et al. 2022 (PMC8919197)",
  },
  {
    when: "Your normal: your last 14 valid check-ins, at least 5",
    card: "Learning your personal normal",
    then: "Your normal band appears once enough valid sessions are in.",
    source: "Our design choice, written down",
  },
];

function Rules() {
  return (
    <section id="rules" aria-labelledby="rules-h" className="py-[clamp(72px,11vw,160px)]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-12">
          <Rise as="h2" className="text-[clamp(34px,4.6vw,72px)] font-semibold leading-[0.98] tracking-[-0.03em] lg:col-span-7">
            <span id="rules-h">17 written rules. Each one names its source.</span>
          </Rise>
          <Rise as="p" i={1} className="max-w-[44ch] self-end text-[18px] leading-[1.55] text-soft lg:col-span-4 lg:col-start-9">
            Scores, alerts and what to do next come from fixed code that anyone can read. A language
            model may explain a card later. It never picks one.
          </Rise>
        </div>
        <div className="mt-12 border-t border-line-strong">
          {RULES.map((r, k) => (
            <Rise key={r.card} i={k} className="grid gap-3 border-b border-line py-6 md:grid-cols-12 md:gap-6">
              <p className="text-[18px] font-semibold leading-snug md:col-span-4">{r.when}</p>
              <div className="md:col-span-5">
                <p className="text-[18px] leading-snug text-primary">&ldquo;{r.card}&rdquo;</p>
                <p className="mt-1 text-[15px] leading-6 text-secondary">{r.then}</p>
              </div>
              <p className="text-[15px] leading-6 text-muted md:col-span-3 md:text-right">{r.source}</p>
            </Rise>
          ))}
        </div>
        <Rise as="p" className="mt-6 text-[15px] text-muted">
          Every card ends the same way: decision support, not a diagnosis.
        </Rise>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- real data */

function RealData() {
  return (
    <section id="data" aria-labelledby="data-h" className="border-t border-line bg-surface py-[clamp(72px,11vw,160px)]">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:px-12">
        <Rise className="lg:col-span-6">
          <figure>
            <img
              src="/welcome/iss050e011454.jpg"
              alt="An astronaut on the International Space Station working on a tablet."
              className="aspect-[4/3] w-full rounded-[16px] object-cover"
              loading="lazy"
            />
            <figcaption className="mt-3 text-[13px] text-muted">
              Peggy Whitson aboard the ISS, Expedition 50. NASA, public domain.
            </figcaption>
          </figure>
        </Rise>
        <div className="flex flex-col justify-center lg:col-span-5 lg:col-start-8">
          <Rise as="h2" className="text-[clamp(34px,4.6vw,72px)] font-semibold leading-[0.98] tracking-[-0.03em]">
            <span id="data-h">Run on four real crew members&apos; blood.</span>
          </Rise>
          <Rise as="p" i={1} className="mt-6 max-w-[42ch] text-[18px] leading-[1.55] text-soft">
            NASA&apos;s open dataset OSD-569 holds blood counts from the four Inspiration4 crew
            members, taken around their 2021 flight. Nabz runs those counts through the same engine
            that watches Sara, and shows each one against its normal range.
          </Rise>
          <Rise i={2} className="mt-8">
            <Link
              href="/real-data"
              className="inline-flex min-h-12 items-center rounded-full border border-line-strong px-6 text-[16px] font-semibold hover:bg-white/5"
            >
              Open the real data
            </Link>
          </Rise>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- emergency */

function Emergency() {
  return (
    <section id="emergency" aria-labelledby="em-h" className="bg-[#2a0c0c] py-[clamp(72px,11vw,160px)]">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-7">
          <Rise as="h2" className="text-[clamp(34px,4.6vw,72px)] font-semibold leading-[0.98] tracking-[-0.03em]">
            <span id="em-h">When someone collapses, nobody signs in.</span>
          </Rise>
          <Rise as="p" i={1} className="mt-6 max-w-[44ch] text-[18px] leading-[1.55] text-soft">
            The emergency guides open with no sign-in. Pick who needs help and what happened, and
            the steps appear, including CPR for microgravity. The CPR guide keeps a beat of 110
            compressions a minute.
          </Rise>
          <Rise i={2} className="mt-8">
            <Link
              href="/emergency"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-emergency-solid px-6 text-[16px] font-semibold text-white hover:bg-emergency-hover"
            >
              Open the emergency guides
            </Link>
          </Rise>
        </div>
        <Rise i={1} className="flex justify-center lg:col-span-4 lg:col-start-9">
          <div className="flex flex-col items-center gap-4" role="img" aria-label="The CPR beat, 110 per minute">
            <Mark className="h-40 w-40 welcome-cpr" />
            <p className="text-[15px] font-medium tabular-nums text-soft">110 per minute</p>
          </div>
        </Rise>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- footer */

function Footer() {
  return (
    <footer className="border-t border-line py-[clamp(64px,9vw,128px)]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <Rise as="h2" className="text-[clamp(40px,7vw,112px)] font-semibold leading-[0.95] tracking-[-0.035em]">
          Try it yourself.
        </Rise>
        <Rise i={1} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/sign-in"
            className="inline-flex min-h-12 items-center rounded-full bg-[#4D8DFF] px-6 text-[16px] font-semibold text-white hover:bg-[#3b78e8]"
          >
            Open the app
          </Link>
          {IS_DEMO_BUILD ? (
            <p className="text-[16px] text-soft">
              Sign in as Sara with code <span className="font-semibold tabular-nums text-primary">4120</span>
            </p>
          ) : null}
        </Rise>
        <div className="mt-16 grid gap-6 border-t border-line pt-8 text-[14px] leading-6 text-muted md:grid-cols-2">
          <p>
            <span className="font-medium text-soft">Team Nova Trio</span>: Hamza Imran, Maryam Amjad,
            Ameni Besbes. NASA Space Apps Challenge 2026.
          </p>
          <p className="md:text-right">
            Built with public NASA data. Not affiliated with or endorsed by NASA. Photos: NASA/JPL-Caltech/MSSS/TAMU
            and NASA, public domain. Decision support, not a diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function WelcomePage() {
  return (
    <div className="overflow-x-clip bg-canvas text-primary">
      <Hero />
      <main>
        <Story />
        <DemoReel />
        <Rules />
        <RealData />
        <Emergency />
      </main>
      <Footer />
    </div>
  );
}
