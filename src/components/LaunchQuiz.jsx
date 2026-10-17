import React, { useEffect, useRef, useState } from 'react';
import WaitlistForm from './WaitlistForm';

const XP_PER_ANSWER = 20;

const ROUND_1 = [
  {
    q: 'You order "rice and curry". How many curries turn up?',
    options: [
      'One. It says curry.',
      'Somewhere between three and ten',
      'Zero. It was a test.',
      'Just the rice, staring at you',
    ],
    answer: 1,
    why: '"Curry" is singular in name only. Expect dhal, a vegetable or three, a sambol and possibly a fish. Pace yourself.',
  },
  {
    q: 'A wild elephant stops your bus on the Kataragama road. Who has right of way?',
    options: [
      'The bus, obviously',
      'Whoever honks first',
      'The elephant. Always the elephant.',
      'Your travel insurance',
    ],
    answer: 2,
    why: 'Elephants near Buttala and Kataragama are famous for stopping traffic to "ask" for snacks. Stay in the vehicle and please don’t feed them.',
  },
  {
    q: 'Why is it called Ceylon tea and not Sri Lanka tea?',
    options: [
      'Ceylon was the island’s name until 1972',
      'It tastes fancier with your pinky out',
      'Ceylon is the name of the tea’s favourite cow',
      'A typo nobody had the heart to fix',
    ],
    answer: 0,
    why: 'The country became Sri Lanka in 1972, but the tea kept its famous old name. Brand recognition is a powerful thing.',
  },
  {
    q: 'Which of these can you actually see in Sri Lanka?',
    options: [
      'Leopards',
      'Sloth bears',
      'Blue whales',
      'All of them. The island is showing off.',
    ],
    answer: 3,
    why: 'Leopards and sloth bears in Yala and Wilpattu, blue whales off Mirissa and Trincomalee. Not bad for an island you can cross in a day.',
  },
  {
    q: 'What is a hopper?',
    options: [
      'A very energetic kangaroo',
      'A bowl-shaped pancake, ideally with an egg in it',
      'Someone who beach-hops from Unawatuna to Arugam Bay',
      'A tuk-tuk with bad suspension',
    ],
    answer: 1,
    why: 'Crispy edges, soft middle, made from rice flour and coconut milk. Order the egg hopper. Then order another.',
  },
];

const ROUND_2 = [
  {
    q: 'How did King Kashyapa’s guests get up to his palace on Sigiriya rock?',
    options: [
      'Through a gate shaped like a giant lion',
      'A tuk-tuk with excellent suspension',
      'Hot air balloon, obviously',
      'They asked the rock nicely',
    ],
    answer: 0,
    why: 'Only the lion’s giant stone paws survive today. The 1,200-odd steps, sadly, are still very much there.',
  },
  {
    q: 'How long is the famous Kandy to Ella train ride?',
    options: [
      'Twenty minutes, tops',
      'About seven hours, and you won’t want it to end',
      'Three working days',
      'Depends on the elephant',
    ],
    answer: 1,
    why: 'Tea hills, waterfalls and people dangling out of the doors for photos. Slow is the whole point.',
  },
  {
    q: 'What do Sri Lankans celebrate in mid-April?',
    options: [
      'New Year. Yes, again.',
      'National nap day',
      'The invention of rice',
      'April Fools, but for a whole month',
    ],
    answer: 0,
    why: 'Sinhala and Tamil New Year, timed by the sun. Expect kiribath, kavum and surprisingly competitive pillow fights.',
  },
  {
    q: 'What is kottu?',
    options: [
      'A board game played by grandmothers',
      'Chopped roti stir-fried with a lot of clanging',
      'What you shout when you stub your toe',
      'A very small tuk-tuk',
    ],
    answer: 1,
    why: 'Follow the rhythmic clang of metal blades on a hot griddle after dark. That’s dinner.',
  },
  {
    q: 'There’s a giant “footprint” on top of Adam’s Peak. Whose is it?',
    options: [
      'Buddha’s',
      'Shiva’s',
      'Adam’s',
      'Depends who you ask. Everyone has claimed it.',
    ],
    answer: 3,
    why: 'Buddhists say Buddha, Hindus say Shiva, many Muslims and Christians say Adam. Climb it at 2 am for sunrise and decide for yourself.',
  },
];

const ROUNDS = [ROUND_1, ROUND_2];

const ranks = [
  [100, 'Basically a local'],
  [80, 'Island insider'],
  [40, 'Tuk-tuk regular'],
  [0, 'Fresh off the plane'],
];
const rankFor = (xp) => ranks.find(([min]) => xp >= min)[1];

