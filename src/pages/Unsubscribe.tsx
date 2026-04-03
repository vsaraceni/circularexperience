import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      } catch { setStatus("invalid"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) { setStatus("error"); return; }
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#faf9f8" }}>
      <div className="max-w-md w-full rounded-xl shadow-sm border p-8 text-center" style={{ background: "#fff", borderColor: "#e5e5e5" }}>
        <div className="text-4xl mb-4">📧</div>

        {status === "loading" && <p className="text-sm" style={{ color: "#666" }}>Verificando...</p>}

        {status === "valid" && (
          <>
            <h1 className="text-xl font-semibold mb-2" style={{ color: "#5F2558" }}>Cancelar inscrição</h1>
            <p className="text-sm mb-6" style={{ color: "#666" }}>
              Deseja parar de receber emails do Circular Experience?
            </p>
            <button
              onClick={handleUnsubscribe}
              className="px-6 py-3 rounded-lg text-white font-medium text-sm"
              style={{ background: "#5F2558" }}
            >
              Confirmar cancelamento
            </button>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold mb-2" style={{ color: "#388E3C" }}>✅ Inscrição cancelada</h1>
            <p className="text-sm" style={{ color: "#666" }}>
              Você não receberá mais emails do Circular Experience.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <h1 className="text-xl font-semibold mb-2" style={{ color: "#F4A736" }}>Já cancelado</h1>
            <p className="text-sm" style={{ color: "#666" }}>
              Esta inscrição já foi cancelada anteriormente.
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1 className="text-xl font-semibold mb-2" style={{ color: "#D32F2F" }}>Link inválido</h1>
            <p className="text-sm" style={{ color: "#666" }}>
              Este link de cancelamento é inválido ou expirou.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold mb-2" style={{ color: "#D32F2F" }}>Erro</h1>
            <p className="text-sm" style={{ color: "#666" }}>
              Ocorreu um erro ao processar sua solicitação. Tente novamente.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
