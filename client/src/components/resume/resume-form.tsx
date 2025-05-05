import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, Zap } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  personalInfoSchema,
  educationItemSchema,
  experienceItemSchema,
  skillItemSchema,
  projectItemSchema,
  ResumeContent,
} from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ResumeFormProps {
  resumeName: string;
  setResumeName: (name: string) => void;
  resumeContent: ResumeContent;
  updateResumeContent: (section: keyof ResumeContent, data: any) => void;
  addItem: (section: "education" | "experience" | "skills" | "projects", item: any) => void;
  removeItem: (section: "education" | "experience" | "skills" | "projects", itemId: string) => void;
  updateItem: (section: "education" | "experience" | "skills" | "projects", itemId: string, item: any) => void;
}

export default function ResumeForm({
  resumeName,
  setResumeName,
  resumeContent,
  updateResumeContent,
  addItem,
  removeItem,
  updateItem,
}: ResumeFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  
  // Education dialog states
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);
  const [currentEducationId, setCurrentEducationId] = useState<string | null>(null);
  
  // Experience dialog states
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [currentExperienceId, setCurrentExperienceId] = useState<string | null>(null);
  
  // Project dialog states
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  // Personal Info form
  const personalInfoForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: resumeContent.personalInfo,
  });

  // AI generation for resume sections
  const generateWithAiMutation = useMutation({
    mutationFn: async ({ prompt, type }: { prompt: string; type: string }) => {
      const res = await apiRequest("POST", "/api/ai/generate", { prompt, type });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content generated",
        description: "AI-generated content has been added.",
      });
      return data.content;
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle personal info form submission
  const onPersonalInfoSubmit = (data: z.infer<typeof personalInfoSchema>) => {
    updateResumeContent("personalInfo", data);
    toast({
      title: "Personal information updated",
      description: "Your personal details have been saved.",
    });
  };

  // Generate summary with AI
  const generateSummary = async () => {
    const { firstName, lastName, title } = personalInfoForm.getValues();
    if (!firstName || !lastName || !title) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and job title first.",
        variant: "destructive",
      });
      return;
    }

    const prompt = `Write a professional resume summary (2-3 sentences) for a ${title} named ${firstName} ${lastName}.`;
    
    try {
      const content = await generateWithAiMutation.mutateAsync({ prompt, type: "summary" });
      personalInfoForm.setValue("summary", content, { shouldDirty: true });
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  // Education form handlers
  const handleAddEducation = () => {
    setCurrentEducationId(null);
    setIsEducationDialogOpen(true);
  };

  const handleEditEducation = (educationId: string) => {
    setCurrentEducationId(educationId);
    setIsEducationDialogOpen(true);
  };

  // Experience form handlers
  const handleAddExperience = () => {
    setCurrentExperienceId(null);
    setIsExperienceDialogOpen(true);
  };

  const handleEditExperience = (experienceId: string) => {
    setCurrentExperienceId(experienceId);
    setIsExperienceDialogOpen(true);
  };

  // Skill form handler
  const handleAddSkill = () => {
    const skillName = window.prompt("Enter skill name:");
    if (skillName && skillName.trim()) {
      addItem("skills", { name: skillName.trim(), level: 0 });
    }
  };

  // Project form handlers
  const handleAddProject = () => {
    setCurrentProjectId(null);
    setIsProjectDialogOpen(true);
  };

  const handleEditProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setIsProjectDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Resume Builder</CardTitle>
        <Input 
          value={resumeName}
          onChange={(e) => setResumeName(e.target.value)}
          className="max-w-[200px] text-base font-normal"
          placeholder="Resume Name"
        />
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          
          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Form {...personalInfoForm}>
              <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={personalInfoForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalInfoForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={personalInfoForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personalInfoForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={personalInfoForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalInfoForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={personalInfoForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalInfoForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalInfoForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={personalInfoForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personalInfoForm.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Professional Summary</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={generateSummary}
                          disabled={generateWithAiMutation.isPending}
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          {generateWithAiMutation.isPending ? "Generating..." : "Generate with AI"}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="A brief summary of your professional background and career goals..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit">Save Personal Information</Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Education Tab */}
          <TabsContent value="education">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Education History</h3>
              <Button onClick={handleAddEducation}>
                <Plus className="mr-2 h-4 w-4" />
                Add Education
              </Button>
            </div>
            
            {resumeContent.education && resumeContent.education.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {resumeContent.education.map((education, index) => (
                  <AccordionItem value={education.id || `edu-${index}`} key={education.id || index}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{education.institution}</span>
                        <span className="text-sm text-muted-foreground">
                          {education.degree}{education.fieldOfStudy ? `, ${education.fieldOfStudy}` : ''}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Duration: </span>
                              {education.startDate} - {education.endDate}
                            </p>
                            {education.description && (
                              <p className="mt-2">{education.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEducation(education.id || '')}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeItem("education", education.id || '')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">No education history added yet.</p>
                <Button variant="link" onClick={handleAddEducation}>
                  Add your education
                </Button>
              </div>
            )}
            
            {/* Education Form Dialog */}
            <EducationFormDialog
              isOpen={isEducationDialogOpen}
              setIsOpen={setIsEducationDialogOpen}
              educationId={currentEducationId}
              education={currentEducationId
                ? resumeContent.education?.find(edu => edu.id === currentEducationId)
                : undefined}
              onSave={(educationData) => {
                if (currentEducationId) {
                  updateItem("education", currentEducationId, educationData);
                } else {
                  addItem("education", educationData);
                }
                setIsEducationDialogOpen(false);
              }}
            />
          </TabsContent>
          
          {/* Experience Tab */}
          <TabsContent value="experience">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Work Experience</h3>
              <Button onClick={handleAddExperience}>
                <Plus className="mr-2 h-4 w-4" />
                Add Experience
              </Button>
            </div>
            
            {resumeContent.experience && resumeContent.experience.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {resumeContent.experience.map((experience, index) => (
                  <AccordionItem value={experience.id || `exp-${index}`} key={experience.id || index}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{experience.position}</span>
                        <span className="text-sm text-muted-foreground">
                          {experience.company}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Duration: </span>
                              {experience.startDate} - {experience.current ? 'Present' : experience.endDate}
                            </p>
                            {experience.description && (
                              <p className="mt-2">{experience.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditExperience(experience.id || '')}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeItem("experience", experience.id || '')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">No work experience added yet.</p>
                <Button variant="link" onClick={handleAddExperience}>
                  Add your work experience
                </Button>
              </div>
            )}
            
            {/* Experience Form Dialog */}
            <ExperienceFormDialog
              isOpen={isExperienceDialogOpen}
              setIsOpen={setIsExperienceDialogOpen}
              experienceId={currentExperienceId}
              experience={currentExperienceId
                ? resumeContent.experience?.find(exp => exp.id === currentExperienceId)
                : undefined}
              onSave={(experienceData) => {
                if (currentExperienceId) {
                  updateItem("experience", currentExperienceId, experienceData);
                } else {
                  addItem("experience", experienceData);
                }
                setIsExperienceDialogOpen(false);
              }}
            />
          </TabsContent>
          
          {/* Skills Tab */}
          <TabsContent value="skills">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Skills</h3>
              <Button onClick={handleAddSkill}>
                <Plus className="mr-2 h-4 w-4" />
                Add Skill
              </Button>
            </div>
            
            {resumeContent.skills && resumeContent.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resumeContent.skills.map((skill, index) => (
                  <Badge
                    key={skill.id || `skill-${index}`}
                    className="px-3 py-1 text-sm cursor-default flex items-center gap-2"
                    variant="secondary"
                  >
                    {skill.name}
                    <Trash2
                      className="h-3 w-3 cursor-pointer text-red-500 hover:text-red-700"
                      onClick={() => removeItem("skills", skill.id || '')}
                    />
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">No skills added yet.</p>
                <Button variant="link" onClick={handleAddSkill}>
                  Add your skills
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Projects</h3>
              <Button onClick={handleAddProject}>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </div>
            
            {resumeContent.projects && resumeContent.projects.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {resumeContent.projects.map((project, index) => (
                  <AccordionItem value={project.id || `proj-${index}`} key={project.id || index}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{project.name}</span>
                        {project.url && (
                          <span className="text-sm text-muted-foreground truncate max-w-md">
                            {project.url}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between">
                          <div>
                            {project.startDate && (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Duration: </span>
                                {project.startDate} - {project.endDate}
                              </p>
                            )}
                            {project.description && (
                              <p className="mt-2">{project.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProject(project.id || '')}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeItem("projects", project.id || '')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">No projects added yet.</p>
                <Button variant="link" onClick={handleAddProject}>
                  Add your projects
                </Button>
              </div>
            )}
            
            {/* Project Form Dialog */}
            <ProjectFormDialog
              isOpen={isProjectDialogOpen}
              setIsOpen={setIsProjectDialogOpen}
              projectId={currentProjectId}
              project={currentProjectId
                ? resumeContent.projects?.find(proj => proj.id === currentProjectId)
                : undefined}
              onSave={(projectData) => {
                if (currentProjectId) {
                  updateItem("projects", currentProjectId, projectData);
                } else {
                  addItem("projects", projectData);
                }
                setIsProjectDialogOpen(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Education Form Dialog
interface EducationFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  educationId: string | null;
  education?: any;
  onSave: (educationData: any) => void;
}

function EducationFormDialog({
  isOpen,
  setIsOpen,
  educationId,
  education,
  onSave,
}: EducationFormDialogProps) {
  const isEditing = !!educationId;
  
  const form = useForm<z.infer<typeof educationItemSchema>>({
    resolver: zodResolver(educationItemSchema),
    defaultValues: education || {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof educationItemSchema>) => {
    onSave(data);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Education" : "Add Education"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your education details"
              : "Add a new education entry to your resume"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input placeholder="University or School Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bachelor of Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fieldOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sep 2018" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jun 2022" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Relevant coursework, achievements, etc." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Experience Form Dialog
interface ExperienceFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  experienceId: string | null;
  experience?: any;
  onSave: (experienceData: any) => void;
}

function ExperienceFormDialog({
  isOpen,
  setIsOpen,
  experienceId,
  experience,
  onSave,
}: ExperienceFormDialogProps) {
  const isEditing = !!experienceId;
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof experienceItemSchema>>({
    resolver: zodResolver(experienceItemSchema),
    defaultValues: experience || {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    },
  });

  const watchCurrent = form.watch("current");

  const handleSubmit = (data: z.infer<typeof experienceItemSchema>) => {
    onSave(data);
    form.reset();
  };

  // Generate job description with AI
  const generateDescription = async () => {
    const { company, position } = form.getValues();
    if (!company || !position) {
      toast({
        title: "Missing information",
        description: "Please fill in the company and position first.",
        variant: "destructive",
      });
      return;
    }

    const prompt = `Write 3-4 bullet points describing job responsibilities and achievements for a ${position} at ${company}.`;
    
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          type: "experience",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      form.setValue("description", data.content, { shouldDirty: true });
      
      toast({
        title: "Description generated",
        description: "AI-generated job description has been added.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Experience" : "Add Experience"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your work experience details"
              : "Add a new work experience entry to your resume"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Job Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jan 2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={watchCurrent ? "Present" : "e.g. Mar 2023"} 
                        disabled={watchCurrent}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="current"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Current Position</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check if you are currently working at this company
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Description</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Generate with AI
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your responsibilities and achievements..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Project Form Dialog
interface ProjectFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectId: string | null;
  project?: any;
  onSave: (projectData: any) => void;
}

function ProjectFormDialog({
  isOpen,
  setIsOpen,
  projectId,
  project,
  onSave,
}: ProjectFormDialogProps) {
  const isEditing = !!projectId;
  
  const form = useForm<z.infer<typeof projectItemSchema>>({
    resolver: zodResolver(projectItemSchema),
    defaultValues: project || {
      name: "",
      description: "",
      url: "",
      startDate: "",
      endDate: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof projectItemSchema>) => {
    onSave(data);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "Add Project"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your project details"
              : "Add a new project to your resume"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jan 2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mar 2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the project, technologies used, your role, etc."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
