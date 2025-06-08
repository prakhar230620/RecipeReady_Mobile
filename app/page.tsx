import RecipeGenerator from "@/components/recipe-generator"

export default function Home() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/icon-192x192.png" alt="RecipeReady Logo" className="w-8 h-8" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RecipeReady
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Transform ingredients into delicious recipes with AI</p>
        </div>
        <RecipeGenerator />
      </main>
    </div>
  )
}
