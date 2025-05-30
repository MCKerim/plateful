import React from "react";
import { Button } from "../components/ui/button";
import { NavLink } from "react-router";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <h1 className="text-7xl font-extrabold text-primary mb-2">404</h1>

      <h2 className="text-2xl font-bold text-muted-foreground mb-2">
        Oops! This plate is empty.
      </h2>

      <p className="text-muted-foreground mb-6">
        Looks like you tried to find a page that doesn’t exist.
        <br />
        Maybe it’s still being cooked up, or it got lost in the pantry!
      </p>

      <Button asChild className="mb-2">
        <NavLink to="/">Take me home</NavLink>
      </Button>
    </div>
  );
};

export default NotFound;
