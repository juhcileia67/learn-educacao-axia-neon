/**
 * Atlas Neon Imersivo: portal institucional modular. A prévia visual usa
 * apenas cenários explicitamente marcados; dados reais chegam por tRPC/Firebase.
 */
import DashboardLayout, { type DashboardNavItem } from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { permissionsByRole, platformRoles, roleLabels, type PlatformPermission } from "@shared/platformRoles";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { useMemo, useState } from "react";
import { startLogin } from "@/const";
import {
  Activity,
  ArrowUpRight,
  BellRing,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FilePlus2,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  ListChecks,
  Map,
  Network,
  NotebookPen,
  Orbit,
  PencilLine,
  Radar,
  School,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
  WandSparkles,
} from "lucide-react";

type PortalRole = "aluno" | "professor" | "coordenacao" | "diretoria" | "admin";

type SignalTone = "bem" | "observar" | "atencao" | "intervencao";

function roleFromAuthenticatedUser(role?: string): PortalRole | null {
  return ["aluno", "professor", "coordenacao", "diretoria", "admin"].includes(role ?? "") ? role as PortalRole : null;
}

const roleInfo: Record<PortalRole, { label: string; caption: string; color: string }> = {
  aluno: { label: "Aluno", caption: "Meu caminho de aprendizagem", color: "cyan" },
  professor: { label: "Professor", caption: "Turmas, acompanhamento e intervenções", color: "magenta" },
  coordenacao: { label: "Coordenação", caption: "Acompanhamento pedagógico institucional", color: "lime" },
  diretoria: { label: "Diretoria", caption: "Visão estratégica da escola", color: "amber" },
  admin: { label: "Administrador", caption: "Estrutura, pessoas e permissões", color: "violet" },
};

const studentNav: DashboardNavItem[] = [
  { icon: LayoutDashboard, label: "Meu caminho", path: "/portal" },
  { icon: ClipboardCheck, label: "Atividades", path: "/portal/atividades" },
  { icon: BookOpenCheck, label: "Trilhas", path: "/portal/trilhas" },
  { icon: Trophy, label: "Conquistas", path: "/portal/conquistas" },
  { icon: Bot, label: "AXIA", path: "/portal/axia" },
];

const teacherNav: DashboardNavItem[] = [
  { icon: LayoutDashboard, label: "Visão da turma", path: "/portal" },
  { icon: UsersRound, label: "Turmas", path: "/portal/turmas" },
  { icon: GraduationCap, label: "Alunos", path: "/portal/alunos" },
  { icon: FilePlus2, label: "Atividades", path: "/portal/atividades" },
  { icon: Trophy, label: "Reconhecimentos", path: "/portal/conquistas" },
  { icon: Map, label: "Mapa de aprendizagem", path: "/portal/mapa" },
  { icon: Radar, label: "Radar de dificuldades", path: "/portal/radar" },
  { icon: NotebookPen, label: "Diário do professor", path: "/portal/diario" },
  { icon: Bot, label: "AXIA pedagógica", path: "/portal/axia" },
];

const managementNav: DashboardNavItem[] = [
  { icon: LayoutDashboard, label: "Visão institucional", path: "/portal" },
  { icon: Network, label: "Visão da escola", path: "/portal/escola" },
  { icon: LineChart, label: "Evolução", path: "/portal/evolucao" },
  { icon: Radar, label: "Central de atenção", path: "/portal/atencao" },
  { icon: ClipboardCheck, label: "Relatórios", path: "/portal/relatorios" },
  { icon: ShieldCheck, label: "Permissões", path: "/portal/permissoes" },
];

const signalCopy: Record<SignalTone, { label: string; copy: string }> = {
  bem: { label: "Tudo bem", copy: "Aluno evoluindo normalmente." },
  observar: { label: "Observar", copy: "Alguns sinais pedem acompanhamento." },
  atencao: { label: "Atenção", copy: "Dificuldade recorrente merece olhar pedagógico." },
  intervencao: { label: "Intervenção sugerida", copy: "Há um padrão que vale revisar com o professor." },
};

function DemoNotice() {
  return <div className="portal-demo-notice"><ShieldCheck size={15} /><span><b>Entre na sua conta para operar o portal.</b> Turmas, atividades, entregas e indicadores só são exibidos conforme o perfil e os vínculos institucionais autorizados.</span></div>;
}

function QueryError({ error, label = "Não foi possível carregar este módulo." }: { error?: { message?: string } | null; label?: string }) {
  if (!error) return null;
  return <div className="empty-state query-error"><BellRing size={24}/><div><b>{label}</b><p>{error.message ?? "Tente novamente em alguns instantes."}</p></div></div>;
}

