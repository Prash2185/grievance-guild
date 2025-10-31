import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const SubmitGrievance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const subcategoriesByCategory: Record<string, string[]> = {
    Academic: ["Teaching Quality", "Syllabus", "Time-Table Clash", "Lab/Equipment"],
    Facility: ["Classroom Infrastructure", "WiFi", "Water Supply", "Restrooms", "Canteen", "Hostel", "Library", "Parking"],
    Examination: ["Marks Related", "Exam Scheduling", "Exam Not Given", "Results Delay", "Invigilation/Conduct"],
    Placement: ["Eligibility Issues", "Company Opportunity", "Documentation", "Placement Cell Support", "Interview Process"],
    Harassment: ["Workplace Harassment", "Student Harassment", "Discrimination", "Bullying", "Inappropriate Behavior"],
    Other: ["Other"],
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formDataObj = new FormData(form);
    
    const title = formDataObj.get("title") as string;
    const description = formDataObj.get("description") as string;
    
    // Collect category-specific details
    const details: any = { subcategory };
    
    // Add all other form fields to details
    for (let [key, value] of formDataObj.entries()) {
      if (key !== "title" && key !== "description") {
        details[key] = value;
      }
    }

    try {
      const { data, error } = await supabase
        .from("grievances")
        .insert({
          submitted_by: user?.id,
          title,
          description,
          category,
          subcategory,
          status: "Submitted",
          details,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Grievance submitted successfully!",
        description: `Your grievance ID is ${data.grievance_id}. You can track its status in your dashboard.`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error submitting grievance",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Submit New Grievance</h1>
          <p className="text-sm text-muted-foreground">Fill out the form below to submit your grievance</p>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Grievance Details</CardTitle>
            <CardDescription>
              Please provide detailed information about your grievance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Grievance Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(val) => { setCategory(val); setSubcategory(""); }} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Facility">Facility</SelectItem>
                    <SelectItem value="Examination">Examination</SelectItem>
                    <SelectItem value="Placement">Placement</SelectItem>
                    <SelectItem value="Harassment">Harassment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              {category && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory *</Label>
                  <Select value={subcategory} onValueChange={setSubcategory} required>
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoriesByCategory[category]?.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dynamic Fields Based on Subcategory */}
              {category === "Facility" && subcategory === "WiFi" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="building">Building *</Label>
                    <Input id="building" name="building" placeholder="e.g., Main Block" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor *</Label>
                    <Input id="floor" name="floor" placeholder="e.g., 2nd Floor" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Specific Location *</Label>
                    <Input id="location" name="location" placeholder="e.g., Lab 1, Room 304" required />
                  </div>
                </>
              )}

              {category === "Academic" && subcategory === "Teaching Quality" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subjectName">Subject Name *</Label>
                    <Input id="subjectName" name="subjectName" placeholder="e.g., Data Structures" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facultyName">Faculty Name *</Label>
                    <Input id="facultyName" name="facultyName" placeholder="Faculty name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issueType">Issue Type *</Label>
                    <Select required>
                      <SelectTrigger id="issueType">
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pace">Pace of teaching</SelectItem>
                        <SelectItem value="methodology">Methodology</SelectItem>
                        <SelectItem value="doubts">Doubt clarification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {category === "Examination" && subcategory === "Marks Related" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input id="subject" name="subject" placeholder="Subject name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code *</Label>
                    <Input id="courseCode" name="courseCode" placeholder="e.g., CS101" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examName">Exam Name *</Label>
                    <Input id="examName" name="examName" placeholder="e.g., Mid-Term 1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examIssueType">Issue Type *</Label>
                    <Select required>
                      <SelectTrigger id="examIssueType">
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error-total">Error in total</SelectItem>
                        <SelectItem value="not-graded">Question not graded</SelectItem>
                        <SelectItem value="wrong-marks">Wrong marks awarded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Please provide a detailed description of your grievance..."
                  rows={6}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting || !category || !subcategory}>
                  {isSubmitting ? "Submitting..." : "Submit Grievance"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubmitGrievance;
