import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import supabase from "@/utils/supabase";
import { NavLink } from "react-router";

export default function SignUp() {
  const signUp = async () => {
    const environment = import.meta.env.VITE_NODE_ENV;

    let redirectUri;
    switch (environment) {
      case "development":
        redirectUri = "http://localhost:5173/";
        break;

      case "codespace":
        redirectUri =
          "https://automatic-space-yodel-4rpxjgp5w9ph7qjx-5173.app.github.dev/";
        break;

      case "preview":
        redirectUri =
          "https://plateful-git-staging-mckerims-projects.vercel.app/";
        break;

      case "production":
        redirectUri = "https://www.plateful.cloud/";
        break;
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectUri}/valuescreen`,
      },
    });
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              Login with or create an account
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Button variant="outline" className="w-full" onClick={signUp}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>

            <NavLink to="/value">
              <Button variant="outline" className="w-full mt-2">Skip</Button>
            </NavLink>
          </CardContent>

          <CardFooter>
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
              By clicking continue, you agree to our{" "}
              <a href="#">Terms of Service</a> and{" "}
              <a href="#">Privacy Policy</a>.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
