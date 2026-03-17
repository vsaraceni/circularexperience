import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCog } from "lucide-react";
import { toast } from "sonner";

interface ProfileEditorProps {
  userId: string;
  onProfileUpdated?: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ userId, onProfileUpdated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    cargo: "",
    phone: "",
  });

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, cargo, phone")
      .eq("id", userId)
      .single();

    if (data) {
      setForm({
        full_name: data.full_name || "",
        email: data.email || "",
        cargo: (data as any).cargo || "",
        phone: (data as any).phone || "",
      });
    }
  };

  useEffect(() => {
    if (open) fetchProfile();
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        email: form.email,
        cargo: form.cargo,
        phone: form.phone,
      } as any)
      .eq("id", userId);

    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil atualizado!");
      setOpen(false);
      onProfileUpdated?.();
    }
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserCog className="h-4 w-4 mr-1" /> Meu Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={form.cargo} onChange={(e) => set("cargo", e.target.value)} placeholder="Ex: Diretor Comercial" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;
