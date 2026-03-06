import { Clock, Users, Mic, Wrench, MessageCircle, Heart } from "lucide-react";

const agendaItems = [
  {
    time: "30 min",
    title: "Abertura e Conexão",
    description:
      "Boas-vindas, apresentação da atividade e dinâmica de integração para estimular a troca entre os participantes.",
    icon: Users,
  },
  {
    time: "1h",
    title: "Introdução à Economia Circular",
    description:
      "Conceitos fundamentais, diferenças em relação ao modelo linear e exemplos inspiradores no Brasil e no mundo.",
    icon: Mic,
  },
  {
    time: "1h 30min",
    title: "Vivência Prática",
    description:
      "Atividade mão na massa baseada nos princípios da circularidade aplicados ao seu contexto de negócio.",
    icon: Wrench,
  },
  {
    time: "40 min",
    title: "Conexão com Negócios",
    description:
      "Sistematização dos aprendizados e identificação de oportunidades de geração de valor para sua organização.",
    icon: MessageCircle,
  },
  {
    time: "20 min",
    title: "Encerramento",
    description:
      "Espaço para dúvidas, comentários, partilha de percepções e convite à rede do Movimento Circular.",
    icon: Heart,
  },
];

const AgendaPrint = () => {
  return (
    <section
      style={{
        width: 1920,
        height: 1080,
        padding: "50px 80px",
        background: "white",
        fontFamily: "sans-serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>
          <span
            style={{
              background: "linear-gradient(135deg, #228B22, #32CD32)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Agenda
          </span>{" "}
          da Oficina
        </h2>
        <p style={{ fontSize: 18, color: "#888" }}>
          4 horas de imersão prática e transformadora
        </p>
      </div>

      {/* Timeline */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 20,
            bottom: 20,
            width: 3,
            background: "linear-gradient(to bottom, #228B22, #32CD32, #90EE90)",
            transform: "translateX(-50%)",
          }}
        />

        {agendaItems.map((item, index) => {
          const isLeft = index % 2 === 0;
          const Icon = item.icon;

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: index < agendaItems.length - 1 ? 12 : 0,
                position: "relative",
              }}
            >
              {/* Dot */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #228B22, #32CD32)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <Icon style={{ width: 16, height: 16, color: "white" }} />
              </div>

              {/* Card - left or right */}
              <div
                style={{
                  width: "calc(50% - 40px)",
                  marginLeft: isLeft ? 0 : "auto",
                  marginRight: isLeft ? "auto" : 0,
                  paddingRight: isLeft ? 30 : 0,
                  paddingLeft: isLeft ? 0 : 30,
                }}
              >
                <div
                  style={{
                    background: "#fafafa",
                    borderRadius: 12,
                    padding: "16px 20px",
                    border: "1px solid #e5e5e5",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: "rgba(34,139,34,0.1)",
                      marginBottom: 6,
                    }}
                  >
                    <Clock style={{ width: 14, height: 14, color: "#228B22" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#228B22" }}>
                      {item.time}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 15, color: "#666", lineHeight: 1.5, margin: 0 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AgendaPrint;
