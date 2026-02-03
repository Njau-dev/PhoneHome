"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api/auth";
import { toast } from "sonner";
import Title from "@/components/common/Title";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await authAPI.forgotPassword({ email });
      toast.success("Password reset email sent successfully");
      setIsSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-full max-w-md gap-4 text-primary"
    >
      <div className="text-center text-2xl sm:text-3xl mb-2">
        <Title text1="FORGOT" text2="PASSWORD" />
      </div>

      {!isSubmitted ? (
        <>
          <p className="text-sm text-secondary mb-2 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
            required
          />

          <div className="w-full flex justify-between text-sm mt-4">
            <Link
              href="/login"
              className="cursor-pointer hover:text-accent transition-colors"
            >
              Back to Login
            </Link>
          </div>

          <button className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-11 transition-all">
            Send Reset Link
          </button>
        </>
      ) : (
        <>
          <div className="text-center p-4">
            <p className="mb-4">Password reset link has been sent to your email.</p>
            <p className="text-sm text-secondary">
              Please check your inbox and follow the instructions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-11 transition-all"
          >
            Back to Login
          </button>
        </>
      )}
    </form>
  );
}
