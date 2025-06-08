"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { languages } from "@/lib/languages"

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState("en")

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("recipe-language")
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage)
    }
  }, [])

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    localStorage.setItem("recipe-language", languageCode)

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: languageCode }))
  }

  const selectedLang = languages.find((lang) => lang.code === selectedLanguage)

  return (
    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-auto min-w-[120px] h-9 rounded-full border-2">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedLang?.flag}</span>
            <span className="text-sm font-medium">{selectedLang?.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
