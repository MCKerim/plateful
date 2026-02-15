import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import "./EmotionalHook.css";

// Scattered positions around the center plate (x, y offsets in px)
const foodItems = [
  { emoji: "\uD83C\uDF55", x: -85, y: -65 },
  { emoji: "\uD83E\uDD57", x: 80, y: -60 },
  { emoji: "\uD83C\uDF5C", x: -95, y: 15 },
  { emoji: "\uD83C\uDF70", x: 90, y: 25 },
  { emoji: "\uD83C\uDF2E", x: -30, y: -100 },
  { emoji: "\uD83C\uDF63", x: 40, y: -95 },
  { emoji: "\uD83E\uDD58", x: -70, y: 65 },
  { emoji: "\uD83C\uDF5D", x: 80, y: 60 },
  { emoji: "\uD83E\uDD50", x: 5, y: 90 },
  { emoji: "\uD83E\uDD51", x: -50, y: -40 },
  { emoji: "\uD83E\uDDC1", x: 55, y: -35 },
];

// Same spring config as ImportRecipes icon bubbles
const popSpring = { type: "spring" as const, stiffness: 400, damping: 12 };

// Timeline: bubble 0–3.5s → plate at 3.8s → food explosion 4.6s+ → visible until ~11s → fade → pause until 13s
const CYCLE_MS = 13000;
const BUBBLE_FADE_OUT = 3.2; // bubble starts fading
const PLATE_DELAY = 3.8; // plate pops in
const FOOD_START = 4.6; // first food item pops
const FOOD_STAGGER = 0.07; // delay between each food item

export default function EmotionalHook() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCycle((c) => c + 1), CYCLE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <OnboardingLayout
      nextButtonLabel={t("valueScreens.emotionalHook.cta")}
      onNext={() => navigate("/survey/1")}
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold first-font">
          {t("valueScreens.emotionalHook.title")}
        </h1>
      </motion.div>

      {/* key={cycle} remounts everything to restart spring animations */}
      <motion.div
        key={cycle}
        className="emotional-hook-visual"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 12,
          times: [0, 0.015, 0.92, 1],
          ease: "easeInOut",
        }}
      >
        {/* Phase 1: Thought bubble with ??? */}
        <motion.div
          className="thought-bubble"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.15,
            ease: "easeOut",
          }}
        >
          <motion.div
            animate={{ opacity: [1, 1, 0] }}
            transition={{
              duration: 1,
              delay: BUBBLE_FADE_OUT,
              times: [0, 0.4, 1],
              ease: "easeIn",
            }}
          >
            <motion.span
              className="thought-question-marks"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              ???
            </motion.span>
          </motion.div>
          <div className="thought-tail" />
        </motion.div>

        {/* Phase 2: Plate pops in with spring bounce */}
        <motion.div
          className="meal-reveal"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            scale: { ...popSpring, delay: PLATE_DELAY },
            opacity: { duration: 0.2, delay: PLATE_DELAY },
          }}
        >
          <div className="plate-illustration">
            <svg viewBox="0 0 200 200" className="plate-svg">
              <ellipse cx="100" cy="110" rx="80" ry="24" fill="#edece8" />
              <ellipse cx="100" cy="108" rx="74" ry="20" fill="#faf9f5" />
              <ellipse cx="100" cy="106" rx="58" ry="14" fill="#edece8" opacity="0.5" />
              <ellipse cx="90" cy="98" rx="28" ry="14" fill="#d4956a" />
              <ellipse cx="90" cy="96" rx="26" ry="12" fill="#e0a87c" />
              <circle cx="120" cy="100" r="8" fill="#7db87a" />
              <circle cx="132" cy="96" r="6" fill="#8fc48d" />
              <circle cx="114" cy="94" r="5" fill="#6ba568" />
              <circle cx="78" cy="92" r="2" fill="#e85d5d" />
              <circle cx="105" cy="88" r="2" fill="#e85d5d" />
              <motion.path
                d="M 80 75 Q 78 65 82 58"
                stroke="#c4c4c4"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: [0, 0.6, 0], pathLength: [0, 1, 1] }}
                transition={{ duration: 2, delay: PLATE_DELAY + 0.5, repeat: Infinity, repeatDelay: 1, ease: "easeOut" }}
              />
              <motion.path
                d="M 100 72 Q 102 62 98 54"
                stroke="#c4c4c4"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: [0, 0.6, 0], pathLength: [0, 1, 1] }}
                transition={{ duration: 2.2, delay: PLATE_DELAY + 0.9, repeat: Infinity, repeatDelay: 0.8, ease: "easeOut" }}
              />
              <motion.path
                d="M 118 74 Q 120 64 116 56"
                stroke="#c4c4c4"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: [0, 0.6, 0], pathLength: [0, 1, 1] }}
                transition={{ duration: 1.8, delay: PLATE_DELAY + 1.3, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" }}
              />
            </svg>
          </div>
        </motion.div>

        {/* Phase 3: Food explosion — items pop in around the plate */}
        {foodItems.map((item, i) => (
          <motion.div
            key={i}
            className="food-bubble"
            style={{ left: `calc(50% + ${item.x}px)`, top: `calc(50% + ${item.y}px)` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              scale: { ...popSpring, delay: FOOD_START + i * FOOD_STAGGER },
              opacity: { duration: 0.15, delay: FOOD_START + i * FOOD_STAGGER },
            }}
          >
            <span className="food-emoji">{item.emoji}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="max-w-sm mt-2 text-center text-gray-600"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        {t("valueScreens.emotionalHook.description")}
      </motion.p>
    </OnboardingLayout>
  );
}