function PortalMetric({ icon: Icon, label, value, detail, tone = "magenta" }: { icon: typeof Activity; label: string; value: string; detail: string; tone?: string }) {
  return <article className={`portal-metric ${tone}`}><span className="metric-icon"><Icon size={18} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function SectionHead({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="portal-section-head"><div><span className="portal-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p><div className="axia-guidance"><span className="axia-guidance-orb"><Sparkles size={12} /></span><span><b>AXIA · orientação contextual</b><small>Uma sugestão aparece aqui quando existe um próximo passo relevante.</small></span></div></div>{action}</div>;
}

function Panel({ title, subtitle, icon: Icon, children, className = "" }: { title: string; subtitle?: string; icon?: typeof Activity; children: React.ReactNode; className?: string }) {
  return <section className={`portal-panel ${className}`}><div className="panel-head"><div>{Icon && <span className="panel-icon"><Icon size={17} /></span>}<div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div></div>{children}</section>;
}

function SignalBadge({ tone }: { tone: SignalTone }) {
  return <span className={`signal-badge ${tone}`}>{signalCopy[tone].label}</span>;
}

type StudentTimelineItem = {
  id: string;
  occurredAt: Date | null;
  kind: "entrega" | "devolutiva" | "conquista";
  title: string;
  detail: string;
};

function StudentEvolutionTimeline({ items }: { items: StudentTimelineItem[] }) {
  const orderedItems = [...items].sort((first, second) => (second.occurredAt?.getTime() ?? 0) - (first.occurredAt?.getTime() ?? 0));
  const iconByKind = { entrega: ClipboardCheck, devolutiva: CheckCircle2, conquista: Trophy } as const;
  const labelByKind = { entrega: "Entrega", devolutiva: "Devolutiva", conquista: "Conquista" } as const;
  if (!orderedItems.length) return <div className="empty-state"><LineChart size={24}/><div><b>Sua evolução aparecerá aqui.</b><p>Entregas, devolutivas e reconhecimentos do seu perfil formarão uma linha do tempo privada.</p></div></div>;
  return <div className="student-evolution-timeline">{orderedItems.map((item) => { const Icon = iconByKind[item.kind]; return <article key={item.id} className={`student-timeline-item ${item.kind}`}><span className="student-timeline-icon"><Icon size={16}/></span><div><span>{labelByKind[item.kind]}{item.occurredAt ? ` · ${item.occurredAt.toLocaleDateString("pt-BR")}` : ""}</span><b>{item.title}</b><p>{item.detail}</p></div></article>; })}</div>;
}

function StudentView() {
  const { isAuthenticated, user } = useAuth();
  const search = useSearch();
  const isAdminStudentDemo = user?.role === "admin" && new URLSearchParams(search).get("demo") === "aluno";
  if (isAdminStudentDemo) return <DemoStudentView />;
  const utils = trpc.useUtils();
  const assignmentsQuery = trpc.platform.myAssignments.useQuery(undefined, { enabled: isAuthenticated });
  const submissionsQuery = trpc.platform.mySubmissions.useQuery(undefined, { enabled: isAuthenticated });
  const recognitionsQuery = trpc.platform.myStudentRecognitions.useQuery(undefined, { enabled: isAuthenticated });
  const [activeAssignment, setActiveAssignment] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [classCode, setClassCode] = useState("");
  const [axiaOpen, setAxiaOpen] = useState(false);
  const [axiaPrompt, setAxiaPrompt] = useState("");
  const [axiaReply, setAxiaReply] = useState("");
  const joinClassMutation = trpc.platform.joinClass.useMutation({
    onSuccess: async (classroom) => {
      await Promise.all([utils.platform.myClasses.invalidate(), utils.platform.myAssignments.invalidate(), utils.platform.overview.invalidate()]);
      setClassCode("");
      toast.success(`Você entrou em ${classroom.name} · ${classroom.grade}.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const submitMutation = trpc.platform.submitActivity.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.platform.myAssignments.invalidate(), utils.platform.mySubmissions.invalidate(), utils.platform.overview.invalidate()]);
      setActiveAssignment(null);
      setAnswerText("");
      toast.success("Resposta enviada com sucesso.");
    },
    onError: (error) => toast.error(error.message),
  });
  const axiaMutation = trpc.platform.axiaChat.useMutation({
    onSuccess: ({ reply }) => setAxiaReply(reply),
    onError: (error) => toast.error(error.message),
  });
  const assignments = assignmentsQuery.data ?? [];
  const recognitions = recognitionsQuery.data ?? [];
  const submittedIds = new Set((submissionsQuery.data ?? []).map((submission) => submission.activityId));
  const pending = assignments.filter((assignment) => !submittedIds.has(assignment.activityId));
  const assignmentTitles = new globalThis.Map(assignments.map((assignment) => [assignment.activityId, assignment.title]));
  const evolutionItems: StudentTimelineItem[] = [
    ...(submissionsQuery.data ?? []).flatMap((submission) => {
      const activityTitle = assignmentTitles.get(submission.activityId) ?? "Atividade da sua turma";
      const items: StudentTimelineItem[] = [{ id: `submission-${submission.id}`, occurredAt: submission.submittedAt ?? null, kind: "entrega", title: `Você enviou: ${activityTitle}`, detail: submission.status === "devolvida" ? "A entrega recebeu uma atualização da equipe pedagógica." : "Sua entrega foi registrada no seu percurso." }];
      if (submission.teacherFeedback || submission.feedbackAt) items.push({ id: `feedback-${submission.id}`, occurredAt: submission.feedbackAt ?? submission.updatedAt ?? submission.submittedAt ?? null, kind: "devolutiva", title: `Devolutiva em: ${activityTitle}`, detail: submission.teacherFeedback ?? "Uma devolutiva foi registrada para esta atividade." });
      return items;
    }),
    ...recognitions.map((recognition) => ({ id: `recognition-${recognition.id}`, occurredAt: recognition.awardedAt ?? null, kind: "conquista" as const, title: `Conquista: ${recognition.category}`, detail: `${recognition.sourceType === "atividade" ? "Atividade" : "Intervenção"}: ${recognition.sourceLabel}` })),
  ];
  return <div className="portal-content">
    <SectionHead eyebrow="PAINEL COMPLEMENTAR DO APP" title="Seu caminho continua daqui." copy="Acompanhe a própria evolução e responda atividades atribuídas à sua turma. Não há ranking público: a referência é a sua jornada." action={<button className="portal-button primary" onClick={() => setAxiaOpen(true)}>Abrir AXIA <Bot size={16} /></button>} />
    {!isAuthenticated && <DemoNotice />}
    <QueryError error={assignmentsQuery.error ?? submissionsQuery.error ?? recognitionsQuery.error} label="Não foi possível carregar seu percurso privado." />
    {isAuthenticated && <form className="join-class-form" onSubmit={(event) => { event.preventDefault(); joinClassMutation.mutate({ code: classCode }); }}><div><b>Entrar em uma turma</b><span>Use o código fornecido pelo professor para receber atividades no portal.</span></div><input required value={classCode} onChange={(event) => setClassCode(event.target.value)} placeholder="Ex.: 7A-LEARN" /><button disabled={joinClassMutation.isPending} className="portal-button secondary" type="submit">{joinClassMutation.isPending ? "Entrando..." : "Entrar com código"} <ArrowUpRight size={15} /></button></form>}
    <div className="portal-metrics-grid">
      <PortalMetric icon={ClipboardCheck} label="Atividades pendentes" value={String(pending.length)} detail={isAuthenticated ? "Atribuídas à sua turma." : "Entre para visualizar."} tone="magenta" />
      <PortalMetric icon={Flame} label="Atividades enviadas" value={String(submittedIds.size)} detail="Entregas registradas na sua conta." tone="amber" />
      <PortalMetric icon={Trophy} label="Conquistas privadas" value={String(recognitions.length)} detail="Visíveis somente no seu perfil." tone="cyan" />
      <PortalMetric icon={CalendarClock} label="Próximo prazo" value={pending[0]?.dueAt ? new Date(pending[0].dueAt).toLocaleDateString("pt-BR") : "—"} detail="Considera atividades pendentes." tone="lime" />
    </div>
    <div className="portal-split two-one">
      <Panel title="O que vem agora" subtitle="Atividades publicadas pelos professores das suas turmas." icon={ListChecks}>
        {assignmentsQuery.isLoading ? <div className="empty-state"><Orbit size={26} /><div><b>Carregando sua rota.</b><p>Buscando atividades vinculadas ao seu perfil.</p></div></div> : pending.length === 0 ? <div className="empty-state"><Orbit size={26} /><div><b>Nenhuma atividade pendente.</b><p>Quando um professor publicar uma atividade para sua turma, ela aparecerá aqui.</p></div></div> : <div className="portal-record-list">{pending.map((assignment) => <article key={assignment.assignmentId}><div><b>{assignment.title}</b><span>{assignment.subject} · {assignment.points} XP {assignment.dueAt ? `· prazo ${new Date(assignment.dueAt).toLocaleDateString("pt-BR")}` : ""}</span></div><button className="text-action" onClick={() => { setActiveAssignment(assignment.activityId); setAnswerText(""); }}>Responder <ArrowUpRight size={15} /></button></article>)}</div>}
        {activeAssignment && <form className="student-answer-form" onSubmit={(event) => { event.preventDefault(); submitMutation.mutate({ activityId: activeAssignment, answerText }); }}><textarea required value={answerText} onChange={(event) => setAnswerText(event.target.value)} placeholder="Escreva sua resposta para a atividade..." /><div><button type="button" className="portal-button secondary" onClick={() => setActiveAssignment(null)}>Cancelar</button><button disabled={submitMutation.isPending} className="portal-button primary" type="submit">{submitMutation.isPending ? "Enviando..." : "Enviar resposta"} <Send size={15} /></button></div></form>}
      </Panel>
      <Panel title="AXIA no seu estudo" subtitle="Sugestões sempre orientadas à autonomia." icon={Bot}>
        <div className="axia-mini"><span className="axia-orb"><Sparkles size={18} /></span><p>“Começamos pelo que você já entende e construímos o próximo passo juntos.”</p>{axiaReply && <p className="axia-reply">{axiaReply}</p>}{axiaOpen ? <form className="student-answer-form" onSubmit={(event) => { event.preventDefault(); axiaMutation.mutate({ audience: "aluno", message: axiaPrompt }); }}><textarea required value={axiaPrompt} onChange={(event) => setAxiaPrompt(event.target.value)} placeholder="Explique o que você quer entender..." /><div><button type="button" className="portal-button secondary" onClick={() => setAxiaOpen(false)}>Fechar</button><button className="portal-button primary" disabled={axiaMutation.isPending} type="submit">{axiaMutation.isPending ? "Pensando..." : "Perguntar"} <Send size={15}/></button></div></form> : <button className="text-action" onClick={() => setAxiaOpen(true)}>Falar com a AXIA <ArrowUpRight size={15} /></button>}</div>
      </Panel>
    </div>
    <Panel title="Minhas conquistas" subtitle="Reconhecimentos privados associados às suas atividades ou intervenções. Não há ranking público." icon={Trophy} className="records-panel">{recognitionsQuery.isLoading ? <div className="empty-state"><Trophy size={24}/><div><b>Carregando suas conquistas.</b><p>Consultando somente os registros vinculados ao seu perfil.</p></div></div> : recognitions.length ? <div className="portal-record-list">{recognitions.map((recognition) => <article key={recognition.id}><div><b>{recognition.category}</b><span>{recognition.message ?? "Reconhecimento registrado pela equipe pedagógica."} · {recognition.sourceType === "atividade" ? "Atividade" : "Intervenção"}: {recognition.sourceLabel}</span></div><span className={`signal-badge ${recognition.status === "conquistada" ? "bem" : "observar"}`}>{recognition.status === "conquistada" ? "conquistada" : "em andamento"}</span></article>)}</div> : <div className="empty-state"><Trophy size={24}/><div><b>Suas conquistas aparecerão aqui.</b><p>Quando um reconhecimento for registrado para você, ele ficará visível somente nesta jornada privada.</p></div></div>}</Panel>
    <Panel title="Minha evolução" subtitle="Linha do tempo privada com eventos que pertencem somente ao seu percurso." icon={LineChart} className="records-panel"><StudentEvolutionTimeline items={evolutionItems}/></Panel>
  </div>;
}

function TeacherOverview() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const overviewQuery = trpc.platform.overview.useQuery(undefined, { enabled: isAuthenticated });
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const submissionsQuery = trpc.platform.myTeacherSubmissions.useQuery(undefined, { enabled: isAuthenticated });
  const activitiesQuery = trpc.platform.myActivities.useQuery(undefined, { enabled: isAuthenticated });
  const overview = overviewQuery.data;
  const submissions = submissionsQuery.data ?? [];
  const classes = classesQuery.data ?? [];
  const upcomingActivities = (activitiesQuery.data ?? []).filter((activity) => activity.dueAt && new Date(activity.dueAt).getTime() >= Date.now() && new Date(activity.dueAt).getTime() <= Date.now() + 7 * 86_400_000);
  const [submissionClassroomId, setSubmissionClassroomId] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const visibleSubmissions = submissionClassroomId ? submissions.filter((submission) => submission.classroomId === submissionClassroomId) : submissions;
  const searchedSubmissions = visibleSubmissions.filter((submission) => `${submission.activityTitle} ${submission.classroomName} ${submission.classroomGrade} ${submission.studentName ?? ""} ${submission.studentEmail ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const latestSubmission = searchedSubmissions[0];
  return <div className="portal-content teacher-reference-dashboard">
    <header className="teacher-reference-head"><div><span className="portal-eyebrow">PAINEL DO PROFESSOR</span><h1>Olá, {user?.name?.split(" ")[0] ?? "professor(a)"}. <span>✦</span></h1><p>Veja o que precisa da sua atenção hoje nas turmas vinculadas ao seu perfil.</p></div><button className="portal-button primary" onClick={() => setLocation("/portal/atividades")}><FilePlus2 size={16} /> Criar nova atividade</button></header>
    {!isAuthenticated && <DemoNotice />}
    <QueryError error={overviewQuery.error ?? classesQuery.error ?? submissionsQuery.error ?? activitiesQuery.error} label="Não foi possível carregar o painel do professor." />
    <div className="teacher-dashboard-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar turma, estudante ou atividade..."/><small>{search ? `${searchedSubmissions.length} entrega(s) encontrada(s)` : "Busque entre as entregas das suas turmas"}</small></div>
    <div className="teacher-reference-metrics">
      <PortalMetric icon={UsersRound} label="Turmas ativas" value={String(overview?.classrooms ?? 0)} detail="Vinculadas ao seu perfil" tone="cyan" />
      <PortalMetric icon={ClipboardCheck} label="Atividades para acompanhar" value={String(overview?.activities ?? 0)} detail="Criadas nas suas turmas" tone="magenta" />
      <PortalMetric icon={BellRing} label="Entregas pendentes" value={String(overview?.pendingSubmissions ?? 0)} detail="Aguardando sua revisão" tone="cyan" />
      <PortalMetric icon={Radar} label="Sinais de atenção" value={String(overview?.attentionSignals ?? 0)} detail="Sempre com revisão humana" tone="lime" />
    </div>
    <div className="teacher-reference-grid">
      <Panel title="Central de Hoje" subtitle="Prioridades reais das suas turmas." icon={BellRing} className="teacher-central"><div className="attention-list">
        <article onClick={() => setLocation("/portal/atividades")}><span className="attention-time">CORRIGIR</span><p><b>{overview?.pendingSubmissions ? `${overview.pendingSubmissions} entrega(s) aguardando leitura` : "Nenhuma entrega pendente"}</b><small>{overview?.pendingSubmissions ? "Abra a fila para revisar respostas enviadas." : "Novas respostas aparecerão aqui quando forem enviadas."}</small></p><ChevronRight size={17} /></article>
        <article onClick={() => setLocation("/portal/atividades")}><span className="attention-time cyan">PRAZOS</span><p><b>{upcomingActivities.length ? `${upcomingActivities.length} atividade(s) vencem em até 7 dias` : "Nenhum prazo nos próximos 7 dias"}</b><small>Revise o andamento e comunique ajustes antes do vencimento.</small></p><ChevronRight size={17} /></article>
        <article onClick={() => setLocation("/portal/radar")}><span className="attention-time lime">ATENÇÃO</span><p><b>{overview?.attentionSignals ?? 0} sinal(is) para acompanhar</b><small>Evidências pedagógicas sempre pedem revisão docente antes de qualquer encaminhamento.</small></p><ChevronRight size={17} /></article>
        <article onClick={() => setLocation("/portal/diario")}><span className="attention-time cyan">DIÁRIO</span><p><b>Registrar contexto da aula</b><small>Guarde observações por turma, matéria e conteúdo trabalhado.</small></p><ChevronRight size={17} /></article>
      </div></Panel>
      <aside className="teacher-axia-suggestion"><div><span className="axia-suggestion-icon"><Sparkles size={25}/></span><h2>Sugestão da AXIA para você</h2><p>{overview?.attentionSignals ? "Há sinais que merecem uma leitura mais cuidadosa. Que tal preparar uma atividade curta de retomada, revisável antes do envio?" : "As turmas estão sem sinais urgentes. Você pode usar este momento para planejar a próxima atividade ou registrar o diário."}</p><button className="portal-button primary" onClick={() => setLocation("/portal/axia?context=radar")}>Ver sugestão <ArrowUpRight size={15}/></button></div><img src="/manus-storage/axia-hero-luminous-object_3b3784ba_a05affca.png" alt="AXIA, assistente pedagógica" /></aside>
      <Panel title="Suas turmas" subtitle="Acompanhe o que está ativo em cada vínculo." icon={UsersRound} className="teacher-classes"><div className="teacher-class-cards">{classesQuery.isLoading ? <div className="empty-state"><UsersRound size={23}/><div><b>Carregando turmas.</b><p>Consultando seus vínculos atuais.</p></div></div> : classes.length ? classes.filter((classroom) => `${classroom.name} ${classroom.grade} ${classroom.institutionName}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 3).map((classroom) => { const classSubmissions = submissions.filter((submission) => submission.classroomId === classroom.id); const classActivities = (activitiesQuery.data ?? []).filter((activity) => activity.classroomId === classroom.id); return <article key={classroom.id}><span>{classroom.grade}</span><h3>{classroom.name}</h3><p>{classroom.institutionName}</p><div><b>{classActivities.length}</b><small>atividades</small><b>{classSubmissions.length}</b><small>entregas</small></div><button onClick={() => setLocation("/portal/turmas")}>Ver turma <ArrowUpRight size={14}/></button></article>; }) : <div className="empty-state"><UsersRound size={23}/><div><b>Nenhuma turma vinculada.</b><p>Crie ou entre em uma turma para iniciar o acompanhamento.</p></div></div>}</div></Panel>
      <Panel title="Atividade mais recente" subtitle="Registro real de entrega no recorte atual." icon={ClipboardCheck} className="teacher-latest"><div className="class-code-row"><select value={submissionClassroomId ?? ""} onChange={(event) => setSubmissionClassroomId(event.target.value ? Number(event.target.value) : undefined)}><option value="">Todas as turmas</option>{classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select></div>{submissionsQuery.isLoading ? <div className="empty-state"><ClipboardCheck size={23}/><div><b>Carregando entregas.</b><p>Consultando atividades e respostas associadas às suas turmas.</p></div></div> : latestSubmission ? <article className="latest-submission"><span className="metric-icon"><ClipboardCheck size={18}/></span><div><b>{latestSubmission.activityTitle}</b><p>{latestSubmission.classroomName} · {latestSubmission.classroomGrade} · {latestSubmission.studentName ?? latestSubmission.studentEmail ?? "Estudante"}</p><small>{latestSubmission.submittedAt ? `Enviada em ${new Date(latestSubmission.submittedAt).toLocaleDateString("pt-BR")}` : "Entrega em acompanhamento"}</small></div><span className={`signal-badge ${latestSubmission.status === "enviada" ? "atencao" : "bem"}`}>{latestSubmission.status}</span></article> : <div className="empty-state"><ClipboardCheck size={23}/><div><b>Nenhuma entrega no recorte.</b><p>As atividades enviadas aparecerão aqui quando houver resposta de estudantes.</p></div></div>}</Panel>
    </div>
  </div>;
}

function ClassesView() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const institutionsQuery = trpc.platform.institutions.useQuery(undefined, { enabled: isAuthenticated });
  const createClassMutation = trpc.platform.createClass.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.platform.myClasses.invalidate(), utils.platform.overview.invalidate()]);
      toast.success("Turma criada e vinculada ao seu perfil.");
    },
    onError: (error) => toast.error(error.message),
  });
  const [lookupCode, setLookupCode] = useState("");
  const [foundClass, setFoundClass] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState("todas");
  const [institutionFilter, setInstitutionFilter] = useState("todas");
  const [membershipFilter, setMembershipFilter] = useState("todos");
  const classes = classesQuery.data ?? [];
  const institutions = institutionsQuery.data ?? [];
  const visibleClasses = classes.filter((item) => `${item.name} ${item.grade} ${item.code} ${item.institutionName}`.toLowerCase().includes(lookupCode.trim().toLowerCase()) && (gradeFilter === "todas" || item.grade === gradeFilter) && (institutionFilter === "todas" || item.institutionName === institutionFilter) && (membershipFilter === "todos" || item.memberRole === membershipFilter));
  return <div className="portal-content classes-reference-view">
    <header className="teacher-reference-head"><div><span className="portal-eyebrow">GESTÃO DE TURMAS</span><h1>Minhas Turmas</h1><p>Gerencie turmas vinculadas e acompanhe os fluxos reais de código, atividades e entregas.</p></div><button className="portal-button primary" onClick={() => document.getElementById("form-nova-turma")?.scrollIntoView({ behavior: "smooth" })}>Criar nova turma <School size={16} /></button></header>
    {!isAuthenticated && <DemoNotice />}
    <QueryError error={classesQuery.error ?? institutionsQuery.error} label="Não foi possível carregar turmas e instituições." />
    <div className="teacher-reference-metrics classes-reference-metrics"><PortalMetric icon={UsersRound} label="Total de turmas" value={String(classes.length)} detail="Vinculadas ao seu perfil" tone="cyan"/><PortalMetric icon={School} label="Instituições" value={String(new Set(classes.map((item) => item.institutionName)).size)} detail="No escopo atual" tone="magenta"/><PortalMetric icon={Copy} label="Códigos ativos" value={String(classes.filter((item) => Boolean(item.code)).length)} detail="Para entrada organizada" tone="lime"/><PortalMetric icon={Activity} label="Turmas no recorte" value={String(visibleClasses.length)} detail="Resultado da busca atual" tone="cyan"/></div>
    <Panel title="Turmas vinculadas" subtitle="Use busca e filtros para recortar somente os vínculos autorizados ao seu perfil." icon={UsersRound} className="classes-reference-table"><div className="class-reference-tools"><input aria-label="Buscar turma" value={lookupCode} onChange={(event) => { setLookupCode(event.target.value); setFoundClass(null); }} placeholder="Buscar turma, código ou instituição..."/><select aria-label="Filtrar por série" value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)}><option value="todas">Todas as séries</option>{Array.from(new Set(classes.map((item) => item.grade))).map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select><select aria-label="Filtrar por instituição" value={institutionFilter} onChange={(event) => setInstitutionFilter(event.target.value)}><option value="todas">Todas as instituições</option>{Array.from(new Set(classes.map((item) => item.institutionName))).map((institution) => <option key={institution} value={institution}>{institution}</option>)}</select><select aria-label="Filtrar por vínculo" value={membershipFilter} onChange={(event) => setMembershipFilter(event.target.value)}><option value="todos">Todos os vínculos</option><option value="professor">Professor</option><option value="aluno">Aluno</option></select><button className="portal-button secondary" onClick={() => setLocation("/portal/axia?context=turma")}>AXIA para turmas <WandSparkles size={15}/></button></div>
      <div className="placeholder-table"><div className="table-head"><span>Turma</span><span>Ano/Série</span><span>Código</span><span>Instituição</span><span>Vínculo</span><span /></div>{classesQuery.isLoading ? <div className="table-empty"><School size={22} /><p>Carregando suas turmas...</p></div> : visibleClasses.length ? visibleClasses.map((item) => <div className="table-data-row class-reference-row" key={item.id}><span><b>{item.name}</b></span><span>{item.grade}</span><span>{item.code}</span><span>{item.institutionName}</span><span>{item.memberRole}</span><button aria-label={`Abrir ${item.name}`} onClick={() => { setFoundClass(`${item.name} · ${item.grade} · ${item.institutionName}`); setLocation("/portal/alunos"); }}><ChevronRight size={16}/></button></div>) : <div className="table-empty"><School size={22} /><p>{classes.length ? "Nenhuma turma corresponde à busca atual." : "Você ainda não participa de nenhuma turma. Crie uma turma ou peça o código ao professor responsável."}</p></div>}</div>{foundClass && <p className="lookup-result">Turma selecionada: {foundClass}</p>}</Panel>
    <div className="portal-split activity-builder-grid">
      <Panel title="Nova turma" subtitle="O código é usado pelos apps Learn e pelo portal para organizar os vínculos." icon={School}>
        {institutions.length === 0 ? <div className="empty-state"><Building2 size={24}/><div><b>Nenhuma instituição disponível.</b><p>Um administrador deve criar a instituição antes que uma turma possa ser registrada.</p></div></div> : <form id="form-nova-turma" className="activity-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); createClassMutation.mutate({ institutionId: Number(form.get("institutionId")), grade: String(form.get("grade")), name: String(form.get("name")), code: String(form.get("code")) }); }}><label>Instituição<select name="institutionId" required>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name} · {institution.code}</option>)}</select></label><div className="form-two"><label>Série<input name="grade" required placeholder="Ex.: 7º ano" /></label><label>Nome da turma<input name="name" required placeholder="Ex.: 7º A" /></label></div><label>Código de acesso<input name="code" required minLength={4} maxLength={18} placeholder="Ex.: 7A-LEARN" /></label><button disabled={createClassMutation.isPending} className="portal-button primary" type="submit">{createClassMutation.isPending ? "Criando..." : "Criar turma"} <School size={15}/></button></form>}
      </Panel>
      <Panel title="Abrir uma turma existente" subtitle="Consulte as turmas que já pertencem ao seu perfil." icon={UsersRound}>
        <div className="class-code-row"><input aria-label="Código da turma" value={lookupCode} onChange={(event) => setLookupCode(event.target.value)} placeholder="Ex.: 7A-LEARN" /><button className="portal-button secondary" onClick={() => { const match = classes.find((item) => item.code.toUpperCase() === lookupCode.trim().toUpperCase()); setFoundClass(match ? `${match.name} · ${match.grade} · ${match.institutionName}` : "Nenhuma turma vinculada ao seu perfil usa esse código."); }}>Abrir turma <ArrowUpRight size={15} /></button></div>{foundClass && <p className="lookup-result">{foundClass}</p>}
      </Panel>
    </div>
  </div>;
}

function StudentDetailView() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const classes = classesQuery.data ?? [];
  const [classroomId, setClassroomId] = useState<number | undefined>();
  const activeClassroomId = classroomId ?? classes[0]?.id;
  const studentsQuery = trpc.platform.classStudents.useQuery({ classroomId: activeClassroomId ?? 0 }, { enabled: Boolean(activeClassroomId) && isAuthenticated });
  const students = studentsQuery.data ?? [];
  const [studentId, setStudentId] = useState<number | undefined>();
  const selectedStudent = students.find((student) => student.id === studentId) ?? students[0];
  const detailQuery = trpc.platform.studentLearningDetail.useQuery({ classroomId: activeClassroomId ?? 0, studentId: selectedStudent?.id ?? 0 }, { enabled: Boolean(activeClassroomId && selectedStudent?.id) && isAuthenticated });
  const detail = detailQuery.data;
  return <div className="portal-content">
    <SectionHead eyebrow="ACOMPANHAMENTO INDIVIDUAL" title="Uma visão que apoia sem reduzir a pessoa a um número." copy="Abra somente estudantes de turmas vinculadas ao seu perfil. Evidências e devolutivas permanecem protegidas pelo acesso da turma." action={<button className="portal-button secondary" onClick={() => setLocation("/portal/axia?context=aluno")}>Analisar evolução com AXIA <WandSparkles size={15}/></button>} />
    {!isAuthenticated && <DemoNotice />}
    <QueryError error={classesQuery.error ?? studentsQuery.error ?? detailQuery.error} label="Não foi possível carregar os estudantes autorizados." />
    <div className="student-profile-head"><span className="student-avatar"><GraduationCap size={25} /></span><div><h2>{selectedStudent?.name ?? "Selecione uma turma"}</h2><p>{selectedStudent?.email ?? "Disponível apenas para professores responsáveis e gestão autorizada."}</p></div>{classes.length ? <div className="student-selector"><select value={activeClassroomId ?? ""} onChange={(event) => { setClassroomId(Number(event.target.value)); setStudentId(undefined); }}>{classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select><select value={selectedStudent?.id ?? ""} onChange={(event) => setStudentId(Number(event.target.value))}><option value="">Selecionar estudante</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name ?? student.email ?? `Estudante #${student.id}`}</option>)}</select></div> : <span className="lookup-result">Nenhuma turma vinculada.</span>}</div>
    <div className="portal-split student-detail-grid">
      <Panel title="Atividades e evolução" subtitle="Entregas, devolutivas e progresso individual ao longo do tempo." icon={LineChart}>{detailQuery.isLoading ? <div className="student-detail-empty"><LineChart size={25}/><p>Carregando entregas e devolutivas do estudante...</p></div> : detail?.submissions.length ? <div className="portal-record-list">{detail.submissions.map((submission) => <article key={submission.id}><div><b>{submission.activityTitle}</b><span>{submission.subject} · {submission.status}{submission.score !== null ? ` · nota ${submission.score}` : ""}{submission.teacherFeedback ? ` · ${submission.teacherFeedback}` : ""}</span></div><span className={`signal-badge ${submission.status === "enviada" ? "atencao" : "bem"}`}>{submission.status}</span></article>)}</div> : <div className="student-detail-empty"><LineChart size={25}/><p>{selectedStudent ? "Nenhuma entrega registrada para este estudante nesta turma." : "Selecione um estudante de uma turma vinculada para abrir seu acompanhamento."}</p></div>}</Panel>
      <Panel title="Leitura pedagógica" subtitle="Facilidades, dificuldades e estratégia que parece funcionar melhor." icon={BrainCircuit}><div className="student-reading-list"><span>Turma selecionada <b>{classes.find((classroom) => classroom.id === activeClassroomId)?.name ?? "—"}</b></span><span>Entregas registradas <b>{detail?.submissions.length ?? 0}</b></span><span>Intervenções encaminhadas <b>{detail?.interventions.length ?? 0}</b></span><span>Devolutivas recebidas <b>{detail?.submissions.filter((item) => Boolean(item.teacherFeedback)).length ?? 0}</b></span></div></Panel>
    </div>
    <Panel title="Histórico de intervenções" subtitle="Cada proposta é revisada por um professor antes de chegar ao aluno." icon={NotebookPen}>{detailQuery.isLoading ? <div className="empty-state"><NotebookPen size={26}/><div><b>Carregando intervenções.</b><p>Consultando o histórico protegido da turma.</p></div></div> : detail?.interventions.length ? <div className="portal-record-list">{detail.interventions.map((intervention) => <article key={intervention.id}><div><b>{intervention.objective}</b><span>{intervention.targetType} · {intervention.status} · {new Date(intervention.createdAt).toLocaleDateString("pt-BR")}</span></div><span className="signal-badge intervencao">{intervention.status}</span></article>)}</div> : <div className="empty-state"><ShieldCheck size={26}/><div><b>Nenhuma intervenção registrada.</b><p>Quando um reforço aprovado for encaminhado para esta turma ou estudante, ele aparecerá neste histórico.</p></div></div>}</Panel>
  </div>;
}

function ActivitiesView() {
  const [mode, setMode] = useState("ESTUDO");
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const utils = trpc.useUtils();
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const activitiesQuery = trpc.platform.myActivities.useQuery(undefined, { enabled: isAuthenticated });
  const createActivityMutation = trpc.platform.createActivity.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.platform.myActivities.invalidate(), utils.platform.overview.invalidate(), utils.platform.myAssignments.invalidate()]);
      toast.success("Atividade salva. Se publicada, ela foi atribuída aos estudantes vinculados à turma.");
    },
    onError: (error) => toast.error(error.message),
  });
  const classes = classesQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const focusedActivityId = Number(new URLSearchParams(search).get("focus") ?? 0);
  const orderedActivities = [...activities].sort((left, right) => Number(right.id === focusedActivityId) - Number(left.id === focusedActivityId));
  return <div className="portal-content">
    <SectionHead eyebrow="CRIAÇÃO PEDAGÓGICA" title="Uma atividade-base. Muitas formas de aprender." copy="Mantenha o objetivo pedagógico e ajuste a apresentação somente depois de revisar a proposta com a AXIA." />
    {!isAuthenticated && <DemoNotice />}
    <QueryError error={classesQuery.error ?? activitiesQuery.error} label="Não foi possível carregar turmas e atividades." />
    <div className="portal-split activity-builder-grid">
      <Panel title="Nova atividade" subtitle="Rascunho estruturado para publicação, agendamento ou adaptação." icon={FilePlus2}>
        {classes.length === 0 ? <div className="empty-state"><UsersRound size={24}/><div><b>Crie uma turma antes de publicar.</b><p>As atividades são associadas a uma turma e podem ser atribuídas automaticamente aos estudantes vinculados.</p></div></div> : <form className="activity-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const dateValue = String(form.get("dueAt") || ""); createActivityMutation.mutate({ classroomId: Number(form.get("classroomId")), title: String(form.get("title")), subject: String(form.get("subject")), instructions: String(form.get("instructions")), dueAt: dateValue ? new Date(`${dateValue}T12:00:00`) : undefined, points: Number(form.get("points") || 100), aiMode: mode as "ESTUDO" | "ATIVIDADE" | "AVALIACAO", activityType: String(form.get("activityType")), status: String(form.get("status")) as "rascunho" | "publicada" }); }}>
          <label>Turma<select name="classroomId" required>{classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select></label>
          <label>Título<input name="title" required placeholder="Ex.: Frações e operações" /></label>
          <div className="form-two"><label>Matéria<input name="subject" required placeholder="Matemática" /></label><label>Prazo<input name="dueAt" type="date" /></label></div>
          <label>Instruções<textarea name="instructions" required placeholder="Descreva o desafio e os critérios de entrega." /></label>
          <div className="form-two"><label>Pontos / XP<input name="points" type="number" min="0" defaultValue="100" /></label><label>Formato<select name="activityType"><option value="resposta_aberta">Resposta aberta</option><option value="multipla_escolha">Múltipla escolha</option><option value="atividade_pratica">Atividade prática</option><option value="projeto">Projeto</option><option value="trabalho_grupo">Trabalho em grupo</option></select></label></div>
          <label>Modo de ajuda da AXIA<div className="mode-picker">{["ESTUDO", "ATIVIDADE", "AVALIACAO"].map((item) => <button type="button" key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>)}</div></label>
          <div className="form-two"><label>Status<select name="status"><option value="rascunho">Salvar como rascunho</option><option value="publicada">Publicar para a turma</option></select></label><span /></div>
          <div className="attachment-line"><span>Anexos serão liberados quando o armazenamento de documentos estiver conectado ao perfil da instituição.</span><span>Publicação cria atribuições aos estudantes.</span></div>
          <div className="form-actions"><button type="button" className="portal-button secondary" onClick={() => setLocation("/portal/axia?context=atividade")}>Adaptar com AXIA <WandSparkles size={15} /></button><button disabled={createActivityMutation.isPending} type="submit" className="portal-button primary">{createActivityMutation.isPending ? "Salvando..." : "Salvar atividade"} <CheckCircle2 size={15} /></button></div>
        </form>}
      </Panel>
      <Panel title="Guia do modo selecionado" subtitle="A IA sugere caminhos. A decisão e a revisão permanecem com o professor." icon={Bot}>
        <div className="mode-guidance"><span className={`mode-orb ${mode.toLowerCase()}`}><Bot size={22} /></span><h3>{mode === "ESTUDO" ? "Explicar e ensinar" : mode === "ATIVIDADE" ? "Pistas sem resposta pronta" : "Ajuda restrita"}</h3><p>{mode === "ESTUDO" ? "A AXIA pode usar explicações em etapas, exemplos e perguntas de checagem para apoiar a aprendizagem." : mode === "ATIVIDADE" ? "A AXIA conduz por perguntas e pistas, preservando o protagonismo do estudante na resolução." : "A AXIA restringe a ajuda para preservar a integridade da avaliação."}</p><div className="adapt-list"><span>Texto menor</span><span>Mais exemplos</span><span>Etapas visuais</span><span>Contexto por interesse</span><span>Atividade prática</span></div></div>
      </Panel>
    </div>
    <Panel title="Atividades da sua turma" subtitle="Rascunhos e atividades publicadas registradas no banco." icon={ClipboardCheck} className="records-panel">
      {activitiesQuery.isLoading ? <div className="empty-state"><ClipboardCheck size={24}/><div><b>Carregando atividades.</b><p>Consultando as turmas vinculadas ao seu perfil.</p></div></div> : activities.length ? <div className="portal-record-list">{orderedActivities.map((activity) => <article key={activity.id} className={activity.id === focusedActivityId ? "origin-focused" : ""}><div><b>{activity.title}</b><span>{activity.subject} · {activity.points} XP · {activity.status} {activity.dueAt ? `· prazo ${new Date(activity.dueAt).toLocaleDateString("pt-BR")}` : ""}</span>{activity.id === focusedActivityId && <small className="origin-focus-note">Origem aberta a partir do Mapa de Conquistas.</small>}</div><span className={`signal-badge ${activity.status === "publicada" ? "bem" : "observar"}`}>{activity.status}</span></article>)}</div> : <div className="empty-state"><ClipboardCheck size={24}/><div><b>Nenhuma atividade criada.</b><p>Use o formulário acima para salvar um rascunho ou publicar para uma turma real.</p></div></div>}
    </Panel>
  </div>;
}

function LearningMapView() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const classes = classesQuery.data ?? [];
  const [classroomId, setClassroomId] = useState<number | undefined>();
  const activeClassroomId = classroomId ?? classes[0]?.id;
  const signalsQuery = trpc.platform.attentionSignals.useQuery({ classroomId: activeClassroomId ?? 0 }, { enabled: Boolean(activeClassroomId) && isAuthenticated });
  const signals = signalsQuery.data ?? [];
  const [selected, setSelected] = useState("todos");
  const mapSegments = [
    { id: "bem", label: "Evoluindo bem", value: signals.filter((signal) => signal.status === "bem").length, tone: "lime", copy: "Evidências registradas como evolução consistente." },
    { id: "observar", label: "Em observação", value: signals.filter((signal) => signal.status === "observar").length, tone: "cyan", copy: "Sinais que pedem acompanhamento ao longo do percurso." },
    { id: "atencao", label: "Precisam de atenção", value: signals.filter((signal) => signal.status === "atencao" || signal.status === "intervencao").length, tone: "magenta", copy: "Sinais que merecem investigação pedagógica." },
  ];
  return <div className="portal-content">
    <SectionHead eyebrow="MAPA DE APRENDIZAGEM" title="Olhe além do acerto e do erro." copy="A leitura organiza evidências por conceito e tipo de dificuldade. A abertura individual depende sempre da permissão do professor." action={<button className="portal-button secondary" onClick={() => setLocation("/portal/axia?context=mapa")}>Sugerir intervenção <WandSparkles size={15}/></button>} />
    {!isAuthenticated && <DemoNotice />}
    <QueryError error={classesQuery.error ?? signalsQuery.error} label="Não foi possível carregar o mapa de aprendizagem." />
    <Panel title="Sinais da turma" subtitle="Leitura baseada em evidências registradas pelos fluxos pedagógicos." icon={Map}>
      {classes.length ? <div className="map-topline"><div><span className="portal-eyebrow">TURMA VINCULADA</span><h3>O que a turma parece precisar agora?</h3></div><select className="map-class-select" value={activeClassroomId ?? ""} onChange={(event) => setClassroomId(Number(event.target.value))}>{classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select></div> : <div className="empty-state"><Map size={25}/><div><b>Nenhuma turma vinculada.</b><p>O mapa será preenchido assim que você criar ou entrar em uma turma.</p></div></div>}
      <div className="learning-map-grid">{mapSegments.map((segment) => <button key={segment.id} onClick={() => setSelected(segment.id)} className={`map-segment ${segment.tone} ${selected === segment.id ? "selected" : ""}`}><strong>{segment.value}</strong><span>{segment.label}</span><small>{segment.copy}</small></button>)}</div>
      <div className="difficulty-categories"><span>Categorias observadas nas evidências:</span><div>{signals.length ? Array.from(new Set(signals.map((signal) => signal.category))).map((item) => <button key={item} onClick={() => setSelected(item)}>{item}</button>) : <span>Nenhum sinal registrado no recorte atual.</span>}</div></div>
    </Panel>
  </div>;
}

function RadarView() {
  const signals: SignalTone[] = ["bem", "observar", "atencao", "intervencao"];
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const interventionsQuery = trpc.platform.myInterventions.useQuery(undefined, { enabled: isAuthenticated });
  const classes = classesQuery.data ?? [];
  const [classroomId, setClassroomId] = useState<number | undefined>();
  const [proposalStage, setProposalStage] = useState<"idle" | "review" | "approved" | "sent">("idle");
  const [objective, setObjective] = useState("Retomar o conteúdo com exemplos visuais e uma atividade curta em etapas.");
  const createInterventionMutation = trpc.platform.createIntervention.useMutation({
    onSuccess: () => { setProposalStage("sent"); toast.success("Reforço encaminhado e registrado no histórico pedagógico."); },
    onError: (error) => toast.error(error.message),
  });
  const activeClassroomId = classroomId ?? classes[0]?.id;
  const activeClassroom = classes.find((classroom) => classroom.id === activeClassroomId);
  const focusedInterventionId = Number(new URLSearchParams(search).get("focus") ?? 0);
  return <div className="portal-content">
    <SectionHead eyebrow="RADAR DE DIFICULDADES" title="Sinais que convidam a cuidar, não a rotular." copy="O radar aponta padrões observáveis antes que uma dificuldade vire apenas uma nota. Nenhuma decisão é automática." action={<button className="portal-button primary" onClick={() => setProposalStage("review")}>Criar reforço com AXIA <WandSparkles size={16} /></button>} />
    {!isAuthenticated && <DemoNotice />}
    <QueryError error={classesQuery.error} label="Não foi possível carregar as turmas para a intervenção." />
    <div className="signal-guide">{signals.map((tone) => <article key={tone} className={tone}><SignalBadge tone={tone} /><p>{signalCopy[tone].copy}</p></article>)}</div>
    <Panel title="Como funciona a intervenção" subtitle="O professor revisa, edita, aprova e decide se envia qualquer proposta." icon={Target}>
      <div className="intervention-steps"><span><b>1</b> A plataforma reúne evidências.</span><ChevronRight size={16} /><span><b>2</b> A AXIA sugere um reforço.</span><ChevronRight size={16} /><span><b>3</b> O professor revisa e aprova.</span><ChevronRight size={16} /><span><b>4</b> O aluno recebe orientação.</span></div>
      <button className="text-action" onClick={() => setLocation("/portal/axia?context=radar")}>Pedir uma leitura contextual à AXIA <ArrowUpRight size={15}/></button>
    </Panel>
    <Panel title="Reforço com AXIA" subtitle="Fluxo demonstrável de revisão pedagógica; nada é enviado sem aprovação." icon={WandSparkles} className="intervention-panel">
      {proposalStage === "idle" && <div className="intervention-empty"><WandSparkles size={25}/><div><b>Proposta ainda não gerada.</b><p>Selecione uma dificuldade evidenciada para a AXIA preparar um rascunho revisável.</p></div><button className="portal-button primary" onClick={() => setProposalStage("review")}>Gerar proposta <Sparkles size={15}/></button></div>}
      {proposalStage === "review" && <div className="proposal-review"><span className="signal-badge intervencao">RASCUNHO PARA REVISÃO</span><label>Objetivo do reforço<textarea value={objective} onChange={(event) => setObjective(event.target.value)} /></label><div className="proposal-options"><span>Mais exemplos</span><span>Texto dividido</span><span>Atividade prática</span></div><div className="form-actions"><button className="portal-button secondary" onClick={() => setObjective("Retomar o conteúdo em etapas curtas, com exemplos adicionais e uma checagem de entendimento.")}>Editar proposta <PencilLine size={15}/></button><button className="portal-button primary" onClick={() => setProposalStage("approved")}>Aprovar reforço <CheckCircle2 size={15}/></button></div></div>}
      {proposalStage === "approved" && <div className="proposal-approved"><CheckCircle2 size={25}/><div><b>Reforço aprovado pelo professor.</b><p>Escolha uma turma vinculada antes de encaminhar. Nenhum estudante recebe a proposta sem essa confirmação.</p><label className="destination-select">Turma de destino<select value={activeClassroomId ?? ""} onChange={(event) => setClassroomId(Number(event.target.value))}>{classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select></label></div><button disabled={!activeClassroomId || createInterventionMutation.isPending} className="portal-button secondary" onClick={() => activeClassroomId && createInterventionMutation.mutate({ classroomId: activeClassroomId, targetType: "turma", objective, status: "encaminhada" })}>{createInterventionMutation.isPending ? "Encaminhando..." : "Confirmar destino"} <Send size={15}/></button></div>}
      {proposalStage === "sent" && <div className="proposal-sent"><CheckCircle2 size={25}/><div><b>Encaminhamento registrado para: {activeClassroom?.name ?? "turma"}.</b><p>O reforço foi salvo no histórico pedagógico e ficará disponível apenas aos perfis vinculados e autorizados.</p></div><span>ENVIADO</span></div>}
    </Panel>
    <Panel title="Intervenções registradas" subtitle="Registros persistidos que podem ser abertos a partir do Mapa de Conquistas." icon={Target} className="records-panel">{interventionsQuery.isLoading ? <div className="empty-state"><Target size={24}/><div><b>Carregando intervenções.</b><p>Consultando apenas os registros das turmas autorizadas.</p></div></div> : interventionsQuery.data?.length ? <div className="portal-record-list">{[...interventionsQuery.data].sort((left, right) => Number(right.id === focusedInterventionId) - Number(left.id === focusedInterventionId)).map((intervention) => <article key={intervention.id} className={intervention.id === focusedInterventionId ? "origin-focused" : ""}><div><b>{intervention.objective}</b><span>{intervention.status} · foco {intervention.targetType}</span>{intervention.id === focusedInterventionId && <small className="origin-focus-note">Origem aberta a partir do Mapa de Conquistas.</small>}</div><span className="signal-badge intervencao">{intervention.status}</span></article>)}</div> : <div className="empty-state"><Target size={24}/><div><b>Nenhuma intervenção registrada.</b><p>Quando um reforço for aprovado e encaminhado, ele ficará disponível aqui.</p></div></div>}</Panel>
  </div>;
}

function DiaryView() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const journalsQuery = trpc.platform.myJournals.useQuery(undefined, { enabled: isAuthenticated });
  const createJournalMutation = trpc.platform.createJournal.useMutation({
    onSuccess: async () => { await utils.platform.myJournals.invalidate(); toast.success("Registro do diário salvo."); },
    onError: (error) => toast.error(error.message),
  });
  const classes = classesQuery.data ?? [];
  const journals = journalsQuery.data ?? [];
  return <div className="portal-content"><SectionHead eyebrow="DIÁRIO DO PROFESSOR" title="Pequenos registros ajudam a enxergar o contexto." copy="Registre o que aconteceu na aula por turma, matéria e conteúdo. Os registros ficam vinculados ao seu perfil e à turma escolhida." />{!isAuthenticated && <DemoNotice />}<QueryError error={classesQuery.error ?? journalsQuery.error} label="Não foi possível carregar o diário pedagógico." /><Panel title="Novo registro" subtitle="Visível somente a você e às pessoas autorizadas na instituição." icon={NotebookPen}>{classes.length === 0 ? <div className="empty-state"><NotebookPen size={24}/><div><b>Você ainda não possui turmas vinculadas.</b><p>Crie ou abra uma turma antes de registrar observações pedagógicas.</p></div></div> : <form className="diary-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); createJournalMutation.mutate({ classroomId: Number(form.get("classroomId")), subject: String(form.get("subject")), contentTopic: String(form.get("contentTopic")), body: String(form.get("body")) }); }}><div className="form-two"><label>Turma<select name="classroomId" required>{classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select></label><label>Matéria<input name="subject" required placeholder="Ex.: Matemática" /></label></div><label>Conteúdo<input name="contentTopic" required placeholder="Ex.: Equações de primeiro grau" /></label><label>Observação<textarea name="body" required placeholder="Ex.: Hoje trabalhei..." /></label><button disabled={createJournalMutation.isPending} className="portal-button primary" type="submit">{createJournalMutation.isPending ? "Registrando..." : "Registrar observação"} <NotebookPen size={15} /></button></form>}</Panel><Panel title="Registros recentes" subtitle="Histórico persistido do seu diário pedagógico." icon={NotebookPen} className="records-panel">{journalsQuery.isLoading ? <div className="empty-state"><NotebookPen size={24}/><div><b>Carregando registros.</b><p>Consultando o diário associado ao seu perfil.</p></div></div> : journals.length ? <div className="portal-record-list">{journals.map((journal) => <article key={journal.id}><div><b>{journal.subject} · {journal.contentTopic}</b><span>{journal.body} · {new Date(journal.createdAt).toLocaleDateString("pt-BR")}</span></div><NotebookPen size={15}/></article>)}</div> : <div className="empty-state"><NotebookPen size={24}/><div><b>Nenhum registro no diário.</b><p>Use o formulário acima para salvar o primeiro contexto da sua turma.</p></div></div>}</Panel></div>;
}

function AxiaTeacherView() {
  const search = useSearch();
  const context = new URLSearchParams(search).get("context");
  const contextualPrompt = context === "mapa" ? "No Mapa de Aprendizagem, sugira uma intervenção curta e revisável a partir dos sinais observados." : context === "atividade" ? "Nesta atividade, sugira uma adaptação que preserve o objetivo pedagógico e não entregue a resposta pronta." : context === "aluno" ? "No acompanhamento individual, ajude a interpretar a evolução sem rotular o estudante e proponha um próximo passo." : context === "turma" ? "Nesta turma, proponha perguntas para analisar participação, entregas e próximos passos sem rotular estudantes." : context === "radar" ? "No Radar de Dificuldades, ajude a transformar evidências em uma proposta de reforço revisável pelo professor." : "";
  const [prompt, setPrompt] = useState(contextualPrompt);
  const { isAuthenticated } = useAuth();
  const [reply, setReply] = useState("");
  const axiaMutation = trpc.platform.axiaChat.useMutation({ onSuccess: ({ reply }) => setReply(reply), onError: (error) => toast.error(error.message) });
  return <div className="portal-content"><SectionHead eyebrow="AXIA PARA PROFESSORES" title="Sugestões pedagógicas, nunca decisões no seu lugar." copy="Use a AXIA para sintetizar evidências, montar uma revisão ou transformar uma atividade. A revisão docente continua obrigatória antes de qualquer envio." />{!isAuthenticated && <DemoNotice />}<div className="portal-split axia-teacher-grid"><Panel title="Assistente pedagógica" subtitle="A resposta parte da sua pergunta e deve ser revisada antes de qualquer uso com a turma." icon={Bot}><div className="teacher-chat"><div className="teacher-message"><span className="axia-orb"><Sparkles size={16} /></span><p>Posso ajudar você a preparar uma revisão, refletir sobre um padrão ou adaptar uma atividade.</p></div>{reply && <div className="teacher-message axia-answer"><span className="axia-orb"><Bot size={16} /></span><p>{reply}</p></div>}<div className="suggestion-chips">{["Como preparar uma revisão de 20 minutos?", "Quais perguntas ajudam a checar entendimento?", "Transforme esta atividade em uma versão prática."].map((item) => <button key={item} onClick={() => setPrompt(item)}>{item}</button>)}</div><form className="teacher-chat-input" onSubmit={(event) => { event.preventDefault(); axiaMutation.mutate({ audience: "professor", message: prompt }); }}><textarea required value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Escreva uma pergunta para a AXIA..." /><button disabled={axiaMutation.isPending} aria-label="Enviar pergunta" type="submit"><Send size={17} /></button></form></div></Panel><Panel title="Princípios de uso" subtitle="Tecnologia com responsabilidade pedagógica." icon={ShieldCheck}><div className="principle-list"><span><CheckCircle2 size={16} /> Sugere, não decide.</span><span><CheckCircle2 size={16} /> Explica o motivo de uma recomendação.</span><span><CheckCircle2 size={16} /> Preserva dados individuais por permissão.</span><span><CheckCircle2 size={16} /> Mantém o professor no ciclo de aprovação.</span></div></Panel></div></div>;
}

function DemoStudentPreview() {
  const { isAuthenticated } = useAuth();
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const demoClasses = (classesQuery.data ?? []).filter((classroom) => classroom.code.startsWith("DEMO-"));
  const [classroomId, setClassroomId] = useState<number | undefined>();
  const activeClassroomId = demoClasses.some((classroom) => classroom.id === classroomId) ? classroomId : demoClasses[0]?.id;
  const studentsQuery = trpc.platform.classStudents.useQuery({ classroomId: activeClassroomId ?? 0 }, { enabled: Boolean(activeClassroomId) && isAuthenticated });
  const student = (studentsQuery.data ?? [])[0];
  const detailQuery = trpc.platform.studentLearningDetail.useQuery({ classroomId: activeClassroomId ?? 0, studentId: student?.id ?? 0 }, { enabled: Boolean(activeClassroomId && student?.id) && isAuthenticated });
  const detail = detailQuery.data;
  return <Panel title="Prévia do percurso do aluno · DEMO" subtitle="Leitura isolada e autorizada dos registros sintéticos; não representa uma sessão real de estudante." icon={GraduationCap} className="records-panel"><div className="class-code-row"><select value={activeClassroomId ?? ""} onChange={(event) => setClassroomId(Number(event.target.value))}><option value="">Selecionar turma DEMO</option>{demoClasses.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select><span className="lookup-result">{student ? `Estudante sintético: ${student.name ?? student.email}` : "Carregue o cenário DEMO para visualizar uma jornada sintética."}</span></div>{detailQuery.isLoading ? <div className="empty-state"><Orbit size={24}/><div><b>Carregando percurso sintético.</b><p>Consultando entregas e intervenções da turma DEMO selecionada.</p></div></div> : detail?.submissions.length ? <div className="portal-record-list">{detail.submissions.map((submission) => <article key={submission.id}><div><b>{submission.activityTitle}</b><span>{submission.subject} · {submission.status}{submission.score !== null ? ` · nota ${submission.score}` : ""}{submission.teacherFeedback ? ` · ${submission.teacherFeedback}` : ""}</span></div><span className={`signal-badge ${submission.status === "enviada" ? "atencao" : "bem"}`}>{submission.status}</span></article>)}</div> : <div className="empty-state"><GraduationCap size={24}/><div><b>Sem entregas sintéticas neste recorte.</b><p>A carga DEMO cria dados de aluno para as turmas com código DEMO.</p></div></div>}</Panel>;
}

function DemoStudentView() {
  const { isAuthenticated } = useAuth();
  const classesQuery = trpc.platform.myClasses.useQuery(undefined, { enabled: isAuthenticated });
  const demoClasses = (classesQuery.data ?? []).filter((classroom) => classroom.code.startsWith("DEMO-"));
  const [classroomId, setClassroomId] = useState<number | undefined>();
  const activeClassroomId = demoClasses.some((classroom) => classroom.id === classroomId) ? classroomId : demoClasses[0]?.id;
  const studentsQuery = trpc.platform.classStudents.useQuery({ classroomId: activeClassroomId ?? 0 }, { enabled: Boolean(activeClassroomId) && isAuthenticated });
  const student = (studentsQuery.data ?? [])[0];
  const detailQuery = trpc.platform.studentLearningDetail.useQuery({ classroomId: activeClassroomId ?? 0, studentId: student?.id ?? 0 }, { enabled: Boolean(activeClassroomId && student?.id) && isAuthenticated });
  const submissions = detailQuery.data?.submissions ?? [];
  const recognitions = detailQuery.data?.recognitions ?? [];
  const scoredSubmissions = submissions.filter((submission) => submission.score !== null);
  const averageScore = scoredSubmissions.length ? Math.round(scoredSubmissions.reduce((total, submission) => total + (submission.score ?? 0), 0) / scoredSubmissions.length) : null;
  const feedbackCount = submissions.filter((submission) => Boolean(submission.teacherFeedback)).length;
  const evolutionItems: StudentTimelineItem[] = [
    ...submissions.flatMap((submission) => {
      const items: StudentTimelineItem[] = [{ id: `demo-submission-${submission.id}`, occurredAt: submission.submittedAt ?? null, kind: "entrega", title: `Entrega registrada: ${submission.activityTitle}`, detail: "Registro sintético do percurso demonstrativo." }];
      if (submission.teacherFeedback || submission.feedbackAt) items.push({ id: `demo-feedback-${submission.id}`, occurredAt: submission.feedbackAt ?? submission.submittedAt ?? null, kind: "devolutiva", title: `Devolutiva: ${submission.activityTitle}`, detail: submission.teacherFeedback ?? "Uma devolutiva sintética foi registrada." });
      return items;
    }),
    ...recognitions.map((recognition) => ({ id: `demo-recognition-${recognition.id}`, occurredAt: recognition.awardedAt ?? null, kind: "conquista" as const, title: `Conquista: ${recognition.category}`, detail: `${recognition.sourceType === "atividade" ? "Atividade" : "Intervenção"}: ${recognition.sourceLabel}` })),
  ];
  return <div className="portal-content student-demo-page"><SectionHead eyebrow="ÁREA DO ALUNO · CENÁRIO DEMO" title={student ? `Olá, ${student.name ?? student.email}.` : "Sua jornada de aprendizagem."} copy="Visualização sintética do percurso do aluno. Os dados exibidos são exclusivamente DEMO e não representam uma sessão real." action={<span className="portal-demo-pill"><Sparkles size={13}/> DADOS SINTÉTICOS</span>} />{!isAuthenticated && <DemoNotice />}<QueryError error={classesQuery.error ?? studentsQuery.error ?? detailQuery.error} label="Não foi possível carregar a jornada DEMO do aluno." /><div className="join-class-form"><div><b>Turma demonstrativa</b><span>Escolha um recorte sintético para conhecer a experiência do aluno.</span></div><select value={activeClassroomId ?? ""} onChange={(event) => setClassroomId(Number(event.target.value))}><option value="">Selecionar turma DEMO</option>{demoClasses.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select></div><div className="portal-metrics-grid"><PortalMetric icon={ClipboardCheck} label="Entregas registradas" value={String(submissions.length)} detail="Atividades no percurso sintético." tone="magenta"/><PortalMetric icon={Trophy} label="Conquistas privadas" value={String(recognitions.length)} detail="Visíveis só nesta jornada DEMO." tone="cyan"/><PortalMetric icon={LineChart} label="Média registrada" value={averageScore === null ? "—" : String(averageScore)} detail="Apenas notas persistidas." tone="lime"/><PortalMetric icon={GraduationCap} label="Turma" value={demoClasses.find((classroom) => classroom.id === activeClassroomId)?.grade ?? "—"} detail="Recorte DEMO selecionado." tone="amber"/></div><div className="portal-split two-one"><Panel title="Minha rota de hoje" subtitle="Entregas e devolutivas registradas no cenário demonstrativo." icon={ListChecks}>{detailQuery.isLoading ? <div className="empty-state"><Orbit size={24}/><div><b>Carregando jornada DEMO.</b><p>Consultando apenas registros sintéticos autorizados.</p></div></div> : submissions.length ? <div className="portal-record-list">{submissions.map((submission) => <article key={submission.id}><div><b>{submission.activityTitle}</b><span>{submission.subject} · {submission.status}{submission.score !== null ? ` · nota ${submission.score}` : ""}{submission.teacherFeedback ? ` · ${submission.teacherFeedback}` : ""}</span></div><span className={`signal-badge ${submission.status === "enviada" ? "atencao" : "bem"}`}>{submission.status}</span></article>)}</div> : <div className="empty-state"><ClipboardCheck size={24}/><div><b>Nenhuma entrega DEMO neste recorte.</b><p>Carregue o cenário demonstrativo no painel administrativo para visualizar registros sintéticos.</p></div></div>}</Panel><Panel title="AXIA acompanha sua jornada" subtitle="A orientação valoriza autonomia e não entrega respostas prontas." icon={Bot}><div className="axia-mini"><span className="axia-orb"><Sparkles size={18}/></span><p>“A cada atividade, a AXIA pode ajudar a organizar o próximo passo, com explicações e perguntas para você pensar.”</p><span className="signal-badge bem">DEMO · ORIENTAÇÃO</span></div></Panel></div><Panel title="Minhas conquistas · DEMO" subtitle="Reconhecimentos sintéticos privados vinculados a atividades ou intervenções do mesmo percurso." icon={Trophy} className="records-panel">{detailQuery.isLoading ? <div className="empty-state"><Trophy size={24}/><div><b>Carregando conquistas DEMO.</b><p>Consultando apenas reconhecimentos sintéticos verificáveis.</p></div></div> : recognitions.length ? <div className="portal-record-list">{recognitions.map((recognition) => <article key={recognition.id}><div><b>{recognition.category}</b><span>{recognition.message ?? "Reconhecimento sintético registrado."} · {recognition.sourceType === "atividade" ? "Atividade" : "Intervenção"}: {recognition.sourceLabel}</span></div><span className={`signal-badge ${recognition.status === "conquistada" ? "bem" : "observar"}`}>{recognition.status === "conquistada" ? "conquistada" : "em andamento"}</span></article>)}</div> : <div className="empty-state"><Trophy size={24}/><div><b>Sem conquistas DEMO neste recorte.</b><p>Carregue o cenário demonstrativo para visualizar reconhecimentos sintéticos vinculados.</p></div></div>}</Panel><Panel title="Minha evolução · DEMO" subtitle="Linha do tempo sintética de entregas, devolutivas e conquistas deste mesmo percurso." icon={LineChart} className="records-panel"><StudentEvolutionTimeline items={evolutionItems}/></Panel></div>;
}

function ManagementView({ role, onOpenTeacherDemo }: { role: "coordenacao" | "diretoria" | "admin"; onOpenTeacherDemo?: () => void }) {
  const roleName = roleInfo[role].label;
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const overviewQuery = trpc.platform.overview.useQuery(undefined, { enabled: isAuthenticated });
  const institutionsQuery = trpc.platform.institutions.useQuery(undefined, { enabled: isAuthenticated && role === "admin" });
  const createInstitutionMutation = trpc.platform.createInstitution.useMutation({
    onSuccess: async () => {
      await utils.platform.institutions.invalidate();
      toast.success("Instituição criada com sucesso.");
    },
    onError: (error) => toast.error(error.message),
  });
  const createDemoScenarioMutation = trpc.platform.createDemoScenario.useMutation({
    onSuccess: async (result) => {
      await Promise.all([utils.platform.overview.invalidate(), utils.platform.institutions.invalidate(), utils.platform.institutionDirectory.invalidate(), utils.platform.institutionClassrooms.invalidate(), utils.platform.institutionStats.invalidate(), utils.platform.myClasses.invalidate(), utils.platform.myActivities.invalidate(), utils.platform.myTeacherSubmissions.invalidate(), utils.platform.attentionSignals.invalidate(), utils.platform.myJournals.invalidate()]);
      toast.success(`Cenário DEMO carregado: ${result.students} estudantes, ${result.classrooms} turmas e ${result.activities} atividades.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const overview = overviewQuery.data;
  const institutions = institutionsQuery.data ?? [];
  const adminDemoPanel = role === "admin" ? <><Panel title="Cenário demonstrativo" subtitle="Dados sintéticos para navegar pelas funções sem usar informações de estudantes reais." icon={Sparkles} className="records-panel"><div className="empty-state"><Sparkles size={24}/><div><b>Instituto Horizonte — DEMO</b><p>Cria 2 turmas, 6 estudantes fictícios, atividades, entregas, sinais, diário e intervenção. Os registros usam códigos DEMO e coexistem com dados institucionais reais.</p></div><button disabled={createDemoScenarioMutation.isPending} className="portal-button secondary" onClick={() => createDemoScenarioMutation.mutate()}>{createDemoScenarioMutation.isPending ? "Preparando cenário..." : "Carregar dados DEMO"} <Sparkles size={15}/></button><button className="portal-button primary" onClick={onOpenTeacherDemo}>Abrir painéis DEMO do professor <ArrowUpRight size={15}/></button></div></Panel><DemoStudentPreview /></> : null;
  return <div className="portal-content">
    <SectionHead eyebrow={`LEARN · ${roleName.toUpperCase()}`} title="A escola vista por camadas, não por rótulos." copy="Acompanhe o que pede apoio e aprofunde somente quando houver autorização institucional. Informações individuais nunca ficam expostas para a comunidade." action={<button className="portal-button secondary" onClick={() => document.getElementById("instituicoes-learn")?.scrollIntoView({ behavior: "smooth" })}>Instituições <ListChecks size={16} /></button>} />
    {!isAuthenticated && <DemoNotice />}
    <QueryError error={overviewQuery.error ?? institutionsQuery.error} label="Não foi possível carregar a visão institucional." />
    {adminDemoPanel}
    {role === "admin" && <Panel title="Área do aluno · DEMO" subtitle="Abra uma página completa de estudante usando apenas registros sintéticos e permissões administrativas." icon={GraduationCap} className="records-panel"><div className="empty-state"><GraduationCap size={24}/><div><b>Jornada do aluno sintético</b><p>Visualize atividades, entregas, devolutivas e a orientação da AXIA sem transformar sua conta real em conta de estudante.</p></div><button className="portal-button primary" onClick={() => setLocation("/portal?demo=aluno")}>Abrir área DEMO do aluno <ArrowUpRight size={15}/></button></div></Panel>}
    <div className="portal-metrics-grid management-metrics"><PortalMetric icon={Building2} label="Instituições" value={String(institutions.length)} detail="Registros persistidos." tone="cyan"/><PortalMetric icon={UsersRound} label="Turmas vinculadas" value={String(overview?.classrooms ?? 0)} detail="No escopo do perfil ativo." tone="magenta"/><PortalMetric icon={School} label="Atividades" value={String(overview?.activities ?? 0)} detail="Criadas nas turmas vinculadas." tone="lime"/><PortalMetric icon={Activity} label="Sinais de atenção" value={String(overview?.attentionSignals ?? 0)} detail="Revisados pela equipe pedagógica." tone="amber"/></div>
    <div className="portal-split management-grid"><Panel title="Visão da escola" subtitle="Navegação hierárquica preparada para aprofundar análises sem misturar permissões." icon={Network}><div className="school-tree"><span><Building2 size={16} /> Escola</span><i /><span><GraduationCap size={16} /> Série</span><i /><span><UsersRound size={16} /> Turma</span><i /><span><BookOpenCheck size={16} /> Matéria</span><i /><span><Target size={16} /> Conteúdo</span></div><p className="soft-copy">As turmas e atividades reais aparecem para os perfis vinculados, com o detalhamento permitido ao papel autenticado.</p></Panel><Panel title="Leitura institucional" subtitle="Indicadores simples, compreensíveis e orientados a ação." icon={LineChart}><div className="institution-signals"><article><SignalBadge tone="bem"/><p>Atividades e turmas registradas podem ser acompanhadas pelos painéis autorizados.</p></article><article><SignalBadge tone="observar"/><p>Variações de engajamento e participação são consultadas a partir das entregas persistidas.</p></article><article><SignalBadge tone="atencao"/><p>Dificuldades recorrentes podem orientar planejamento e formação.</p></article></div></Panel></div>
    {role === "admin" && <Panel title="Instituições" subtitle="Crie a organização que será usada no cadastro de turmas." icon={Building2} className="records-panel"><form id="instituicoes-learn" className="activity-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); createInstitutionMutation.mutate({ name: String(form.get("name")), code: String(form.get("code")) }); }}><div className="form-two"><label>Nome da instituição<input name="name" required placeholder="Ex.: Escola Learn" /></label><label>Código institucional<input name="code" required minLength={2} maxLength={24} placeholder="Ex.: LEARN-SP" /></label></div><button disabled={createInstitutionMutation.isPending} className="portal-button primary" type="submit">{createInstitutionMutation.isPending ? "Criando..." : "Criar instituição"} <Building2 size={15}/></button></form><div className="portal-record-list">{institutions.map((institution) => <article key={institution.id}><div><b>{institution.name}</b><span>Código institucional: {institution.code}</span></div><span className="signal-badge bem">ATIVA</span></article>)}</div></Panel>}
  </div>;
}

const initialInstitutionalFilters = { turma: "Todas as turmas", serie: "Todas as séries", materia: "Todas as matérias", periodo: "Este período" };
type InstitutionalFilterState = typeof initialInstitutionalFilters;

type InstitutionalClassroom = { id: number; name: string; grade: string };

function InstitutionalFilters({ compact = false, filters, onChange, classrooms = [], classroomId, onClassroomChange, error }: { compact?: boolean; filters: InstitutionalFilterState; onChange: (next: InstitutionalFilterState) => void; classrooms?: InstitutionalClassroom[]; classroomId?: number; onClassroomChange?: (id: number | undefined) => void; error?: string }) {
  const summary = Object.values(filters).join(" · ");
  const scopeTitle = filters.turma === "Sem dados conectados" ? "Aguardando o vínculo de uma turma" : `Recorte ativo: ${filters.turma}`;
  const optionsByKey: Record<string, string[]> = {
    serie: ["Todas as séries", ...Array.from(new Set(classrooms.map((item) => item.grade)))],
    materia: ["Todas as matérias", "Matemática", "Português", "Ciências", "História", "Geografia"],
    periodo: ["Este período", "Últimos 30 dias", "Últimos 90 dias", "Últimos 180 dias"],
  };
  return <div className={`institution-filters ${compact ? "compact" : ""}`}><span><ListChecks size={15}/> FILTROS INSTITUCIONAIS</span><div>{Object.entries(filters).map(([key, value]) => <label key={key}>{key}{key === "turma" && classrooms.length ? <select value={classroomId ?? ""} onChange={(event) => { const id = event.target.value ? Number(event.target.value) : undefined; const classroom = classrooms.find((item) => item.id === id); onClassroomChange?.(id); onChange({ ...filters, turma: classroom ? `${classroom.name} · ${classroom.grade}` : "Todas as turmas" }); }}><option value="">Todas as turmas</option>{classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.grade}</option>)}</select> : <select value={value} onChange={(event) => onChange({ ...filters, [key]: event.target.value })}>{(optionsByKey[key] ?? [value]).map((option) => <option key={option} value={option}>{option}</option>)}</select>}</label>)}</div>{error ? <p className="filter-outcome"><b>Não foi possível atualizar este recorte:</b> {error}</p> : <p className="filter-outcome" aria-live="polite"><b>Leitura ajustada para:</b> {summary}. Os indicadores deste módulo são consultados de acordo com o recorte selecionado.</p>}<article className="filter-scenario" key={summary}><span>RECORTE APLICADO</span><b>{scopeTitle}</b><small>{filters.serie} · {filters.materia} · {filters.periodo}. Turma, série, matéria e período alteram as contagens deste painel.</small></article></div>;
}

function useInstitutionalScope(filters: InstitutionalFilterState) {
  const { isAuthenticated } = useAuth();
  const [classroomId, setClassroomId] = useState<number | undefined>();
  const classroomsQuery = trpc.platform.institutionClassrooms.useQuery(undefined, { enabled: isAuthenticated });
  const periodDays = filters.periodo === "Últimos 30 dias" ? 30 : filters.periodo === "Últimos 90 dias" ? 90 : filters.periodo === "Últimos 180 dias" ? 180 : undefined;
  const grade = filters.serie === "Todas as séries" ? undefined : filters.serie;
  const subject = filters.materia === "Todas as matérias" ? undefined : filters.materia;
  const statsInput = classroomId ? { classroomId, subject, periodDays } : { grade, subject, periodDays };
  const statsQuery = trpc.platform.institutionStats.useQuery(statsInput, { enabled: isAuthenticated });
  return { isAuthenticated, classroomId, setClassroomId, classrooms: classroomsQuery.data ?? [], stats: statsQuery.data, statsLoading: statsQuery.isLoading, error: classroomsQuery.error ?? statsQuery.error };
}

function SchoolView() {
  const [filters, setFilters] = useState(initialInstitutionalFilters);
  const { isAuthenticated } = useAuth();
  const [institutionId, setInstitutionId] = useState<number | undefined>();
  const institutionsQuery = trpc.platform.institutionDirectory.useQuery(undefined, { enabled: isAuthenticated });
  const statsQuery = trpc.platform.institutionStats.useQuery(institutionId ? { institutionId } : undefined, { enabled: isAuthenticated });
  const institutions = institutionsQuery.data ?? [];
  const stats = statsQuery.data;
  return <div className="portal-content"><SectionHead eyebrow="VISÃO DA ESCOLA" title={`Da escola ao conteúdo: ${filters.turma}.`} copy="A navegação hierárquica foi preparada para estruturar análises agregadas e aprofundamentos que respeitam a permissão de cada perfil." />{!isAuthenticated && <DemoNotice />}<QueryError error={institutionsQuery.error ?? statsQuery.error} label="Não foi possível carregar a visão da escola." /><InstitutionalFilters filters={filters} onChange={setFilters}/><Panel title="Escopo institucional" subtitle="Selecione uma instituição para aplicar o recorte real de turmas, atividades e sinais." icon={Building2}><div className="class-code-row"><select aria-label="Instituição" value={institutionId ?? ""} onChange={(event) => setInstitutionId(event.target.value ? Number(event.target.value) : undefined)}><option value="">Todas as instituições disponíveis</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name} · {institution.code}</option>)}</select><span className="lookup-result">{statsQuery.error ? "Falha ao atualizar os indicadores." : statsQuery.isLoading ? "Atualizando indicadores..." : `${stats?.classrooms ?? 0} turma(s) · ${stats?.activities ?? 0} atividade(s) · ${stats?.signals ?? 0} sinal(is)`}</span></div></Panel><div className="portal-metrics-grid"><PortalMetric icon={UsersRound} label="Turmas no recorte" value={String(stats?.classrooms ?? 0)} detail="Consulta institucional atual." tone="cyan"/><PortalMetric icon={ClipboardCheck} label="Atividades" value={String(stats?.activities ?? 0)} detail="Publicadas ou em rascunho." tone="magenta"/><PortalMetric icon={Radar} label="Sinais" value={String(stats?.signals ?? 0)} detail="Evidências registradas." tone="amber"/><PortalMetric icon={Building2} label="Instituições" value={String(institutions.length)} detail="Disponíveis ao perfil." tone="lime"/></div><Panel title={`Percurso institucional · ${filters.serie}`} subtitle={`Escola → Série → Turma → Matéria → Conteúdo · ${filters.materia}.`} icon={Network}><div className="school-tree large"><span><Building2 size={16}/> Escola</span><i/><span><GraduationCap size={16}/> {filters.serie}</span><i/><span><UsersRound size={16}/> {filters.turma}</span><i/><span><BookOpenCheck size={16}/> {filters.materia}</span><i/><span><Target size={16}/> Conteúdo</span></div><div className="empty-state"><Network size={26}/><div><b>{statsQuery.error ? "Indicadores indisponíveis para este recorte." : `Panorama filtrado para ${filters.turma}.`}</b><p>{statsQuery.error ? "Revise a conexão e tente novamente. O detalhamento individual permanece protegido pelas permissões do perfil." : "As contagens acima já refletem a instituição escolhida. O detalhamento individual continua protegido pelas permissões do perfil."}</p></div></div></Panel></div>;
}

function EvolutionView() {
  const [filters, setFilters] = useState(initialInstitutionalFilters);
  const scope = useInstitutionalScope(filters);
  return <div className="portal-content"><SectionHead eyebrow="EVOLUÇÃO" title={`Movimentos de ${filters.turma}, em ${filters.periodo}.`} copy="Os relatórios consolidados ajudam a escola a reconhecer avanços e identificar conteúdos que podem precisar de mais suporte." />{!scope.isAuthenticated && <DemoNotice />}<InstitutionalFilters filters={filters} onChange={setFilters} classrooms={scope.classrooms} classroomId={scope.classroomId} onClassroomChange={scope.setClassroomId} error={scope.error?.message}/><div className="portal-split management-grid"><Panel title={`Evolução por turma · ${filters.turma}`} subtitle={`Atividades reais registradas no período: ${filters.periodo}.`} icon={LineChart}><div className="chart-empty"><LineChart size={29}/><strong>{scope.stats?.activities ?? 0} atividade(s) registrada(s)</strong><span>{scope.error ? "Não foi possível carregar este recorte." : scope.statsLoading ? "Atualizando o recorte da turma..." : "O gráfico evolutivo será composto conforme as entregas forem avaliadas."}</span></div></Panel><Panel title={`Evidências · ${filters.materia}`} subtitle={`Sinais agregados, sem exposição individual na visão ampla de ${filters.serie}.`} icon={BookOpenCheck}><div className="chart-empty"><BookOpenCheck size={29}/><strong>{scope.stats?.signals ?? 0} sinal(is) pedagógico(s)</strong><span>O recorte atual preserva a privacidade dos estudantes e prioriza {filters.materia}.</span></div></Panel></div></div>;
}

function AttentionCenterView() {
  const [filters, setFilters] = useState(initialInstitutionalFilters);
  const scope = useInstitutionalScope(filters);
  return <div className="portal-content"><SectionHead eyebrow="CENTRAL DE ATENÇÃO" title={`Ações em foco: ${filters.turma}.`} copy="Prazos, entregas, padrões de dificuldade e necessidades de apoio aparecem em uma fila de ação vinculada à autorização institucional." />{!scope.isAuthenticated && <DemoNotice />}<InstitutionalFilters compact filters={filters} onChange={setFilters} classrooms={scope.classrooms} classroomId={scope.classroomId} onClassroomChange={scope.setClassroomId} error={scope.error?.message}/><Panel title={`Fila de acompanhamento · ${filters.materia}`} subtitle={`Recorte: ${filters.serie} · ${filters.periodo}.`} icon={BellRing}><div className="attention-center-empty"><BellRing size={27}/><div><b>{scope.error ? "Não foi possível carregar a fila deste recorte." : `${scope.stats?.signals ?? 0} sinal(is) aguardando leitura institucional.`}</b><p>{scope.statsLoading ? "Atualizando a fila da turma selecionada..." : "O número é calculado a partir dos sinais registrados no recorte escolhido. A abertura individual permanece disponível somente aos perfis autorizados."}</p></div></div></Panel></div>;
}

function ReportsView() {
  const [report, setReport] = useState("Relatório da turma");
  const [filters, setFilters] = useState(initialInstitutionalFilters);
  const scope = useInstitutionalScope(filters);
  const [generated, setGenerated] = useState(false);
  return <div className="portal-content"><SectionHead eyebrow="RELATÓRIOS" title={`Relatórios de ${filters.turma}, sem perder o contexto.`} copy="Professor e gestão podem gerar leituras por turma, matéria ou período a partir dos registros persistidos." />{!scope.isAuthenticated && <DemoNotice />}<InstitutionalFilters compact filters={filters} onChange={setFilters} classrooms={scope.classrooms} classroomId={scope.classroomId} onClassroomChange={scope.setClassroomId} error={scope.error?.message}/><Panel title={`Preparar relatório · ${filters.periodo}`} subtitle={`Estrutura pronta para ${filters.serie} · ${filters.materia}.`} icon={ClipboardCheck}><div className="report-builder"><label>Tipo de relatório<select value={report} onChange={(event) => setReport(event.target.value)}><option>Relatório da turma</option><option>Evolução por matéria</option><option>Visão institucional</option><option>Versão para responsáveis</option></select></label><div><b>{report}</b><p>{scope.error ? "Não foi possível carregar os indicadores deste recorte." : `Usará o recorte ${filters.turma} · ${filters.materia} e os indicadores reais disponíveis.`}</p></div><button disabled={Boolean(scope.error)} className="portal-button primary" onClick={() => setGenerated(true)}>Preparar relatório <ClipboardCheck size={15}/></button></div>{generated && <div className="filter-scenario"><span>RELATÓRIO PREPARADO</span><b>{report} · {filters.periodo}</b><small>{scope.stats?.classrooms ?? 0} turma(s), {scope.stats?.activities ?? 0} atividade(s) e {scope.stats?.signals ?? 0} sinal(is) no recorte institucional atual.</small></div>}</Panel></div>;
}

function PermissionsView() {
  const labels: Record<PlatformPermission, string> = { "student:self:read": "Próprios dados", "student:submission:write": "Enviar atividades", "classroom:read": "Ler turmas", "classroom:manage": "Gerir turmas", "activity:manage": "Criar atividades", "student:detail:read": "Detalhe do aluno", "signal:read": "Ler sinais", "intervention:manage": "Gerir intervenções", "institution:read": "Ler instituição", "report:read": "Ler relatórios", "institution:manage": "Gerir instituição", "permission:manage": "Gerir permissões" };
  const { user, isAuthenticated, refresh } = useAuth();
  const updateRoleMutation = trpc.platform.updateUserRole.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Papel atualizado. O usuário verá os módulos correspondentes no próximo acesso.");
    },
    onError: (error) => toast.error(error.message),
  });
  return <div className="portal-content"><SectionHead eyebrow="PERMISSÕES" title="Cada perfil vê somente o que precisa para cuidar bem." copy="A matriz abaixo orienta os guardas da plataforma. O administrador pode atribuir papéis a usuários que já entraram pelo menos uma vez." />{!isAuthenticated && <DemoNotice />}<Panel title="Matriz de acesso" subtitle="Permissões técnicas aplicadas em contratos protegidos e visíveis de forma transparente." icon={ShieldCheck}><div className="permission-matrix"><div className="permission-row matrix-head"><span>Recurso</span>{platformRoles.map((role) => <span key={role}>{roleLabels[role]}</span>)}</div>{(Object.keys(labels) as PlatformPermission[]).map((permission) => <div className="permission-row" key={permission}><span>{labels[permission]}</span>{platformRoles.map((role) => <span key={role}>{permissionsByRole[role].includes(permission) ? <CheckCircle2 size={15}/> : <i>—</i>}</span>)}</div>)}</div></Panel>{user?.role === "admin" && <Panel title="Atribuir papel" subtitle="O usuário precisa já ter autenticado no portal para que o e-mail esteja registrado." icon={ShieldCheck} className="records-panel"><form className="activity-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); updateRoleMutation.mutate({ email: String(form.get("email")), role: String(form.get("role")) as "aluno" | "professor" | "coordenacao" | "diretoria" | "admin" }); }}><div className="form-two"><label>E-mail do usuário<input name="email" type="email" required placeholder="pessoa@escola.edu.br" /></label><label>Papel<select name="role" defaultValue="professor"><option value="aluno">Aluno</option><option value="professor">Professor</option><option value="coordenacao">Coordenação</option><option value="diretoria">Diretoria</option><option value="admin">Administrador</option></select></label></div><button className="portal-button primary" disabled={updateRoleMutation.isPending} type="submit">{updateRoleMutation.isPending ? "Atualizando..." : "Atualizar papel"} <ShieldCheck size={15}/></button></form></Panel>}</div>;
}

function RecognitionsView() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"todos" | "andamento" | "conquistados">("todos");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editStatus, setEditStatus] = useState<"em_andamento" | "conquistada">("conquistada");
  const recognitionsQuery = trpc.platform.myRecognitions.useQuery(undefined, { enabled: isAuthenticated });
  const updateRecognitionMutation = trpc.platform.updateRecognition.useMutation({
    onSuccess: async () => {
      await utils.platform.myRecognitions.invalidate();
      setEditingId(null);
      toast.success("Reconhecimento atualizado. A origem vinculada foi preservada.");
    },
    onError: (error) => toast.error(error.message),
  });
  const recognitions = recognitionsQuery.data ?? [];
  const visibleRecognitions = filter === "todos" ? recognitions : recognitions.filter((recognition) => recognition.status === (filter === "andamento" ? "em_andamento" : "conquistada"));
  const conqueredCount = recognitions.filter((recognition) => recognition.status === "conquistada").length;
  const progressingCount = recognitions.filter((recognition) => recognition.status === "em_andamento").length;
  const progressPercentage = recognitions.length ? Math.round((conqueredCount / recognitions.length) * 100) : 0;
  const iconForCategory = (category: string) => category.toLowerCase().includes("cri") ? Sparkles : category.toLowerCase().includes("part") ? UsersRound : category.toLowerCase().includes("ded") ? CheckCircle2 : Trophy;
  const toneForCategory = (category: string) => category.toLowerCase().includes("cri") ? "magenta" : category.toLowerCase().includes("part") ? "cyan" : category.toLowerCase().includes("ded") ? "lime" : "amber";
  const editingRecognition = recognitions.find((recognition) => recognition.id === editingId);
  const openEditor = (recognition: typeof recognitions[number]) => {
    setEditingId(recognition.id);
    setEditCategory(recognition.category);
    setEditMessage(recognition.message ?? "");
    setEditStatus(recognition.status);
  };
  return <div className="portal-content recognitions-map-page"><header className="recognitions-map-head"><div><div className="recognitions-breadcrumb">Início <ChevronRight size={13}/> Reconhecimentos</div><h1>Mapa de Conquistas</h1><p>Celebre cada passo da jornada com registros reais, atribuídos e acompanhados no portal.</p><div className="recognitions-tabs"><button className={filter === "todos" ? "active" : ""} onClick={() => setFilter("todos")}>Todas</button><button className={filter === "andamento" ? "active" : ""} onClick={() => setFilter("andamento")}>Em andamento</button><button className={filter === "conquistados" ? "active" : ""} onClick={() => setFilter("conquistados")}>Conquistadas</button></div></div><section className="recognitions-total-card"><span className="recognition-total-icon"><Trophy size={28}/></span><div><small>Total de conquistas</small><strong>{conqueredCount} <i>/ {recognitions.length}</i></strong></div><b>{progressPercentage}%</b><div className="recognition-total-progress"><i style={{ width: `${progressPercentage}%` }}/></div></section></header>{!isAuthenticated && <DemoNotice />}<QueryError error={recognitionsQuery.error} label="Não foi possível carregar os reconhecimentos." />{recognitionsQuery.isLoading ? <div className="empty-state"><Trophy size={25}/><div><b>Carregando mapa de conquistas.</b><p>Consultando os reconhecimentos com origem persistida nas turmas autorizadas.</p></div></div> : visibleRecognitions.length ? <div className="recognition-map-grid">{visibleRecognitions.map((recognition) => { const Icon = iconForCategory(recognition.category); const tone = toneForCategory(recognition.category); const isConquered = recognition.status === "conquistada"; const sourceLabel = `${recognition.sourceType === "atividade" ? "Atividade" : "Intervenção"}: ${recognition.sourceLabel}`; const target = recognition.sourceType === "atividade" ? `/portal/atividades?focus=${recognition.activityId}` : `/portal/radar?focus=${recognition.interventionId}`; const openSource = () => setLocation(target); return <article key={recognition.id} role="button" tabIndex={0} onClick={openSource} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openSource(); } }} className={`recognition-map-card recognition-link-card ${tone} ${isConquered ? "conquered" : "progressing"}`}><div className="recognition-card-stars">✦ · ✧ · ✦</div><span className="recognition-map-icon"><Icon size={37}/></span><h2>{recognition.category}</h2><p>{recognition.message ?? `Reconhecimento atribuído a ${recognition.studentName ?? recognition.studentEmail ?? "estudante"}.`}</p><span className="recognition-origin">{sourceLabel}</span><small>{recognition.studentName ?? recognition.studentEmail ?? "Estudante"} · {new Date(recognition.awardedAt).toLocaleDateString("pt-BR")}</small><b>{isConquered ? "Conquistada" : "Em andamento"}</b><div className="recognition-card-actions"><button className="recognition-action open" onClick={(event) => { event.stopPropagation(); openSource(); }}>Abrir origem <ArrowUpRight size={13}/></button><button className="recognition-action edit" onClick={(event) => { event.stopPropagation(); openEditor(recognition); }}><PencilLine size={13}/> Editar</button></div></article>; })}</div> : <div className="empty-state recognitions-empty"><Trophy size={27}/><div><b>{filter === "andamento" ? "Nenhum reconhecimento em andamento com origem vinculada." : filter === "conquistados" ? "Nenhuma conquista vinculada registrada." : "Seu mapa ainda não tem reconhecimentos vinculados."}</b><p>O mapa exibe apenas registros associados a uma atividade ou intervenção específica, para manter o acompanhamento verificável.</p></div></div>}<footer className="recognitions-summary"><div><span className="recognition-summary-icon"><Sparkles size={24}/></span><div><b>Continue evoluindo.</b><p>Cada reconhecimento é um passo em direção ao seu melhor.</p></div></div><section><span><b>{conqueredCount}</b><small>Conquistadas</small></span><span><b>{progressingCount}</b><small>Em andamento</small></span><span><b>{recognitions.length}</b><small>Registros totais</small></span></section></footer>{editingRecognition && <div className="recognition-edit-backdrop" role="presentation" onMouseDown={() => setEditingId(null)}><form className="recognition-edit-dialog" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); updateRecognitionMutation.mutate({ recognitionId: editingRecognition.id, category: editCategory, message: editMessage || undefined, status: editStatus }); }}><div><span className="tiny-label">EDITAR RECONHECIMENTO</span><h2>{editingRecognition.studentName ?? editingRecognition.studentEmail ?? "Estudante"}</h2><p>{editingRecognition.sourceType === "atividade" ? "Atividade" : "Intervenção"}: {editingRecognition.sourceLabel}. A origem não pode ser alterada neste editor.</p></div><label>Categoria<input required minLength={2} maxLength={70} value={editCategory} onChange={(event) => setEditCategory(event.target.value)} /></label><label>Mensagem<textarea maxLength={12000} value={editMessage} onChange={(event) => setEditMessage(event.target.value)} /></label><label>Status<select value={editStatus} onChange={(event) => setEditStatus(event.target.value as "em_andamento" | "conquistada")}><option value="em_andamento">Em andamento</option><option value="conquistada">Conquistada</option></select></label><div className="form-actions"><button type="button" className="portal-button secondary" onClick={() => setEditingId(null)}>Cancelar</button><button type="submit" disabled={updateRecognitionMutation.isPending} className="portal-button primary">{updateRecognitionMutation.isPending ? "Salvando..." : "Salvar edição"} <CheckCircle2 size={15}/></button></div></form></div>}</div>;
}

function PortalBody({ role, section, onOpenTeacherDemo }: { role: PortalRole; section: string; onOpenTeacherDemo?: () => void }) {
  if (role === "aluno") return <StudentView />;
  if (role === "professor") {
    if (section === "turmas") return <ClassesView />;
    if (section === "alunos") return <StudentDetailView />;
    if (section === "atividades") return <ActivitiesView />;
    if (section === "conquistas") return <RecognitionsView />;
    if (section === "mapa") return <LearningMapView />;
    if (section === "radar") return <RadarView />;
    if (section === "diario") return <DiaryView />;
    if (section === "axia") return <AxiaTeacherView />;
    return <TeacherOverview />;
  }
  if (section === "escola") return <SchoolView />;
  if (section === "evolucao") return <EvolutionView />;
  if (section === "atencao") return <AttentionCenterView />;
  if (section === "relatorios") return <ReportsView />;
  if (section === "permissoes") return <PermissionsView />;
  return <ManagementView role={role} onOpenTeacherDemo={onOpenTeacherDemo} />;
}

function PortalLogin({ loading }: { loading: boolean }) {
  const benefits = [{ icon: BrainCircuit, title: "AXIA Inteligente", copy: "Entende, orienta e adapta a aprendizagem." }, { icon: LineChart, title: "Aprendizagem adaptativa", copy: "Conteúdos no ritmo e estilo de cada estudante." }, { icon: Trophy, title: "Gamificação e conquistas", copy: "Motivação que acompanha engajamento e resultados reais." }, { icon: ShieldCheck, title: "Segurança e privacidade", copy: "Dados protegidos e permissões institucionais reais." }];
  return <div className="learn-login"><header><a href="/"><img src="/manus-storage/axia-neon-mark_befbeb3c.png" alt="Símbolo Learn Educação"/><span><b>LEARN</b><small>EDUCAÇÃO</small></span></a><span>Precisa de ajuda?</span></header><main><section className="learn-login-copy"><span>ACESSO INSTITUCIONAL PROTEGIDO</span><h1>Aprender hoje,<br/><em>transformar</em><br/>o amanhã.</h1><p>O Learn Educação com AXIA conecta a jornada de estudo, o trabalho docente e a leitura institucional em uma plataforma com acesso responsável.</p><div className="learn-login-benefits">{benefits.map(({ icon: Icon, title, copy }) => <article key={title}><i><Icon size={21}/></i><div><b>{title}</b><small>{copy}</small></div></article>)}</div><div className="learn-login-diamond"><span/><i/><b/></div></section><aside className="learn-login-card"><h2>Entrar na sua conta</h2><p>Acesse o Learn Educação com sua conta institucional autorizada.</p><div className="learn-login-field"><span>Conta institucional</span><b>Seu perfil será identificado após o login.</b></div><button disabled={loading} onClick={() => startLogin()}>{loading ? "Verificando acesso..." : "Entrar com minha conta"}<ArrowUpRight size={17}/></button><div className="learn-login-divider"><i/>ou entre com o provedor conectado<i/></div><div className="learn-login-note"><b>Novo na instituição?</b><span>Aluno, professor, gestão e administração recebem o papel correto por vínculo ou convite institucional.</span></div><div className="learn-login-roles"><span><GraduationCap size={18}/><b>Aluno</b><small>Minha jornada</small></span><span><UsersRound size={18}/><b>Professor</b><small>Painel docente</small></span><span><Building2 size={18}/><b>Gestão</b><small>Visão escolar</small></span><span><ShieldCheck size={18}/><b>Admin</b><small>Estrutura</small></span></div></aside></main><footer>© 2026 Learn Educação — AXIA Neon · Privacidade · Termos de uso</footer></div>;
}

function PendingAccessView({ name }: { name?: string | null }) {
  return <div className="relative min-h-screen overflow-hidden bg-[#040818] px-5 py-6 text-white sm:px-10"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(73,214,255,.18),transparent_26rem),radial-gradient(circle_at_18%_78%,rgba(255,76,218,.16),transparent_28rem)]"/><main className="relative mx-auto flex min-h-[calc(100vh-48px)] max-w-3xl items-center"><section className="w-full border border-[#49d6ff]/30 bg-[#0b1634]/85 p-8 shadow-[0_24px_70px_rgba(0,0,0,.42)] backdrop-blur-xl sm:p-12"><span className="inline-flex h-12 w-12 items-center justify-center border border-[#49d6ff]/40 bg-[#49d6ff]/10 text-[#49d6ff]"><ShieldCheck size={23}/></span><span className="mt-7 block text-[10px] font-extrabold tracking-[.17em] text-[#49d6ff]">CONTA AUTENTICADA · VÍNCULO PENDENTE</span><h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">Olá, {name ?? "pessoa"}.<br/>Seu acesso ainda está sendo <em className="not-italic text-[#ff4cda]">vinculado.</em></h1><p className="mt-6 max-w-2xl text-sm leading-7 text-[#b6c3dd]">Para proteger dados de estudantes e instituições, uma conta nova não recebe um papel de aluno, professor ou gestão automaticamente. Peça à equipe responsável para associar sua conta ao papel e à instituição corretos.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="border border-white/10 bg-white/[.035] p-4 text-sm"><b className="block text-[#e8f3ff]">Aluno</b><span className="mt-1 block text-xs leading-5 text-[#9aa8c4]">Recebe acesso depois de a conta ser vinculada e ingressar na turma autorizada.</span></div><div className="border border-white/10 bg-white/[.035] p-4 text-sm"><b className="block text-[#e8f3ff]">Equipe escolar</b><span className="mt-1 block text-xs leading-5 text-[#9aa8c4]">Professor, coordenação, diretoria e administração são liberados por convite ou atribuição de papel.</span></div></div><a href="/" className="mt-8 inline-flex min-h-11 items-center gap-2 border border-[#49d6ff]/35 px-4 text-xs font-extrabold text-[#d9f5ff]">Voltar ao site público <ArrowUpRight size={15}/></a></section></main></div>;
}

export default function Portal() {
  const { user, isAuthenticated, loading } = useAuth();
  const [adminDemoRole, setAdminDemoRole] = useState<"professor" | null>(null);
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const authenticatedRole = roleFromAuthenticatedUser(user?.role);
  const isAdminTeacherDemo = isAuthenticated && authenticatedRole === "admin" && adminDemoRole === "professor";
  const isAdminStudentDemo = isAuthenticated && authenticatedRole === "admin" && new URLSearchParams(search).get("demo") === "aluno";
  const isAdminDemo = isAdminTeacherDemo || isAdminStudentDemo;
  const role = isAdminStudentDemo ? "aluno" : isAdminTeacherDemo ? "professor" : (authenticatedRole ?? "aluno");
  const section = location.split("?")[0].split("/")[2] || "visao";
  const nav = useMemo(() => role === "aluno" ? studentNav : role === "professor" ? teacherNav : managementNav, [role]);

  if (!isAuthenticated) return <PortalLogin loading={loading} />;
  if (!authenticatedRole) return <PendingAccessView name={user?.name} />;

  return <DashboardLayout menuItems={nav} title="LEARN · PORTAL" preview={isAdminDemo}><div className="portal-root"><header className="portal-top"><button className="portal-wordmark" onClick={() => setLocation("/")}><img src="/manus-storage/axia-neon-mark_befbeb3c.png" alt="Símbolo orbital da Learn Educação" /><span><b>LEARN</b><small>EDUCAÇÃO · PORTAL</small></span></button><div className="portal-top-meta">{isAdminDemo && <span className="portal-demo-pill"><Sparkles size={12} /> CENÁRIO DEMO SINTÉTICO</span>}<button className="back-home" onClick={() => setLocation("/")}>Site público <ArrowUpRight size={14} /></button></div></header><div className="role-strip"><div><span>{isAdminDemo ? "VISUALIZAÇÃO DEMO" : "ACESSO AUTORIZADO"}</span><p>{roleInfo[role].label} · {roleInfo[role].caption}</p></div>{authenticatedRole === "admin" && <button className="portal-button secondary" onClick={() => { if (isAdminDemo) { setAdminDemoRole(null); setLocation("/portal"); } else { setAdminDemoRole("professor"); setLocation("/portal"); } }}>{isAdminDemo ? "Voltar à gestão" : "Abrir DEMO docente"} <ArrowUpRight size={15}/></button>}</div><PortalBody role={role} section={section} onOpenTeacherDemo={() => { setAdminDemoRole("professor"); setLocation("/portal"); }} /></div></DashboardLayout>;
}
