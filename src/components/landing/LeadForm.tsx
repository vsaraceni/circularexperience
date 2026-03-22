import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const step1Schema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
});

const step2Schema = z.object({
  cargo: z.string().trim().min(2, "Cargo deve ter pelo menos 2 caracteres").max(100, "Cargo muito longo"),
  company: z.string().trim().min(2, "Nome da empresa deve ter pelo menos 2 caracteres").max(100, "Nome da empresa muito longo"),
  telefone: z.string().trim().min(8, "Telefone deve ter pelo menos 8 caracteres").max(20, "Telefone muito longo"),
});

type FormData = {
  name: string;
  email: string;
  cargo: string;
  company: string;
  telefone: string;
};

const LeadForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    cargo: "",
    company: "",
    telefone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (step === 1) {
      const result = step1Schema.safeParse({ name: formData.name, email: formData.email });
      if (!result.success) {
        const fieldErrors: Partial<Record<keyof FormData, string>> = {};
        result.error.errors.forEach(err => {
          const field = err.path[0] as keyof FormData;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: validate cargo + company
    const result = step2Schema.safeParse({ cargo: formData.cargo, company: formData.company, telefone: formData.telefone });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-lead-email", {
        body: formData,
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erro ao enviar formulário");
      }

      if (!data.success) {
        throw new Error(data.error || "Erro ao enviar e-mail");
      }
      
      setIsSuccess(true);
      toast.success("Solicitação enviada com sucesso! Em breve entraremos em contato.");
      
      setFormData({ name: "", email: "", cargo: "", company: "", telefone: "" });
      setStep(1);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Erro ao enviar. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-16 h-16 rounded-full gradient-secondary flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-secondary-foreground" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          Solicitação Enviada!
        </h3>
        <p className="text-muted-foreground mb-4">
          Em breve nossa equipe entrará em contato com mais informações.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setIsSuccess(false)}
        >
          Enviar novamente
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground">
          Nome completo <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Seu nome completo"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={errors.name ? "border-destructive" : ""}
          maxLength={100}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">
          E-mail <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className={errors.email ? "border-destructive" : ""}
          maxLength={255}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Step 2 fields - revealed after step 1 */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="cargo" className="text-foreground">
              Cargo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cargo"
              placeholder="Ex: Gerente de RH, Coord. de Sustentabilidade"
              value={formData.cargo}
              onChange={(e) => handleChange("cargo", e.target.value)}
              className={errors.cargo ? "border-destructive" : ""}
              maxLength={100}
            />
            {errors.cargo && (
              <p className="text-xs text-destructive">{errors.cargo}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-foreground">
              Empresa / Organização <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              placeholder="Nome da sua organização"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              className={errors.company ? "border-destructive" : ""}
              maxLength={100}
            />
            {errors.company && (
              <p className="text-xs text-destructive">{errors.company}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-foreground">
              Telefone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleChange("telefone", e.target.value)}
              className={errors.telefone ? "border-destructive" : ""}
              maxLength={20}
            />
            {errors.telefone && (
              <p className="text-xs text-destructive">{errors.telefone}</p>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        variant="hero" 
        size="lg" 
        className="w-full mt-6"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Quero levar para minha organização
          </>
        )}
      </Button>

    </form>
  );
};

export default LeadForm;
