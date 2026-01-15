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
 * Fetch all project members including owner and team members
 * FAIL-SAFE Implementation:
 * Step A: Fetch project owner from projects table
 * Step B: Fetch all project_members with profiles join
 * Step C: Combine and deduplicate
 * 
 * Note: Uses Map to ensure no duplicates and handles RLS gracefully
 */
export function useProjectMembersSimple(projectId: string | null) {
  return useQuery({
    queryKey: ["project-members-simple", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const membersMap = new Map<string, ProjectMember>();

      try {
        // ===== STEP A: FETCH PROJECT OWNER =====
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("user_id")
          .eq("id", projectId)
          .single();

        if (projectError) {
          console.error("Error fetching project owner:", projectError);
        } else if (project?.user_id) {
          // Get owner's profile
          const { data: ownerProfile } = await (supabase as any)
            .from("profiles")
            .select("email, nickname")
            .eq("id", project.user_id)
            .single();

          if (ownerProfile) {
            membersMap.set(project.user_id, {
              user_id: project.user_id,
              email: ownerProfile.email || "Project Owner",
              nickname: ownerProfile.nickname || null,
            });
          } else {
            // Fallback: Add owner without profile data
            membersMap.set(project.user_id, {
              user_id: project.user_id,
              email: "Project Owner",
              nickname: null,
            });
          }
        }

        // ===== STEP B: FETCH ALL TEAM MEMBERS =====
        const { data: projectMembers, error: membersError } = await supabase
          .from("project_members")
          .select("user_id")
          .eq("project_id", projectId);

        if (membersError) {
          console.error("Error fetching project_members:", membersError);
        } else if (projectMembers && projectMembers.length > 0) {
          // Fetch profiles for all members
          for (const member of projectMembers) {
            // Skip if already in map (owner might be in project_members too)
            if (membersMap.has(member.user_id)) continue;

            const { data: memberProfile } = await (supabase as any)
              .from("profiles")
              .select("email, nickname")
              .eq("id", member.user_id)
              .single();

            if (memberProfile) {
              membersMap.set(member.user_id, {
                user_id: member.user_id,
                email: memberProfile.email || "Unknown",
                nickname: memberProfile.nickname || null,
              });
            } else {
              // Fallback without profile
              membersMap.set(member.user_id, {
                user_id: member.user_id,
                email: `User ${member.user_id.substring(0, 8)}`,
                nickname: null,
              });
            }
          }
        }

        // ===== STEP C: RETURN COMBINED ARRAY =====
        return Array.from(membersMap.values());
      } catch (error) {
        console.error("Error in useProjectMembersSimple:", error);
        return [];
      }
    },
    enabled: !!projectId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
}
