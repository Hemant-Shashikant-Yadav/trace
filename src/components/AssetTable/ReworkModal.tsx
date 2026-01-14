import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  assetName: string;
  oldStatus: string;
  newStatus: string;
}

export const ReworkModal: React.FC<ReworkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assetName,
  oldStatus,
  newStatus,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      return;
    }

    setIsSubmitting(true);
    await onSubmit(reason.trim());
    setIsSubmitting(false);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const isValidReason = reason.trim().length >= 10;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-card border-destructive max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            RETURN FOR REWORK
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Message */}
          <div className="bg-destructive/10 border border-destructive/50 rounded-sm p-3">
            <p className="text-sm text-foreground">
              You are returning <span className="font-mono font-bold">{assetName}</span> from{" "}
              <span className="font-mono uppercase font-bold text-warning">
                {oldStatus}
              </span>{" "}
              to{" "}
              <span className="font-mono uppercase font-bold text-destructive">
                {newStatus}
              </span>
              .
            </p>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-display tracking-wider text-muted-foreground">
              REASON FOR REWORK (REQUIRED)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this asset is being returned for rework...&#10;&#10;Minimum 10 characters required."
              className="bg-input border-border min-h-[120px]"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {reason.length} / 10 characters minimum
              </p>
              {reason.length > 0 && !isValidReason && (
                <p className="text-xs text-destructive">
                  Please provide more detail
                </p>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-sm">
            <p>
              <strong>Note:</strong> This reason will be saved to the asset's notes and visible in
              the history log. The revision count will be incremented automatically.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValidReason || isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? "Submitting..." : "Submit Rework"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
