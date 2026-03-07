"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check if we have a token in the URL hash
    // This handles both invite tokens (type=signup/invite) and recovery tokens (type=recovery)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");

      // Handle recovery tokens (for password resets)
      // Invite tokens should use /setup-password instead
      if (type === "recovery" && accessToken) {
        // Exchange the recovery token for a session
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          })
          .then(({ error }) => {
            if (error) {
              toast.error("Invalid or expired reset token");
              router.push("/forgot-password");
            } else {
              setIsReady(true);
              // Clear the hash from URL
              window.history.replaceState(null, "", window.location.pathname);
            }
          })
          .catch(() => {
            toast.error("Invalid or expired reset token");
            router.push("/forgot-password");
          });
      } else if (type === "signup" || type === "invite") {
        // If it's an invite token, redirect to setup-password
        toast.error(
          "This link is for account setup. Please use the invitation link."
        );
        router.push("/login");
      } else {
        toast.error("Invalid or missing reset token");
        router.push("/forgot-password");
      }
    } else {
      // No hash, check if we're already authenticated (token might be in session)
      // This handles cases where the user refreshes the page after setting the session
      supabase.auth.getSession().then(({ data }) => {
        const session = data?.session;
        if (session) {
          setIsReady(true);
        } else {
          toast.error("Invalid or expired token");
          router.push("/forgot-password");
        }
      }).catch(() => {
        toast.error("Invalid or expired token");
        router.push("/forgot-password");
      });
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: data.password,
          name: data.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to reset password");
        return;
      }

      // After setting password, user is already authenticated
      // Redirect to dashboard instead of login
      toast.success("Password set successfully! Redirecting...");
      router.push("/dashboard");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Display Name (Optional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          {...register("name")}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          This will be displayed in the sidebar and throughout the app
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          {...register("password")}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput
          id="confirmPassword"
          placeholder="••••••••"
          {...register("confirmPassword")}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
