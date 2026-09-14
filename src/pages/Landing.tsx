import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const assetUrl = (filename: string) => import.meta.env.BASE_URL + filename;

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-[#2A0D5B] via-[#4A148C] to-[#1A1333]">
      {/* Header minimalista fixo */}
      <header className="w-full fixed top-0 left-0 z-30 bg-transparent flex justify-between items-center px-12 py-6">
        <div className="flex items-center gap-3">
          <img src={assetUrl("KY ZENITH.png")} alt="Logo Zerith" className="h-10 w-10 object-contain" />
          <span className="text-2xl font-bold tracking-widest text-white"><span style={{ color: '#FFDD00' }}>Z</span>ERITH</span>
        </div>
        <Button onClick={() => navigate("/login")}
          className="px-8 py-2 text-base font-bold bg-[#4A148C] text-white rounded-full shadow-lg hover:bg-[#6A1B9A] hover:brightness-110" style={{ textShadow: '0 2px 8px #0006' }}>
          Entrar no Sistema
        </Button>
      </header>

      {/* Hero Section estilo Tesla */}
      <section
        className="relative flex flex-col items-center justify-center min-h-screen pt-32 pb-16 text-center overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(42,13,91,0.7), rgba(74,20,140,0.7)), url('" + assetUrl("ai-car-dashboard.jpg") + "')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <h1 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg mb-6" style={{ letterSpacing: '.01em' }}>
          O futuro da mobilidade elétrica<br />
          <span className="text-[#FFDD00]">começa aqui</span>
        </h1>
        <p className="text-2xl md:text-3xl text-white/90 mb-10 max-w-2xl mx-auto">
          Plataforma premium de manutenção preditiva para veículos elétricos. Tecnologia, design e inteligência para sua frota.
        </p>
        <Button onClick={() => navigate("/login")}
          className="mt-4 px-12 py-4 text-xl font-bold bg-[#FFDD00] text-black rounded-full shadow-xl hover:brightness-110">
          Contrate Agora
        </Button>
      </section>

      {/* Vídeo institucional */}
      <div className="flex flex-col items-center my-12">
        <h2 
          className="text-4xl md:text-5xl font-extrabold mb-6"
          style={{ 
            fontFamily: 'Montserrat, sans-serif', 
            letterSpacing: '0.07em', 
            fontWeight: 800, 
            color: '#fff', 
            textShadow: '0 2px 16px #4A148C, 0 1px 0 #000, 0 0 12px #FFDD0088' 
          }}
        >
          Assista ao nosso comercial
        </h2>
        <video
          controls
          className="rounded-2xl shadow-2xl border-4 border-[#4A148C] max-w-3xl w-full bg-black"
          style={{ outline: 'none' }}
        >
          <source src={assetUrl("comercial.mp4")} type="video/mp4" />
          Seu navegador não suporta vídeo.
        </video>
      </div>

      {/* Benefícios */}
      <section className="py-24 bg-white/10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 px-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <img src="https://cdn-icons-png.flaticon.com/512/1048/1048953.png" alt="Monitoramento" className="h-16 w-16 mb-2" />
            <h3 className="text-2xl font-bold text-white">Monitoramento em Tempo Real</h3>
            <p className="text-white/90">Acompanhe dados dos sensores dos veículos 24h por dia, com alertas automáticos e gráficos avançados.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Alertas" className="h-16 w-16 mb-2" />
            <h3 className="text-2xl font-bold text-white">Alertas Inteligentes</h3>
            <p className="text-white/90">Receba notificações sobre riscos e falhas antes que se tornem problemas graves. IA que aprende com sua frota.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Eficiência" className="h-16 w-16 mb-2" />
            <h3 className="text-2xl font-bold text-white">Eficiência com IA</h3>
            <p className="text-white/90">Inove com inteligência artificial: aumente a performance, otimize recursos e lidere a transformação sustentável da mobilidade elétrica.</p>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-24 bg-gradient-to-r from-[#2A0D5B]/80 to-[#4A148C]/80">
        <div className="max-w-5xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center">
          <img src={assetUrl("Logo Zenith Final.png")} alt="Dashboard" className="rounded-2xl shadow-2xl border-4 border-[#4A148C] object-cover w-full" />
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white mb-4">Como funciona?</h2>
            <ul className="text-white/90 text-xl space-y-4 list-disc list-inside">
              <li>Conecte sua frota à plataforma Zerith AI</li>
              <li>Receba diagnósticos automáticos e alertas inteligentes</li>
              <li>Acompanhe tudo em tempo real pelo painel premium</li>
              <li>Reduza custos, evite falhas e otimize sua operação</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-24 bg-white/10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-16">O que dizem nossos clientes</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white/10 p-8 rounded-2xl shadow-xl text-white border border-[#4A148C]">
              <p className="italic text-xl">“Reduzimos em 30% os custos de manutenção e nunca mais tivemos uma pane inesperada!”</p>
              <span className="block mt-6 font-bold text-white">Rafael Lima, Velox Motors</span>
            </div>
            <div className="bg-white/10 p-8 rounded-2xl shadow-xl text-white border border-[#4A148C]">
              <p className="italic text-xl">“A plataforma é intuitiva e os alertas realmente funcionam. Recomendo para qualquer gestor de frota.”</p>
              <span className="block mt-6 font-bold text-white">Amanda Oliveira, EletroFrotas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Chamada para ação final */}
      <section className="py-24 bg-gradient-to-r from-[#4A148C] to-[#1A1333] text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">Pronto para revolucionar sua frota?</h2>
        <Button onClick={() => navigate("/login")}
          className="px-12 py-4 text-xl font-bold bg-[#FFDD00] text-[#1A1333] rounded-full shadow-xl hover:brightness-110">
          Comece Agora
        </Button>
      </section>

      {/* Footer minimalista */}
      <footer className="py-10 text-center bg-[#1A1333] border-t border-white/10 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto px-8 gap-4">
          <span className="text-lg text-white">&copy; 2026 Zerith AI - Todos os direitos reservados</span>
          <div className="flex gap-6">
            <a href="#" className="text-white hover:text-[#FFDD00] transition">Política de Privacidade</a>
            <a href="#" className="text-white hover:text-[#FFDD00] transition">Termos de Uso</a>
            <a href="#" className="text-white hover:text-[#FFDD00] transition">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;