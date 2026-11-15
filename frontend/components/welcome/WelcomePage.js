"use client";

import "@fontsource-variable/geist";
import "@fontsource/instrument-serif/400-italic.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";

/*
 * The welcome page is built on one fact: from Mars, Earth is a dot up to 22 minutes away by radio
 * (MARS_DELAY_MAX_MINUTES, research/CHECKS.md). Each chapter has its own field of colour taken from
 * the subject: space black, the white of the cabin, Earth blue, emergency red and Mars ochre.
 * Numbers are copied from src/core/constants.ts and content/cards.json; the page scores nothing.
 */

const IS_DEMO_BUILD = process.env.NEXT_PUBLIC_DEMO === "1";
const DELAY_MAX_MIN = 22; // MARS_DELAY_MAX_MINUTES
const EASE = [0.22, 1, 0.36, 1];
const ROLL = [0.4, 0, 0.1, 1];

const C = {
  space: "#050608",
  ink: "#f5f5f7",
  cabin: "#eeebe5",
  cabinInk: "#101216",
  earth: "#4D8DFF",
  alert: "#b3261e",
  mars: "#a84a24",
};

const SANS = "'Geist Variable', var(--font-inter), system-ui, sans-serif";
const SERIF = "'Instrument Serif', Georgia, serif";

/* ---------------------------------------------------------------- parts */

function Rise({ children, i = 0, className, as = "div", style }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 1.0, ease: EASE, delay: i * 0.08 }}
    >
      {children}
    </M>
  );
}

