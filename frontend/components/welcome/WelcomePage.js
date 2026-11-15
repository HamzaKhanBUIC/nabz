"use client";

import "@fontsource-variable/geist";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";

/*
 * The welcome page is built on one fact: from Mars, Earth is a dot up to 22 minutes away by radio
 * (MARS_DELAY_MAX_MINUTES, research/CHECKS.md). Each chapter has its own field of colour: space black,
 * cabin stone, Earth's night blue, emergency red and Mars rust. Earth blue and Mars rust are a
 * complementary pair; red is kept for the emergency chapter only.
 * Numbers are copied from src/core/constants.ts and content/cards.json; the page scores nothing.
 */

const IS_DEMO_BUILD = process.env.NEXT_PUBLIC_DEMO === "1";
const DELAY_MAX_MIN = 22; // MARS_DELAY_MAX_MINUTES
const EASE = [0.22, 1, 0.36, 1];

const C = {
  space: "#08090b",
  ink: "#f4f4f5",
  cabin: "#e6e4e0",
  cabinInk: "#121316",
  night: "#0a1022",
  alert: "#b3261e",
  mars: "#94401f",
};

const SANS = "'Geist Variable', var(--font-inter), system-ui, sans-serif";
const WRAP = "mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12";
const PAD = "py-[clamp(88px,11vw,180px)]";
const H2 = "text-[clamp(42px,6.4vw,104px)] font-semibold leading-[0.95] tracking-[-0.045em]";
const LEAD = "text-[19px] leading-[1.45] tracking-[-0.01em]";

/* ---------------------------------------------------------------- parts */

function Rise({ children, i = 0, className, as = "div", style }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
    >
      {children}
    </M>
  );
}

/**
 * A headline whose lines slide up from behind a mask, one after another. The heading itself is
 * watched, because the lines start clipped by their mask and so are never "in view" themselves.
 */
