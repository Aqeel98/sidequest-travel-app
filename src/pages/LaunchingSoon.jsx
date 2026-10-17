import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import LandingDecor from '../components/LandingDecor';
import WaitlistForm from '../components/WaitlistForm';
import LaunchQuiz from '../components/LaunchQuiz';
import './LaunchingSoon.css';

// Official launch moment (Sri Lanka time). Override per-deploy with VITE_LAUNCH_DATE.
export const LAUNCH_DATE = new Date(
  import.meta.env.VITE_LAUNCH_DATE || '2026-11-28T09:00:00+05:30'
);

const INSTAGRAM_URL = 'https://www.instagram.com/sidequest.lk';
const TIKTOK_URL = 'https://www.tiktok.com/@sidequest.lk';

const getRemaining = () => {
  const ms = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  return {
    done: ms === 0,
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
};

const pad = (n) => String(n).padStart(2, '0');

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M16.6 3c.3 2.2 1.7 3.8 3.9 4v3.1c-1.4.1-2.7-.3-3.9-1.1v6.3c0 3.7-3 6.2-6.4 5.6-2.4-.4-4.3-2.4-4.6-4.8-.5-3.7 2.6-6.8 6.2-6.3v3.2c-1.6-.4-3.2.7-3.2 2.4 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5V3h3z" />
  </svg>
);

export default function LaunchingSoon() {
  const [t, setT] = useState(getRemaining);
  const [quizOpen, setQuizOpen] = useState(false);
  // Stable reference: the countdown re-renders every second and must not reset the quiz dialog.
  const closeQuiz = useCallback(() => setQuizOpen(false), []);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  );

  useEffect(() => {
    const id = setInterval(() => setT(getRemaining()), 1000);
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const launchLabel = LAUNCH_DATE.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo',
  });

  const units = [
    ['Days', t.days],
    ['Hours', t.hours],
    ['Minutes', t.minutes],
    ['Seconds', t.seconds],
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#E6D5B8] font-sans">
      <Helmet>
        <title>SideQuest · Launching soon</title>
        <meta name="description" content="SideQuest launches on 28 November 2026. Quests across Sri Lanka. Follow @sidequest.lk on Instagram and TikTok." />
      </Helmet>

      {/* Brand bar — same logo treatment as the Navbar */}
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-center md:justify-start">
          <div className="flex items-center">
            <div className="relative flex items-center justify-center w-12 h-12 mr-3">
              <div className="absolute inset-0 border-[4px] rounded-full" style={{ borderColor: '#0D9488' }} />
              <img src="/nav-needle.webp" alt="" className="sqls-needle w-6 h-6 object-contain" />
            </div>
            <div className="text-xl font-extrabold tracking-tight text-gray-800">
              SideQ
              <span style={{ color: '#006A4E' }}>u</span>
              <span style={{ color: '#800000' }}>e</span>
              <span style={{ color: '#F58220' }}>s</span>
              t
            </div>
          </div>
        </div>
      </header>

      {/* Hero — same teal, icon field and wave as the Home page */}
      <main className="relative overflow-hidden bg-brand-600 flex-1 flex flex-col justify-center">
        <div
          className="absolute inset-0 overflow-hidden z-0"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent 82%)',
            maskImage: 'linear-gradient(to bottom, #000 55%, transparent 82%)',
          }}
        >
          <LandingDecor viewportWidth={viewportWidth} />
        </div>

        {/* Soft clearing behind the text so the icon field stays calm */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 42%, rgba(13,148,136,0.92) 0%, rgba(13,148,136,0.6) 45%, rgba(13,148,136,0) 75%)' }}
        />

        <div className="sqls-rise relative z-10 max-w-xl mx-auto px-4 w-full pt-14 md:pt-20 pb-40 md:pb-52 lg:pb-60 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Adventure with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-white">Impact</span>
          </h1>

          <p className="mt-5 text-lg md:text-xl text-teal-50/90 font-light">
            {t.done
              ? 'We’re opening the doors.'
              : <>Quests across Sri Lanka launch on <span className="whitespace-nowrap font-semibold text-white">{launchLabel}</span></>}
          </p>

          {/* Countdown: one calm glass strip */}
          <div
            role="timer"
            aria-label={`${t.days} days, ${t.hours} hours, ${t.minutes} minutes until launch`}
            className="mt-10 grid grid-cols-4 divide-x divide-white/15 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl py-5 shadow-[0_24px_50px_-24px_rgba(19,78,74,0.6)]"
          >
            {units.map(([label, value]) => (
              <div key={label}>
                <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight leading-none">
                  {pad(value)}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-teal-50/80">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-md mx-auto text-left sm:text-center">
            <WaitlistForm />
          </div>

          <button
            type="button"
            onClick={() => setQuizOpen(true)}
            className="mt-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Play the 1-minute Sri Lanka quiz
          </button>

          <div className="mt-8 flex items-center justify-center gap-3 text-teal-50/90">
            <span>Follow @sidequest.lk</span>
            {[[INSTAGRAM_URL, 'Instagram', <InstagramIcon key="i" />], [TIKTOK_URL, 'TikTok', <TikTokIcon key="t" />]].map(([href, label, icon]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`SideQuest on ${label}`}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/25 text-white flex items-center justify-center transition-colors hover:bg-white hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Beach + wave — copied from Home */}
        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-[110px] md:h-[170px] lg:h-[200px] bg-[#E6D5B8]" />
          <svg
            className="relative -mt-px block w-[210%] h-[110px] md:h-[170px] lg:h-[200px]"
            viewBox="0 0 1200 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,0 L1200,0 L1200,130 C900,180 600,90 300,160 L0,120 Z"
              className="animate-wave-roll fill-white/30"
              style={{ animationDuration: '15s', animationDelay: '-5s' }}
            />
            <path
              d="M0,0 L1200,0 L1200,120 C900,160 600,80 300,140 L0,100 Z"
              className="animate-wave-roll fill-white"
              style={{ animationDuration: '10s', animationDelay: '-2s' }}
            />
            <path
              d="M0,0 L1200,0 L1200,100 C900,140 600,60 300,120 L0,80 Z"
              className="animate-wave-roll fill-brand-600"
              style={{ animationDuration: '10s' }}
            />
          </svg>
        </div>
      </main>

      {/* Sand */}
      <footer className="flex justify-center px-4 pt-1 pb-6">
        <p className="text-sm font-medium text-[#6b5a3c]">© {new Date().getFullYear()} SideQuest.lk</p>
      </footer>

      {quizOpen && <LaunchQuiz onClose={closeQuiz} />}
    </div>
  );
}
