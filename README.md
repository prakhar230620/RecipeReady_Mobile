# RecipeReady

RecipeReady is an AI-powered recipe generator that helps you create delicious meals with the ingredients you have.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/toolminesais-projects/v0-modern-recipe-generator)

## Features

- Generate recipes based on ingredients you have
- Filter recipes by dietary preferences and cuisine
- Save favorite recipes
- Progressive Web App (PWA) support
- Dark/Light theme
- User authentication

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- NextAuth.js for authentication
- MongoDB for database
- Groq API for recipe generation
- Gemini API for image generation
- PWA support with next-pwa

## Deployment on Vercel

Follow these steps to deploy the application on Vercel:

1. **Fork or Clone the Repository**

2. **Create a Vercel Account**
   - Sign up at [vercel.com](https://vercel.com) if you don't have an account

3. **Install Vercel CLI (Optional)**
   ```bash
   npm install -g vercel
   ```

4. **Set Up Environment Variables**
   - Copy the variables from `.env.example` to your Vercel project
   - You'll need to set up:
     - `NEXTAUTH_URL`: Your deployed URL
     - `NEXTAUTH_SECRET`: A secure random string
     - `MONGODB_URI`: Your MongoDB connection string
     - `GROQ_API_KEY`: Your Groq API key
     - `GEMINI_API_KEY`: Your Gemini API key

5. **Deploy to Vercel**
   - Using Vercel Dashboard:
     - Import your GitHub repository
     - Configure the environment variables
     - Deploy
   
   - Or using Vercel CLI:
     ```bash
     vercel
     ```

6. **Verify Deployment**
   - Check that your application is running correctly
   - Test the recipe generation functionality
   - Verify that authentication works

## Local Development

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd newRR2
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the required environment variables (see `.env.example`)

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser