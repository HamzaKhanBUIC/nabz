"use client";

/**
 * ROUTE `/profile/edit` — SCREEN 15 · Edit profile.
 *
 * Four text fields in a 2-column grid (864px), all values written straight to
 * the session store so they persist in localStorage. Nothing is sent anywhere
 * — the handoff line "sync to Earth with the next link" describes the product
 * intent; this frontend phase stores the edit locally only.
 *
 * The form is a child component keyed by the profile id: the session only
 * resolves after mount, so initialising the fields from props (instead of
 * copying them in an effect) keeps the render pure and the markup stable.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/ui/PageTransition";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { useSession } from "@/lib/data/session";

const HANDS = ["left", "right"];

function initialForm(profile) {
  return {
    fullName: profile.fullName || "",
    role: profile.role || "",
    age: profile.age != null ? String(profile.age) : "",
    dominantHand: profile.dominantHand || "",
  };
}

function EditProfileForm({ profile, updateProfile }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialForm(profile));
  const [errors, setErrors] = useState({});

  function update(field) {
    return (event) => {
      const { value } = event.target;
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate() {
    const next = {};

    if (!form.fullName.trim()) next.fullName = "Enter your full name.";
    if (!form.role.trim()) next.role = "Enter your role.";

    const age = Number(form.age);
    if (!form.age.trim() || !Number.isInteger(age) || age < 18 || age > 120) {
      next.age = "Enter an age between 18 and 120.";
    }

    if (!HANDS.includes(form.dominantHand.trim().toLowerCase())) {
      next.dominantHand = "Enter Left or Right.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const hand = form.dominantHand.trim().toLowerCase();
    updateProfile({
      fullName: form.fullName.trim(),
      role: form.role.trim(),
      age: Number(form.age),
      dominantHand: hand === "left" ? "Left" : "Right",
    });
    router.push("/profile");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-9 max-w-[864px]">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextField
          label="Full name"
          value={form.fullName}
          onChange={update("fullName")}
          autoComplete="name"
          autoFocus
          error={errors.fullName}
        />
        <TextField
          label="Role"
          value={form.role}
          onChange={update("role")}
          error={errors.role}
        />
        <TextField
          label="Age"
          value={form.age}
          onChange={update("age")}
          inputMode="numeric"
          error={errors.age}
        />
        <TextField
          label="Dominant hand"
          value={form.dominantHand}
          onChange={update("dominantHand")}
          hint="Left or Right — used for the reaction test"
          error={errors.dominantHand}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Button type="submit" size="lg">
          Save changes
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => router.push("/profile")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, isAuthenticated, hydrated, updateProfile } = useSession();

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/");
  }, [hydrated, isAuthenticated, router]);

  if (!profile) return null;

  return (
    <PageTransition>
      <BackLink href="/profile">Profile</BackLink>

      <h1 className="mt-6 t-h1 text-primary">Edit profile</h1>
      <p className="mt-2 t-body-md text-muted">
        Changes stay on this device and sync to Earth with the next link.
      </p>

      <EditProfileForm
        key={profile.id}
        profile={profile}
        updateProfile={updateProfile}
      />
    </PageTransition>
  );
}
