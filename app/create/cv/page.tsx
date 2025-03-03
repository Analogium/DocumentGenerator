"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Download, Plus, Trash2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { saveDocument, getUserDocuments } from "@/lib/supabase";
import { generateCVPDF } from "@/lib/pdf-generator";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function CVPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("id");
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  
  const [cvData, setCvData] = useState({
    personal: {
      name: "",
      title: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      summary: "",
    },
    experience: [
      { 
        company: "", 
        position: "", 
        startDate: "", 
        endDate: "", 
        current: false,
        description: "" 
      }
    ],
    education: [
      { 
        institution: "", 
        degree: "", 
        field: "", 
        startDate: "", 
        endDate: "", 
        description: "" 
      }
    ],
    skills: [""],
    languages: [""],
  });

  useEffect(() => {
  }
  )
}