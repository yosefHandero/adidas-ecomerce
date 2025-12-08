"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name?: string;
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = authClient.getCurrentUser();
        setUser(currentUser as User | null);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (auth updates)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);

    // Check auth on focus
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      setUser(null);
      router.refresh();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (isLoading) {
    return <div className="w-20 h-8 bg-gray-200 animate-pulse rounded" />;
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
      <span className="text-sm text-gray-700">
        Hello, {user.name || user.email}
      </span>
      <Button variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