export default function LaunchQuiz({ onClose }) {
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [xp, setXp] = useState(0); // total across rounds
  const [roundXp, setRoundXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const questions = ROUNDS[round];
  const current = questions[index];
  const answered = picked !== null;
  const roundMax = questions.length * XP_PER_ANSWER;
  const hasNextRound = round + 1 < ROUNDS.length;

  const choose = (i) => {
    if (answered) return;
    setPicked(i);
    if (i === current.answer) {
      setXp((v) => v + XP_PER_ANSWER);
      setRoundXp((v) => v + XP_PER_ANSWER);
    }
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setFinished(true);
    }
  };

  const nextRound = () => {
    setRound(round + 1); setIndex(0); setPicked(null); setRoundXp(0); setFinished(false);
    dialogRef.current?.scrollTo({ top: 0 });
  };

  const restart = () => {
    setRound(0); setIndex(0); setPicked(null); setXp(0); setRoundXp(0); setFinished(false);
    dialogRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#134e4a]/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sri Lanka quiz"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="sqls-sheet w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[#E6D5B8] text-[#134e4a] rounded-t-3xl sm:rounded-3xl border border-[#cdb892] shadow-[0_30px_80px_-30px_rgba(19,78,74,0.9)] outline-none"
      >
        {/* Header: progress + XP */}
        <div className="sticky top-0 bg-[#E6D5B8]/95 backdrop-blur px-6 pt-5 pb-4 border-b border-[#cdb892]">
          <div className="flex items-center text-sm">
            <span className="text-[#6b5a3c]">
              {`Round ${round + 1}`} · {finished ? 'Done' : `Question ${index + 1} of ${questions.length}`}
            </span>
            <span className="ml-auto font-bold tabular-nums" aria-live="polite">{xp} XP</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quiz"
              className="ml-3 -mr-2 w-9 h-9 rounded-full flex items-center justify-center text-[#134e4a] hover:bg-[#d9c59f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-[#d4bf98] overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-700 ease-out"
              style={{ width: `${(roundXp / roundMax) * 100}%` }}
            />
          </div>
        </div>

        <div className="px-6 py-6">
          {!finished ? (
            <>
              <h2 className="text-xl sm:text-2xl font-bold leading-snug">{current.q}</h2>

              <div className="mt-5 grid gap-2.5">
                {current.options.map((opt, i) => {
                  const isRight = i === current.answer;
                  const isPicked = i === picked;
                  let tone = 'bg-white/55 border-[#cdb892] text-[#134e4a] hover:bg-white/80';
                  if (answered && isRight) tone = 'bg-brand-600 text-white border-brand-600';
                  else if (answered && isPicked) tone = 'bg-[#800000]/10 border-[#800000]/40 text-[#800000]';
                  else if (answered) tone = 'bg-white/30 border-[#d4bf98] text-[#134e4a] opacity-60';
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => choose(i)}
                      disabled={answered}
                      className={`text-left px-4 py-3.5 rounded-2xl border font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${tone}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="sqls-reveal mt-5">
                  <p className="font-bold">
                    {picked === current.answer ? `Correct. +${XP_PER_ANSWER} XP` : 'Not quite.'}
                  </p>
                  <p className="mt-1 text-[#5b4a2e] leading-relaxed">{current.why}</p>
                  <button
                    type="button"
                    onClick={next}
                    autoFocus
                    className="mt-5 w-full bg-brand-600 hover:bg-brand-800 text-white font-bold py-3.5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    {index + 1 < questions.length ? 'Next question' : 'See my result'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="sqls-reveal text-center">
              <p className="text-5xl font-extrabold tabular-nums text-brand-600">{xp} XP</p>
              <p className="mt-2 text-xl font-bold">{rankFor(roundXp)}</p>
              <p className="mt-1 text-sm text-[#6b5a3c]">
                {roundXp / XP_PER_ANSWER} of {questions.length} right in round {round + 1}
              </p>

              {hasNextRound && (
                <button
                  type="button"
                  onClick={nextRound}
                  className="mt-5 w-full bg-brand-600 hover:bg-brand-800 text-white font-bold py-3.5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  Keep going: round {round + 2}
                </button>
              )}
              <p className="mt-3 text-[#5b4a2e] leading-relaxed">
                On SideQuest you earn XP like this for real quests across Sri Lanka, then swap it for rewards from local partners.
              </p>
              <p className="mt-1 text-xs text-[#6b5a3c]">This was practice XP. The real thing starts at launch.</p>

              <div className="mt-6 text-left">
                <WaitlistForm source="quiz" tone="light" />
              </div>

              <button
                type="button"
                onClick={restart}
                className="mt-5 text-sm font-semibold text-brand-600 underline underline-offset-4 hover:text-brand-800"
              >
                Play again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
