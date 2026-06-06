"use client";

import { useState } from "react";
import { X, Send, Loader2, MessageSquareReply, MessageSquare } from "lucide-react";
import { sendEmail } from "@/lib/api";

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalInsight: {
    text: string;
    agent: string;
    reasoning?: string;
    source_sender?: string;
  };
}

export function ReplyModal({ isOpen, onClose, originalInsight }: ReplyModalProps) {
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isOpen) return null;

  const getActionDetails = () => {
    const agent = originalInsight.agent;
    if (agent.includes("Inbox")) return { title: "Reply to Thread", placeholder: "Type your reply here...", button: "SEND REPLY", icon: MessageSquareReply };
    if (agent.includes("Meeting")) return { title: "Follow up on Meeting", placeholder: "Type your follow-up message...", button: "SEND FOLLOW-UP", icon: Send };
    if (agent.includes("Ticket")) return { title: "Comment on Ticket", placeholder: "Add your comment...", button: "POST COMMENT", icon: MessageSquare };
    return { title: "Respond to Insight", placeholder: "Type your message...", button: "SEND", icon: MessageSquareReply };
  };

  const action = getActionDetails();
  const ActionIcon = action.icon;

  const handleSend = async () => {
    if (!body.trim()) return;

    setIsSending(true);
    setStatus("idle");
    try {
      // Use the actual sender if available, fallback to a default
      const to = originalInsight.source_sender || "recipient@teampulse.dev"; 
      const subject = `RE: ${originalInsight.text.split("|")[0]}`;
      
      await sendEmail({
        to,
        subject,
        body,
        ref_id: "mock-email-id",
      });
      
      setStatus("success");
      setTimeout(() => {
        onClose();
        setBody("");
        setStatus("idle");
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface px-6 py-4">
          <h3 className="font-mono text-sm font-medium uppercase tracking-wider text-ink-black flex items-center gap-2">
            <ActionIcon size={16} /> {action.title}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-ink-black transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Context */}
        <div className="bg-surface-container/30 px-6 py-4 border-b border-outline-variant max-h-[160px] overflow-y-auto custom-scrollbar">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 shrink-0">Context</p>
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-black leading-snug">
              {originalInsight.text.split("|")[1] || originalInsight.text}
            </p>
            {originalInsight.reasoning && (
              <p className="text-xs text-on-surface-variant italic">
                {originalInsight.reasoning}
              </p>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-6">
          <textarea
            autoFocus
            rows={6}
            className="w-full resize-none rounded-xl border border-outline-variant bg-surface p-4 font-mono text-sm text-ink-black focus:border-ink-black focus:ring-0 placeholder:text-on-surface-variant/50"
            placeholder={action.placeholder}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSending || status === "success"}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-outline-variant bg-surface px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 font-mono text-sm text-on-surface-variant hover:text-ink-black transition-colors"
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !body.trim() || status === "success"}
            className="flex items-center gap-2 rounded-lg bg-ink-black px-6 py-2 font-mono text-sm font-medium text-white hover:bg-ink-black/90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> SENDING...
              </>
            ) : status === "success" ? (
              "SENT!"
            ) : (
              action.button
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
