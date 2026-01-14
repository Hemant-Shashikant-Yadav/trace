import { Folder, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelect: (project: Project) => void;
}

export const ProjectSelector = ({
  projects,
  selectedProject,
  onSelect,
}: ProjectSelectorProps) => {
  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Folder className="w-5 h-5" />
        <span className="font-display text-sm tracking-wider">NO PROJECTS</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-foreground hover:bg-secondary"
        >
          <Folder className="w-5 h-5 text-primary" />
          <span className="font-display text-sm tracking-wider">
            {selectedProject?.name || "SELECT PROJECT"}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-border min-w-[200px]">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => onSelect(project)}
            className="flex items-center justify-between"
          >
            <span className="font-mono text-sm">{project.name}</span>
            {selectedProject?.id === project.id && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
