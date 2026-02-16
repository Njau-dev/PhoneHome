"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authAPI } from "@/lib/api/auth";
import { toast } from "sonner";
import Title from "@/components/common/Title";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidToken, setIsValidToken] = useState(Boolean(token));
  const [isReset, setIsReset] = useState(false);
  const router = useRouter();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      await authAPI.resetPassword({ token, password });
      toast.success("Password reset successfully");
      setIsReset(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      toast.error(message);
      
      if (message.includes("Invalid") || message.includes("expired")) {
        setIsValidToken(false);
      }
    }
  };

  if (!isValidToken) {
    return (
      <div className="flex flex-col items-center w-full max-w-md gap-4 text-primary">
        <div className="text-center text-2xl sm:text-3xl mb-2">
          <Title text1="INVALID" text2="TOKEN" />
        </div>

        <p className="text-center mb-4">
          The password reset link is invalid or has expired.
        </p>

        <button
          onClick={() => router.push("/forgot-password")}
          className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-11 transition-all"
        >
          Request New Link
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-full max-w-md gap-4 text-primary"
    >
      <div className="text-center text-2xl sm:text-3xl mb-2">
        <Title text1="RESET" text2="PASSWORD" />
      </div>

      {!isReset ? (
        <>
          <p className="text-sm text-secondary mb-2 text-center">
            Enter your new password below.
          </p>

          <input
            type="password"
            placeholder="New Password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
            required
          />

          <button className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-11 transition-all">
            Reset Password
          </button>
        </>
      ) : (
        <>
          <div className="text-center p-4">
            <p className="mb-4">Your password has been reset successfully!</p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-11 transition-all"
          >
            Login with New Password
          </button>
        </>
      )}
    </form>
  );
}