/** A headline whose lines slide up from behind a mask, one after another. */
function Lines({ lines, className, delay = 0, onView = true, as = "h2", id }) {
  const reduce = useReducedMotion();
  const H = as;
  return (
    <H className={className} id={id}>
      {lines.map((line, k) => (
        <span key={k} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className="block"
            initial={{ y: reduce ? 0 : "105%" }}
            {...(onView
              ? { whileInView: { y: 0 }, viewport: { once: true, margin: "0px 0px -60px 0px" } }
              : { animate: { y: 0 } })}
            transition={{ duration: 1.1, ease: EASE, delay: delay + k * 0.09 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </H>
  );
}

const Em = ({ children }) => (
  <em className="font-normal not-italic" style={{ fontFamily: SERIF, fontStyle: "italic", letterSpacing: "-0.01em" }}>
    {children}
  </em>
);

/** Button whose label rolls up on hover (a stacked copy slides in from below). */
function Roll({ href, children, tone = "light", className = "" }) {
  const tones = {
    light: "bg-[#f5f5f7] text-[#050608]",
    blue: "bg-[#4D8DFF] text-white",
    ghost: "border border-white/25 text-[#f5f5f7] hover:border-white/60",
    dark: "bg-[#101216] text-[#eeebe5]",
    outlineDark: "border border-black/25 text-[#101216] hover:border-black/60",
    red: "bg-white text-[#b3261e]",
  };
  const label = (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-[400ms] ease-[cubic-bezier(.4,0,.1,1)] group-hover:-translate-y-full">
        {children}
      </span>
      <span
        className="absolute inset-0 block translate-y-full transition-transform duration-[400ms] ease-[cubic-bezier(.4,0,.1,1)] group-hover:translate-y-0"
        aria-hidden
      >
        {children}
      </span>
    </span>
  );
  const cls = `group inline-flex min-h-12 items-center rounded-full px-6 text-[16px] font-medium tracking-[-0.01em] transition-colors ${tones[tone]} ${className}`;
  return href.startsWith("#") ? (
    <a href={href} className={cls}>
      {label}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}

function Mark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 -4 76 72" className={className} aria-hidden>
      <g transform="translate(6,0)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="26" stroke="#4D8DFF" strokeWidth="6" />
        <path d="M-4 34 H18 L24 22 L31 46 L38 16 L44 34 H68" stroke="#F7F8FB" strokeWidth="5" />
      </g>
    </svg>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ---------------------------------------------------------------- header */

function Header() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        solid ? "border-b border-white/10 bg-[#050608]/70 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-8 lg:px-12">
        <Link href="/welcome" className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.03em]">
          <Mark className="h-7 w-7" />
          <span>Nabz</span>
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-8 text-[14px] text-white/70 md:flex">
          {[
            ["#features", "Features"],
            ["#demo", "Demo"],
            ["#rules", "Rules"],
            ["#emergency", "Emergency"],
            ["#data", "NASA data"],
          ].map(([h, l]) => (
            <a key={h} href={h} className="transition-colors hover:text-white">
              {l}
            </a>
          ))}
        </nav>
        <Roll href="/sign-in" tone="light" className="!min-h-10 !px-5 !text-[14px]">
          Open the app
        </Roll>
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
    <div className="flex items-start gap-3 text-[14px] leading-6 text-white/75">
      <span className="relative mt-[7px] flex h-2.5 w-2.5 shrink-0" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-[#4D8DFF] welcome-ping" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-[#4D8DFF]" />
      </span>
      <p className="max-w-[34ch]">
        {left > 0 ? (
          <>
            A message sent from Mars when you opened this page lands on Earth in{" "}
            <span className="font-semibold tabular-nums text-white">{fmt(left)}</span>.
          </>
        ) : (
          <>That message just landed on Earth. A reply needs another 22 minutes.</>
        )}
      </p>
    </div>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[max(100svh,820px)] flex-col justify-end overflow-hidden"
      aria-labelledby="hero-h"
    >
      {/* On phones the photo fills the top part only, so Earth stays clear of the headline. */}
      <motion.div className="absolute inset-x-0 top-0 -z-10 h-[62%] overflow-hidden sm:h-full" style={{ y: photoY }}>
        <motion.img
          src="/welcome/PIA17936.jpg"
          alt="The evening sky over Mars from the Curiosity rover, with Earth as a small bright dot."
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${DOT_X}% ${DOT_Y}%` }}
          initial={{ scale: reduce ? 1 : 1.12, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.6, ease: EASE }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.5)_0%,rgba(5,6,8,0)_28%,rgba(5,6,8,0.45)_60%,#050608_100%)]" />
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${DOT_X}%`, top: `${DOT_Y}%` }}
          aria-hidden
        >
          <span className="block h-16 w-16 rounded-full border border-[#4D8DFF] welcome-ping" />
          <motion.span
            className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.18em] text-white/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
          >
            Earth
          </motion.span>
        </div>
      </motion.div>

      <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 sm:px-8 sm:pb-16 lg:px-12">
        <Lines
          as="h1"
          id="hero-h"
          onView={false}
          delay={0.35}
          className="text-[clamp(56px,11.5vw,184px)] font-semibold leading-[0.9] tracking-[-0.055em]"
          lines={[
            "That dot",
            <>
              is <Em>Earth.</Em>
            </>,
          ]}
        />
        <motion.div
          className="mt-10 grid gap-8 border-t border-white/15 pt-8 lg:grid-cols-12"
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.9 }}
        >
          <p className="max-w-[36ch] text-[clamp(19px,1.6vw,24px)] font-normal leading-[1.4] tracking-[-0.015em] text-white lg:col-span-5">
            The nearest doctor is on it. Nabz keeps the crew&apos;s health checks on board, so the
            answer doesn&apos;t have to wait for Earth.
          </p>
          <div className="flex flex-wrap items-start gap-3 lg:col-span-4">
            <Roll href="#demo" tone="blue">
              Watch Sara&apos;s day
            </Roll>
            <Roll href="/sign-in" tone="ghost">
              {IS_DEMO_BUILD ? "Try it: Sara, 4120" : "Open the app"}
            </Roll>
          </div>
          <div className="lg:col-span-3">
            <Countdown />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- story */

const BEATS = [
  { min: 0, img: "s-today", alt: "Nabz Today screen for Sara, day 120 of the Mars transit.", t: "Day 120 of the Mars transit. Sara opens Nabz for her morning check-in." },
  { min: 3, img: "s-checkin", alt: "Check-in result: slower than your personal normal.", t: "Three minutes of tapping. She is slower than her own normal, learned from her last 14 check-ins." },
  { min: 5, img: "s-bp-typed", alt: "Blood pressure form with 186 over 122 entered.", t: "She measures her blood pressure. 186 over 122." },
  { min: 6, img: "s-bp-card", alt: "Card: very high reading, measure again. Act now with the crew medical officer.", t: "Nabz answers at once: rest five minutes, measure again, act now with the crew medical officer." },
  { min: 11, img: "iss047e134605", alt: "An astronaut at work inside the International Space Station.", t: "The crew has acted. Earth hears about it afterwards, as the card says." },
  { min: 22, img: "PIA17936", alt: "Earth as a small dot in the Mars evening sky.", t: "A question sent to Earth at minute zero lands now. The reply needs another 22 minutes." },
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
  const move = { duration: reduce ? 0 : 0.8, ease: EASE };

  return (
    <section id="story" ref={ref} aria-label="One morning on the way to Mars" style={{ height: `${BEATS.length * 70 + 30}svh` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden py-6">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="relative" aria-hidden>
            <div className="flex items-center justify-between gap-3 text-[12px] font-medium uppercase tracking-[0.16em] text-white/55">
              <span>Mars</span>
              <span className="text-center tabular-nums text-white">
                {b.min < DELAY_MAX_MIN ? `Question to Earth · ${b.min} of ${DELAY_MAX_MIN} min` : "Landed on Earth"}
              </span>
              <span>Earth</span>
            </div>
            <div className="relative mt-4 h-px bg-white/20">
              <motion.div className="absolute inset-y-0 left-0 bg-[#4D8DFF]" animate={{ width: pct }} transition={move} />
              <motion.span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4D8DFF] shadow-[0_0_0_6px_rgba(77,141,255,0.2)]"
                animate={{ left: pct }}
                transition={move}
              />
              <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full border border-[#4D8DFF] bg-[#050608]" />
            </div>
          </div>

          <div className="mt-[clamp(28px,6vh,72px)] grid items-center gap-6 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="text-[13px] font-medium uppercase tabular-nums tracking-[0.16em] text-[#7aaaff]">Minute {b.min}</p>
              <div className="relative mt-4 min-h-[6.6em] text-[clamp(26px,3.1vw,48px)] font-medium leading-[1.08] tracking-[-0.035em]">
                {BEATS.map((x, k) => (
                  <p
                    key={k}
                    className="absolute inset-x-0 top-0 transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
                    style={{
                      opacity: k === i ? 1 : 0,
                      filter: k === i ? "blur(0)" : "blur(6px)",
                      transform: `translateY(${k === i ? 0 : k < i ? -18 : 18}px)`,
                    }}
                    aria-hidden={k !== i}
                  >
                    {x.t}
                  </p>
                ))}
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[18px] bg-[#101216] ring-1 ring-white/10 lg:col-span-7">
              {BEATS.map((x, k) => (
                <img
                  key={x.img}
                  src={`/welcome/${x.img}.jpg`}
                  alt={k === i ? x.alt : ""}
                  aria-hidden={k !== i}
                  className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
                  style={{
                    opacity: k === i ? 1 : 0,
                    transform: k === i ? "scale(1)" : "scale(1.04)",
                    objectPosition: x.img === "PIA17936" ? `${DOT_X}% ${DOT_Y}%` : "top",
                  }}
                  loading={k < 2 ? "eager" : "lazy"}
                />
              ))}
              <span
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500"
                style={{ left: `${DOT_X}%`, top: `${DOT_Y}%`, opacity: b.img === "PIA17936" ? 1 : 0 }}
                aria-hidden
              >
                <span className="block h-10 w-10 rounded-full border-2 border-[#4D8DFF] welcome-ping" />
              </span>
            </div>
          </div>
          <ol className="mt-8 flex gap-2" aria-hidden>
            {BEATS.map((_, k) => (
              <li key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/15">
                <span
                  className="block h-full rounded-full bg-white transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
                  style={{ transform: `scaleX(${k <= i ? 1 : 0})`, transformOrigin: "left" }}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- features */

// Every tile is a real screen from the app as Sara sees it.
const FEATURES = [
  { img: "s-checkin", tag: "Check-in", h: "Three minutes, every morning.", p: "A tap test for reaction speed, scored against your own normal.", span: "lg:col-span-7" },
  { img: "f-normal-zone", tag: "Normal zone", h: "Your own normal.", p: "Learned from your last 14 valid check-ins.", span: "lg:col-span-5" },
  { img: "s-bp-card", tag: "Measure", h: "Pressure, pulse, oxygen.", p: "One measurement, one clear next step.", span: "lg:col-span-5" },
  { img: "f-coach2", tag: "AI coach", h: "A coach that explains.", p: "Plain answers about any card, with sources. Runs on the device. Never decides.", span: "lg:col-span-7" },
  { img: "f-send2", tag: "Send to Earth", h: "You choose what leaves the ship.", p: "Preview every line before it is queued for the flight surgeon.", span: "lg:col-span-6" },
  { img: "f-today", tag: "Radiation", h: "Your dose, counted.", p: "Mission dose so far against NASA's 600 mSv career limit.", span: "lg:col-span-6" },
  { img: "f-environment", tag: "Mission environment", h: "From the ISS to Mars.", p: "Delay, gravity and who to call change with where the crew is.", span: "lg:col-span-4" },
  { img: "f-hazards", tag: "5 hazards", h: "Every card has a reason.", p: "Each one names its NASA spaceflight hazard and source.", span: "lg:col-span-4" },
  { img: "f-emergency2", tag: "Emergency", h: "No sign-in. Ever.", p: "Collapse, CPR, seizure, low blood sugar: steps in a few taps.", span: "lg:col-span-4" },
];

function Features() {
  return (
    <section id="features" aria-labelledby="feat-h" className="py-[clamp(88px,12vw,180px)]" style={{ background: C.cabin, color: C.cabinInk }}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-12">
          <Lines
            id="feat-h"
            className="text-[clamp(44px,7vw,112px)] font-semibold leading-[0.92] tracking-[-0.05em] lg:col-span-8"
            lines={[
              "Everything Sara",
              <>
                needs, <Em>on board.</Em>
              </>,
            ]}
          />
          <Rise i={2} as="p" className="max-w-[34ch] self-end text-[19px] leading-[1.45] tracking-[-0.015em] text-black/65 lg:col-span-4">
            Nine tools in one app, built for a crew that can&apos;t wait twenty minutes for a reply.
          </Rise>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          {FEATURES.map((f, k) => (
            <Rise key={f.tag} i={k % 3} className={`group ${f.span}`}>
              <article className="flex h-full flex-col overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.06] transition-shadow duration-500 hover:shadow-[0_30px_80px_-30px_rgba(16,18,22,0.35)]">
                <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                  <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#2f62d6]">{f.tag}</p>
                  <h3 className="mt-3 text-[clamp(24px,2.2vw,34px)] font-semibold leading-[1.05] tracking-[-0.035em]">{f.h}</h3>
                  <p className="mt-2 max-w-[42ch] text-[16px] leading-[1.45] text-black/60">{f.p}</p>
                </div>
                <div className="relative mt-6 flex-1 overflow-hidden pl-6 sm:pl-8">
                  <img
                    src={`/welcome/${f.img}.jpg`}
                    alt={`Nabz ${f.tag} screen.`}
                    loading="lazy"
                    className="aspect-[16/10] w-full rounded-tl-[14px] object-cover object-left-top ring-1 ring-black/10 transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.015]"
                  />
                </div>
              </article>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- guided demo */

// Chapter start times (seconds) in the guided recording of Sara's day.
const CHAPTERS = [
  ["Sign in", 0],
  ["Today", 6.3],
  ["Check-in", 12.8],
  ["Normal zone", 40.6],
  ["Blood pressure", 45.9],
  ["AI coach", 65.6],
  ["Send to Earth", 76.5],
  ["Mission environment", 88.4],
  ["5 hazards", 93.8],
  ["Real NASA data", 99.3],
  ["Emergency mode", 106.6],
];

function Demo() {
  const box = useRef(null);
  const video = useRef(null);
  const reduce = useReducedMotion();
  const [inView, setInView] = useState(false);
  const [userPaused, setUserPaused] = useState(null);
  const paused = userPaused ?? Boolean(reduce);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(119);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (inView && !paused) v.play().catch(() => {});
    else v.pause();
  }, [inView, paused]);

  const current = CHAPTERS.reduce((acc, c, k) => (t >= c[1] ? k : acc), 0);
  const seek = (s) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = s;
    setUserPaused(false);
  };

  return (
    <section id="demo" aria-labelledby="demo-h" className="py-[clamp(88px,12vw,180px)]" style={{ background: "#070b18" }}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-12">
          <Lines
            id="demo-h"
            className="text-[clamp(44px,7vw,112px)] font-semibold leading-[0.92] tracking-[-0.05em] lg:col-span-8"
            lines={[
              <>
                Watch Sara&apos;s <Em>whole</Em>
              </>,
              "day.",
            ]}
          />
          <Rise i={2} as="p" className="max-w-[36ch] self-end text-[19px] leading-[1.45] tracking-[-0.015em] text-white/70 lg:col-span-4">
            Two minutes in the real app, every feature, with notes on screen. Pick a chapter to jump
            straight to it.
          </Rise>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Rise className="lg:col-span-9">
            <div ref={box} className="overflow-hidden rounded-[20px] bg-black ring-1 ring-white/15 shadow-[0_40px_120px_-40px_rgba(77,141,255,0.35)]">
              <video
                ref={video}
                className="block aspect-[16/10] w-full bg-black"
                src="/welcome/guided.mp4"
                poster="/welcome/guided-poster.jpg"
                muted
                playsInline
                loop
                preload="metadata"
                aria-label="Screen recording of the Nabz app: Sara's day from sign-in to emergency mode, with captions."
                onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 119)}
                onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
              />
              <div className="flex items-center gap-4 border-t border-white/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setUserPaused(!paused)}
                  className="inline-flex min-h-10 min-w-20 items-center justify-center rounded-full bg-white/10 px-4 text-[14px] font-medium hover:bg-white/20"
                >
                  {paused ? "Play" : "Pause"}
                </button>
                <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
                  <span className="absolute inset-y-0 left-0 rounded-full bg-[#4D8DFF]" style={{ width: `${(t / dur) * 100}%` }} />
                </div>
                <span className="w-24 text-right text-[13px] tabular-nums text-white/60">
                  {fmt(Math.floor(t))} / {fmt(Math.floor(dur))}
                </span>
              </div>
            </div>
          </Rise>
          <Rise i={1} className="lg:col-span-3">
            <ol aria-label="Chapters" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {CHAPTERS.map(([name, s], k) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => seek(s)}
                    aria-current={k === current ? "step" : undefined}
                    className={`flex w-full items-baseline gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors duration-300 ${
                      k === current ? "bg-white text-[#050608]" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={`shrink-0 text-[12px] tabular-nums ${k === current ? "text-[#2f62d6]" : "text-white/40"}`}>
                      {String(k + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] font-medium tracking-[-0.01em]">{name}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-4 px-3 text-[13px] leading-5 text-white/45">
              The 3-minute test is shortened with the app&apos;s demo sample so the tour fits in two minutes.
            </p>
          </Rise>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- rules */

const RULES = [
  { when: "Above 180/120 mmHg", card: "Very high reading: measure again", then: "Rest about 5 minutes and measure again. With chest pain or trouble speaking, alert a crewmate now.", source: "AHA/ACC blood pressure guideline" },
  { when: "1.5 SD below your own normal", card: "Slower than your personal normal", then: "Put off precision tasks that can wait.", source: "Cognition on the ISS · PMC11614644" },
  { when: "Slow after ≤ 6 h of sleep", card: "Slower than your normal after short sleep", then: "Ask a crewmate to double-check critical steps. Plan a full sleep tonight.", source: "Jones et al. 2022 · PMC8919197" },
  { when: "Fewer than 5 valid check-ins", card: "Learning your personal normal", then: "Your normal band appears once enough valid sessions are in.", source: "Our design choice, written down" },
];

function Rules() {
  return (
    <section id="rules" aria-labelledby="rules-h" className="py-[clamp(88px,12vw,180px)]" style={{ background: C.space }}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-12">
          <Lines
            id="rules-h"
            className="text-[clamp(44px,7vw,112px)] font-semibold leading-[0.92] tracking-[-0.05em] lg:col-span-8"
            lines={[
              "17 rules decide.",
              <>
                <Em>AI never does.</Em>
              </>,
            ]}
          />
          <Rise i={2} as="p" className="max-w-[36ch] self-end text-[19px] leading-[1.45] tracking-[-0.015em] text-white/70 lg:col-span-4">
            Every alert comes from fixed code with a named source. The coach can explain a card. It
            can&apos;t pick one.
          </Rise>
        </div>
        <div className="mt-14 border-t border-white/15">
          {RULES.map((r, k) => (
            <Rise key={r.card} i={k} className="grid gap-3 border-b border-white/10 py-7 md:grid-cols-12 md:gap-8">
              <p className="text-[clamp(22px,2vw,30px)] font-semibold leading-tight tracking-[-0.03em] md:col-span-4">{r.when}</p>
              <div className="md:col-span-5">
                <p className="text-[19px] font-medium tracking-[-0.015em]">&ldquo;{r.card}&rdquo;</p>
                <p className="mt-1.5 text-[16px] leading-[1.5] text-white/60">{r.then}</p>
              </div>
              <p className="text-[14px] leading-6 text-white/45 md:col-span-3 md:text-right">{r.source}</p>
            </Rise>
          ))}
        </div>
        <Rise as="p" className="mt-6 text-[14px] text-white/45">
          Every card ends the same way: decision support, not a diagnosis.
        </Rise>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- emergency */

const GUIDES = ["Collapsed or unresponsive crewmate", "Crewmate CPR in microgravity", "Crewmate having a seizure", "Suspected low blood sugar"];

function Emergency() {
  return (
    <section id="emergency" aria-labelledby="em-h" className="py-[clamp(88px,12vw,180px)] text-white" style={{ background: C.alert }}>
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 sm:px-8 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-7">
          <Lines
            id="em-h"
            className="text-[clamp(44px,7vw,112px)] font-semibold leading-[0.92] tracking-[-0.05em]"
            lines={["When someone", "collapses,", <Em key="e">nobody signs in.</Em>]}
          />
          <Rise i={2} as="p" className="mt-8 max-w-[40ch] text-[19px] leading-[1.45] tracking-[-0.015em] text-white/85">
            Emergency mode is one tap from every screen and opens without a code. Pick who needs
            help and what happened. The CPR guide keeps a beat of 110 a minute.
          </Rise>
          <Rise i={3} className="mt-8">
            <Roll href="/emergency" tone="red">
              Open emergency mode
            </Roll>
          </Rise>
        </div>
        <div className="flex flex-col justify-end lg:col-span-5">
          <Rise className="mb-8 flex items-center gap-4">
            <Mark className="h-20 w-20 welcome-cpr" />
            <p className="text-[14px] font-medium uppercase tracking-[0.16em] text-white/80">110 compressions a minute</p>
          </Rise>
          <ul className="border-t border-white/30">
            {GUIDES.map((g, k) => (
              <Rise as="li" key={g} i={k} className="flex items-baseline gap-4 border-b border-white/20 py-4">
                <span className="text-[13px] tabular-nums text-white/60">0{k + 1}</span>
                <span className="text-[20px] font-medium tracking-[-0.02em]">{g}</span>
              </Rise>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- real data */

function RealData() {
  return (
    <section id="data" aria-labelledby="data-h" className="py-[clamp(88px,12vw,180px)] text-[#fbefe6]" style={{ background: C.mars }}>
      <div className="mx-auto grid max-w-[1440px] items-end gap-12 px-4 sm:px-8 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-6">
          <Lines
            id="data-h"
            className="text-[clamp(44px,7vw,112px)] font-semibold leading-[0.92] tracking-[-0.05em]"
            lines={["Real blood.", <>Real <Em>flight.</Em></>]}
          />
          <Rise i={2} as="p" className="mt-8 max-w-[40ch] text-[19px] leading-[1.45] tracking-[-0.015em] text-[#fbefe6]/85">
            NASA&apos;s open dataset OSD-569 holds blood counts from the four Inspiration4 crew,
            taken around their 2021 flight. Nabz runs them through the same engine that watches Sara.
          </Rise>
          <Rise i={3} className="mt-8">
            <Roll href="/real-data" tone="light">
              See the real data
            </Roll>
          </Rise>
        </div>
        <Rise i={1} className="lg:col-span-6">
          <img
            src="/welcome/f-real-data.jpg"
            alt="Nabz real astronaut data screen: an Inspiration4 crew member's hemoglobin against their own normal."
            loading="lazy"
            className="w-full rounded-[20px] ring-1 ring-black/20 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.6)]"
          />
        </Rise>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- footer */

function Footer() {
  return (
    <footer className="pb-10 pt-[clamp(88px,12vw,180px)]" style={{ background: C.space }}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <Lines
          className="text-[clamp(56px,11vw,176px)] font-semibold leading-[0.9] tracking-[-0.055em]"
          lines={["Try it", <Em key="y">yourself.</Em>]}
        />
        <Rise i={2} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Roll href="/sign-in" tone="blue">
            Open the app
          </Roll>
          <Roll href="/emergency" tone="ghost">
            Emergency mode
          </Roll>
          {IS_DEMO_BUILD ? (
            <p className="text-[16px] text-white/70">
              Sign in as Sara with code <span className="font-semibold tabular-nums text-white">4120</span>
            </p>
          ) : null}
        </Rise>
        <div className="mt-24 grid gap-6 border-t border-white/10 pt-8 text-[13px] leading-6 text-white/45 md:grid-cols-2">
          <p>
            <span className="font-medium text-white/75">Team Nova Trio</span> · Hamza Imran, Maryam
            Amjad, Ameni Besbes · NASA Space Apps Challenge 2026
          </p>
          <p className="md:text-right">
            Built with public NASA data. Not affiliated with or endorsed by NASA. Photos:
            NASA/JPL-Caltech/MSSS/TAMU and NASA, public domain. Decision support, not a diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function WelcomePage() {
  return (
    <div
      className="overflow-x-clip antialiased"
      style={{ background: C.space, color: C.ink, fontFamily: SANS, "--font-heading": SANS, "--font-body": SANS, "--color-primary": "currentColor" }}
    >
      <Header />
      <Hero />
      <main>
        <Story />
        <Features />
        <Demo />
        <Rules />
        <Emergency />
        <RealData />
      </main>
      <Footer />
    </div>
  );
}
