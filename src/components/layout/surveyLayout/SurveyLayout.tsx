import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

type Props = {
  questionNumber: number;
  maxQuestionNumber: number;
  question: string;
  answers: string[];
  selected?: string[];
  handleSelect: (option: string) => void;
  onComplete: () => void;
  onBack?: () => void;
  showNextButton?: boolean;
  twoColumns?: boolean;
};

export default function SurveyLayout({
  questionNumber,
  maxQuestionNumber,
  question,
  answers,
  selected,
  handleSelect,
  onComplete,
  onBack,
  showNextButton = true,
  twoColumns = false,
}: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-between w-screen h-screen max-w-xs mx-auto"
      style={{
        paddingTop: "calc(2.5rem + var(--safe-area-top, 0px))",
        paddingBottom: "calc(2.5rem + var(--safe-area-bottom, 0px))",
      }}
    >
      <motion.div
        className="flex flex-col w-full gap-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
              aria-label={t("survey.back")}
            >
              <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          )}
          <Progress value={(questionNumber / maxQuestionNumber) * 100} className="flex-1" />
        </div>

        <motion.h1
          key={`question-${questionNumber}`}
          className="mb-4 text-3xl second-font font-bold text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {t(`questions.${question}.question`)}
        </motion.h1>
      </motion.div>

      <motion.div
        key={`answers-${questionNumber}`}
        className={`flex w-full gap-4 ${twoColumns ? "grid grid-cols-2" : "flex-col"}`}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {answers.map((option, index) => (
          <motion.div
            key={`${questionNumber}-${option}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: index * 0.08,
              ease: "easeOut",
            }}
          >
            <Button
              className="w-full rounded-lg"
              variant={selected?.includes(option) ? "default" : "secondary"}
              onClick={() => handleSelect(option)}
              asChild
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {t(`questions.${question}.${option}`)}
              </motion.button>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key="next-button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full"
        >
          <Button
            className="w-full second-font h-12 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
            onClick={onComplete}
            asChild
            disabled={!showNextButton}
          >
            <motion.button
              whileHover={{ scale: showNextButton ? 1.02 : 1 }}
              whileTap={{ scale: showNextButton ? 0.98 : 1 }}
              animate={{
                opacity: showNextButton ? 1 : 0.5,
                scale: showNextButton ? 1 : 0.98,
              }}
              transition={{ duration: 0.15 }}
            >
              {t("surveyStart.nextButton")}
            </motion.button>
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
