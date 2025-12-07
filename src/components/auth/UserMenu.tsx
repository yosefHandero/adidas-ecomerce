"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authClient.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };

    checkAuth();
    // Refresh auth periodically
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    setUser(null);
    router.refresh();
  };

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push("/auth/login")}>
          Sign In
        </Button>
        <Button onClick={() => router.push("/auth/signup")}>Sign Up</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">Hello, {user.name || user.email}</span>
      <Button variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
