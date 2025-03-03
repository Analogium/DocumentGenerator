"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Plus, Settings, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { getUserDocuments, getUserProfile, Document, Profile, updateProfile } from "@/lib/supabase";
import { generateInvoicePDF, generateQuotePDF, generateCVPDF, generateCoverLetterPDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DashboardPage() {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("documents");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const [userDocs, userProfile] = await Promise.all([
          getUserDocuments(user.id),
          getUserProfile(user.id)
        ]);
        
        setDocuments(userDocs);
        setProfile(userProfile);
        setFullName(user.user_metadata?.full_name || "");
      } catch (error: any) {
        toast({
          title: "Error loading data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserData();
  }, [user, toast]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get document icon based on type
  const getDocumentIcon = (type: string) => {
    return <FileText className="h-5 w-5" />;
  };
  
  const handleDownload = async (document: Document) => {
    try {
      let doc;
      
      switch (document.type) {
        case 'invoice':
          doc = generateInvoicePDF(document.content);
          break;
        case 'quote':
          doc = generateQuotePDF(document.content);
          break;
        case 'cv':
          doc = generateCVPDF(document.content);
          break;
        case 'cover-letter':
          doc = generateCoverLetterPDF(document.content);
          break;
        default:
          throw new Error("Unknown document type");
      }
      
      doc.save(`${document.name}.pdf`);
      
      toast({
        title: "Download Complete",
        description: "Your document has been downloaded as a PDF.",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "There was an error downloading your document.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Update user metadata
      await updateAuthProfile({ full_name: fullName });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Please Sign In</CardTitle>
              <CardDescription>
                You need to be signed in to view your dashboard.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </CardFooter>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Link href="/#document-types">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Document
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="documents">My Documents</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        {getDocumentIcon(doc.type)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{doc.name}</CardTitle>
                      <CardDescription>
                        {doc.type.charAt(0).toUpperCase() + doc.type.slice(1).replace('-', ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2">
                      <div className="flex justify-between w-full">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                        <Link href={`/create/${doc.type}?id=${doc.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No documents yet</h3>
                  <p className="text-muted-foreground mb-6">Create your first document to get started</p>
                  <Link href="/#document-types">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Document
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan: {profile?.subscription_tier === 'premium' ? 'Premium' : 'Free'}</CardTitle>
                <CardDescription>
                  {profile ? `You have used ${profile.documents_created_this_month} of ${profile.subscription_tier === 'premium' ? 'unlimited' : '3'} free documents this month.` : 'Loading subscription information...'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Documents created this month</span>
                    <span className="font-medium">{profile?.documents_created_this_month || 0}/{profile?.subscription_tier === 'premium' ? '∞' : '3'}</span>
                  </div>
                  {profile?.subscription_tier !== 'premium' && (
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${Math.min((profile?.documents_created_this_month || 0) / 3 * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {profile?.subscription_tier === 'premium' 
                      ? `Your premium plan renews on ${profile.subscription_renewal_date ? formatDate(profile.subscription_renewal_date) : 'N/A'}.`
                      : 'Your free plan resets on the 1st of each month.'}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                {profile?.subscription_tier !== 'premium' && (
                  <Link href="/pricing" className="w-full">
                    <Button className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" /> Upgrade Plan
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and personal information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email || ''} disabled />
                    </div>
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={handleUpdateProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                        </>
                      ) : (
                        <>
                          <Settings className="mr-2 h-4 w-4" /> Update Profile
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
}

function Label({ htmlFor, children }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">
      {children}
    </label>
  );
}

function Input({ ...props }) {
  return (
    <input
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
}