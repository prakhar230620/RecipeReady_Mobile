'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild className="rounded-full">
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to RecipeReady. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
        </p>

        <h2>2. Data We Collect</h2>
        <p>
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul>
          <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
          <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
          <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
          <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
          <li><strong>Recipe Data</strong> includes information about recipes you generate, save, or favorite.</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <p>
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </p>
        <ul>
          <li>To register you as a new customer.</li>
          <li>To provide and improve our services to you.</li>
          <li>To manage our relationship with you.</li>
          <li>To administer and protect our business and this website.</li>
          <li>To deliver relevant website content to you.</li>
          <li>To use data analytics to improve our website, products/services, marketing, customer relationships and experiences.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements.
        </p>

        <h2>6. Your Legal Rights</h2>
        <p>
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
        </p>
        <ul>
          <li>Request access to your personal data.</li>
          <li>Request correction of your personal data.</li>
          <li>Request erasure of your personal data.</li>
          <li>Object to processing of your personal data.</li>
          <li>Request restriction of processing your personal data.</li>
          <li>Request transfer of your personal data.</li>
          <li>Right to withdraw consent.</li>
        </ul>

        <h2>7. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or our privacy practices, please contact us at:
        </p>
        <p>
          Email: support@recipeready.com<br />
          Or visit our Contact Support page in the app.
        </p>
      </div>
    </div>
  )
}