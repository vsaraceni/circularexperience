import { GraduationCap, Award, Globe } from "lucide-react";
import perfilEdson from "@/assets/perfil-edson.jpg";
import perfilSueli from "@/assets/perfil-sueli.jpg";
import perfilFlavio from "@/assets/perfil-flavio.jpg";
const experts = [{
  name: "Prof. Dr. Edson Grandisoli",
  title: "Embaixador do Movimento Circular",
  credentials: ["Pós-doutor pelo IEA-USP", "Doutor em Educação para a Sustentabilidade", "Assessor da UNESCO"],
  image: perfilEdson,
  imagePosition: "object-top"
}, {
  name: "Profa. Dra. Sueli Furlan",
  title: "Docente FFLCH-USP",
  credentials: ["Pós-doutora pela Universidade de Cádiz", "Mestre e Doutora em Ciências pela USP", "Pesquisa em Educomunicação Socioambiental"],
  image: perfilSueli,
  imagePosition: "object-center"
}, {
  name: "Prof. Dr. Flávio Ribeiro",
  title: "Embaixador do Movimento Circular",
  credentials: ["Conselheiro do Pacto Global da ONU", "Doutor em Ciências Ambientais", "Especialista em Logística Reversa"],
  image: perfilFlavio,
  imagePosition: "object-top"
}];
const Experts = () => {
  return <section id="especialistas" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Nossos Especialistas<span className="text-gradient-primary">Especialistas</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Aprenda com profissionais reconhecidos nacionalmente em Economia Circular
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experts.map((expert, index) => <div key={index} className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img src={expert.image} alt={expert.name} className={`w-full h-full object-cover ${expert.imagePosition} group-hover:scale-105 transition-transform duration-500`} />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6 -mt-16 relative z-10">
                <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">{expert.name}</h3>
                  <p className="text-primary font-medium text-sm mb-4">{expert.title}</p>

                  <ul className="space-y-2">
                    {expert.credentials.map((credential, idx) => <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        <span>{credential}</span>
                      </li>)}
                  </ul>
                </div>
              </div>
            </div>)}
        </div>

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground mt-8 italic">
          * A escolha do especialista que irá conduzir a palestra e as dinâmicas será de acordo com a agenda do evento e
          perfil de público.
        </p>

        {/* Credibility Badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Movimento Circular</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border">
            <GraduationCap className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium text-foreground">Professores Doutores</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border">
            <Globe className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Prepare-se para o Futuro</span>
          </div>
        </div>
      </div>
    </section>;
};
export default Experts;