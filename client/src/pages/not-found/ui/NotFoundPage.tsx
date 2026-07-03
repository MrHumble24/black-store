import { Button } from "@/shared/ui/button";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <h1 className="text-6xl font-black text-primary">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
}
