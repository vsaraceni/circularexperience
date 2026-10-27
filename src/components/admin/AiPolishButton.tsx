import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const stripHtml = (h: string) => h.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

interface Props {
  field: "scope" | "considerations";
  label: string;
  value: string;
  title?: string;
  company?: string;
  onApply: (html: string) => void;
}

const AiPolishButton: React.FC<Props> = ({ field, label, value, title, company, onApply }) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [original, setOriginal] = useState("");
  const empty = !stripHtml(value || "");

  const run = async () => {
    setLoading(true);
    setOriginal(value);
    const { data, error } = await supabase.functions.invoke("polish-proposal-text", {
      body: { text: value, field, title, company },
    });
    setLoading(false);
    if (error || !data?.html) {
      let msg = data?.error || "Não foi possível revisar o texto.";
      try { const b = await (error as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
      toast.error(msg);
      return;
    }
    setSuggestion(data.html);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1 text-primary"
        disabled={empty || loading}
        title={empty ? "Digite ou importe um rascunho antes de ajustar" : "Revisar texto e formatação com IA"}
        onClick={run}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {loading ? "Revisando..." : "Ajustar com IA"}
      </Button>

      <Dialog open={suggestion !== null} onOpenChange={(o) => !o && setSuggestion(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Revisão por IA — {label}</DialogTitle>
            <DialogDescription>Apenas texto e formatação foram revisados. Confira antes de aplicar.</DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Antes</p>
              <div className="prose prose-sm max-w-none border border-border rounded-md p-3 max-h-[55vh] overflow-auto bg-muted/30"
                dangerouslySetInnerHTML={{ __html: original }} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-primary">Depois</p>
              <div className="prose prose-sm max-w-none border border-primary/40 rounded-md p-3 max-h-[55vh] overflow-auto"
                dangerouslySetInnerHTML={{ __html: suggestion ?? "" }} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSuggestion(null)}>Descartar</Button>
            <Button type="button" onClick={() => { onApply(suggestion!); setSuggestion(null); toast.success("Texto revisado aplicado"); }}>
              Aprovar e aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiPolishButton;
