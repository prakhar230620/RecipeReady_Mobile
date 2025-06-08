'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild className="rounded-full">
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Terms of Service</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using RecipeReady, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily use RecipeReady for personal, non-commercial purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:
        </p>
        <ul>
          <li>Modify or copy the materials;</li>
          <li>Use the materials for any commercial purpose or for any public display;</li>
          <li>Attempt to reverse engineer any software contained on RecipeReady;</li>
          <li>Remove any copyright or other proprietary notations from the materials; or</li>
          <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
        </ul>
        <p>
          This license shall automatically terminate if you violate any of these restrictions and may be terminated by RecipeReady at any time.
        </p>

        <h2>3. Disclaimer</h2>
        <p>
          The materials on RecipeReady are provided on an 'as is' basis. RecipeReady makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>
        <p>
          Further, RecipeReady does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
        </p>

        <h2>4. Limitations</h2>
        <p>
          In no event shall RecipeReady or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on RecipeReady, even if RecipeReady or a RecipeReady authorized representative has been notified orally or in writing of the possibility of such damage.
        </p>

        <h2>5. Accuracy of Materials</h2>
        <p>
          The materials appearing on RecipeReady could include technical, typographical, or photographic errors. RecipeReady does not warrant that any of the materials on its website are accurate, complete or current. RecipeReady may make changes to the materials contained on its website at any time without notice. However RecipeReady does not make any commitment to update the materials.
        </p>

        <h2>6. Links</h2>
        <p>
          RecipeReady has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by RecipeReady of the site. Use of any such linked website is at the user's own risk.
        </p>

        <h2>7. Modifications</h2>
        <p>
          RecipeReady may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
        </p>

        <h2>8. Governing Law</h2>
        <p>
          These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us at:
        </p>
        <p>
          Email: support@recipeready.com<br />
          Or visit our Contact Support page in the app.
        </p>
      </div>
    </div>
  )
}