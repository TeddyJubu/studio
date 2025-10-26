"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Utensils, AlertCircle, X } from "lucide-react";
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
  { id: "local", label: "Local/Sustainable" },
  { id: "low-carb", label: "Low-Carb" },
  { id: "low-sodium", label: "Low-Sodium" },
  { id: "paleo", label: "Paleo" },
  { id: "keto", label: "Keto" },
];

export function DietaryPreferencesComponent({
  preferences,
  onSave,
  onSkip,
}: DietaryPreferencesProps) {
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    preferences?.dietaryRestrictions || []
  );
  const [allergens, setAllergens] = useState<string[]>(
    preferences?.allergens || []
  );
  const [foodPreferences, setFoodPreferences] = useState<string[]>(
    preferences?.preferences || []
  );
  const [notes, setNotes] = useState(preferences?.notes || "");

  const toggleRestriction = (id: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAllergen = (id: string) => {
    setAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const togglePreference = (id: string) => {
    setFoodPreferences((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const prefs: DietaryPreferences = {
      dietaryRestrictions,
      allergens,
      preferences: foodPreferences,
      notes: notes.trim() || undefined,
    };
    onSave(prefs);
  };

  const hasSelections =
    dietaryRestrictions.length > 0 ||
    allergens.length > 0 ||
    foodPreferences.length > 0 ||
    notes.trim().length > 0;

  return (
    <Card className="my-2 max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          Dietary Preferences & Allergens
        </CardTitle>
        <CardDescription>
          Help us prepare the best experience for your visit (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dietary Restrictions */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Dietary Restrictions</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <div key={restriction.id} className="flex items-center space-x-2">
                <Checkbox
                  id={restriction.id}
                  checked={dietaryRestrictions.includes(restriction.id)}
                  onCheckedChange={() => toggleRestriction(restriction.id)}
                />
                <Label
                  htmlFor={restriction.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {restriction.label}
                </Label>
              </div>
            ))}
          </div>
          {dietaryRestrictions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {dietaryRestrictions.map((id) => {
                const restriction = DIETARY_RESTRICTIONS.find((r) => r.id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {restriction?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleRestriction(id)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Allergens */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <Label className="text-base font-semibold text-destructive">
              Allergens (Important!)
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Please let us know about any food allergies so we can ensure your safety
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COMMON_ALLERGENS.map((allergen) => (
              <div key={allergen.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`allergen-${allergen.id}`}
                  checked={allergens.includes(allergen.id)}
                  onCheckedChange={() => toggleAllergen(allergen.id)}
                />
                <Label
                  htmlFor={`allergen-${allergen.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {allergen.label}
                </Label>
              </div>
            ))}
          </div>
          {allergens.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {allergens.map((id) => {
                const allergen = COMMON_ALLERGENS.find((a) => a.id === id);
                return (
                  <Badge key={id} variant="destructive" className="gap-1">
                    {allergen?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleAllergen(id)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Food Preferences */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Food Preferences</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FOOD_PREFERENCES.map((pref) => (
              <div key={pref.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`pref-${pref.id}`}
                  checked={foodPreferences.includes(pref.id)}
                  onCheckedChange={() => togglePreference(pref.id)}
                />
                <Label
                  htmlFor={`pref-${pref.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {pref.label}
                </Label>
              </div>
            ))}
          </div>
          {foodPreferences.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {foodPreferences.map((id) => {
                const pref = FOOD_PREFERENCES.find((p) => p.id === id);
                return (
                  <Badge key={id} variant="outline" className="gap-1">
                    {pref?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => togglePreference(id)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="dietary-notes">Additional Notes</Label>
          <Textarea
            id="dietary-notes"
            placeholder="Any other dietary requirements or preferences we should know about?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            e.g., "Prefer dishes without cilantro", "Lactose intolerant", etc.
          </p>
        </div>

        {/* Summary */}
        {hasSelections && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-semibold">Summary:</p>
            <div className="space-y-1 text-sm">
              {dietaryRestrictions.length > 0 && (
                <p>
                  <span className="font-medium">Restrictions:</span>{" "}
                  {dietaryRestrictions
                    .map((id) => DIETARY_RESTRICTIONS.find((r) => r.id === id)?.label)
                    .join(", ")}
                </p>
              )}
              {allergens.length > 0 && (
                <p className="text-destructive">
                  <span className="font-medium">Allergens:</span>{" "}
                  {allergens
                    .map((id) => COMMON_ALLERGENS.find((a) => a.id === id)?.label)
                    .join(", ")}
                </p>
              )}
              {foodPreferences.length > 0 && (
                <p>
                  <span className="font-medium">Preferences:</span>{" "}
                  {foodPreferences
                    .map((id) => FOOD_PREFERENCES.find((p) => p.id === id)?.label)
                    .join(", ")}
                </p>
              )}
              {notes.trim() && (
                <p>
                  <span className="font-medium">Notes:</span> {notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            {hasSelections ? "Save Preferences" : "No Dietary Requirements"}
          </Button>
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip
            </Button>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          We take dietary requirements seriously. Our staff will be notified of your
          preferences when you arrive.
        </p>
      </CardContent>
    </Card>
  );
}
