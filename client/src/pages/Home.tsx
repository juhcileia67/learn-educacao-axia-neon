/**
 * Atlas Neon Imersivo: landing page educacional com navegação orbital, painéis
 * de vidro azul, pontos magenta/ciano e a AXIA como guia da jornada.
 */
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Atom,
  BookOpenCheck,
  BrainCircuit,
  ChevronRight,
  CircleCheckBig,
  Flame,
  GraduationCap,
  Menu,
  MessageCircle,
  Orbit,
  Play,
  School,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
  X,
  Zap,
} from "lucide-react";

const assets = {
  city: "/manus-storage/axia-neon-hero-city_78ca7d9b.png",
  tutor: "/manus-storage/axia-neon-tutor_93546aa8.png",
  orbit: "/manus-storage/axia-neon-orbit-learning_4963663d.png",
  activities: "/manus-storage/axia-neon-activity-scene_49f4476b.png",
  mark: "/manus-storage/axia-neon-mark_befbeb3c.png",
  luminousHero: "/manus-storage/axia-hero-luminous-object_3b3784ba_a05affca.png",
};

const routeItems = [
  {
    icon: BookOpenCheck,
    kicker: "01 · ORGANIZE",
    title: "Uma trilha que acompanha o seu ritmo.",
    copy: "A AXIA transforma matéria, prazo e interesse em uma sequência que faz sentido para o seu dia.",
    accent: "cyan",
  },
  {
    icon: Atom,
    kicker: "02 · PRATIQUE",
    title: "Atividades que viram avanço real.",
    copy: "Cada desafio mostra o que já clareou e onde vale voltar com mais calma.",
    accent: "magenta",
  },
  {
    icon: Trophy,
    kicker: "03 · CELEBRE",
    title: "Progresso que você consegue enxergar.",
    copy: "XP, sequência e conquistas registram a consistência que constrói autonomia.",
    accent: "lime",
  },
];

