import { createClient } from '@supabase/supabase-js';

// Get the environment variables
const supabaseUrl = '';
const supabaseAnonKey = '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Document = {
  id: string;
  user_id: string;
  name: string;
  type: 'invoice' | 'quote' | 'cv' | 'cover-letter';
  content: any;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'premium' | 'payg';
  documents_created_this_month: number;
  subscription_renewal_date?: string;
};

// Helper functions for database operations
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data as Profile;
}

export async function getUserDocuments(userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Document[];
}

export async function saveDocument(userId: string, document: Omit<Document, 'id' | 'user_id' | 'created_at' | 'updated_at'>, documentId?: string) {
  // If documentId is provided, update the existing document
  if (documentId) {
    const { data, error } = await supabase
      .from('documents')
      .update({
        name: document.name,
        content: document.content,
      })
      .eq('id', documentId)
      .eq('user_id', userId) // Ensure the user owns this document
      .select()
      .single();
    
    if (error) throw error;
    return data as Document;
  } else {
    // Otherwise, create a new document
    const { data, error } = await supabase
      .from('documents')
      .insert([
        { 
          user_id: userId,
          ...document,
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data as Document;
  }
}

export async function updateDocument(documentId: string, updates: Partial<Document>) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Document;
}

export async function deleteDocument(documentId: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);
  
  if (error) throw error;
  return true;
}

export async function incrementDocumentCount(userId: string) {
  // First get the current count
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('documents_created_this_month')
    .eq('id', userId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Then increment it
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      documents_created_this_month: (profile?.documents_created_this_month || 0) + 1 
    })
    .eq('id', userId);
  
  if (updateError) throw updateError;
  return true;
}

export async function deleteUserAccount(userId: string) {
  const { data, error } = await supabase
    .rpc('delete_user_account', { target_user_id: userId });
  
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, file: File) {
  // Create a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  
  // Upload the file to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);
  
  if (uploadError) throw uploadError;
  
  // Get the public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
  
  // Update the user's metadata with the avatar URL
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: data.publicUrl }
  });
  
  if (updateError) throw updateError;
  
  return data.publicUrl;
}
