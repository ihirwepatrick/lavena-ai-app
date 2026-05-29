"use client";

import { HomeReminders } from "@/components/chat/HomeReminders";
import { WeeklyMealSchedule } from "@/components/chat/WeeklyMealSchedule";
import { ChatComposer } from "./ChatComposer";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { fetchChildReminders } from "@/lib/children/reminders";
import { computeAgeWeeks } from "@/lib/children/age";
import {
  getAgeNutritionGuide,
  getWeeklyMealSchedule,
} from "@/lib/nutrition/guide";
import { CHAT_PRESETS } from "@/lib/chat/presets";
import { useEffect, useMemo, useState } from "react";
import type { ChildReminder } from "@/lib/children/reminders";

interface ChatHomeProps {
  childName?: string;
  childId?: string;
  dateOfBirth?: string;
  hasChild: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onSuggestedPrompt: (prompt: string) => void;
  onRegisterChild: () => void;
  onOpenPresets?: () => void;
  disabled?: boolean;
}

export function ChatHome({
  childName,
  childId,
  dateOfBirth,
  hasChild,
  input,
  onInputChange,
  onSend,
  onSuggestedPrompt,
  onRegisterChild,
  onOpenPresets,
  disabled,
}: ChatHomeProps) {
  const [reminders, setReminders] = useState<ChildReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  useEffect(() => {
    if (!childId) {
      setReminders([]);
      return;
    }
    setRemindersLoading(true);
    fetchChildReminders(childId)
      .then(setReminders)
      .catch(() => setReminders([]))
      .finally(() => setRemindersLoading(false));
  }, [childId]);

  const nutrition = useMemo(() => {
    if (!dateOfBirth) return null;
    const ageWeeks = computeAgeWeeks(dateOfBirth);
    return {
      guide: getAgeNutritionGuide(ageWeeks),
      schedule: getWeeklyMealSchedule(ageWeeks),
    };
  }, [dateOfBirth]);

  const mealPlanPrompt =
    CHAT_PRESETS.find((p) => p.id === "weekly-meals")?.prompt ?? "";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 pb-8 pt-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {hasChild
              ? `How can I help${childName ? ` with ${childName}` : ""}?`
              : "Welcome to Lavena AI"}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-[15px]">
            {hasChild
              ? "Vaccines, nutrition, sleep, and growth — all in one place."
              : "Register your child to start personalized healthcare conversations."}
          </p>
        </div>

        {hasChild && childId && (
          <HomeReminders
            reminders={reminders}
            loading={remindersLoading}
            onAskAbout={onSuggestedPrompt}
          />
        )}

        {hasChild && nutrition && (
          <WeeklyMealSchedule
            guide={nutrition.guide}
            schedule={nutrition.schedule}
            onAskMealPlan={() => onSuggestedPrompt(mealPlanPrompt)}
          />
        )}

        <div className="w-full">
          <ChatComposer
            variant="home"
            value={input}
            onChange={onInputChange}
            onSend={onSend}
            disabled={disabled || !hasChild}
            onOpenPresets={onOpenPresets}
            showPresetsButton={hasChild}
            placeholder={
              hasChild
                ? "Ask anything about your child…"
                : "Register a child to begin…"
            }
          />
        </div>

        {hasChild ? (
          <SuggestedPrompts
            onSelect={onSuggestedPrompt}
            disabled={disabled}
          />
        ) : (
          <button
            type="button"
            onClick={onRegisterChild}
            className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
          >
            Register a child
          </button>
        )}
      </div>
    </div>
  );
}
