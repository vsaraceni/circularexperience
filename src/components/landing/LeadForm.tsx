import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const leadSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  whatsapp: z.string().trim().min(10, "WhatsApp deve ter pelo menos 10 dígitos").max(15, "WhatsApp inválido").regex(/^[\d\s\-\(\)]+$/, "Apenas números são permitidos"),
  cargo: z.string().trim().min(2, "Cargo deve ter pelo menos 2 caracteres").max(100, "Cargo muito longo"),
  company: z.string().trim().min(2, "Nome da empresa deve ter pelo menos 2 caracteres").max(100, "Nome da empresa muito longo"),
  city: z.string().trim().min(2, "Cidade deve ter pelo menos 2 caracteres").max(100, "Cidade muito longa"),
  state: z.string().min(2, "Selecione um estado"),
});

type LeadFormData = z.infer<typeof leadSchema>;

const LeadForm = () => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    whatsapp: "",
    cargo: "",
    company: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = leadSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LeadFormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof LeadFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-lead-email", {
        body: result.data,
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
      
      // Reset form after success
      setFormData({
        name: "",
        email: "",
        whatsapp: "",
        cargo: "",
        company: "",
        city: "",
        state: "",
      });
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
          Em breve nossa equipe entrará em contato com uma proposta personalizada.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setIsSuccess(false)}
        >
          Fazer nova solicitação
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

      {/* WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="whatsapp" className="text-foreground">
          WhatsApp <span className="text-destructive">*</span>
        </Label>
        <Input
          id="whatsapp"
          type="tel"
          placeholder="(11) 99999-9999"
          value={formData.whatsapp}
          onChange={(e) => handleChange("whatsapp", e.target.value)}
          className={errors.whatsapp ? "border-destructive" : ""}
          maxLength={15}
        />
        {errors.whatsapp && (
          <p className="text-xs text-destructive">{errors.whatsapp}</p>
        )}
      </div>

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

      {/* City and State */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-foreground">
            Cidade <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            placeholder="Sua cidade"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className={errors.city ? "border-destructive" : ""}
            maxLength={100}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state" className="text-foreground">
            Estado <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.state} 
            onValueChange={(value) => handleChange("state", value)}
          >
            <SelectTrigger className={errors.state ? "border-destructive" : ""}>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {brazilianStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-xs text-destructive">{errors.state}</p>
          )}
        </div>
      </div>

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
            Solicitar Proposta
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Ao enviar, você concorda em receber uma proposta comercial do Circular Experience.
      </p>
    </form>
  );
};

export default LeadForm;