const studyCards = [
  { icon: BrainCircuit, title: "Trilha de estudos", copy: "Conteúdos organizados passo a passo", tag: "EM ROTA", percent: 68 },
  { icon: Sparkles, title: "Explicações", copy: "Um conceito por vez, do seu jeito", tag: "PRONTO", percent: 100 },
  { icon: Zap, title: "Exercícios", copy: "Prática com feedback que orienta", tag: "HOJE", percent: 32 },
];

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [portalAccessOpen, setPortalAccessOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { role: "axia", text: "Oi, Ju! Que tal transformar uma dúvida em um próximo passo?" },
  ]);

  const nextPrompt = useMemo(
    () => ["Explicar frações", "Revisar história", "Criar exercícios"],
    [],
  );

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    setMessages((current) => [
      ...current,
      { role: "student", text: cleanMessage },
      { role: "axia", text: "Boa direção. Vamos por partes: o que você já entende sobre isso?" },
    ]);
    setMessage("");
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Learn Educação, início">
          <img className="brand-mark" src={assets.mark} alt="Símbolo AXIA" />
          <span className="brand-type">
            <strong>LEARN</strong>
            <small>EDUCAÇÃO</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <a href="#jornada">Jornada</a>
          <a href="#atividades">Atividades</a>
          <a href="#axia">AXIA</a>
          <a href="/portal">Portal Learn</a>
        </nav>
        <div className="portal-access">
          <button className="nav-cta" onClick={() => setPortalAccessOpen((open) => !open)} aria-expanded={portalAccessOpen} aria-controls="portal-access-menu">
            Entrar <ArrowUpRight size={15} />
          </button>
          {portalAccessOpen && <div id="portal-access-menu" className="portal-access-menu"><div><span className="tiny-label">ACESSO INSTITUCIONAL</span><b>Escolha seu portal</b><p>Após o login, o Learn confirma o papel e os vínculos reais da conta.</p></div><a href="/portal" className="portal-access-option aluno"><GraduationCap size={19}/><span><b>Sou Aluno(a)</b><small>Atividades e jornada pessoal</small></span><ArrowUpRight size={15}/></a><a href="/portal" className="portal-access-option professor"><UsersRound size={19}/><span><b>Sou Professor(a)</b><small>Turmas, atividades e acompanhamento</small></span><ArrowUpRight size={15}/></a><a href="/portal" className="portal-access-option escola"><School size={19}/><span><b>Sou da Administração</b><small>Visão escolar, pessoas e permissões</small></span><ArrowUpRight size={15}/></a><small className="portal-access-note"><ShieldCheck size={12}/> O papel é validado no login; esta escolha não altera permissões.</small></div>}
        </div>
        <button className="mobile-menu" aria-label="Abrir menu">
          <Menu size={20} />
        </button>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <img className="hero-city" src={assets.city} alt="Cidade futurista iluminada por neon" />
          <div className="hero-shade" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-inner">
            <div className="hero-copy reveal">
              <div className="eyebrow"><span /> LEARN EDUCAÇÃO · GUIADO POR AXIA</div>
              <h1>O próximo insight<br />já tem <em>uma rota.</em></h1>
              <p>
                Uma experiência de estudo que transforma dúvidas em movimento, com uma IA que explica,
                desafia e celebra cada passo do caminho.
              </p>
              <div className="hero-actions">
                <button className="button button-primary" onClick={() => scrollTo("jornada")}>
                  Começar minha jornada <ArrowDownRight size={18} />
                </button>
                <button className="button button-ghost" onClick={() => setChatOpen(true)}>
                  <Play size={15} fill="currentColor" /> Ver a AXIA em ação
                </button>
              </div>
              <div className="hero-proof">
                <div className="proof-avatars"><span>J</span><span>A</span><span>M</span></div>
                <span>Feito para aprender com consistência, <b>não com pressão.</b></span>
              </div>
            </div>

            <div className="hero-axia reveal reveal-delay">
              <div className="axia-glow" />
              <div className="level-card glass-panel">
                <span className="tiny-label">SUA ENERGIA HOJE</span>
                <div className="level-number"><span>NÍVEL</span><strong>07</strong></div>
                <div className="xp-line"><span><Star size={13} fill="currentColor" /> 1.840 XP</span><small>próximo: 2.500</small></div>
                <div className="progress"><i style={{ width: "74%" }} /></div>
              </div>
              <img className="axia-tutor" src={assets.luminousHero} alt="AXIA, tutora de aprendizagem, segurando um elemento luminoso" />
              <div className="axia-caption"><Sparkles size={15} /> AXIA ESTÁ AQUI</div>
            </div>
          </div>
          <div className="hero-bottom-line">
            <span>ROLE PARA EXPLORAR</span>
            <div><i /><i /><i /></div>
            <span>01 / 04</span>
          </div>
        </section>

        <section className="signal-strip" aria-label="Indicadores de experiência">
          <div><span className="signal-icon"><Zap size={19} /></span><p><b>Ritmo possível</b><small>Pequenos passos, todo dia.</small></p></div>
          <div><span className="signal-icon cyan"><BrainCircuit size={19} /></span><p><b>Explicação adaptada</b><small>Do jeito que sua mente entende.</small></p></div>
          <div><span className="signal-icon lime"><Trophy size={19} /></span><p><b>Progresso visível</b><small>Conquistas que fazem sentido.</small></p></div>
        </section>

        <section id="jornada" className="journey-section section-pad">
          <div className="section-heading split-heading">
            <div>
              <span className="section-kicker">UMA JORNADA, NÃO UMA LISTA</span>
              <h2>Quando o estudo ganha<br /><em>um pulso próprio.</em></h2>
            </div>
            <p>Não é sobre empilhar tarefas. É sobre construir confiança enquanto cada conceito encontra o seu lugar.</p>
          </div>

          <div className="journey-layout">
            <div className="journey-steps">
              {routeItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article className={`route-item ${item.accent}`} key={item.kicker}>
                    <div className="route-icon"><Icon size={20} /></div>
                    <div>
                      <span>{item.kicker}</span>
                      <h3>{item.title}</h3>
                      <p>{item.copy}</p>
                    </div>
                    <ChevronRight className="route-arrow" size={20} />
                  </article>
                );
              })}
            </div>

            <aside className="route-console glass-panel">
              <img src={assets.orbit} alt="Mapa orbital de aprendizagem" />
              <div className="console-overlay" />
              <div className="console-content">
                <div className="console-top"><span>ROTA ATUAL</span><b><span /> AO VIVO</b></div>
                <h3>Revolução<br />Francesa</h3>
                <div className="console-path"><span className="done"><CircleCheckBig size={14} /> Mapa do assunto</span><span className="current"><i /> Causas e personagens</span><span><i /> Revisão guiada</span></div>
                <button onClick={() => setChatOpen(true)}>Abrir com a AXIA <ArrowUpRight size={15} /></button>
              </div>
            </aside>
          </div>
        </section>

        <section id="atividades" className="activity-section section-pad">
          <div className="activity-scene-wrap"><img src={assets.activities} alt="Elementos abstratos de progresso de estudo" /></div>
          <div className="activity-grid">
            <div className="activity-copy">
              <span className="section-kicker">APRENDER TAMBÉM É FAZER</span>
              <h2>Todo esforço deixa<br />um <em>sinal de luz.</em></h2>
              <p>Atividades deixam de ser uma caixa de entrega. Elas viram pontos claros no mapa: o que foi entendido, o que evoluiu, o que pede ajuda.</p>
              <button className="text-link" onClick={() => scrollTo("axia")}>Conhecer o espaço da AXIA <ArrowDownRight size={17} /></button>
            </div>

            <div className="study-stack">
              {studyCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <article className="study-card glass-panel" key={card.title} style={{ "--card-index": index } as React.CSSProperties}>
                    <span className="study-symbol"><Icon size={23} /></span>
                    <div className="study-copy"><h3>{card.title}</h3><p>{card.copy}</p></div>
                    <div className="study-meta"><span>{card.tag}</span><div className="mini-ring" style={{ "--p": `${card.percent * 3.6}deg` } as React.CSSProperties}><b>{card.percent}%</b></div></div>
                  </article>
                );
              })}
              <button className="sync-button"><Orbit size={17} /> Sincronizar minhas atividades</button>
            </div>
          </div>
        </section>

        <section id="axia" className="axia-section section-pad">
          <div className="axia-surface">
            <div className="axia-surface-copy">
              <span className="section-kicker">SUA TUTORA DE BOLSO</span>
              <h2>Uma conversa certa pode mudar <em>a próxima hora de estudo.</em></h2>
              <p>A AXIA não entrega respostas prontas. Ela troca de estratégia, pede um exemplo e ajuda você a perceber quando a ideia finalmente encaixou.</p>
              <div className="axia-tags"><span><MessageCircle size={14} /> explique de outro jeito</span><span><Flame size={14} /> cria um desafio</span></div>
              <button className="button button-primary" onClick={() => setChatOpen(true)}>Falar com a AXIA <MessageCircle size={17} /></button>
            </div>
            <div className="quote-pulse">
              <span className="quote-orb"><Sparkles size={22} /></span>
              <p>“Você não precisa saber tudo<br />para começar. Só precisa de<br /><strong>uma boa próxima pergunta.</strong>”</p>
              <small>— AXIA, sua guia de aprendizagem</small>
            </div>
          </div>
        </section>

        <section className="final-cta section-pad">
          <div className="cta-rule" />
          <span className="section-kicker">A SUA ROTA COMEÇA AQUI</span>
          <h2>Aprender pode ter<br /><em>mais brilho.</em></h2>
          <p>Entre no universo Learn Educação e veja cada dúvida ganhar direção.</p>
          <button className="button button-primary" onClick={() => setChatOpen(true)}>Acender minha jornada <Sparkles size={17} /></button>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="#inicio"><img className="brand-mark" src={assets.mark} alt="" /><span className="brand-type"><strong>LEARN</strong><small>EDUCAÇÃO</small></span></a>
        <p>Estudo guiado por curiosidade, constância e uma boa próxima pergunta.</p>
        <span>© 2026 · AXIA Neon</span>
      </footer>

      <button className="floating-axia" onClick={() => setChatOpen(true)} aria-label="Abrir conversa com AXIA">
        <img src={assets.mark} alt="" />
        <span>Falar com a AXIA</span>
      </button>

      {chatOpen && (
        <aside className="chat-window glass-panel" aria-label="Conversa com AXIA">
          <div className="chat-header"><div><span className="status-dot" /> AXIA <small>online agora</small></div><button onClick={() => setChatOpen(false)} aria-label="Fechar conversa"><X size={17} /></button></div>
          <div className="chat-body">
            {messages.map((entry, index) => <div className={`message ${entry.role}`} key={`${entry.role}-${index}`}>{entry.text}</div>)}
          </div>
          <div className="quick-prompts">{nextPrompt.map((prompt) => <button key={prompt} onClick={() => setMessage(prompt)}>{prompt}</button>)}</div>
          <form className="chat-form" onSubmit={sendMessage}><input aria-label="Mensagem para a AXIA" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Pergunte à AXIA..." /><button type="submit" aria-label="Enviar mensagem"><Send size={16} /></button></form>
        </aside>
      )}
    </div>
  );
}
