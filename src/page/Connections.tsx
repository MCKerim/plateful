import { useState } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { usePostHog } from "posthog-js/react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { writeClipboardText } from "@/utils/nativeClipboard";
import { reportError } from "@/utils/reportError";
import claudeMark from "@/assets/icons/claude-spark-clay.svg";
import blossomBlack from "@/assets/icons/openai-blossom-black.svg";
import blossomWhite from "@/assets/icons/openai-blossom-white.svg";

const SERVER_URL = "https://mcp.plateful.cloud/mcp";
const SERVER_ROW_ID = "server";

const EXAMPLE_PROMPTS = [
  { id: "tonight", key: "connections.promptTonight" },
  { id: "collections", key: "connections.promptCollections" },
] as const;

// Both buttons are neutral rather than one tinted: the marks only exist in their
// own colours (Claude's clay Spark turns to mud on our orange), and which
// assistant someone uses is their choice, not a recommendation we make.
// OpenAI's guidelines forbid recolouring the blossom, hence two files by theme.
// 30 px against Claude's 24: the blossom is a thin outline with a lot of
// interior space, the Spark a solid burst, so equal sizes look unequal.
const CONNECT_TARGETS = [
  {
    client: "claude",
    url: `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Plateful&connectorUrl=${encodeURIComponent(SERVER_URL)}`,
    labelKey: "connections.connectClaude",
    icon: <img src={claudeMark} alt="" className="size-6" />,
  },
  {
    client: "chatgpt",
    url: "https://chatgpt.com/plugins/plateful",
    labelKey: "connections.connectChatGPT",
    icon: (
      <>
        <img src={blossomBlack} alt="" className="size-[30px] dark:hidden" />
        <img src={blossomWhite} alt="" className="hidden size-[30px] dark:block" />
      </>
    ),
  },
] as const;

export default function Connections() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(text: string, id: string) {
    try {
      await writeClipboardText(text);
    } catch (error) {
      reportError("Error copying connection text", error, { id });
      toast.error(t("common.error"));
      return;
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
  }

  function copyIcon(id: string) {
    return copiedId === id ? (
      <Check className="size-4 shrink-0 text-primary" />
    ) : (
      <Copy className="size-4 shrink-0 text-muted-foreground" />
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 px-2 pb-6">
        <div className="flex flex-col gap-4">
          <h1 className="first-font text-3xl">{t("connections.headline")}</h1>
          <p className="text-muted-foreground">{t("connections.subheadline")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">{t("connections.examplesTitle")}</h2>

          {EXAMPLE_PROMPTS.map((prompt) => {
            const text = t(prompt.key);
            return (
              <button
                key={prompt.id}
                type="button"
                title={t("connections.copyPromptHint")}
                onClick={() => copy(text, prompt.id)}
                className="flex w-full items-start gap-3 rounded-[14px] bg-card p-3.5 text-left text-sm transition-colors hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex-1">{text}</span>
                {copyIcon(prompt.id)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {CONNECT_TARGETS.map((target) => (
            <NavLink
              key={target.client}
              to={target.url}
              target="_blank"
              onClick={() =>
                posthog?.capture(AnalyticsEvent.mcpConnectOpened, { client: target.client })
              }
            >
              <Button variant="secondary" size="lg" className="w-full">
                {target.icon}
                {t(target.labelKey)}
              </Button>
            </NavLink>
          ))}
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="advanced" className="border-b-0">
            <AccordionTrigger className="py-0 text-sm font-semibold hover:no-underline [&>svg]:text-muted-foreground">
              {t("connections.advanced")}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-3 pb-0 pt-3">
              <p className="text-xs text-muted-foreground">{t("connections.advancedText")}</p>

              <button
                type="button"
                title={t("connections.copyServerHint")}
                onClick={() => copy(SERVER_URL, SERVER_ROW_ID)}
                className="flex w-full items-center gap-3 rounded-[10px] bg-card p-3 text-left transition-colors hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex-1 truncate font-mono text-xs">{SERVER_URL}</span>
                {copyIcon(SERVER_ROW_ID)}
              </button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Layout>
  );
}
