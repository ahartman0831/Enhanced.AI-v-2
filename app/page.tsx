import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  FileText,
  Camera,
  Activity,
  Pill,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Crown,
  Star,
  ArrowRight,
  Award
} from 'lucide-react'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function LandingPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-cyan-500/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-end gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Get Started</Button>
            </Link>
          </div>
        </header>

        {/* Hero Section - Logo only, large at top */}
        <section className="relative min-h-[50vh] flex flex-col items-center justify-center bg-background border-b border-cyan-500/10">
          <div className="flex flex-col items-center justify-center w-full px-4">
            <Link href="/" className="block mb-8">
              <Logo size="fill" showText={false} className="h-36 w-72 sm:h-44 sm:w-80 md:h-56 md:w-96 [&_img]:object-contain" />
            </Link>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

      {/* Features Section */}
      <section className="py-16 bg-cyan-500/5 dark:bg-cyan-950/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Health Analysis Tools</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore evidence-based health optimization with AI-powered educational insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg hover:border-cyan-500/30 transition-all border-cyan-500/10">
              <CardHeader>
                <Search className="h-8 w-8 text-cyan-500 mb-2" />
                <CardTitle>Stack Explorer</CardTitle>
                <CardDescription>
                  Educational analysis of supplementation approaches based on your goals and experience level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Goal-based recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Risk assessment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Nutrition impact analysis
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:border-cyan-500/30 transition-all border-cyan-500/10">
              <CardHeader>
                <FileText className="h-8 w-8 text-cyan-500 mb-2" />
                <CardTitle>Bloodwork Analysis</CardTitle>
                <CardDescription>
                  Upload and analyze blood test results with AI-powered educational insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Marker interpretation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Trend analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Projection modeling
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:border-cyan-500/30 transition-all border-cyan-500/10">
              <CardHeader>
                <Camera className="h-8 w-8 text-cyan-500 mb-2" />
                <CardTitle>Progress Photos</CardTitle>
                <CardDescription>
                  Track body composition changes with AI-powered analysis and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Body composition tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Progress visualization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    AI-powered insights
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:border-cyan-500/30 transition-all border-cyan-500/10">
              <CardHeader>
                <Activity className="h-8 w-8 text-cyan-500 mb-2" />
                <CardTitle>Side Effects Monitor</CardTitle>
                <CardDescription>
                  Educational analysis of potential side effects and management strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Mechanism explanations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Interaction analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Management strategies
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:border-cyan-500/30 transition-all border-cyan-500/10">
              <CardHeader>
                <Pill className="h-8 w-8 text-cyan-500 mb-2" />
                <CardTitle>Compound Database</CardTitle>
                <CardDescription>
                  Educational information about vitamins, supplements, and medications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Comprehensive research
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Usage guidelines
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Safety information
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:border-cyan-500/30 transition-all border-cyan-500/10">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-cyan-500 mb-2" />
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Track and analyze your health metrics with comprehensive dashboards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Metric tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Trend analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    Goal progress
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade as you need more advanced features and professional support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Free
                </CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="text-3xl font-bold">$0<span className="text-base font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    Compounds database
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    Order blood test
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    Profile & subscription
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    Community discussions
                  </li>
                </ul>
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">Get Started Free</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-cyan-500/50 shadow-lg shadow-cyan-500/10">
              <CardHeader>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-cyan-600 text-white dark:bg-cyan-500 dark:text-foreground">Most Popular</Badge>
                </div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-cyan-500" />
                  Pro
                </CardTitle>
                <CardDescription>Exploration, modeling & educational tools</CardDescription>
                <div className="text-3xl font-bold">$19<span className="text-base font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>🧪 Exploration — Stack Explorer, Side Effects, Counterfeit Checker</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>📊 Modeling — Progress Photos, Results Forecaster, Supplement Analyzer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>⚙️ Educational Tools — Advanced analysis and reporting</span>
                  </li>
                </ul>
                <Link href="/subscription">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">Upgrade to Pro</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Elite Plan */}
            <Card className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 shadow-lg shadow-amber-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-600" />
                  Elite
                </CardTitle>
                <CardDescription>Biomarker intelligence & doctor-ready exports</CardDescription>
                <div className="text-3xl font-bold">$29.99<span className="text-base font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>🔬 Biomarker Intelligence — Bloodwork Parser, lab analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>📈 Longitudinal Tracking — Bloodwork History, trends over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>🧠 Personalized Recovery Modeling — Recovery Timeline, PCT considerations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>📄 Doctor-Ready Exports — Telehealth Referral packages, PDF exports</span>
                  </li>
                </ul>
                <Link href="/subscription">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">Upgrade to Elite</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Disclaimer */}
          <Alert className="max-w-2xl mx-auto mt-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Pricing Notice:</strong> Professional medical services (doctor consultations, lab testing, TRT protocols)
              are provided through licensed healthcare partners. Enhanced.AI facilitates connections but does not provide medical services directly.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-cyan-500/5 dark:bg-cyan-950/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Trusted by Serious Athletes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">10K+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">500K+</div>
              <div className="text-muted-foreground">Analyses Performed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">98%</div>
              <div className="text-muted-foreground">User Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Health Optimization Journey Today</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of athletes who are making informed decisions about their health and performance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/dashboard">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Start Free Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/compounds">
              <Button size="lg" variant="outline" className="border-cyan-500/50 text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-400/50 dark:hover:bg-cyan-500/10">
                Browse Compound Database
              </Button>
            </Link>
          </div>

          {/* Final Disclaimer */}
          <Alert className="max-w-3xl mx-auto border-cyan-500/20 bg-cyan-500/5 dark:border-cyan-800/50 dark:bg-cyan-950/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Important Legal Notice:</strong> Enhanced.AI is an educational platform providing information about health optimization concepts.
              We are not medical professionals and do not provide medical advice, diagnosis, or treatment. All content is for educational purposes only.
              Users should consult with qualified healthcare providers before making any changes to their health regimen or starting any supplementation program.
              Individual results may vary significantly, and responses to any interventions cannot be guaranteed.
            </AlertDescription>
          </Alert>

          <div className="mt-8 text-sm text-muted-foreground">
            <p>© 2025 Enhanced AI. Educational information only. Not medical advice.</p>
          </div>
        </div>
      </section>
    </div>
    </ThemeProvider>
  )
}