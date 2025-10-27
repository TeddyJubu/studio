"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Utensils, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DietaryPreferences } from "@/lib/types";

interface DietaryPreferencesProps {
  preferences?: DietaryPreferences;
  onSave: (preferences: DietaryPreferences) => void;
  onSkip?: () => void;
}

const DIETARY_RESTRICTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free", label: "Dairy-Free" },
  { id: "nut-free", label: "Nut-Free" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "kosher", label: "Kosher" },
  { id: "halal", label: "Halal" },
];

const COMMON_ALLERGENS = [
  { id: "peanuts", label: "Peanuts" },
  { id: "tree-nuts", label: "Tree Nuts" },
  { id: "shellfish", label: "Shellfish" },
  { id: "fish", label: "Fish" },
  { id: "eggs", label: "Eggs" },
  { id: "dairy", label: "Dairy" },
  { id: "soy", label: "Soy" },
  { id: "wheat", label: "Wheat" },
  { id: "sesame", label: "Sesame" },
];

const FOOD_PREFERENCES = [
  { id: "organic", label: "Organic" },
  { id: "local", label: "Local & Sustainable" },
  { id: "low-carb", label: "Low-Carb" },
  { id: "low-sodium", label: "Low-Sodium" },
  { id: "paleo", label: "Paleo" },
  { id: "keto", label: "Keto" },
];

function toggleValue(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function DietaryPreferencesComponent({
  preferences,
  onSave,
  onSkip,
}: DietaryPreferencesProps) {
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    preferences?.dietaryRestrictions ?? [],
  );
  const [allergens, setAllergens] = useState<string[]>(
    preferences?.allergens ?? [],
  );
  const [foodPreferences, setFoodPreferences] = useState<string[]>(
    preferences?.preferences ?? [],
  );
  const [notes, setNotes] = useState(preferences?.notes ?? "");

  const hasSelections = useMemo(
    () =>
      dietaryRestrictions.length > 0 ||
      allergens.length > 0 ||
      foodPreferences.length > 0 ||
      notes.trim().length > 0,
    [dietaryRestrictions, allergens, foodPreferences, notes],
  );

  const handleSave = () => {
    onSave({
      dietaryRestrictions,
      allergens,
      preferences: foodPreferences,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Card className="my-4 max-w-3xl overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-lg backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Utensils className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl font-semibold">
              Personalize the dining experience
            </CardTitle>
            <CardDescription>
              Let the kitchen know about dietary needs and preferences ahead of
              your visit.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasSelections ? (
            <Badge
              variant="outline"
              className="border-success/40 bg-success/10 text-xs font-medium uppercase tracking-wide text-success"
            >
              Details shared
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-border/60 bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Optional step
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <section className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-base font-semibold text-foreground">
              Dietary restrictions
            </Label>
            {dietaryRestrictions.length > 0 ? (
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-xs font-medium text-primary"
              >
                {dietaryRestrictions.length} selected
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DIETARY_RESTRICTIONS.map((restriction) => {
              const checked = dietaryRestrictions.includes(restriction.id);
              return (
                <label
                  key={restriction.id}
                  htmlFor={`dietary-${restriction.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm font-medium hover:border-primary/40"
                >
                  <Checkbox
                    id={`dietary-${restriction.id}`}
                    checked={checked}
                    onCheckedChange={() =>
                      setDietaryRestrictions((prev) =>
                        toggleValue(prev, restriction.id),
                      )
                    }
                  />
                  <span className="text-muted-foreground">
                    {restriction.label}
                  </span>
                </label>
              );
            })}
          </div>
          {dietaryRestrictions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {dietaryRestrictions.map((id) => {
                const restriction = DIETARY_RESTRICTIONS.find(
                  (item) => item.id === id,
                );
                return (
                  <Badge
                    key={id}
                    variant="outline"
                    className="flex items-center gap-1 border-border/50 bg-background/80 text-xs font-medium text-muted-foreground"
                  >
                    {restriction?.label}
                    <button
                      type="button"
                      className="rounded-full p-1 text-muted-foreground/70 hover:text-destructive"
                      onClick={() =>
                        setDietaryRestrictions((prev) => toggleValue(prev, id))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <div>
              <Label className="text-base font-semibold text-destructive">
                Allergens (critical info)
              </Label>
              <p className="text-xs text-destructive/80">
                We’ll flag these in the guest profile to keep your party safe.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COMMON_ALLERGENS.map((allergen) => {
              const checked = allergens.includes(allergen.id);
              return (
                <label
                  key={allergen.id}
                  htmlFor={`allergen-${allergen.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-destructive/30 bg-background/80 px-3 py-2 text-sm font-medium hover:border-destructive/40"
                >
                  <Checkbox
                    id={`allergen-${allergen.id}`}
                    checked={checked}
                    onCheckedChange={() =>
                      setAllergens((prev) => toggleValue(prev, allergen.id))
                    }
                  />
                  <span className="text-destructive/80">{allergen.label}</span>
                </label>
              );
            })}
          </div>
          {allergens.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergens.map((id) => {
                const allergen = COMMON_ALLERGENS.find(
                  (item) => item.id === id,
                );
                return (
                  <Badge
                    key={id}
                    variant="destructive"
                    className="flex items-center gap-1 border-destructive/40 bg-destructive/20 text-xs font-semibold"
                  >
                    {allergen?.label}
                    <button
                      type="button"
                      className="rounded-full p-1 hover:bg-destructive/10"
                      onClick={() =>
                        setAllergens((prev) => toggleValue(prev, id))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-base font-semibold text-foreground">
              Preferences & highlights
            </Label>
            {foodPreferences.length > 0 ? (
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-xs font-medium text-primary"
              >
                {foodPreferences.length} noted
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FOOD_PREFERENCES.map((preference) => {
              const checked = foodPreferences.includes(preference.id);
              return (
                <label
                  key={preference.id}
                  htmlFor={`preference-${preference.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm font-medium hover:border-primary/40"
                >
                  <Checkbox
                    id={`preference-${preference.id}`}
                    checked={checked}
                    onCheckedChange={() =>
                      setFoodPreferences((prev) =>
                        toggleValue(prev, preference.id),
                      )
                    }
                  />
                  <span className="text-muted-foreground">
                    {preference.label}
                  </span>
                </label>
              );
            })}
          </div>
          {foodPreferences.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {foodPreferences.map((id) => {
                const preference = FOOD_PREFERENCES.find(
                  (item) => item.id === id,
                );
                return (
                  <Badge
                    key={id}
                    variant="outline"
                    className="flex items-center gap-1 border-border/50 bg-background/80 text-xs font-medium text-muted-foreground"
                  >
                    {preference?.label}
                    <button
                      type="button"
                      className="rounded-full p-1 text-muted-foreground/70 hover:text-destructive"
                      onClick={() =>
                        setFoodPreferences((prev) => toggleValue(prev, id))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <Label htmlFor="dietary-notes" className="text-base font-semibold">
            Notes for the kitchen
          </Label>
          <Textarea
            id="dietary-notes"
            placeholder="Anything else we should know? Celebration, seating preference, or specific ingredient call-outs."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
        </section>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end">
        {onSkip ? (
          <Button variant="ghost" type="button" onClick={onSkip}>
            Skip for now
          </Button>
        ) : null}
        <Button type="button" onClick={() => handleSave()}>
          Save preferences
        </Button>
      </CardFooter>
    </Card>
  );
}
