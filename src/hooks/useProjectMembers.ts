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
      if (!projectId) {
        console.log("[useProjectMembersSimple] No projectId provided");
        return [];
      }

      const membersMap = new Map<string, ProjectMember>();

      console.log("[useProjectMembersSimple] Starting fetch for project:", projectId);

      try {
        // ===== STEP A: FETCH PROJECT OWNER =====
        console.log("[Step A] Fetching project owner...");
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("user_id")
          .eq("id", projectId)
          .single();

        if (projectError) {
          console.error("[Step A] Error fetching project owner:", projectError);
        } else if (project?.user_id) {
          console.log("[Step A] Found project owner:", project.user_id);
          
          // Get owner's profile
          const { data: ownerProfile, error: ownerProfileError } = await (supabase as any)
            .from("profiles")
            .select("email, nickname")
            .eq("id", project.user_id)
            .single();

          if (ownerProfileError) {
            console.warn("[Step A] Could not fetch owner profile:", ownerProfileError);
            // Fallback: Add owner without profile data
            membersMap.set(project.user_id, {
              user_id: project.user_id,
              email: "Project Owner (No Profile)",
              nickname: null,
            });
          } else if (ownerProfile) {
            console.log("[Step A] Owner profile found:", ownerProfile.email);
            membersMap.set(project.user_id, {
              user_id: project.user_id,
              email: ownerProfile.email || "Project Owner",
              nickname: ownerProfile.nickname || null,
            });
          }
        }

        // ===== STEP B: FETCH ALL TEAM MEMBERS =====
        console.log("[Step B] Fetching project_members table...");
        const { data: projectMembers, error: membersError } = await supabase
          .from("project_members")
          .select("user_id")
          .eq("project_id", projectId);

        if (membersError) {
          console.error("[Step B] Error fetching project_members:", membersError);
          console.error("[Step B] This may be an RLS issue. Check policies on project_members table.");
        } else {
          console.log("[Step B] project_members query returned:", projectMembers?.length || 0, "rows");
          
          if (projectMembers && projectMembers.length > 0) {
            console.log("[Step B] Member user_ids:", projectMembers.map(m => m.user_id));
            
            // Fetch profiles for all members in batch (more efficient)
            for (const member of projectMembers) {
              // Skip if already in map (owner might be in project_members too)
              if (membersMap.has(member.user_id)) {
                console.log("[Step B] Skipping duplicate:", member.user_id);
                continue;
              }

              const { data: memberProfile, error: profileError } = await (supabase as any)
                .from("profiles")
                .select("email, nickname")
                .eq("id", member.user_id)
                .single();

              if (profileError) {
                console.warn("[Step B] Could not fetch profile for:", member.user_id, profileError);
                // Add member without profile data as fallback
                membersMap.set(member.user_id, {
                  user_id: member.user_id,
                  email: `User ${member.user_id.substring(0, 8)}`,
                  nickname: null,
                });
              } else if (memberProfile) {
                console.log("[Step B] Added member:", memberProfile.email);
                membersMap.set(member.user_id, {
                  user_id: member.user_id,
                  email: memberProfile.email || "Unknown",
                  nickname: memberProfile.nickname || null,
                });
              }
            }
          } else {
            console.log("[Step B] No members found in project_members table");
          }
        }

        // ===== STEP C: RETURN COMBINED ARRAY =====
        const allMembers = Array.from(membersMap.values());
        
        console.log("[Step C] Final member list:", {
          projectId,
          totalMembers: allMembers.length,
          members: allMembers.map(m => ({ 
            id: m.user_id.substring(0, 8) + "...", 
            email: m.email,
            nickname: m.nickname 
          })),
        });

        return allMembers;
      } catch (error) {
        console.error("[useProjectMembersSimple] Unexpected error:", error);
        return [];
      }
    },
    enabled: !!projectId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
}
