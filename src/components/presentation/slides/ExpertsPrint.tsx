import perfilEdson from "@/assets/perfil-edson.jpg";
import perfilSueli from "@/assets/perfil-sueli.jpg";
import perfilFlavio from "@/assets/perfil-flavio.jpg";

const experts = [
  {
    name: "Prof. Dr. Edson Grandisoli",
    title: "Embaixador do Movimento Circular",
    credentials: ["Pós-doutor pelo IEA-USP", "Doutor em Educação para a Sustentabilidade", "Assessor da UNESCO"],
    image: perfilEdson,
    imagePosition: "object-top",
  },
  {
    name: "Profa. Dra. Sueli Furlan",
    title: "Docente FFLCH-USP",
    credentials: ["Pós-doutora pela Universidade de Cádiz", "Mestre e Doutora em Ciências pela USP", "Pesquisa em Educomunicação Socioambiental"],
    image: perfilSueli,
    imagePosition: "object-center",
  },
  {
    name: "Prof. Dr. Flávio Ribeiro",
    title: "Embaixador do Movimento Circular",
    credentials: ["Conselheiro do Pacto Global da ONU", "Doutor em Ciências Ambientais", "Especialista em Logística Reversa"],
    image: perfilFlavio,
    imagePosition: "object-top",
  },
];

const ExpertsPrint = () => {
  return (
    <section
      className="w-full h-full flex flex-col justify-center px-16 py-12"
      style={{ fontFamily: "'Raleway', sans-serif", background: "hsl(248 0.7% 96.8%)" }}
    >
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold mb-3" style={{ color: "hsl(307 44% 26%)" }}>
          Nossos <span style={{ color: "hsl(307 44% 26%)" }}>Coordenadores Técnicos</span>
        </h2>
        <p className="text-lg" style={{ color: "hsl(257 4.6% 55.4%)" }}>
          Aprenda com profissionais reconhecidos nacionalmente em Economia Circular
        </p>
      </div>

      <div className="grid grid-cols-3 gap-10 px-8">
        {experts.map((expert, index) => (
          <div
            key={index}
            className="rounded-2xl overflow-hidden"
            style={{ background: "white", border: "1px solid hsl(256 1.3% 92.9%)" }}
          >
            <div className="h-72 overflow-hidden">
              <img
                src={expert.image}
                alt={expert.name}
                className={`w-full h-full object-cover ${expert.imagePosition}`}
              />
            </div>

            <div className="p-5">
              <h3 className="text-lg font-bold mb-1" style={{ color: "hsl(265 4% 12.9%)" }}>
                {expert.name}
              </h3>
              <p className="text-sm font-semibold mb-3" style={{ color: "hsl(307 44% 26%)" }}>
                {expert.title}
              </p>

              <ul className="space-y-1">
                {expert.credentials.map((credential, idx) => (
                  <li
                    key={idx}
                    className="text-sm flex items-start gap-2"
                    style={{ color: "hsl(257 4.6% 55.4%)" }}
                  >
                    <span style={{ color: "hsl(174 72% 40%)" }}>•</span>
                    <span>{credential}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExpertsPrint;
