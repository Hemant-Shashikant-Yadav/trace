import React, { useState } from "react";
import { Settings, UserPlus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { friendlyError } from "@/lib/utils";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectOwnerId: string;
  currentUserId: string;
  onProjectDeleted: () => void;
}

interface ProjectMemberWithProfile {
  id: string;
  user_id: string;
  email: string | null;
  nickname: string | null;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectOwnerId,
  currentUserId,
  onProjectDeleted,
}) => {
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch project members with profiles
  const { data: members = [], isLoading: loadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ["project-settings-members", projectId],
    queryFn: async () => {
      // Get project members
      const { data: memberData, error: memberError } = await supabase
        .from("project_members")
        .select("id, user_id")
        .eq("project_id", projectId);

      if (memberError) throw memberError;

      // Fetch profiles for each member
      const membersWithProfiles: ProjectMemberWithProfile[] = [];
      
      for (const member of memberData || []) {
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("email, nickname")
          .eq("id", member.user_id)
          .single();

        membersWithProfiles.push({
          id: member.id,
          user_id: member.user_id,
          email: profile?.email || null,
          nickname: profile?.nickname || null,
        });
      }

      return membersWithProfiles;
    },
    enabled: isOpen,
  });

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const email = newMemberEmail.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Look up user in profiles
    const { data: profile, error: profileError } = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      toast({
        title: "User Not Found",
        description: "No user with this email address exists",
        variant: "destructive",
      });
      return;
    }

    // Check if already a member
    if (members.some(m => m.user_id === profile.id)) {
      toast({
        title: "Already a Member",
        description: "This user is already a project member",
        variant: "destructive",
      });
      return;
    }

    // Add to project_members
    const { error: insertError } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: profile.id,
      });

    if (insertError) {
      toast({
        title: "Error Adding Member",
        description: friendlyError(insertError.message),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Member Added",
      description: `${email} has been added to the project`,
    });

    setNewMemberEmail("");
    refetchMembers();
    queryClient.invalidateQueries({ queryKey: ["project-members"] });
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string | null) => {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error Removing Member",
        description: friendlyError(error.message),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Member Removed",
      description: `${memberEmail || "Member"} has been removed from the project`,
    });

    refetchMembers();
    queryClient.invalidateQueries({ queryKey: ["project-members"] });
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== "delete") {
      toast({
        title: "Confirmation Required",
        description: 'Please type "delete" to confirm',
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      toast({
        title: "Error Deleting Project",
        description: friendlyError(error.message),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Project Deleted",
      description: `${projectName} has been permanently deleted`,
    });

    onProjectDeleted();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            PROJECT SETTINGS - {projectName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="team" className="font-display text-xs tracking-wider">
              TEAM MANAGEMENT
            </TabsTrigger>
            <TabsTrigger value="danger" className="font-display text-xs tracking-wider text-destructive">
              DANGER ZONE
            </TabsTrigger>
          </TabsList>

          {/* Team Management Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="command-border bg-card/50 rounded-sm p-4">
              <h3 className="font-display text-sm tracking-wider mb-4">
                CURRENT MEMBERS ({members.length})
              </h3>

              {loadingMembers ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No members yet
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 border border-border rounded-sm hover:bg-secondary/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm">
                          {member.nickname || member.email || "Unknown User"}
                        </span>
                        {member.user_id === projectOwnerId && (
                          <span className="text-xs text-primary font-mono">(Owner)</span>
                        )}
                      </div>

                      {member.user_id !== projectOwnerId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-display tracking-wider">
                                REMOVE MEMBER
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove {member.nickname || member.email} from this project? Their
                                history will be preserved.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.id, member.email)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Member Section */}
            <div className="command-border bg-card/50 rounded-sm p-4">
              <h3 className="font-display text-sm tracking-wider mb-4">ADD MEMBER</h3>
              <div className="flex gap-2">
                <Input
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-input border-border"
                  onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                />
                <Button
                  onClick={handleAddMember}
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                User must have an existing account
              </p>
            </div>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-4">
            <div className="command-border border-destructive bg-destructive/5 rounded-sm p-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-sm tracking-wider text-destructive mb-2">
                    DELETE PROJECT
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete the project, all assets, and history. This action
                    cannot be undone.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete" className="text-xs text-muted-foreground">
                    Type <span className="font-mono font-bold">delete</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete"
                    className="bg-input border-destructive"
                  />
                </div>

                <Button
                  onClick={handleDeleteProject}
                  disabled={deleteConfirmText !== "delete"}
                  className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  DELETE PROJECT PERMANENTLY
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
