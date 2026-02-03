"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";

export default function LoginPage() {
  const [currentState, setCurrentState] = useState<"Login" | "Sign Up">("Login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, isAuthenticated, hasHydrated } = useAuth();

  const redirect = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.push(redirect);
    }
  }, [hasHydrated, isAuthenticated, redirect, router]);

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentState === "Sign Up") {
      await signup(username, email, password, phoneNumber);
    } else {
      await login(email, password);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-full max-w-md gap-4 text-primary"
    >
      <div className="inline-flex items-center gap-2 mb-2">
        <p className="font-prata text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-secondary" />
      </div>

      {currentState === "Sign Up" && (
        <input
          type="text"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
          required
        />
      )}

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        required
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        required
      />

      {currentState === "Sign Up" && (
        <input
          type="tel"
          placeholder="Phone Number"
          onChange={(e) => setPhoneNumber(e.target.value)}
          value={phoneNumber}
          className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        />
      )}

      <div
        className={`w-full flex ${currentState === "Login" ? "justify-between" : "justify-end"
          } text-sm -mt-2`}
      >
        {currentState === "Login" && (
          <Link
            href="/forgot-password"
            className="cursor-pointer hover:text-accent transition-colors"
          >
            Forgot your password?
          </Link>
        )}
        <p
          className="cursor-pointer hover:text-accent transition-colors"
          onClick={() =>
            setCurrentState(currentState === "Login" ? "Sign Up" : "Login")
          }
        >
          {currentState === "Login" ? "Create Account" : "Login Here"}
        </p>
      </div>

      <button className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-11 transition-all">
        {currentState === "Login" ? "Sign In" : "Sign Up"}
      </button>
    </form>
  );
}
