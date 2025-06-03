import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 3D Layered Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to opacity-10 transform translate-z-0" />
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary-gradient-from to-secondary-gradient-to opacity-10 transform translate-z-20 rotate-12" />
        <div className="absolute inset-0 bg-gradient-to-bl from-primary-gradient-from/50 to-transparent opacity-10 transform -translate-z-10 -rotate-6" />
      </div>
      
      {/* Hero Content */}
      <div className="container relative pt-32 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="animate-fade-up bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
            Track Your Bites, Own Your Health
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            MealMatrix helps you track your nutrition journey with a beautiful, intuitive interface.
            Monitor calories, visualize trends, and achieve your health goals.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary-gradient-from to-primary-gradient-to hover:opacity-90">
              <Link href="/auth/signup">
                Get Started
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">
                Login
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Easy Tracking',
              description: 'Log your meals quickly and effortlessly with our intuitive interface.',
            },
            {
              title: 'Visual Insights',
              description: 'See your progress with beautiful charts and actionable insights.',
            },
            {
              title: 'Smart Goals',
              description: 'Set and track nutrition goals that adapt to your lifestyle.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-gradient-from/10 to-primary-gradient-to/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
