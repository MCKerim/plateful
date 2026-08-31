import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { BookOpen, Pencil, Trash2, Users, Plug } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/utils/supabase";
import { redirectTo } from "@/utils/nativeBrowser";
import { useAppSelector } from "@/redux/hooks";
import { selectHousehold } from "@/redux/slices/householdSlice";
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

export default function OAuthConsent() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const household = useAppSelector(selectHousehold);

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
    { icon: Users, text: t("oauthConsent.permissionHousehold") },
  ];

  return (
    <Layout showFooter={false}>
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Plug className="w-12 h-12" />

          {state.status === "loading" && (
            <p className="font-medium text-primary">{t("common.loading")}</p>
          )}

          {state.status === "error" && (
            <>
              <p className="font-medium text-primary">{t(`oauthConsent.${state.key}`)}</p>
              {state.key === "sessionExpired" && (
                // Signing out drops this route to the sign-in screen, and the URL
                // (with authorization_id) is untouched — so signing back in
                // returns straight to this consent request rather than losing it.
                <Button className="w-full" onClick={() => supabase.auth.signOut()}>
                  {t("oauthConsent.signInAgain")}
                </Button>
              )}
            </>
          )}

          {state.status === "ready" && (
            <>
              <h1 className="first-font text-3xl break-words">
                {t("oauthConsent.title", { client: state.clientName })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {household?.name
                  ? t("oauthConsent.subtitleWithHousehold", { household: household.name })
                  : t("oauthConsent.subtitle")}
              </p>
            </>
          )}
        </div>

        {state.status === "ready" && (
          <>
            <ul className="flex flex-col w-full gap-3 text-left">
              {permissions.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground text-left">
              {t("oauthConsent.revokeHint")}
            </p>

            <div className="flex flex-col w-full gap-3">
              <Button onClick={() => decide(true)} disabled={isDeciding} className="w-full">
                {isDeciding ? t("oauthConsent.deciding") : t("oauthConsent.approve")}
              </Button>
              <Button
                variant="outline"
                onClick={() => decide(false)}
                disabled={isDeciding}
                className="w-full"
              >
                {t("oauthConsent.deny")}
              </Button>
            </div>

            {state.clientUri && (
              <p className="text-xs text-muted-foreground break-all">
                {t("oauthConsent.clientUri", { uri: state.clientUri })}
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
