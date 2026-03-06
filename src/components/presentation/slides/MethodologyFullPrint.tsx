import { Lightbulb, Search, Wrench } from "lucide-react";
import circularExperienceLogo from "@/assets/circular-experience-logo.png";

const steps = [
  {
    number: "1",
    title: "Alinhando Conhecimentos",
    subtitle: "Palestra dialogada com especialista",
    description: "Conceitos fundamentais, diferenças em relação ao modelo linear e exemplos inspiradores.",
    icon: Lightbulb,
    color: "#1BA39C",
  },
  {
    number: "2",
    title: "Identificando Oportunidades",
    subtitle: "Explorando os 7 R's da circularidade",
    description: "Recusar, Repensar, Reduzir, Reutilizar, Reparar, Regenerar e Reciclar aplicados ao seu negócio.",
    icon: Search,
    color: "#5F2558",
  },
  {
    number: "3",
    title: "Criando Circularidade",
    subtitle: "Experiência mão-na-massa",
    description: "Oficina colaborativa e construção de um plano de ação prático e personalizado.",
    icon: Wrench,
    color: "#E6A817",
  },
];

const benefits = [
  "Conceitos básicos e premissas da Economia Circular com foco em operações corporativas",
  "Circularidade de diferentes materiais para evitar desperdícios e minimizar custos",
  "Mapeamento de oportunidades para construção de negócios mais circulares",
  "Ferramentas e estratégias para identificação de processos circulares",
  "Criação de um plano de ação individual e coletivo",
  "Conexão com a rede do Movimento Circular",
];

const MethodologyFullPrint = () => {
  return (
    <div style={{ width: 1920, height: 1080, padding: "40px 80px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <img src={circularExperienceLogo} alt="Circular Experience" style={{ height: 56, margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 40, fontWeight: 700, marginBottom: 4, color: "#1a1a2e" }}>
          Nossa <span style={{ color: "#5F2558" }}>Metodologia</span>
        </h2>
        <p style={{ fontSize: 18, color: "#64748b" }}>Uma jornada em 3 etapas para capacitar sua equipe</p>
      </div>

      {/* 3 Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 28 }}>
        {steps.map((step, index) => (
          <div key={index} style={{ textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: step.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px", color: "white", fontSize: 22, fontWeight: 700
            }}>
              {step.number}
            </div>
            <div style={{
              background: "white", borderRadius: 12, padding: 20,
              border: "1px solid #e2e8f0", height: "100%", textAlign: "left"
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: "#f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12
              }}>
                <step.icon size={20} color={step.color} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{step.title}</h3>
              <p style={{ fontSize: 14, fontWeight: 500, color: step.color, marginBottom: 8 }}>{step.subtitle}</p>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div style={{ background: "white", borderRadius: 12, padding: "20px 28px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", textAlign: "center", marginBottom: 16 }}>
          O que seu time vai aprender
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {benefits.map((benefit, index) => (
            <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 8, background: "#f1f5f9" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5F2558", marginTop: 5, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#1a1a2e", lineHeight: 1.4 }}>{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MethodologyFullPrint;
