import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { BookOpen, Link2Off, Loader2, Pencil, Plug, Trash2 } from "lucide-react";
import { toast } from "sonner";
import mascotSalad from "@/assets/mascot-filled-salad.webp";
import claudeMark from "@/assets/icons/claude-spark-clay.svg";
import blossomBlack from "@/assets/icons/openai-blossom-black.svg";
import blossomWhite from "@/assets/icons/openai-blossom-white.svg";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/utils/supabase";
import { redirectTo } from "@/utils/nativeBrowser";
import { reportError } from "@/utils/reportError";

/**
 * OAuth consent screen for Supabase Auth's OAuth 2.1 server.
 *
 * This is the one human step in connecting Plateful to an AI assistant. Claude or
 * ChatGPT registers itself, sends the user to `/auth/v1/oauth/authorize`, and
 * Supabase bounces them here with an `authorization_id`. Approving mints an
 * access token for that app; the MCP server then acts as this user, under their
 * normal row-level security.
 *
 * The permission list below is hand-written on purpose. Supabase's OAuth server
 * supports only the OIDC scopes (`openid`/`email`/`profile`/`phone`), which say
 * nothing about recipes — so the scope strings cannot describe what connecting
 * actually grants. This page is the only place the user is told, which is why it
 * spells out deletion explicitly rather than saying "manage your recipes".
 */

/**
 * Errors carry a key, not a translated string, so the effect below never depends
 * on `t` — otherwise switching language would re-run it and re-request an
 * authorization that may only be fetched once.
 */
type ConsentErrorKey = "missingRequest" | "loadFailed" | "sessionExpired";

/**
 * A dead Plateful session and a bad authorization request fail at the same call
 * but need opposite fixes — sign in again here, versus start over in the other
 * app. Reporting the first as the second sends people off re-adding a connector
 * that was never the problem, so the two are told apart by status code.
 */
function isSessionError(error: { status?: number; code?: string } | null): boolean {
  return error?.status === 401 || error?.status === 403 || error?.code === "session_not_found";
}

type ConsentState =
  | { status: "loading" }
  | { status: "error"; key: ConsentErrorKey }
  | {
      status: "ready";
      authorizationId: string;
      clientName: string;
      clientUri: string | null;
    };

/**
 * The requesting app's mark, in its own colours like on the Connections page.
 * Clients register no logo (Claude and ChatGPT send none), so the name decides;
 * anything else gets a plug.
 */
function ClientMark({ name }: Readonly<{ name: string }>) {
  const lowered = name.toLowerCase();
  if (lowered.includes("claude")) return <img src={claudeMark} alt="" className="size-8" />;
  if (lowered.includes("chatgpt") || lowered.includes("openai")) {
    return (
      <>
        <img src={blossomBlack} alt="" className="size-10 dark:hidden" />
        <img src={blossomWhite} alt="" className="hidden size-10 dark:block" />
      </>
    );
  }
  return <Plug className="size-8" />;
}

export default function OAuthConsent() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const authorizationId = searchParams.get("authorization_id");
  const [state, setState] = useState<ConsentState>({ status: "loading" });
  const [isDeciding, setIsDeciding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAuthorization = async () => {
      if (!authorizationId) {
        setState({ status: "error", key: "missingRequest" });
        return;
      }

      try {
        const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
        if (cancelled) return;

        if (error || !data) {
          setState({
            status: "error",
            key: isSessionError(error) ? "sessionExpired" : "loadFailed",
          });
          return;
        }

        // Already consented to these scopes — Supabase hands back a finished
        // redirect instead of details, and the user never sees this page.
        if (!("authorization_id" in data)) {
          redirectTo(data.redirect_url);
          return;
        }

        setState({
          status: "ready",
          authorizationId: data.authorization_id,
          clientName: data.client.name,
          clientUri: data.client.uri || null,
        });
      } catch (err) {
        if (cancelled) return;
        reportError("Error loading OAuth authorization", err);
        setState({ status: "error", key: "loadFailed" });
      }
    };

    loadAuthorization();

    return () => {
      cancelled = true;
    };
  }, [authorizationId, supabase]);

  async function decide(approve: boolean) {
    if (state.status !== "ready" || isDeciding) return;
    setIsDeciding(true);

    try {
      // `skipBrowserRedirect` keeps the navigation ours, so a failed decision
      // shows an error here instead of silently leaving the user on a dead page.
      const { data, error } = approve
        ? await supabase.auth.oauth.approveAuthorization(state.authorizationId, {
            skipBrowserRedirect: true,
          })
        : await supabase.auth.oauth.denyAuthorization(state.authorizationId, {
            skipBrowserRedirect: true,
          });

      if (error || !data?.redirect_url) {
        toast.error(t("oauthConsent.decisionFailed"));
        setIsDeciding(false);
        return;
      }

      redirectTo(data.redirect_url);
    } catch (err) {
      reportError("Error submitting OAuth decision", err);
      toast.error(t("oauthConsent.decisionFailed"));
      setIsDeciding(false);
    }
  }

  const permissions = [
    { icon: BookOpen, text: t("oauthConsent.permissionRead") },
    { icon: Pencil, text: t("oauthConsent.permissionWrite") },
    { icon: Trash2, text: t("oauthConsent.permissionDelete") },
  ];

  // A full screen without the app's header and tab bar, like the invite page:
  // the person arrives from the other app and leaves through one of the buttons.
  return (
    <div className="flex flex-col items-center w-full max-w-lg min-h-dvh mx-auto px-6 pt-16 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {state.status === "loading" && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Link2Off className="size-12 text-muted-foreground" />
          <p className="max-w-xs text-muted-foreground">{t(`oauthConsent.${state.key}`)}</p>
          {state.key === "sessionExpired" && (
            // Signing out drops this route to the sign-in screen, and the URL
            // (with authorization_id) is untouched — so signing back in
            // returns straight to this consent request rather than losing it.
            <Button
              variant="accent"
              className="w-full max-w-sm h-12 rounded-full font-semibold text-base"
              onClick={() => supabase.auth.signOut()}
            >
              {t("oauthConsent.signInAgain")}
            </Button>
          )}
        </div>
      )}

      {state.status === "ready" && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-card">
              <img src={mascotSalad} alt="" className="size-11 object-contain" />
            </div>
            <div aria-hidden className="w-8 border-t-2 border-dashed border-muted-foreground/50" />
            <div className="flex size-16 items-center justify-center rounded-2xl bg-card">
              <ClientMark name={state.clientName} />
            </div>
          </div>

          <h1 className="first-font mt-6 max-w-full break-words text-center text-4xl">
            {t("oauthConsent.title", { client: state.clientName })}
          </h1>

          <ul className="mt-8 flex w-full flex-col gap-4 rounded-2xl bg-card p-4">
            {permissions.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex w-full max-w-sm flex-col gap-1 pt-8">
            <Button
              variant="accent"
              className="w-full h-12 rounded-full font-semibold text-base"
              onClick={() => decide(true)}
              disabled={isDeciding}
            >
              {isDeciding ? t("oauthConsent.deciding") : t("oauthConsent.approve")}
            </Button>
            <Button
              variant="link"
              className="text-accent font-semibold hover:no-underline"
              onClick={() => decide(false)}
              disabled={isDeciding}
            >
              {t("oauthConsent.deny")}
            </Button>

            {state.clientUri && (
              <p className="mt-2 break-all text-center text-xs text-muted-foreground">
                {t("oauthConsent.clientUri", { uri: state.clientUri })}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
