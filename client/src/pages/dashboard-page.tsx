import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/layouts/main-layout";
import ResumeForm from "@/components/resume/resume-form";
import ResumePreview from "@/components/resume/resume-preview";
import SavedResumes from "@/components/resume/saved-resumes";
import AiPromptBar from "@/components/resume/ai-prompt-bar";
import { CollaborationPanel } from "@/components/resume/collaboration-panel";
import { ResumeContent, EducationItem, ExperienceItem, SkillItem, ProjectItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Default empty resume
const defaultResumeContent: ResumeContent = {
  personalInfo: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    title: "",
    summary: "",
  },
  education: [],
  experience: [],
  skills: [],
  projects: [],
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("resume-builder");
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [resumeContent, setResumeContent] = useState<ResumeContent>(defaultResumeContent);
  const [resumeName, setResumeName] = useState<string>("My Resume");
  const [currentResumeId, setCurrentResumeId] = useState<number | null>(null);

  // AI generation mutation
  const generateWithAiMutation = useMutation({
    mutationFn: async ({ prompt, type }: { prompt: string; type: string }) => {
      const res = await apiRequest("POST", "/api/ai/generate", { prompt, type });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data && data.content) {
        setResumeContent(data.content);
        toast({
          title: "Resume generated",
          description: "AI-generated resume content has been loaded from your prompt.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check for saved prompt from landing page on component mount and generate content
  useEffect(() => {
    const storedPrompt = sessionStorage.getItem('resumePrompt');
    if (storedPrompt) {
      // Clear it after retrieval so it doesn't persist on page refresh
      sessionStorage.removeItem('resumePrompt');
      
      // Auto-generate resume with the saved prompt
      toast({
        title: "Generating Resume",
        description: "Creating a resume based on the information you provided.",
      });
      
      generateWithAiMutation.mutate({
        prompt: storedPrompt,
        type: "complete"
      });
    }
  }, [toast, generateWithAiMutation]);

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates"],
    staleTime: Infinity,
  });

  // Update resume content
  const updateResumeContent = (sectionName: keyof ResumeContent, data: any) => {
    setResumeContent((prev) => ({
      ...prev,
      [sectionName]: data,
    }));
  };

  // Add item to an array section
  const addItem = (
    section: "education" | "experience" | "skills" | "projects",
    item: EducationItem | ExperienceItem | SkillItem | ProjectItem
  ) => {
    setResumeContent((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), { ...item, id: crypto.randomUUID() }],
    }));
  };

  // Remove item from an array section
  const removeItem = (
    section: "education" | "experience" | "skills" | "projects",
    itemId: string
  ) => {
    setResumeContent((prev) => ({
      ...prev,
      [section]: prev[section]?.filter((item: any) => item.id !== itemId) || [],
    }));
  };

  // Handle editing an item
  const updateItem = (
    section: "education" | "experience" | "skills" | "projects",
    itemId: string,
    updatedItem: any
  ) => {
    setResumeContent((prev) => ({
      ...prev,
      [section]: prev[section]?.map((item: any) => 
        item.id === itemId ? { ...updatedItem, id: itemId } : item
      ) || [],
    }));
  };

  // Load a resume
  const loadResume = (resumeData: any) => {
    setCurrentResumeId(resumeData.id);
    setResumeName(resumeData.name);
    setSelectedTemplate(resumeData.templateId);
    setResumeContent(resumeData.content);
    setActiveTab("resume-builder");
    toast({
      title: "Resume loaded",
      description: `${resumeData.name} has been loaded for editing.`,
    });
  };

  // Create a new resume
  const createNewResume = () => {
    setCurrentResumeId(null);
    setResumeName("My Resume");
    setSelectedTemplate(1);
    setResumeContent(defaultResumeContent);
    setActiveTab("resume-builder");
    toast({
      title: "New resume created",
      description: "Start building your new resume.",
    });
  };

  if (templatesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>Dashboard - AI Resume Builder</title>
      </Helmet>
      
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="resume-builder">Resume Builder</TabsTrigger>
                  <TabsTrigger value="saved-resumes">My Resumes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="resume-builder">
                  <div className="mb-6">
                    <AiPromptBar 
                      onGenerateContent={(content) => {
                        if (typeof content === 'string') {
                          // Handle single text content (like summary)
                          toast({
                            title: "Content generated",
                            description: "AI-generated content has been added.",
                          });
                        } else {
                          // Handle full resume
                          setResumeContent(content);
                          toast({
                            title: "Resume generated",
                            description: "AI-generated resume content has been loaded.",
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-2/3">
                      <ResumeForm 
                        resumeName={resumeName}
                        setResumeName={setResumeName}
                        resumeContent={resumeContent}
                        updateResumeContent={updateResumeContent}
                        addItem={addItem}
                        removeItem={removeItem}
                        updateItem={updateItem}
                      />
                    </div>
                    
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                      <ResumePreview
                        resumeContent={resumeContent}
                        selectedTemplate={selectedTemplate}
                        setSelectedTemplate={setSelectedTemplate}
                        templates={templates}
                        resumeName={resumeName}
                        resumeId={currentResumeId}
                      />
                      
                      {/* Show collaboration panel only when working on a saved resume */}
                      {currentResumeId && (
                        <div>
                          <h3 className="text-lg font-medium mb-4 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Collaborative Editing
                          </h3>
                          <CollaborationPanel resumeId={currentResumeId} />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="saved-resumes">
                  <SavedResumes 
                    onLoadResume={loadResume} 
                    onCreateNewResume={createNewResume}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
