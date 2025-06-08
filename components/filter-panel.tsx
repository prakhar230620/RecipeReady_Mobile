"use client"

import { useState } from "react"
import type { RecipeFilters } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { cuisineFlags } from "@/lib/languages"
import { Plus, Minus, ChevronDownIcon } from "lucide-react"

interface FilterPanelProps {
  filters: RecipeFilters
  onFiltersChange: (filters: RecipeFilters) => void
}

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  // Track selected options count for each category
  const [selectedCounts, setSelectedCounts] = useState({
    dietary: filters.dietary?.length || 0,
    cuisine: filters.cuisine?.length || 0,
    spiceLevel: filters.spiceLevel?.length || 0,
    mealType: filters.mealType?.length || 0,
    cookTime: filters.cookTime?.length || 0,
    healthProfile: filters.healthProfile?.length || 0,
    difficulty: filters.difficulty?.length || 0,
  })

  // Helper function to update array filters
  const updateArrayFilter = (key: keyof RecipeFilters, value: string, checked: boolean) => {
    const currentValues = filters[key] as string[] || [];
    let newValues: string[];
    
    if (checked) {
      // Add value if it doesn't exist
      newValues = currentValues.includes(value) ? currentValues : [...currentValues, value];
    } else {
      // Remove value if it exists
      newValues = currentValues.filter(v => v !== value);
    }
    
    // Update the filters
    const updatedFilters = { ...filters, [key]: newValues };
    onFiltersChange(updatedFilters);
    
    // Update the selected count
    setSelectedCounts(prev => ({
      ...prev,
      [key]: newValues.length
    }));
  };

  // Helper function to check if a value is selected
  const isSelected = (key: keyof RecipeFilters, value: string) => {
    const values = filters[key] as string[] || [];
    return values.includes(value);
  };

  // Helper function to increment/decrement servings
  const updateServings = (increment: boolean) => {
    const newValue = increment ? filters.servings + 1 : Math.max(1, filters.servings - 1);
    onFiltersChange({ ...filters, servings: newValue });
  };

  return (
    <main className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">👥 Servings</Label>
        <div className="flex items-center">
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={() => updateServings(false)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            min="1"
            max="20"
            value={filters.servings}
            onChange={(e) => onFiltersChange({ ...filters, servings: Number.parseInt(e.target.value) || 2 })}
            className="h-10 rounded-full text-center mx-2"
            placeholder="2"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={() => updateServings(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center">
          ⏰ Cook Time
          {selectedCounts.cookTime > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCounts.cookTime}
            </span>
          )}
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Cook Time
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <DropdownMenuCheckboxItem
              checked={isSelected('cookTime', 'any')}
              onCheckedChange={(checked) => updateArrayFilter('cookTime', 'any', checked === true)}
            >
              ⏰ Any Time
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cookTime', 'quick')}
              onCheckedChange={(checked) => updateArrayFilter('cookTime', 'quick', checked === true)}
            >
              ⚡ Under 30 min
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cookTime', 'medium')}
              onCheckedChange={(checked) => updateArrayFilter('cookTime', 'medium', checked === true)}
            >
              🕐 30-60 min
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cookTime', 'long')}
              onCheckedChange={(checked) => updateArrayFilter('cookTime', 'long', checked === true)}
            >
              🕰️ Over 1 hour
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center">
          🥗 Dietary
          {selectedCounts.dietary > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCounts.dietary}
            </span>
          )}
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Dietary Options
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'any')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'any', checked === true)}
            >
              🍽️ Any
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'vegetarian')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'vegetarian', checked === true)}
            >
              🥬 Vegetarian
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'vegan')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'vegan', checked === true)}
            >
              🌱 Vegan
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'gluten-free')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'gluten-free', checked === true)}
            >
              🌾 Gluten-Free
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'keto')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'keto', checked === true)}
            >
              🥑 Keto
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'paleo')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'paleo', checked === true)}
            >
              🥩 Paleo
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'dairy-free')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'dairy-free', checked === true)}
            >
              🥛 Dairy-Free
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'low-carb')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'low-carb', checked === true)}
            >
              🥒 Low-Carb
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'high-protein')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'high-protein', checked === true)}
            >
              💪 High-Protein
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'low-calorie')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'low-calorie', checked === true)}
            >
              🏃‍♀️ Low-Calorie
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('dietary', 'sugar-free')}
              onCheckedChange={(checked) => updateArrayFilter('dietary', 'sugar-free', checked === true)}
            >
              🚫🍯 Sugar-Free
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center">
          🌍 Cuisine
          {selectedCounts.cuisine > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCounts.cuisine}
            </span>
          )}
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Cuisine
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'any')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'any', checked === true)}
            >
              🌐 Any Cuisine
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'italian')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'italian', checked === true)}
            >
              {cuisineFlags.italian} Italian
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'mexican')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'mexican', checked === true)}
            >
              {cuisineFlags.mexican} Mexican
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'chinese')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'chinese', checked === true)}
            >
              {cuisineFlags.chinese} Chinese
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'indian')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'indian', checked === true)}
            >
              {cuisineFlags.indian} Indian
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'thai')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'thai', checked === true)}
            >
              {cuisineFlags.thai} Thai
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'japanese')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'japanese', checked === true)}
            >
              {cuisineFlags.japanese} Japanese
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'korean')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'korean', checked === true)}
            >
              {cuisineFlags.korean} Korean
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'french')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'french', checked === true)}
            >
              {cuisineFlags.french} French
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'mediterranean')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'mediterranean', checked === true)}
            >
              {cuisineFlags.mediterranean} Mediterranean
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('cuisine', 'american')}
              onCheckedChange={(checked) => updateArrayFilter('cuisine', 'american', checked === true)}
            >
              {cuisineFlags.american} American
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center">
          🌶️ Spice Level
          {selectedCounts.spiceLevel > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCounts.spiceLevel}
            </span>
          )}
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Spice Level
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <DropdownMenuCheckboxItem
              checked={isSelected('spiceLevel', 'any')}
              onCheckedChange={(checked) => updateArrayFilter('spiceLevel', 'any', checked === true)}
            >
              🍽️ Any Level
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('spiceLevel', 'mild')}
              onCheckedChange={(checked) => updateArrayFilter('spiceLevel', 'mild', checked === true)}
            >
              😊 Mild
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('spiceLevel', 'medium')}
              onCheckedChange={(checked) => updateArrayFilter('spiceLevel', 'medium', checked === true)}
            >
              🌶️ Medium
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('spiceLevel', 'hot')}
              onCheckedChange={(checked) => updateArrayFilter('spiceLevel', 'hot', checked === true)}
            >
              🔥 Hot
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('spiceLevel', 'very-hot')}
              onCheckedChange={(checked) => updateArrayFilter('spiceLevel', 'very-hot', checked === true)}
            >
              🌋 Very Hot
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center">
          🍽️ Meal Type
          {selectedCounts.mealType > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCounts.mealType}
            </span>
          )}
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Meal Types
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'any')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'any', checked === true)}
            >
              🍽️ Any Meal
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'breakfast')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'breakfast', checked === true)}
            >
              🌅 Breakfast
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'brunch')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'brunch', checked === true)}
            >
              🥐 Brunch
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'lunch')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'lunch', checked === true)}
            >
              ☀️ Lunch
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'dinner')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'dinner', checked === true)}
            >
              🌙 Dinner
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'snack')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'snack', checked === true)}
            >
              🍿 Snack
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'dessert')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'dessert', checked === true)}
            >
              🍰 Dessert
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'appetizer')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'appetizer', checked === true)}
            >
              🥗 Appetizer
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('mealType', 'side-dish')}
              onCheckedChange={(checked) => updateArrayFilter('mealType', 'side-dish', checked === true)}
            >
              🥙 Side Dish
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center">
          🎯 Difficulty
          {selectedCounts.difficulty > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCounts.difficulty}
            </span>
          )}
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Difficulty
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
            <DropdownMenuCheckboxItem
              checked={isSelected('difficulty', 'any')}
              onCheckedChange={(checked) => updateArrayFilter('difficulty', 'any', checked === true)}
            >
              🎯 Any Level
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('difficulty', 'easy')}
              onCheckedChange={(checked) => updateArrayFilter('difficulty', 'easy', checked === true)}
            >
              😊 Easy
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('difficulty', 'medium')}
              onCheckedChange={(checked) => updateArrayFilter('difficulty', 'medium', checked === true)}
            >
              🤔 Medium
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('difficulty', 'hard')}
              onCheckedChange={(checked) => updateArrayFilter('difficulty', 'hard', checked === true)}
            >
              😤 Hard
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center">
          🏃‍♀️ Health Focus
          {selectedCounts.healthProfile > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCounts.healthProfile}
            </span>
          )}
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Health Focus
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
            <DropdownMenuCheckboxItem
              checked={isSelected('healthProfile', 'any')}
              onCheckedChange={(checked) => updateArrayFilter('healthProfile', 'any', checked === true)}
            >
              🍽️ Any Focus
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('healthProfile', 'weight-loss')}
              onCheckedChange={(checked) => updateArrayFilter('healthProfile', 'weight-loss', checked === true)}
            >
              🏃‍♀️ Weight Loss
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('healthProfile', 'muscle-gain')}
              onCheckedChange={(checked) => updateArrayFilter('healthProfile', 'muscle-gain', checked === true)}
            >
              💪 Muscle Gain
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('healthProfile', 'heart-healthy')}
              onCheckedChange={(checked) => updateArrayFilter('healthProfile', 'heart-healthy', checked === true)}
            >
              ❤️ Heart Healthy
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('healthProfile', 'diabetic-friendly')}
              onCheckedChange={(checked) => updateArrayFilter('healthProfile', 'diabetic-friendly', checked === true)}
            >
              🩺 Diabetic Friendly
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('healthProfile', 'anti-inflammatory')}
              onCheckedChange={(checked) => updateArrayFilter('healthProfile', 'anti-inflammatory', checked === true)}
            >
              🌿 Anti-Inflammatory
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('healthProfile', 'energy-boost')}
              onCheckedChange={(checked) => updateArrayFilter('healthProfile', 'energy-boost', checked === true)}
            >
              ⚡ Energy Boost
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSelected('healthProfile', 'immune-boost')}
              onCheckedChange={(checked) => updateArrayFilter('healthProfile', 'immune-boost', checked === true)}
            >
              🛡️ Immune Boost
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </main>
  )
}
