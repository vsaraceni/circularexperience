import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CrmNavbar from "@/components/admin/CrmNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  cargo: string | null;
  role_label: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
};

type ApproveState = { user: ProfileRow; role: "admin" | "user"; label: string } | null;
type RejectState = { user: ProfileRow; reason: string } | null;

export default function UsersAdmin() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approve, setApprove] = useState<ApproveState>(null);
  const [reject, setReject] = useState<RejectState>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, cargo, role_label, approval_status, created_at, approved_at, rejection_reason")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Falha ao carregar usuários");
    } else {
      setRows((data as any) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    return {
      pending: rows.filter((r) => r.approval_status === "pending"),
      approved: rows.filter((r) => r.approval_status === "approved"),
      rejected: rows.filter((r) => r.approval_status === "rejected"),
    };
  }, [rows]);

  const doApprove = async () => {
    if (!approve) return;
    setBusy(true);
    const { error } = await supabase.rpc("approve_user" as any, {
      _user_id: approve.user.id,
      _role: approve.role,
      _role_label: approve.label || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Falha ao aprovar: " + error.message);
      return;
    }
    toast.success("Usuário aprovado");
    setApprove(null);
    load();
  };

  const doReject = async () => {
    if (!reject) return;
    setBusy(true);
    const { error } = await supabase.rpc("reject_user" as any, {
      _user_id: reject.user.id,
      _reason: reject.reason || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Falha ao rejeitar: " + error.message);
      return;
    }
    toast.success("Acesso revogado");
    setReject(null);
    load();
  };

  const renderRow = (u: ProfileRow) => (
    <div
      key={u.id}
      className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border bg-card"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground truncate">
            {u.full_name || "(sem nome)"}
          </p>
          {u.role_label && (
            <Badge variant="secondary" className="text-[10px]">{u.role_label}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Cadastro:{" "}
          {u.created_at
            ? format(new Date(u.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
            : "—"}
          {u.cargo ? ` · ${u.cargo}` : ""}
        </p>
        {u.approval_status === "rejected" && u.rejection_reason && (
          <p className="text-[11px] text-destructive mt-1">Motivo: {u.rejection_reason}</p>
        )}
      </div>
      <div className="flex gap-2">
        {u.approval_status === "pending" && (
          <>
            <Button
              size="sm"
              onClick={() =>
                setApprove({ user: u, role: "user", label: u.role_label ?? "" })
              }
            >
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReject({ user: u, reason: "" })}
            >
              Rejeitar
            </Button>
          </>
        )}
        {u.approval_status === "approved" && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => setReject({ user: u, reason: "" })}
          >
            Revogar acesso
          </Button>
        )}
        {u.approval_status === "rejected" && (
          <Button
            size="sm"
            onClick={() =>
              setApprove({ user: u, role: "user", label: u.role_label ?? "" })
            }
          >
            Reativar
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <CrmNavbar currentModule={"pipeline" as any} />
      <main className="flex-1 px-4 md:px-8 py-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Gestão de usuários</h1>
          <p className="text-sm text-muted-foreground">
            Aprove novos cadastros e gerencie o acesso ao CRM.
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pendentes
                {groups.pending.length > 0 && (
                  <Badge className="ml-2 h-4 px-1.5 text-[10px]">
                    {groups.pending.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Aprovados ({groups.approved.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados ({groups.rejected.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="space-y-3">
              {groups.pending.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Nenhum cadastro pendente.
                </p>
              ) : (
                groups.pending.map(renderRow)
              )}
            </TabsContent>
            <TabsContent value="approved" className="space-y-3">
              {groups.approved.map(renderRow)}
            </TabsContent>
            <TabsContent value="rejected" className="space-y-3">
              {groups.rejected.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Ninguém rejeitado.</p>
              ) : (
                groups.rejected.map(renderRow)
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Dialog open={!!approve} onOpenChange={(o) => !o && setApprove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar acesso</DialogTitle>
          </DialogHeader>
          {approve && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{approve.user.full_name || "(sem nome)"}</p>
                <p className="text-xs text-muted-foreground">{approve.user.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select
                  value={approve.role}
                  onValueChange={(v) =>
                    setApprove({ ...approve, role: v as "admin" | "user" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cargo / rótulo (opcional)</Label>
                <Input
                  value={approve.label}
                  onChange={(e) => setApprove({ ...approve, label: e.target.value })}
                  placeholder="Ex: SDR, Closer, Diretor Comercial"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprove(null)}>Cancelar</Button>
            <Button onClick={doApprove} disabled={busy}>
              {busy ? "Aprovando..." : "Aprovar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reject} onOpenChange={(o) => !o && setReject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reject?.user.approval_status === "approved" ? "Revogar acesso" : "Rejeitar cadastro"}
            </DialogTitle>
          </DialogHeader>
          {reject && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{reject.user.full_name || "(sem nome)"}</p>
                <p className="text-xs text-muted-foreground">{reject.user.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Input
                  value={reject.reason}
                  onChange={(e) => setReject({ ...reject, reason: e.target.value })}
                  placeholder="Ex: fora do time comercial"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={doReject} disabled={busy}>
              {busy ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}