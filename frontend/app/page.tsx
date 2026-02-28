import Link from "next/link";
import { cookies } from "next/headers";
import {
  MapPin,
  Clock,
  Shield,
  Star,
  CreditCard,
  Car,
  ChevronRight,
  Phone,
  Zap,
  Globe,
  Award,
  Heart,
  Leaf,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Auto-assign nearest driver with AI-powered matching in under 30 seconds.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Leaf,
    title: "Eco-Friendly Rides",
    description: "Track your carbon footprint and earn rewards for choosing green options.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Safe & Verified",
    description: "Real-time SOS, emergency contacts, and 24/7 safety monitoring.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Star,
    title: "Premium Experience",
    description: "Customize music, temperature, and conversation preferences for every ride.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "Favorite Routes",
    description: "Save frequent destinations for one-click booking with your preferences.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Award,
    title: "Gamification",
    description: "Earn achievements, unlock badges, and compete on leaderboards.",
    gradient: "from-amber-500 to-yellow-500",
  },
];

const steps = [
  { 
    step: "01", 
    title: "Set Your Destination", 
    desc: "Type where you want to go or choose from your favorite routes.",
    icon: MapPin,
  },
  { 
    step: "02", 
    title: "Choose Your Ride", 
    desc: "Select from Economy, Premium, SUV, or Eco-friendly options.",
    icon: Car,
  },
  { 
    step: "03", 
    title: "Instant Match", 
    desc: "Our AI finds and assigns the nearest driver automatically.",
    icon: Zap,
  },
  { 
    step: "04", 
    title: "Track & Enjoy", 
    desc: "Live tracking, safe arrival, and seamless payment.",
    icon: TrendingUp,
  },
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get("auth_token")?.value);
  return (
    <div className="min-h-screen bg-cyber-dark-900 overflow-x-hidden">
      {/* ── Enhanced Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cyber-dark-900/80 backdrop-blur-2xl border-b border-cyber-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple-500 to-cyber-green-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 rounded-xl flex items-center justify-center shadow-xl">
                <Car className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold font-orbitron bg-gradient-to-r from-cyber-purple-400 via-cyber-pink-400 to-cyber-green-400 bg-clip-text text-transparent">
                RideSwift
              </span>
              <p className="text-xs text-cyber-green-400 font-medium">Next-Gen Mobility</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-primary !py-3 !px-6 text-sm relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Dashboard
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-green-500 to-cyber-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/sign-in" 
                  className="text-cyber-purple-300 hover:text-cyber-green-400 transition-all duration-300 font-semibold text-sm relative group"
                >
                  Sign In
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyber-green-400 group-hover:w-full transition-all duration-300" />
                </Link>
                <Link href="/sign-up" className="btn-primary !py-3 !px-6 text-sm relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-1">
                    Get Started
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section with Enhanced Visuals ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-dark-900 via-cyber-purple-900/20 to-cyber-dark-900" />
        
        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 -left-40 w-80 h-80 bg-cyber-purple-500/40 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyber-green-500/30 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyber-pink-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyber-green-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
        
        {/* Enhanced Grid Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(123,63,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(123,63,242,0.05)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,159,0.1),transparent_50%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          {/* Floating Badge */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyber-purple-500/20 to-cyber-green-500/20 backdrop-blur-xl border border-cyber-purple-400/30 px-6 py-3 rounded-full mb-8 shadow-2xl animate-fade-in">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-green-400 shadow-neon-green" />
            </span>
            <span className="text-white font-semibold text-sm">Live in 50+ Cities • 24/7 Available</span>
            <Sparkles className="w-4 h-4 text-cyber-green-400" />
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-extrabold font-orbitron mb-8 leading-tight animate-fade-in-up">
            <span className="inline-block bg-gradient-to-r from-white via-cyber-purple-200 to-white bg-clip-text text-transparent drop-shadow-2xl">
              The Future of
            </span>
            <br />
            <span className="inline-block bg-gradient-to-r from-cyber-purple-400 via-cyber-pink-500 to-cyber-green-400 bg-clip-text text-transparent animate-gradient-x drop-shadow-[0_0_50px_rgba(123,63,242,0.5)]">
              Smart Mobility
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed font-light animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            AI-powered ride matching • Eco-friendly options • Personalized experiences
            <br />
            <span className="text-cyber-green-400">Join the revolution in urban transportation</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link 
              href="/sign-up" 
              className="group relative px-10 py-5 text-lg font-bold font-orbitron overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 animate-gradient-x" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple-600 via-cyber-pink-600 to-cyber-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-3 text-white drop-shadow-lg">
                <Zap className="w-5 h-5" />
                Book Your First Ride
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link
              href="/sign-up?role=driver"
              className="group px-10 py-5 text-lg font-bold font-orbitron border-2 border-cyber-green-500 text-cyber-green-400 rounded-2xl hover:bg-cyber-green-500/10 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,159,0.4)]"
            >
              <span className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                Drive & Earn
              </span>
            </Link>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {[
              { value: "150K+", label: "Active Riders", icon: Users, color: "cyber-purple" },
              { value: "12K+", label: "Pro Drivers", icon: Car, color: "cyber-pink" },
              { value: "4.95★", label: "Avg Rating", icon: Star, color: "cyber-green" },
            ].map(({ value, label, icon: Icon, color }) => (
              <div key={label} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-dark-800/50 to-cyber-dark-900/50 backdrop-blur-xl rounded-2xl border border-cyber-purple-500/20 group-hover:border-cyber-purple-500/50 transition-all" />
                <div className="relative p-6">
                  <Icon className={`w-8 h-8 text-${color}-400 mx-auto mb-3 group-hover:scale-110 transition-transform`} />
                  <div className={`text-4xl font-bold font-orbitron text-${color}-400 drop-shadow-[0_0_20px_rgba(0,255,159,0.4)] mb-1`}>
                    {value}
                  </div>
                  <div className="text-cyber-purple-400 text-sm font-medium">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-cyber-purple-400/50 rounded-full p-1">
              <div className="w-1.5 h-3 bg-cyber-green-400 rounded-full mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section with Cards ── */}
      <section className="relative py-32 bg-gradient-to-b from-cyber-dark-900 via-cyber-dark-800 to-cyber-dark-900">
        {/* Ambient Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-green-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyber-purple-500/20 to-cyber-green-500/20 backdrop-blur-xl border border-cyber-purple-400/30 px-6 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-cyber-green-400" />
              <span className="text-white font-semibold">Unique Features</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold font-orbitron mb-6 bg-gradient-to-r from-white via-cyber-purple-200 to-cyber-green-200 bg-clip-text text-transparent">
              Why Choose RideSwift?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Experience the next generation of ride-sharing with features you won't find anywhere else
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description, gradient }, idx) => (
              <div
                key={title}
                className="group relative"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyber-purple-500 to-cyber-green-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
                
                {/* Card */}
                <div className="relative h-full bg-gradient-to-br from-cyber-dark-800/90 to-cyber-dark-900/90 backdrop-blur-xl border border-cyber-purple-500/20 rounded-2xl p-8 hover:border-cyber-purple-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity`} />
                    <div className={`relative w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold font-orbitron mb-4 text-white group-hover:text-cyber-green-300 transition-colors">
                    {title}
                  </h3>
                  <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors">
                    {description}
                  </p>

                  {/* Hover Arrow */}
                  <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-cyber-green-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA Below Features */}
          <div className="text-center mt-16">
            <Link 
              href="/sign-up" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 text-white font-bold font-orbitron rounded-xl hover:shadow-[0_0_40px_rgba(123,63,242,0.6)] transition-all duration-300 hover:scale-105"
            >
              <Globe className="w-5 h-5" />
              Explore All Features
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works with Timeline ── */}
      <section className="relative py-32 bg-cyber-dark-900">
        {/* Animated Grid Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,159,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,159,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyber-green-500/20 to-cyber-purple-500/20 backdrop-blur-xl border border-cyber-green-400/30 px-6 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-cyber-green-400" />
              <span className="text-white font-semibold">Simple & Fast</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold font-orbitron mb-6 bg-gradient-to-r from-cyber-green-400 via-cyber-purple-400 to-cyber-pink-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              From booking to destination in just four simple steps
            </p>
          </div>

          {/* Timeline Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting Line (hidden on mobile) */}
            <div className="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 opacity-30" />

            {steps.map(({ step, title, desc, icon: Icon }, idx) => (
              <div 
                key={step} 
                className="relative group"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                {/* Step Card */}
                <div className="relative">
                  {/* Glow */}
                  <div className="absolute -inset-2 bg-gradient-to-br from-cyber-purple-500 to-cyber-green-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500" />
                  
                  {/* Card Content */}
                  <div className="relative bg-gradient-to-br from-cyber-dark-800 to-cyber-dark-900 border border-cyber-purple-500/30 rounded-3xl p-8 text-center hover:border-cyber-purple-400/70 transition-all duration-500 hover:scale-105">
                    {/* Step Number Badge */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple-500 to-cyber-green-500 rounded-2xl blur-lg opacity-75" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 rounded-2xl flex items-center justify-center font-bold font-orbitron text-white text-lg shadow-xl">
                          {step}
                        </div>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="mt-8 mb-6 flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-cyber-green-400/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-20 h-20 bg-gradient-to-br from-cyber-dark-700 to-cyber-dark-800 rounded-full flex items-center justify-center border-2 border-cyber-purple-400/40 group-hover:border-cyber-green-400 transition-all duration-300">
                          <Icon className="w-10 h-10 text-cyber-green-400 group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Text */}
                    <h3 className="text-xl font-bold font-orbitron mb-4 text-white group-hover:text-cyber-green-300 transition-colors">
                      {title}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Arrow (hidden on last item and mobile) */}
                {idx < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 text-cyber-purple-400/50 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enhanced CTA Section ── */}
      <section className="relative py-32 overflow-hidden">
        {/* Gradient Background with Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple-600 via-cyber-pink-500 to-cyber-green-500 animate-gradient-x" />
        
        {/* Overlay Patterns */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float" />
          <div className="absolute top-1/3 right-1/3 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-delayed" />
          <div className="absolute bottom-1/3 left-1/2 w-36 h-36 bg-white/10 rounded-full blur-2xl animate-pulse" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-xl border border-white/30 px-8 py-3 rounded-full mb-8 shadow-2xl">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <span className="text-white font-bold">Limited Offer • First 3 Rides Free</span>
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>

          {/* Headline */}
          <h2 className="text-5xl md:text-7xl font-extrabold font-orbitron mb-6 text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] leading-tight">
            Ready for the
            <br />
            <span className="inline-block animate-pulse">Smartest Ride?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto drop-shadow-[0_0_20px_rgba(0,0,0,0.3)] leading-relaxed">
            Join over 150,000 riders who've made the switch to intelligent, eco-friendly, personalized transportation
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/sign-up" 
              className="group relative px-12 py-5 bg-white text-cyber-purple-600 font-bold font-orbitron text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_50px_rgba(255,255,255,0.8)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Zap className="w-6 h-6" />
                Start Your Journey
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link 
              href="/sign-up?role=driver" 
              className="group px-12 py-5 bg-transparent border-3 border-white text-white font-bold font-orbitron text-lg rounded-2xl backdrop-blur-xl transition-all duration-300 hover:bg-white hover:text-cyber-purple-600 hover:scale-110 hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]"
            >
              <span className="flex items-center gap-3">
                <Car className="w-6 h-6" />
                Drive with Us
              </span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span className="text-sm font-medium">4.95★ Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">150K+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              <span className="text-sm font-medium">Eco-Friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Premium Footer ── */}
      <footer className="relative bg-gradient-to-b from-cyber-dark-900 via-cyber-dark-800 to-cyber-dark-900 text-cyber-purple-300 border-t border-cyber-purple-500/20">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-green-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple-500 to-cyber-green-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 rounded-xl flex items-center justify-center shadow-xl">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold font-orbitron bg-gradient-to-r from-cyber-purple-400 via-cyber-pink-400 to-cyber-green-400 bg-clip-text text-transparent">
                    RideSwift
                  </span>
                  <p className="text-xs text-cyber-green-400 font-medium">Next-Gen Mobility</p>
                </div>
              </Link>
              
              <p className="text-cyber-purple-300 mb-6 leading-relaxed max-w-sm">
                Revolutionizing urban transportation with AI-powered matching, eco-friendly rides, and personalized experiences.
              </p>

              {/* Social Links */}
              <div className="flex gap-4">
                {["Twitter", "Facebook", "Instagram", "LinkedIn"].map((social) => (
                  <Link
                    key={social}
                    href="#"
                    className="w-10 h-10 bg-cyber-dark-700/50 backdrop-blur-xl border border-cyber-purple-500/20 rounded-lg flex items-center justify-center hover:border-cyber-green-400 hover:bg-cyber-green-500/10 transition-all duration-300 group"
                  >
                    <Globe className="w-5 h-5 text-cyber-purple-400 group-hover:text-cyber-green-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            {[
              { title: "For Riders", links: ["Book a Ride", "Ride History", "Fare Calculator", "Promotions", "Safety Center"] },
              { title: "For Drivers", links: ["Become a Driver", "Earnings", "Requirements", "Driver Resources", "Support"] },
              { title: "Company", links: ["About Us", "Careers", "Press Kit", "Blog", "Contact"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-bold font-orbitron mb-6 text-lg">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <Link 
                        href="#" 
                        className="text-cyber-purple-300 hover:text-cyber-green-400 transition-colors duration-300 text-sm flex items-center gap-2 group"
                      >
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all duration-300" />
                        <span>{link}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-cyber-purple-500/20 mb-8" />

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6 text-sm text-cyber-purple-400">
              <p>&copy; {new Date().getFullYear()} RideSwift Inc. All rights reserved.</p>
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <Link key={item} href="#" className="hover:text-cyber-green-400 transition-colors">
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-cyber-purple-500/20 to-cyber-green-500/20 backdrop-blur-xl border border-cyber-purple-400/30 px-4 py-2 rounded-full">
                <Phone className="w-4 h-4 text-cyber-green-400" />
                <span className="text-cyber-green-400 font-semibold text-sm">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-cyber-green-500/20 to-cyber-purple-500/20 backdrop-blur-xl border border-cyber-green-400/30 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-cyber-purple-400" />
                <span className="text-cyber-purple-400 font-semibold text-sm">50+ Cities</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
