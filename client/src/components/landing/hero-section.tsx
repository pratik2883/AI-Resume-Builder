import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Users, CheckCircle2 } from "lucide-react";

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-white">
      {/* Background gradient blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-96 left-72 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">AI-Powered Resume Builder</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl leading-tight">
              <span className="block">Build your</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                perfect resume
              </span>
              <span className="block">with AI</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl leading-relaxed">
              Create professional resumes in minutes with our AI-powered platform. Stand out from the crowd with tailored content and stylish templates.
            </p>
            
            {/* Feature highlights */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                <span className="ml-2 text-gray-700">AI-generated content</span>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                <span className="ml-2 text-gray-700">Professional templates</span>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                <span className="ml-2 text-gray-700">PDF export</span>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                <span className="ml-2 text-gray-700">Collaborative editing</span>
              </div>
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white px-8" asChild>
                <Link href={user ? "/dashboard" : "/auth"}>
                  <FileText className="h-5 w-5 mr-2" />
                  Create Your Resume
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-2" asChild>
                <a href="#demo">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Try AI Demo
                </a>
              </Button>
            </div>
            
            {/* Social proof */}
            <div className="mt-10">
              <p className="text-sm font-medium text-gray-500 mb-2">Trusted by thousands of job seekers</p>
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="ml-3 flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-500">Join 10,000+ users</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Main image with decorative elements */}
            <div className="relative z-10 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 rotate-1 transform transition-transform hover:rotate-0 duration-300">
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-gray-100 to-gray-50 flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
                alt="Resume preview" 
                className="w-full object-cover rounded-b-lg mt-10"
              />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-20 -right-6 bg-yellow-100 p-4 rounded-lg shadow-md z-20 rotate-3 transform transition-transform hover:rotate-0 duration-300">
              <div className="text-sm font-medium text-gray-800">AI Generated ✨</div>
              <div className="text-xs text-gray-500">Professional content</div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-blue-100 p-4 rounded-lg shadow-md z-20 -rotate-3 transform transition-transform hover:rotate-0 duration-300">
              <div className="text-sm font-medium text-gray-800">ATS Friendly</div>
              <div className="text-xs text-gray-500">Optimized for job applications</div>
            </div>
            
            {/* Background decorative patterns */}
            <div className="absolute top-1/4 -right-16 w-32 h-32 bg-primary/5 rounded-full"></div>
            <div className="absolute bottom-1/4 -left-16 w-32 h-32 bg-blue-100/50 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