function Lines({ lines, className, delay = 0, onView = true, as = "h2", id }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.2 });
  const show = !onView || seen;
  const H = as;
  return (
    <H className={className} id={id} ref={ref}>
      {lines.map((line, k) => (
        <span key={k} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className="block"
            initial={reduce ? false : { y: "105%" }}
            animate={show ? { y: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE, delay: delay + k * 0.07 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </H>
  );
}

/** The second half of a headline, set in the same face at a lower tone. */
const Soft = ({ children }) => <span className="opacity-50">{children}</span>;

function Btn({ href, children, tone = "light", className = "" }) {
  const tones = {
    light: "bg-[#f4f4f5] text-[#08090b] hover:bg-white",
    blue: "bg-[#1d5ce6] text-white hover:bg-[#1749bb]",
    dark: "bg-[#1b1d23] text-[#f4f4f5] hover:bg-[#262932]",
    red: "bg-white text-[#8f1d16] hover:bg-[#fde9e7]",
  };
  const cls = `inline-flex min-h-12 items-center rounded-full px-6 text-[16px] font-medium tracking-[-0.01em] transition-colors duration-300 ${tones[tone]} ${className}`;
  return href.startsWith("#") ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

function Mark({ className = "h-8 w-8", ring = "#4D8DFF", line = "#F7F8FB" }) {
  return (
    <svg viewBox="0 -4 76 72" className={className} aria-hidden>
      <g transform="translate(6,0)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="26" stroke={ring} strokeWidth="6" />
        <path d="M-4 34 H18 L24 22 L31 46 L38 16 L44 34 H68" stroke={line} strokeWidth="5" />
      </g>
    </svg>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; // a clock

/* ---------------------------------------------------------------- header */

// Transparent over the photo at the top; once you scroll it becomes a solid black bar (no blur).
function Header() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${solid ? "bg-[#08090b]" : "bg-transparent"}`}>
      <div className={`${WRAP} flex items-center justify-between gap-4 py-3.5`}>
        <Link href="/welcome" className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.03em]">
          <Mark className="h-7 w-7" />
          <span>Nabz</span>
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-8 text-[15px] text-white/70 md:flex">
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
        <Btn href="/sign-in" tone="light" className="!min-h-10 !px-5 !text-[15px]">
          Open the app
        </Btn>
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
    <div className="flex items-start gap-3 text-[15px] leading-6 text-white/75">
      <span className="relative mt-[7px] flex h-2.5 w-2.5 shrink-0" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-[#4D8DFF] welcome-ping" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-[#4D8DFF]" />
      </span>
      <p className="max-w-[30ch]">
        {left > 0 ? (
          <>
            Send a message from Mars now and it reaches Earth in{" "}
            <span className="font-semibold tabular-nums text-white">{fmt(left)}</span>.
          </>
        ) : (
          <>That message just reached Earth. The reply takes another 22 minutes.</>
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
          transition={{ duration: 2.4, ease: EASE }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,11,0.5)_0%,rgba(8,9,11,0)_28%,rgba(8,9,11,0.45)_60%,#08090b_100%)]" /> {/* scrim over the photo, taste-skill-ignore */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${DOT_X}%`, top: `${DOT_Y}%` }}
          aria-hidden
        >
          <span className="block h-16 w-16 rounded-full border-2 border-[#4D8DFF] welcome-ping" />
          <motion.span
            className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap text-[14px] font-medium text-white/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Earth
          </motion.span>
        </div>
      </motion.div>

      <div className={`${WRAP} w-full pb-12 sm:pb-16`}>
        <Lines
          as="h1"
          id="hero-h"
          onView={false}
          delay={0.3}
          className="text-[clamp(56px,11.5vw,184px)] font-semibold leading-[0.9] tracking-[-0.055em]"
          lines={[
            "That dot",
            <>
              is <Soft>Earth.</Soft>
            </>,
          ]}
        />
        <motion.div
          className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end"
          initial={{ opacity: 0, y: reduce ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
        >
          <p className={`max-w-[32ch] text-white lg:col-span-5 ${LEAD} sm:text-[21px]`}>
            The nearest doctor is up to 22 minutes away by radio. Nabz keeps the crew&apos;s health checks on board.
          </p>
          <div className="flex flex-wrap items-start gap-3 lg:col-span-4">
            <Btn href="#demo" tone="blue">
              Watch Sara&apos;s day
            </Btn>
            <Btn href="/sign-in" tone="dark">
              {IS_DEMO_BUILD ? "Try it: Sara, 4120" : "Open the app"}
            </Btn>
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
  { min: 0, img: "s-today", alt: "Nabz Today screen for Sara, day 120 of the Mars transit.", t: "Day 120. Sara opens her check-in." },
  { min: 3, img: "s-checkin", alt: "Check-in result: slower than your personal normal.", t: "She's slower than her own normal." },
  { min: 5, img: "s-bp-typed", alt: "Blood pressure form with 186 over 122 entered.", t: "Her blood pressure reads 186/122." },
  { min: 6, img: "s-bp-card", alt: "Card: very high reading, measure again. Act now with the crew medical officer.", t: "Nabz: measure again, get the medical officer." },
  { min: 11, img: "iss047e134605", alt: "An astronaut at work inside the International Space Station.", t: "The crew has already acted." },
  { min: 22, img: "PIA17936", alt: "Earth as a small dot in the Mars evening sky.", t: "Only now does Earth hear about it." },
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
    <section id="story" ref={ref} aria-label="One morning on the way to Mars" style={{ height: `${BEATS.length * 60 + 40}svh` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden py-6">
        <div className={`${WRAP} w-full`}>
          <div className="relative" aria-hidden>
            <div className="flex items-center justify-between gap-3 text-[15px] font-medium text-white/60">
              <span>Mars</span>
              <span className="text-center tabular-nums text-white">
                {b.min < DELAY_MAX_MIN ? `Message to Earth: ${b.min} of ${DELAY_MAX_MIN} min` : "Message reaches Earth"}
              </span>
              <span>Earth</span>
            </div>
            <div className="relative mt-4 h-1 rounded-full bg-white/15">
              <motion.div className="absolute inset-y-0 left-0 rounded-full bg-[#4D8DFF]" animate={{ width: pct }} transition={move} />
              <motion.span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4D8DFF]"
                animate={{ left: pct }}
                transition={move}
              />
              <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-[#4D8DFF] bg-[#08090b]" />
            </div>
          </div>

          <div className="mt-[clamp(28px,6vh,72px)] grid items-center gap-6 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="text-[15px] font-medium tabular-nums text-[#7ea6ff]">Minute {b.min}</p>
              <div className="relative mt-3 min-h-[2.3em] text-[clamp(30px,3.4vw,52px)] font-semibold leading-[1.05] tracking-[-0.035em]">
                {BEATS.map((x, k) => (
                  <p
                    key={k}
                    className="absolute inset-x-0 top-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
                    style={{
                      opacity: k === i ? 1 : 0,
                      transform: `translateY(${k === i ? 0 : k < i ? -16 : 16}px)`,
                    }}
                    aria-hidden={k !== i}
                  >
                    {x.t}
                  </p>
                ))}
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[18px] bg-[#121316] lg:col-span-7">
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
              <li key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
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
  { img: "s-checkin", tag: "Check-in", h: "Three minutes a morning.", p: "A tap test of reaction speed.", span: "lg:col-span-7" },
  { img: "f-normal-zone", tag: "Normal zone", h: "Your own normal.", p: "Learned from your last 14 check-ins.", span: "lg:col-span-5" },
  { img: "s-bp-card", tag: "Measure", h: "Pressure, pulse, oxygen.", p: "One reading, one next step.", span: "lg:col-span-5" },
  { img: "f-coach2", tag: "AI coach", h: "A coach that explains.", p: "Plain answers with sources. It never makes the call.", span: "lg:col-span-7" },
  { img: "f-send2", tag: "Send to Earth", h: "You pick what gets sent.", p: "Read every line before it goes.", span: "lg:col-span-6" },
  { img: "f-today", tag: "Radiation", h: "Your dose, counted.", p: "Against NASA's 600 mSv career limit.", span: "lg:col-span-6" },
  { img: "f-environment", tag: "Mission", h: "ISS, Moon or Mars.", p: "The delay changes with the mission.", span: "lg:col-span-4" },
  { img: "f-hazards", tag: "5 hazards", h: "Every card has a reason.", p: "Each one names its NASA hazard.", span: "lg:col-span-4" },
  { img: "f-emergency2", tag: "Emergency", h: "Opens without a sign-in.", p: "Collapse, CPR, seizure, low blood sugar.", span: "lg:col-span-4" },
];

function Features() {
  return (
    <section id="features" aria-labelledby="feat-h" className={PAD} style={{ background: C.cabin, color: C.cabinInk }}>
      <div className={WRAP}>
        <div className="grid gap-8 lg:grid-cols-12">
          <Lines
            id="feat-h"
            className={`${H2} lg:col-span-8`}
            lines={[
              "Everything Sara",
              <>
                needs, <Soft>on board.</Soft>
              </>,
            ]}
          />
          <Rise i={1} as="p" className={`max-w-[30ch] self-end text-[#45474d] lg:col-span-4 ${LEAD}`}>
            Nine tools, all working without Earth.
          </Rise>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          {FEATURES.map((f, k) => (
            <Rise key={f.tag} i={k % 3} className={`group ${f.span}`}>
              <article className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#f6f5f3]">
                <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                  <p className="text-[14px] font-medium text-[#1d4fc4]">{f.tag}</p>
                  <h3 className="mt-2 text-[clamp(24px,2.2vw,32px)] font-semibold leading-[1.08] tracking-[-0.03em]">{f.h}</h3>
                  <p className="mt-2 text-[16px] leading-[1.45] text-[#45474d]">{f.p}</p>
                </div>
                <div className="relative mt-6 flex-1 overflow-hidden pl-6 sm:pl-8">
                  <img
                    src={`/welcome/${f.img}.jpg`}
                    alt={`Nabz ${f.tag} screen.`}
                    loading="lazy"
                    className="aspect-[16/10] w-full rounded-tl-[14px] object-cover object-left-top transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1.5"
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
  ["Mission", 88.4],
  ["5 hazards", 93.8],
  ["NASA data", 99.3],
  ["Emergency", 106.6],
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
    <section id="demo" aria-labelledby="demo-h" className={PAD} style={{ background: C.night }}>
      <div className={WRAP}>
        <div className="grid gap-8 lg:grid-cols-12">
          <Lines
            id="demo-h"
            className={`${H2} lg:col-span-8`}
            lines={["Watch Sara's", <Soft key="s">whole day.</Soft>]}
          />
          <Rise i={1} as="p" className={`max-w-[30ch] self-end text-white/70 lg:col-span-4 ${LEAD}`}>
            Two minutes in the real app. Pick a chapter to jump to it.
          </Rise>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Rise className="lg:col-span-9">
            <div ref={box} className="overflow-hidden rounded-[20px] bg-black">
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
              <div className="flex items-center gap-4 bg-[#0e1426] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setUserPaused(!paused)}
                  className="inline-flex min-h-10 min-w-20 items-center justify-center rounded-full bg-white/10 px-4 text-[15px] font-medium hover:bg-white/20"
                >
                  {paused ? "Play" : "Pause"}
                </button>
                <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
                  <span className="absolute inset-y-0 left-0 rounded-full bg-[#4D8DFF]" style={{ width: `${(t / dur) * 100}%` }} />
                </div>
                <span className="w-24 text-right text-[14px] tabular-nums text-white/60">
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
                      k === current ? "bg-white text-[#08090b]" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={`w-5 shrink-0 text-[14px] tabular-nums ${k === current ? "text-[#1d4fc4]" : "text-white/40"}`}>{k + 1}</span>
                    <span className="text-[15px] font-medium tracking-[-0.01em]">{name}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-4 px-3 text-[14px] leading-5 text-white/50">The 3-minute test is cut short with demo data.</p>
          </Rise>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- rules */

const RULES = [
  { when: "Above 180/120 mmHg", card: "Very high reading: measure again", source: "AHA/ACC blood pressure guideline" },
  { when: "1.5 SD below your normal", card: "Slower than your personal normal", source: "Cognition on the ISS, PMC11614644" },
  { when: "Slow after 6 h of sleep or less", card: "Slower than your normal after short sleep", source: "Jones et al. 2022, PMC8919197" },
  { when: "Fewer than 5 valid check-ins", card: "Learning your personal normal", source: "Our design choice, written down" },
];

function Rules() {
  return (
    <section id="rules" aria-labelledby="rules-h" className={PAD} style={{ background: C.space }}>
      <div className={WRAP}>
        <div className="grid gap-8 lg:grid-cols-12">
          <Lines id="rules-h" className={`${H2} lg:col-span-8`} lines={["17 rules decide.", <Soft key="s">AI doesn&apos;t.</Soft>]} />
          <Rise i={1} as="p" className={`max-w-[30ch] self-end text-white/70 lg:col-span-4 ${LEAD}`}>
            Every alert comes from fixed code with a named source. The coach explains a card. It can&apos;t pick one.
          </Rise>
        </div>
        <div className="mt-14 grid gap-3 md:grid-cols-2">
          {RULES.map((r, k) => (
            <Rise key={r.card} i={k % 2} className="rounded-[20px] bg-[#121419] p-7 sm:p-9">
              <p className="text-[clamp(24px,2.2vw,32px)] font-semibold leading-tight tracking-[-0.03em]">{r.when}</p>
              <p className="mt-3 text-[18px] text-white/85">&quot;{r.card}&quot;</p>
              <p className="mt-5 text-[14px] text-white/50">{r.source}</p>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- emergency */

const GUIDES = ["Collapsed or unresponsive crewmate", "Crewmate CPR in microgravity", "Crewmate having a seizure", "Suspected low blood sugar"];

function Emergency() {
  return (
    <section id="emergency" aria-labelledby="em-h" className={`${PAD} text-white`} style={{ background: C.alert }}>
      <div className={`${WRAP} grid gap-12 lg:grid-cols-12`}>
        <div className="lg:col-span-7">
          <Lines id="em-h" className={H2} lines={["Emergency needs", <Soft key="s">no sign-in.</Soft>]} />
          <Rise i={1} as="p" className={`mt-8 max-w-[34ch] text-white/90 ${LEAD}`}>
            Emergency mode is one tap from every screen and needs no code.
          </Rise>
          <Rise i={2} className="mt-8">
            <Btn href="/emergency" tone="red">
              Open emergency mode
            </Btn>
          </Rise>
        </div>
        <div className="flex flex-col justify-end lg:col-span-5">
          <Rise className="mb-8 flex items-center gap-4">
            <Mark className="h-16 w-16 welcome-cpr" ring="#ffffff" line="#ffffff" />
            <p className="text-[16px] font-medium text-white/90">CPR guide at 110 beats a minute</p>
          </Rise>
          <ul className="grid gap-3">
            {GUIDES.map((g, k) => (
              <Rise as="li" key={g} i={k} className="rounded-[14px] bg-black/15 px-5 py-4 text-[19px] font-medium tracking-[-0.015em]">
                {g}
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
    <section id="data" aria-labelledby="data-h" className={`${PAD} text-white`} style={{ background: C.mars }}>
      <div className={`${WRAP} grid items-center gap-12 lg:grid-cols-12`}>
        <div className="lg:col-span-5">
          <Lines id="data-h" className={H2} lines={["Real blood.", <Soft key="s">Real flight.</Soft>]} />
          <Rise i={1} as="p" className={`mt-8 max-w-[32ch] text-white/90 ${LEAD}`}>
            NASA&apos;s OSD-569 holds blood counts from the four Inspiration4 crew. Nabz checks them with the same rules it uses for Sara.
          </Rise>
          <Rise i={2} className="mt-8">
            <Btn href="/real-data" tone="light">
              See the real data
            </Btn>
          </Rise>
        </div>
        <Rise i={1} className="lg:col-span-7">
          <img
            src="/welcome/f-real-data.jpg"
            alt="Nabz real astronaut data screen: an Inspiration4 crew member's hemoglobin against their own normal."
            loading="lazy"
            className="w-full rounded-[20px] bg-[#121316]"
          />
        </Rise>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- footer */

function Footer() {
  return (
    <footer className="pb-10 pt-[clamp(88px,11vw,180px)]" style={{ background: C.space }}>
      <div className={WRAP}>
        <Lines
          className="text-[clamp(56px,11vw,176px)] font-semibold leading-[0.9] tracking-[-0.055em]"
          lines={["Try it", <Soft key="y">yourself.</Soft>]}
        />
        <Rise i={1} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Btn href="/sign-in" tone="blue">
            Open the app
          </Btn>
          <Btn href="/emergency" tone="dark">
            Emergency mode
          </Btn>
          {IS_DEMO_BUILD ? (
            <p className="text-[16px] text-white/70">
              Sign in as Sara with code <span className="font-semibold tabular-nums text-white">4120</span>
            </p>
          ) : null}
        </Rise>
        <div className="mt-24 grid gap-6 text-[14px] leading-6 text-white/50 md:grid-cols-2">
          <p>
            <span className="font-medium text-white/80">Team Nova Trio</span>: Hamza Imran, Maryam Amjad, Ameni Besbes. NASA Space Apps
            Challenge 2026.
          </p>
          <p className="md:text-right">
            Decision support, not a diagnosis. Built with public NASA data; not endorsed by NASA. Photos: NASA/JPL-Caltech/MSSS/TAMU and NASA.
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
