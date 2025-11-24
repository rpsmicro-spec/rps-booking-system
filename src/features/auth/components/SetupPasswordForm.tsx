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

const setupPasswordSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SetupPasswordFormValues = z.infer<typeof setupPasswordSchema>;

export function SetupPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [invitedName, setInvitedName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check if we have an invite token in the URL hash
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");

      // Handle invite tokens (signup/invite) - for new users setting up their account
      if ((type === "signup" || type === "invite") && accessToken) {
        // Exchange the invite token for a session
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          })
          .then(async ({ error }) => {
            if (error) {
              toast.error("Invalid or expired invitation link");
              router.push("/login");
            } else {
              // Fetch user profile to get the invited name
              try {
                const {
                  data: { user: authUser },
                } = await supabase.auth.getUser();
                if (authUser) {
                  const { data: userProfile } = await supabase
                    .from("users")
                    .select("name")
                    .eq("id", authUser.id)
                    .single();

                  if (userProfile?.name) {
                    setInvitedName(userProfile.name);
                  }
                }
              } catch {
                // Ignore errors fetching user profile
              }

              setIsReady(true);
              // Clear the hash from URL
              window.history.replaceState(null, "", window.location.pathname);
            }
          });
      } else if (type === "recovery") {
        // If it's a recovery token, redirect to reset-password instead
        toast.error(
          "This link is for password reset. Please use the forgot password page."
        );
        router.push("/forgot-password");
      } else {
        toast.error("Invalid or missing invitation token");
        router.push("/login");
      }
    } else {
      // No hash, check if we're already authenticated (token might be in session)
      // This handles cases where the user refreshes the page after setting the session
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          // Fetch user profile to get the invited name
          try {
            const { data: userProfile } = await supabase
              .from("users")
              .select("name")
              .eq("id", session.user.id)
              .single();

            if (userProfile?.name) {
              setInvitedName(userProfile.name);
            }
          } catch {
            // Ignore errors fetching user profile
          }

          setIsReady(true);
        } else {
          toast.error("Invalid or expired invitation link");
          router.push("/login");
        }
      });
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SetupPasswordFormValues>({
    resolver: zodResolver(setupPasswordSchema),
    defaultValues: {
      name: invitedName || "",
    },
  });

  // Update form when invited name is loaded
  useEffect(() => {
    if (invitedName) {
      reset({ name: invitedName });
    }
  }, [invitedName, reset]);

  const onSubmit = async (data: SetupPasswordFormValues) => {
    setIsLoading(true);
    try {
      // Use the name from form if provided, otherwise use the invited name
      const nameToSubmit = data.name?.trim() || invitedName || undefined;

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: data.password,
          name: nameToSubmit,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to set password");
        return;
      }

      // After setting password, user is already authenticated
      // Redirect to dashboard
      toast.success("Password set successfully! Welcome to RPS Job Manager.");
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
        <p className="text-sm text-muted-foreground">
          Setting up your account...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Your Name{" "}
          {invitedName ? "(Pre-filled from invitation)" : "(Optional)"}
        </Label>
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
          {invitedName
            ? "This name was set when you were invited. You can change it if needed."
            : "This will be displayed in the sidebar and throughout the app"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Create Password</Label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          {...register("password")}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Must be at least 6 characters long
        </p>
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
        {isLoading ? "Setting up..." : "Set Password & Continue"}
      </Button>
    </form>
  );
}
