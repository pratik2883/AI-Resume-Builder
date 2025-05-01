import {
  Zap,
  LayoutTemplate,
  PlusCircle,
  Download,
  FolderPlus,
  ShieldCheck,
  Users,
  Brain,
  CheckCheck,
} from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <Brain className="h-6 w-6 text-white" />,
      title: "AI-Powered Content Generation",
      description:
        "Let our advanced AI suggest professional content for your resume based on your background and industry standards.",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: <LayoutTemplate className="h-6 w-6 text-white" />,
      title: "Professional Templates",
      description:
        "Choose from a variety of professionally designed templates that are optimized for ATS systems.",
      color: "from-purple-500 to-purple-700",
    },
    {
      icon: <PlusCircle className="h-6 w-6 text-white" />,
      title: "Customizable Sections",
      description:
        "Add, remove, and rearrange sections to highlight your most relevant experiences and skills.",
      color: "from-green-500 to-green-700",
    },
    {
      icon: <Download className="h-6 w-6 text-white" />,
      title: "One-Click PDF Download",
      description:
        "Export your finished resume as a professional PDF ready to be sent to employers.",
      color: "from-rose-500 to-rose-700",
    },
    {
      icon: <Users className="h-6 w-6 text-white" />,
      title: "Collaborative Editing",
      description:
        "Work together with mentors or colleagues to perfect your resume with real-time collaborative editing.",
      color: "from-amber-500 to-amber-700",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-white" />,
      title: "Privacy Guaranteed",
      description:
        "Your data is securely stored and never shared with third parties.",
      color: "from-cyan-500 to-cyan-700",
    },
  ];

  return (
    <div id="features" className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-primary/[0.03] bg-[length:30px_30px]"></div>
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Zap className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Everything you need to create<br />the perfect resume
          </h2>
          <p className="mt-6 max-w-2xl text-xl text-gray-600 mx-auto">
            Our platform offers all the tools you need to craft, customize, and download professional resumes that stand out.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div className="relative group" key={index}>
                {/* Hover effect background */}
                <div className="absolute -inset-4 rounded-xl bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative">
                  <div>
                    <span className={`inline-flex items-center justify-center p-3 rounded-xl shadow-lg bg-gradient-to-br ${feature.color} transform transition-transform group-hover:scale-110 duration-300`}>
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Stats section */}
        <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center transform transition hover:scale-105 duration-300">
            <div className="text-4xl font-bold text-primary">10,000+</div>
            <div className="mt-2 text-gray-600">Resumes Created</div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center transform transition hover:scale-105 duration-300">
            <div className="text-4xl font-bold text-primary">150+</div>
            <div className="mt-2 text-gray-600">Countries</div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center transform transition hover:scale-105 duration-300">
            <div className="text-4xl font-bold text-primary">96%</div>
            <div className="mt-2 text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center transform transition hover:scale-105 duration-300">
            <div className="text-4xl font-bold text-primary">24/7</div>
            <div className="mt-2 text-gray-600">Customer Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
