"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createChildProfile,
  formatChildAge,
  formatDisplayDate,
} from "@/lib/children/actions";
import type { Child } from "@/lib/types";
import { useState } from "react";

type Step = "form" | "confirm" | "done";

interface RegisterChildDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (child: Child, addAnother: boolean) => void;
}

export function RegisterChildDialog({
  open,
  onClose,
  onCreated,
}: RegisterChildDialogProps) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdChild, setCreatedChild] = useState<Child | null>(null);

  function resetForm() {
    setStep("form");
    setName("");
    setDateOfBirth("");
    setError(null);
    setSaving(false);
    setCreatedChild(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function goToConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your child's name.");
      return;
    }
    if (!dateOfBirth) {
      setError("Please enter a date of birth.");
      return;
    }
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      setError("Please enter a valid date of birth in the past.");
      return;
    }

    setStep("confirm");
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      const child = await createChildProfile(name, dateOfBirth);
      setCreatedChild(child);
      setStep("done");
      onCreated(child, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSaving(false);
    }
  }

  function handleAddAnother() {
    if (createdChild) onCreated(createdChild, true);
    resetForm();
  }

  function handleStartChatting() {
    handleClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
      >
        {step === "form" && (
          <>
            <h2 className="text-lg font-semibold text-foreground">
              Register a child
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your child&apos;s profile for personalized healthcare guidance.
            </p>
            <form onSubmit={goToConfirm} className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Child&apos;s name
                </span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mia"
                  autoFocus
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Date of birth
                </span>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </label>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Continue
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 className="text-lg font-semibold text-foreground">
              Confirm details
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Please review before saving.
            </p>
            <dl className="mt-5 space-y-3 rounded-xl border border-border bg-muted/50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">{name.trim()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Date of birth</dt>
                <dd className="font-medium text-foreground">
                  {formatDisplayDate(dateOfBirth)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Age</dt>
                <dd className="font-medium text-foreground">
                  {formatChildAge(dateOfBirth)}
                </dd>
              </div>
            </dl>
            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("form")}
                disabled={saving}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? "Saving…" : "Confirm & save"}
              </Button>
            </div>
          </>
        )}

        {step === "done" && createdChild && (
          <>
            <h2 className="text-lg font-semibold text-foreground">
              Profile created
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {createdChild.name}
              </span>{" "}
              is ready. You can start chatting or register another child.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleAddAnother}
              >
                Add another child
              </Button>
              <Button type="button" className="flex-1" onClick={handleStartChatting}>
                Start chatting
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
