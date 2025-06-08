'use client'

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Recipe } from "@/lib/types"
import { useSession } from 'next-auth/react'
import toast from "react-hot-toast"

interface RecipeContextType {
  favoriteRecipes: Recipe[]
  generatedRecipes: Recipe[]
  addToFavorites: (recipe: Recipe) => void
  removeFromFavorites: (recipeId: string) => void
  isFavorite: (recipeId: string) => boolean
  addGeneratedRecipe: (recipe: Recipe) => void
  clearGeneratedRecipes: () => void
  clearAllGeneratedRecipes: () => void
  loading: boolean
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined)

// IndexedDB configuration
const DB_NAME = 'RecipesDatabase'
const DB_VERSION = 1
const FAVORITES_STORE = 'favorites'
const GENERATED_STORE = 'generatedRecipes'
const GENERATED_KEY = 'generated-recipes' // Key for generated recipes

// Helper functions for IndexedDB
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error)
      reject(request.error)
    }
    
    request.onsuccess = (event) => {
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = request.result
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: 'userEmail' })
      }
      
      if (!db.objectStoreNames.contains(GENERATED_STORE)) {
        // Use a simple keyPath for generated recipes
        db.createObjectStore(GENERATED_STORE, { keyPath: 'key' })
      }
    }
  })
}

const saveToIndexedDB = async (storeName: string, key: string, data: any): Promise<void> => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      let request;
      if (storeName === GENERATED_STORE) {
        // For generated recipes store, use 'key' as keyPath
        request = store.put({ key: key, recipes: data })
      } else {
        // For favorites store, use 'userEmail' as keyPath
        request = store.put({ userEmail: key, recipes: data })
      }
      
      request.onsuccess = () => {
        console.log(`Successfully saved to IndexedDB: ${storeName} with key ${key}`)
        resolve()
      }
      request.onerror = () => {
        console.error('Error saving to IndexedDB:', request.error)
        reject(request.error)
      }
      
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error)
    throw error
  }
}

const getFromIndexedDB = async (storeName: string, key: string): Promise<any> => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      let request;
      if (storeName === GENERATED_STORE) {
        // For generated recipes store, use 'key' as keyPath
        request = store.get(key)
      } else {
        // For favorites store, use 'userEmail' as keyPath
        request = store.get(key)
      }
      
      request.onsuccess = () => {
        console.log(`Successfully retrieved from IndexedDB: ${storeName} with key ${key}`)
        resolve(request.result ? request.result.recipes : null)
      }
      
      request.onerror = () => {
        console.error('Error reading from IndexedDB:', request.error)
        reject(request.error)
      }
      
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error('Failed to read from IndexedDB:', error)
    return null
  }
}

const removeFromIndexedDB = async (storeName: string, key: string): Promise<void> => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      let request;
      if (storeName === GENERATED_STORE) {
        // For generated recipes store, use 'key' as keyPath
        request = store.delete(key)
      } else {
        // For favorites store, use 'userEmail' as keyPath
        request = store.delete(key)
      }
      
      request.onsuccess = () => {
        console.log(`Successfully removed from IndexedDB: ${storeName} with key ${key}`)
        resolve()
      }
      request.onerror = () => {
        console.error('Error deleting from IndexedDB:', request.error)
        reject(request.error)
      }
      
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error('Failed to delete from IndexedDB:', error)
    throw error
  }
}

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([])
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      loadFavoriteRecipes()
    } else {
      setFavoriteRecipes([])
    }
  }, [session])

  useEffect(() => {
    // Load generated recipes from IndexedDB
    loadGeneratedRecipes()
  }, [])

  const loadFavoriteRecipes = async () => {
    if (!session?.user?.email) return

    try {
      // Try to get from IndexedDB first
      const recipes = await getFromIndexedDB(FAVORITES_STORE, session.user.email)
      
      if (recipes) {
        setFavoriteRecipes(recipes)
        console.log("Loaded favorite recipes from IndexedDB:", recipes)
      } else {
        // Fallback to localStorage for backward compatibility
        const stored = localStorage.getItem(`favorites_${session.user.email}`)
        if (stored) {
          const parsedRecipes = JSON.parse(stored)
          setFavoriteRecipes(parsedRecipes)
          console.log("Loaded favorite recipes from localStorage (migrating to IndexedDB):", parsedRecipes)
          
          // Migrate to IndexedDB
          await saveToIndexedDB(FAVORITES_STORE, session.user.email, parsedRecipes)
          
          // Can optionally remove from localStorage after migration
          // localStorage.removeItem(`favorites_${session.user.email}`)
        }
      }
    } catch (error) {
      console.error("Error loading favorite recipes:", error)
      toast.error("Failed to load your favorite recipes")
    }
  }

  const loadGeneratedRecipes = async () => {
    try {
      const recipes = await getFromIndexedDB(GENERATED_STORE, GENERATED_KEY)
      if (recipes) {
        setGeneratedRecipes(recipes)
        console.log("Loaded generated recipes from IndexedDB:", recipes)
      }
    } catch (error) {
      console.error("Error loading generated recipes:", error)
    }
  }

  const addGeneratedRecipe = async (recipe: Recipe) => {
    setGeneratedRecipes((prevRecipes) => {
      const newRecipes = [recipe, ...prevRecipes.filter((r) => r.id !== recipe.id)].slice(0, 5)
      saveToIndexedDB(GENERATED_STORE, GENERATED_KEY, newRecipes)
      console.log("Added generated recipe, updated state:", newRecipes)
      return newRecipes
    })
  }

  const clearGeneratedRecipes = () => {
    setGeneratedRecipes([])
    saveToIndexedDB(GENERATED_STORE, GENERATED_KEY, [])
    console.log("Cleared generated recipes from state and IndexedDB.")
  }

  const clearAllGeneratedRecipes = async () => {
    setGeneratedRecipes([])
    await removeFromIndexedDB(GENERATED_STORE, GENERATED_KEY)
    console.log("Cleared all generated recipes from IndexedDB.")
  }

  const addToFavorites = async (recipe: Recipe) => {
    if (!session?.user?.email) {
      toast.error("Please log in to add to favorites.")
      return
    }
    setFavoriteRecipes((prevFavorites) => {
      const newFavorites = [...prevFavorites, recipe]
      saveToIndexedDB(FAVORITES_STORE, session.user!.email, newFavorites)
      console.log("Added to favorites, updated state:", newFavorites)
      return newFavorites
    })
    toast.success("Added to favorites! ❤️")
  }

  const removeFromFavorites = async (recipeId: string) => {
    if (!session?.user?.email) return
    setFavoriteRecipes((prevFavorites) => {
      const newFavorites = prevFavorites.filter((r) => r.id !== recipeId)
      saveToIndexedDB(FAVORITES_STORE, session.user!.email, newFavorites)
      console.log("Removed from favorites, updated state:", newFavorites)
      return newFavorites
    })
    toast.success("Removed from favorites! 💔")
  }

  const isFavorite = (recipeId: string) => {
    return favoriteRecipes.some((r) => r.id === recipeId)
  }

  return (
    <RecipeContext.Provider
      value={{
        favoriteRecipes,
        generatedRecipes,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        addGeneratedRecipe,
        clearGeneratedRecipes,
        clearAllGeneratedRecipes,
        loading,
      }}
    >
      {children}
    </RecipeContext.Provider>
  )
}

export function useRecipes() {
  const context = useContext(RecipeContext)
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider")
  }
  return context
}