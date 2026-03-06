import { Target, Lightbulb, Recycle, RefreshCw, Droplets, Wrench, TreeDeciduous, Hand } from "lucide-react";

const sevenRs = [
  { icon: Hand, label: "Recusar" },
  { icon: Lightbulb, label: "Repensar" },
  { icon: Droplets, label: "Reduzir" },
  { icon: RefreshCw, label: "Reutilizar" },
  { icon: Recycle, label: "Reciclar" },
  { icon: Wrench, label: "Reparar" },
  { icon: TreeDeciduous, label: "Regenerar" },
];

const AboutPrint = () => {
  return (
    <section
      style={{
        width: 1920,
        height: 1080,
        display: "flex",
        alignItems: "center",
        padding: "60px 80px",
        background: "white",
        fontFamily: "sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Left column - text */}
      <div style={{ flex: 1, paddingRight: 60 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 999,
            background: "rgba(34,139,34,0.1)",
            marginBottom: 24,
          }}
        >
          <Target style={{ width: 18, height: 18, color: "#228B22" }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#228B22" }}>
            Circular Experience
          </span>
        </div>

        <h2
          style={{
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 28,
            color: "#1a1a1a",
          }}
        >
          Capacite seu time para colocar a{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #228B22, #32CD32)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Economia Circular
          </span>{" "}
          em prática
        </h2>

        <div style={{ fontSize: 18, lineHeight: 1.7, color: "#555" }}>
          <p style={{ marginBottom: 16 }}>
            <strong style={{ color: "#1a1a1a" }}>Objetivo:</strong> Juntos com
            seu time, construiremos estratégias viáveis para evitar que materiais
            se tornem resíduos, promovendo a utilização eficiente e prolongada
            dos recursos na sua operação.
          </p>
          <p style={{ marginBottom: 16 }}>
            Esta atividade colaborativa incentivará os colaboradores a
            desenvolver soluções criativas e práticas, aplicáveis diretamente em
            seus negócios, para minimizar o desperdício e maximizar a
            circularidade.
          </p>
          <p>
            Criaremos um espaço de reflexão prática sobre a Economia Circular,
            explorando como os{" "}
            <strong style={{ color: "#1a1a1a" }}>7 R's</strong> podem ser
            transformados em oportunidades concretas para ações mais sustentáveis
            e circulares.
          </p>
        </div>
      </div>

      {/* Right column - 7 R's wheel */}
      <div
        style={{
          width: 560,
          height: 560,
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Center circle */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #228B22, #32CD32)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(34,139,34,0.3)",
            zIndex: 10,
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            Economia
            <br />
            Circular
          </span>
        </div>

        {/* Dashed circle */}
        <div
          style={{
            position: "absolute",
            inset: 100,
            borderRadius: "50%",
            border: "2px dashed rgba(34,139,34,0.3)",
          }}
        />

        {/* Items in circle */}
        {sevenRs.map((item, index) => {
          const angle = (index * 360) / 7 - 90;
          const radius = 210;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          const Icon = item.icon;

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #228B22, #32CD32)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <Icon style={{ width: 30, height: 30, color: "white" }} />
              </div>
              <span
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AboutPrint;
