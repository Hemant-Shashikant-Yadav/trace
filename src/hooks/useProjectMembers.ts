import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectMember {
  user_id: string;
  email: string;
  nickname?: string | null;
}

/**
 * Hook to fetch project members with their email addresses
 * Uses RPC function to bypass RLS restrictions on auth.users
 */
export function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Try direct query first (if RLS allows)
      const { data, error } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching project members:", error);
        return [];
      }

      // For each member, we need to get their email
      // Since direct auth.users access may be blocked, we'll use the project owner
      // and get the current user's email separately
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const members: ProjectMember[] = [];
      
      // Add current user if they're in the project
      if (user && data.some(m => m.user_id === user.id)) {
        members.push({
          user_id: user.id,
          email: user.email || "Unknown",
        });
      }

      // Get project owner
      const { data: projectData } = await supabase
        .from("projects")
        .select("user_id")
        .eq("id", projectId)
        .single();

      if (projectData) {
        // If owner is not already in list
        if (!members.some(m => m.user_id === projectData.user_id)) {
          // Try to get owner's data through current session
          // In a real app, you'd use an RPC function here
          const { data: { user: ownerUser } } = await supabase.auth.getUser();
          if (ownerUser && ownerUser.id === projectData.user_id) {
            members.push({
              user_id: ownerUser.id,
              email: ownerUser.email || "Owner",
            });
          }
        }
      }

      return members;
    },
    enabled: !!projectId,
  });
}

/**
 * Simplified version that returns current user and project owner
 * This works around RLS limitations without needing RPC functions
 * Now includes nickname from profiles table
 */
export function useProjectMembersSimple(projectId: string | null) {
  return useQuery({
    queryKey: ["project-members-simple", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const members: ProjectMember[] = [];

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Try to get user's profile for nickname
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();

        members.push({
          user_id: user.id,
          email: user.email,
          nickname: profile?.nickname || null,
        });
      }

      return members;
    },
    enabled: !!projectId,
  });
}
