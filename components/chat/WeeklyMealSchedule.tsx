"use client";

import type { DayMealPlan } from "@/lib/nutrition/guide";
import type { AgeNutritionGuide } from "@/lib/nutrition/guide";
import { cn } from "@/lib/utils";
import { UtensilsCrossed } from "lucide-react";

interface WeeklyMealScheduleProps {
  guide: AgeNutritionGuide;
  schedule: DayMealPlan[];
  onAskMealPlan?: () => void;
}

export function WeeklyMealSchedule({
  guide,
  schedule,
  onAskMealPlan,
}: WeeklyMealScheduleProps) {
  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Nutrition & weekly meals
            </h2>
            <p className="text-xs text-muted-foreground">{guide.label}</p>
          </div>
        </div>
        {onAskMealPlan && (
          <button
            type="button"
            onClick={onAskMealPlan}
            className="shrink-0 text-xs font-medium text-foreground underline-offset-2 hover:underline"
          >
            Customize with AI
          </button>
        )}
      </div>

      <p className="px-1 text-sm text-muted-foreground">{guide.summary}</p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 font-semibold text-foreground">Day</th>
              <th className="px-3 py-2.5 font-semibold text-foreground">
                Breakfast
              </th>
              <th className="px-3 py-2.5 font-semibold text-foreground">Lunch</th>
              <th className="px-3 py-2.5 font-semibold text-foreground">
                Dinner
              </th>
              <th className="px-3 py-2.5 font-semibold text-foreground">
                Snack
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, i) => (
              <tr
                key={row.day}
                className={cn(
                  "border-b border-border last:border-0",
                  i % 2 === 1 && "bg-muted/20",
                )}
              >
                <td className="px-3 py-2.5 font-medium text-foreground">
                  {row.day}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.breakfast}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.lunch}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.dinner}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.snack}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NutritionList title="Focus nutrients" items={guide.focusNutrients} />
        <NutritionList title="Foods to offer" items={guide.foodsToIntroduce} />
        <NutritionList title="Limit or avoid" items={guide.avoid} />
        <NutritionList title="Tips" items={guide.feedingTips} />
      </div>
    </div>
  );
}

function NutritionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1 text-sm text-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-muted-foreground">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
