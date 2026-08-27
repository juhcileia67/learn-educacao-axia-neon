import { and, count, desc, eq, gte, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activities,
  activityAssignments,
  classrooms,
  classMemberships,
  InsertUser,
  institutions,
  interventions,
  learningSignals,
  recognitions,
  submissions,
  teacherJournals,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

/** Dados persistidos: o portal nunca trata amostras visuais como dados reais. */
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserRoleByEmail(input: { email: string; role: "aluno" | "professor" | "coordenacao" | "diretoria" | "admin" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(users).set({ role: input.role }).where(eq(users.email, input.email));
  if (!result[0].affectedRows) throw new Error("Nenhum usuário autenticado foi encontrado com este e-mail");
}

export async function listClassesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      grade: classrooms.grade,
      code: classrooms.code,
      institutionName: institutions.name,
      memberRole: classMemberships.memberRole,
    })
    .from(classMemberships)
    .innerJoin(classrooms, eq(classMemberships.classroomId, classrooms.id))
    .innerJoin(institutions, eq(classrooms.institutionId, institutions.id))
    .where(eq(classMemberships.userId, userId));
}

export async function listInstitutions() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: institutions.id, name: institutions.name, code: institutions.code }).from(institutions).orderBy(institutions.name);
}

export async function listInstitutionClassrooms() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: classrooms.id, name: classrooms.name, grade: classrooms.grade, institutionName: institutions.name })
    .from(classrooms).innerJoin(institutions, eq(classrooms.institutionId, institutions.id)).orderBy(institutions.name, classrooms.grade, classrooms.name);
}

export async function getInstitutionStats(input: { institutionId?: number; classroomId?: number; grade?: string; subject?: string; periodDays?: number } = {}) {
  const db = await getDb();
  if (!db) return { classrooms: 0, activities: 0, signals: 0 };
  const classRows = input.classroomId
    ? await db.select({ id: classrooms.id }).from(classrooms).where(eq(classrooms.id, input.classroomId))
    : input.institutionId && input.grade
    ? await db.select({ id: classrooms.id }).from(classrooms).where(and(eq(classrooms.institutionId, input.institutionId), eq(classrooms.grade, input.grade)))
    : input.institutionId
    ? await db.select({ id: classrooms.id }).from(classrooms).where(eq(classrooms.institutionId, input.institutionId))
    : input.grade
    ? await db.select({ id: classrooms.id }).from(classrooms).where(eq(classrooms.grade, input.grade))
    : await db.select({ id: classrooms.id }).from(classrooms);
  const classIds = classRows.map((item) => item.id);
  if (!classIds.length) return { classrooms: 0, activities: 0, signals: 0 };
  const since = input.periodDays ? new Date(Date.now() - input.periodDays * 24 * 60 * 60 * 1000) : undefined;
  const activityConditions = [inArray(activities.classroomId, classIds), ...(input.subject ? [eq(activities.subject, input.subject)] : []), ...(since ? [gte(activities.createdAt, since)] : [])];
  const signalConditions = [inArray(learningSignals.classroomId, classIds), ...(input.subject ? [eq(learningSignals.subject, input.subject)] : []), ...(since ? [gte(learningSignals.createdAt, since)] : [])];
  const [activityCount] = await db.select({ value: count() }).from(activities).where(and(...activityConditions));
  const [signalCount] = await db.select({ value: count() }).from(learningSignals).where(and(...signalConditions));
  return { classrooms: classIds.length, activities: activityCount?.value ?? 0, signals: signalCount?.value ?? 0 };
}

export async function createInstitution(input: { name: string; code: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(institutions).values(input);
  return Number(result[0].insertId);
}

/** Cenário idempotente e sintético, destinado exclusivamente à demonstração do portal. */
export async function createDemoScenario(adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(institutions).values({ name: "Instituto Horizonte — DEMO", code: "DEMO-HORIZONTE" })
    .onDuplicateKeyUpdate({ set: { name: "Instituto Horizonte — DEMO" } });
  const [institution] = await db.select().from(institutions).where(eq(institutions.code, "DEMO-HORIZONTE")).limit(1);
  if (!institution) throw new Error("Não foi possível criar a instituição demonstrativa");

  const studentSpecs = [
    ["diana.pereira@demo.learn", "Diana Pereira"], ["gabriel.souza@demo.learn", "Gabriel Souza"],
    ["helena.alves@demo.learn", "Helena Alves"], ["lucas.ramos@demo.learn", "Lucas Ramos"],
    ["marina.costa@demo.learn", "Marina Costa"], ["thiago.lima@demo.learn", "Thiago Lima"],
  ] as const;
  const studentIds: number[] = [];
  for (const [email, name] of studentSpecs) {
    const openId = `demo-${email}`;
    await db.insert(users).values({ openId, email, name, loginMethod: "demo", role: "aluno", lastSignedIn: new Date() })
      .onDuplicateKeyUpdate({ set: { name, email, role: "aluno", lastSignedIn: new Date() } });
    const [student] = await db.select({ id: users.id }).from(users).where(eq(users.openId, openId)).limit(1);
    if (student) studentIds.push(student.id);
  }

  const classSpecs = [
    { code: "DEMO-8A", name: "8º A · Exploradores", grade: "8º ano" },
    { code: "DEMO-8B", name: "8º B · Criadores", grade: "8º ano" },
  ];
  const demoClasses: Array<{ id: number; code: string }> = [];
  for (const spec of classSpecs) {
    await db.insert(classrooms).values({ ...spec, institutionId: institution.id, createdById: adminId })
      .onDuplicateKeyUpdate({ set: { name: spec.name, grade: spec.grade } });
    const [classroom] = await db.select({ id: classrooms.id, code: classrooms.code }).from(classrooms).where(eq(classrooms.code, spec.code)).limit(1);
    if (!classroom) continue;
    demoClasses.push(classroom);
    await db.insert(classMemberships).values({ classroomId: classroom.id, userId: adminId, memberRole: "professor" })
      .onDuplicateKeyUpdate({ set: { memberRole: "professor", joinedAt: new Date() } });
  }
  for (let index = 0; index < studentIds.length; index += 1) {
    const studentId = studentIds[index];
    const classroom = demoClasses[index % demoClasses.length];
    if (!classroom) continue;
    await db.insert(classMemberships).values({ classroomId: classroom.id, userId: studentId, memberRole: "aluno" })
      .onDuplicateKeyUpdate({ set: { memberRole: "aluno", joinedAt: new Date() } });
  }

  const activitySpecs = [
    { classIndex: 0, title: "Laboratório de frações", subject: "Matemática", contentTopic: "Frações equivalentes", points: 120 },
    { classIndex: 0, title: "Crônica do cotidiano", subject: "Português", contentTopic: "Produção textual", points: 100 },
    { classIndex: 1, title: "Energia em movimento", subject: "Ciências", contentTopic: "Transformações de energia", points: 140 },
    { classIndex: 1, title: "Mapa das migrações", subject: "Geografia", contentTopic: "Fluxos populacionais", points: 90 },
  ];
  const activityIds: number[] = [];
  for (const spec of activitySpecs) {
    const classroom = demoClasses[spec.classIndex];
    if (!classroom) continue;
    const [existing] = await db.select({ id: activities.id }).from(activities).where(and(eq(activities.classroomId, classroom.id), eq(activities.title, spec.title))).limit(1);
    const activityId = existing?.id ?? Number((await db.insert(activities).values({
      classroomId: classroom.id, createdById: adminId, title: spec.title, subject: spec.subject, contentTopic: spec.contentTopic,
      instructions: "Dado sintético de demonstração: explique seu raciocínio em etapas e registre o que deseja revisar.",
      dueAt: new Date(Date.now() + 5 * 86_400_000), points: spec.points, aiMode: "ATIVIDADE", activityType: "resposta_aberta", status: "publicada", publishedAt: new Date(),
    }))[0].insertId);
    activityIds.push(activityId);
    for (let studentIndex = 0; studentIndex < studentIds.length; studentIndex += 1) {
      const studentId = studentIds[studentIndex];
      if (studentIndex % demoClasses.length === spec.classIndex) await db.insert(activityAssignments).values({ activityId, studentId })
        .onDuplicateKeyUpdate({ set: { assignedAt: new Date() } });
    }
  }

  for (let index = 0; index < activityIds.length; index += 1) {
    const activityId = activityIds[index];
    const studentId = studentIds[index % studentIds.length];
    if (!studentId) continue;
    const returned = index % 2 === 1;
    await db.insert(submissions).values({
      activityId, studentId, answerText: "Resposta sintética usada apenas para demonstrar a fila de entregas e devolutivas.",
      status: returned ? "devolvida" : "enviada", score: returned ? 88 : null,
      teacherFeedback: returned ? "Boa estratégia. Revise apenas a justificativa final." : null,
      submittedAt: new Date(Date.now() - (index + 1) * 3_600_000), feedbackAt: returned ? new Date() : null,
    }).onDuplicateKeyUpdate({ set: { status: returned ? "devolvida" : "enviada", score: returned ? 88 : null, teacherFeedback: returned ? "Boa estratégia. Revise apenas a justificativa final." : null, updatedAt: new Date() } });
  }

  for (let index = 0; index < studentIds.length; index += 1) {
    const studentId = studentIds[index];
    const classroom = demoClasses[index % demoClasses.length];
    if (!classroom) continue;
    const [signal] = await db.select({ id: learningSignals.id }).from(learningSignals).where(and(eq(learningSignals.classroomId, classroom.id), eq(learningSignals.studentId, studentId), eq(learningSignals.category, "Participação"))).limit(1);
    if (!signal) await db.insert(learningSignals).values({ classroomId: classroom.id, studentId, subject: "Matemática", contentTopic: "Frações equivalentes", category: "Participação", status: index % 3 === 0 ? "atencao" : index % 3 === 1 ? "observar" : "bem", evidence: "Sinal sintético de demonstração.", suggestedAction: "Retomar o conceito com apoio visual.", reviewedByTeacher: index % 3 !== 0 });
  }

  const firstClassroom = demoClasses[0];
  if (firstClassroom) {
    const [journal] = await db.select({ id: teacherJournals.id }).from(teacherJournals).where(and(eq(teacherJournals.teacherId, adminId), eq(teacherJournals.classroomId, firstClassroom.id), eq(teacherJournals.contentTopic, "Frações equivalentes"))).limit(1);
    if (!journal) await db.insert(teacherJournals).values({ teacherId: adminId, classroomId: firstClassroom.id, subject: "Matemática", contentTopic: "Frações equivalentes", body: "Dado sintético de demonstração: a turma respondeu bem a representações visuais e solicitou mais exemplos práticos." });
    const [intervention] = await db.select({ id: interventions.id }).from(interventions).where(and(eq(interventions.teacherId, adminId), eq(interventions.classroomId, firstClassroom.id), eq(interventions.objective, "Revisar frações com exemplos visuais em pequenos grupos."))).limit(1);
    const interventionId = intervention?.id ?? Number((await db.insert(interventions).values({ classroomId: firstClassroom.id, teacherId: adminId, targetType: "turma", objective: "Revisar frações com exemplos visuais em pequenos grupos.", status: "encaminhada", sentAt: new Date() }))[0].insertId);
    const demoRecognitionSpecs = [
      { category: "Explorador", message: "Reconhecimento sintético: concluiu o Laboratório de frações com estratégia bem explicada.", status: "conquistada" as const, sourceType: "atividade" as const, activityId: activityIds[0] },
      { category: "Persistente", message: "Reconhecimento sintético: segue participando do reforço visual de frações.", status: "em_andamento" as const, sourceType: "intervencao" as const, interventionId },
    ];
    const demoStudentId = studentIds[0];
    if (demoStudentId) for (const recognition of demoRecognitionSpecs) {
      const [existingRecognition] = await db.select({ id: recognitions.id }).from(recognitions).where(and(eq(recognitions.teacherId, adminId), eq(recognitions.studentId, demoStudentId), eq(recognitions.category, recognition.category))).limit(1);
      if (!existingRecognition) await db.insert(recognitions).values({ teacherId: adminId, studentId: demoStudentId, ...recognition });
    }
  }

  return { institution: institution.name, classrooms: demoClasses.length, students: studentIds.length, activities: activityIds.length };
}

export async function hasClassroomMembership(userId: number, classroomId: number) {
  const db = await getDb();
  if (!db) return false;
  const membership = await db.select({ id: classMemberships.id }).from(classMemberships)
    .where(and(eq(classMemberships.classroomId, classroomId), eq(classMemberships.userId, userId))).limit(1);
  return Boolean(membership[0]);
}

export async function listActivitiesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const classes = await listClassesForUser(userId);
  const classIds = classes.map((item) => item.id);
  if (!classIds.length) return [];
  return db.select({
    id: activities.id, classroomId: activities.classroomId, title: activities.title,
    subject: activities.subject, instructions: activities.instructions, dueAt: activities.dueAt,
    points: activities.points, aiMode: activities.aiMode, activityType: activities.activityType,
    status: activities.status, createdAt: activities.createdAt,
  }).from(activities).where(inArray(activities.classroomId, classIds)).orderBy(desc(activities.createdAt));
}

export async function listAssignmentsForStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    activityId: activities.id, assignmentId: activityAssignments.id, title: activities.title,
    subject: activities.subject, instructions: activities.instructions, dueAt: activities.dueAt,
    points: activities.points, aiMode: activities.aiMode, status: activities.status,
  }).from(activityAssignments)
    .innerJoin(activities, eq(activityAssignments.activityId, activities.id))
    .where(eq(activityAssignments.studentId, studentId))
    .orderBy(desc(activities.createdAt));
}

export async function listStudentsForClassroom(input: { requesterId: number; classroomId: number }) {
  const db = await getDb();
  if (!db) return [];
  if (!(await hasClassroomMembership(input.requesterId, input.classroomId))) throw new Error("Você não possui vínculo com esta turma");
  return db.select({ id: users.id, name: users.name, email: users.email })
    .from(classMemberships)
    .innerJoin(users, eq(classMemberships.userId, users.id))
    .where(and(eq(classMemberships.classroomId, input.classroomId), eq(classMemberships.memberRole, "aluno")))
    .orderBy(users.name);
}

export async function getStudentLearningDetail(input: { requesterId: number; classroomId: number; studentId: number }) {
  const db = await getDb();
  if (!db) return { submissions: [], interventions: [], recognitions: [] };
  if (!(await hasClassroomMembership(input.requesterId, input.classroomId))) throw new Error("Você não possui vínculo com esta turma");
  if (!(await hasClassroomMembership(input.studentId, input.classroomId))) throw new Error("O estudante não possui vínculo com esta turma");
  const submissionsForStudent = await db.select({
    id: submissions.id,
    activityTitle: activities.title,
    subject: activities.subject,
    status: submissions.status,
    score: submissions.score,
    teacherFeedback: submissions.teacherFeedback,
    submittedAt: submissions.submittedAt,
    feedbackAt: submissions.feedbackAt,
  }).from(submissions).innerJoin(activities, eq(submissions.activityId, activities.id))
    .where(and(eq(submissions.studentId, input.studentId), eq(activities.classroomId, input.classroomId)))
    .orderBy(desc(submissions.updatedAt));
  const interventionsForStudent = await db.select({ id: interventions.id, objective: interventions.objective, status: interventions.status, createdAt: interventions.createdAt, sentAt: interventions.sentAt, targetType: interventions.targetType })
    .from(interventions)
    .where(and(eq(interventions.classroomId, input.classroomId), or(eq(interventions.targetStudentId, input.studentId), eq(interventions.targetType, "turma"))))
    .orderBy(desc(interventions.createdAt));
  const recognitionsForStudent = await db.select({ id: recognitions.id, category: recognitions.category, message: recognitions.message, status: recognitions.status, sourceType: recognitions.sourceType, activityTitle: activities.title, interventionObjective: interventions.objective, awardedAt: recognitions.awardedAt })
    .from(recognitions)
    .leftJoin(activities, eq(recognitions.activityId, activities.id))
    .leftJoin(interventions, eq(recognitions.interventionId, interventions.id))
    .where(and(eq(recognitions.studentId, input.studentId), or(eq(activities.classroomId, input.classroomId), eq(interventions.classroomId, input.classroomId))))
    .orderBy(desc(recognitions.awardedAt));
  return { submissions: submissionsForStudent, interventions: interventionsForStudent, recognitions: recognitionsForStudent.flatMap((recognition) => {
    const sourceLabel = recognition.sourceType === "atividade" ? recognition.activityTitle : recognition.sourceType === "intervencao" ? recognition.interventionObjective : null;
    return sourceLabel ? [{ ...recognition, sourceLabel }] : [];
  }) };
}

export async function listTeacherSubmissions(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  const classes = await listClassesForUser(teacherId);
  const classIds = classes.map((item) => item.id);
  if (!classIds.length) return [];
  return db.select({
    id: submissions.id,
    activityId: submissions.activityId,
    studentId: submissions.studentId,
    studentName: users.name,
    studentEmail: users.email,
    activityTitle: activities.title,
    classroomId: activities.classroomId,
    classroomName: classrooms.name,
    classroomGrade: classrooms.grade,
    status: submissions.status,
    submittedAt: submissions.submittedAt,
    score: submissions.score,
  }).from(submissions)
    .innerJoin(activities, eq(submissions.activityId, activities.id))
    .innerJoin(classrooms, eq(activities.classroomId, classrooms.id))
    .innerJoin(users, eq(submissions.studentId, users.id))
    .where(inArray(activities.classroomId, classIds))
    .orderBy(desc(submissions.updatedAt));
}

export async function listTeacherRecognitions(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: recognitions.id,
    studentId: recognitions.studentId,
    studentName: users.name,
    studentEmail: users.email,
    category: recognitions.category,
    message: recognitions.message,
    status: recognitions.status,
    sourceType: recognitions.sourceType,
    activityId: recognitions.activityId,
    interventionId: recognitions.interventionId,
    activityTitle: activities.title,
    interventionObjective: interventions.objective,
    awardedAt: recognitions.awardedAt,
  }).from(recognitions)
    .innerJoin(users, eq(recognitions.studentId, users.id))
    .leftJoin(activities, eq(recognitions.activityId, activities.id))
    .leftJoin(interventions, eq(recognitions.interventionId, interventions.id))
    .where(eq(recognitions.teacherId, teacherId))
    .orderBy(desc(recognitions.awardedAt));
  return rows.flatMap((recognition) => {
    const sourceLabel = recognition.sourceType === "atividade" ? recognition.activityTitle : recognition.sourceType === "intervencao" ? recognition.interventionObjective : null;
    return sourceLabel ? [{ ...recognition, sourceLabel }] : [];
  });
}

export async function listRecognitionsForStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: recognitions.id, category: recognitions.category, message: recognitions.message, status: recognitions.status, sourceType: recognitions.sourceType, activityTitle: activities.title, interventionObjective: interventions.objective, awardedAt: recognitions.awardedAt })
    .from(recognitions)
    .leftJoin(activities, eq(recognitions.activityId, activities.id))
    .leftJoin(interventions, eq(recognitions.interventionId, interventions.id))
    .where(eq(recognitions.studentId, studentId))
    .orderBy(desc(recognitions.awardedAt));
  return rows.flatMap((recognition) => {
    const sourceLabel = recognition.sourceType === "atividade" ? recognition.activityTitle : recognition.sourceType === "intervencao" ? recognition.interventionObjective : null;
    return sourceLabel ? [{ ...recognition, sourceLabel }] : [];
  });
}

export async function createRecognition(input: { teacherId: number; studentId: number; category: string; message?: string; status: "em_andamento" | "conquistada"; sourceType: "atividade" | "intervencao"; activityId?: number; interventionId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.sourceType === "atividade" && !input.activityId) throw new Error("Selecione a atividade vinculada ao reconhecimento");
  if (input.sourceType === "intervencao" && !input.interventionId) throw new Error("Selecione a intervenção vinculada ao reconhecimento");
  const sourceClassroomId = input.sourceType === "atividade"
    ? (await db.select({ classroomId: activities.classroomId }).from(activities).where(eq(activities.id, input.activityId!)).limit(1))[0]?.classroomId
    : (await db.select({ classroomId: interventions.classroomId }).from(interventions).where(eq(interventions.id, input.interventionId!)).limit(1))[0]?.classroomId;
  if (!sourceClassroomId) throw new Error("A origem selecionada não foi encontrada");
  if (!(await hasClassroomMembership(input.teacherId, sourceClassroomId))) throw new Error("Você não possui vínculo com a turma da origem selecionada");
  const [studentMembership] = await db.select({ id: classMemberships.id }).from(classMemberships).where(and(eq(classMemberships.classroomId, sourceClassroomId), eq(classMemberships.userId, input.studentId), eq(classMemberships.memberRole, "aluno"))).limit(1);
  if (!studentMembership) throw new Error("O estudante não pertence à turma da origem selecionada");
  const result = await db.insert(recognitions).values({
    teacherId: input.teacherId,
    studentId: input.studentId,
    category: input.category,
    message: input.message,
    status: input.status,
    sourceType: input.sourceType,
    activityId: input.sourceType === "atividade" ? input.activityId : null,
    interventionId: input.sourceType === "intervencao" ? input.interventionId : null,
  });
  return Number(result[0].insertId);
}

export async function updateRecognition(input: { recognitionId: number; teacherId: number; category: string; message?: string; status: "em_andamento" | "conquistada" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [recognition] = await db.select({ id: recognitions.id }).from(recognitions).where(and(eq(recognitions.id, input.recognitionId), eq(recognitions.teacherId, input.teacherId))).limit(1);
  if (!recognition) throw new Error("Reconhecimento não encontrado ou não autorizado");
  await db.update(recognitions).set({ category: input.category, message: input.message, status: input.status }).where(eq(recognitions.id, input.recognitionId));
  return { id: input.recognitionId };
}

export async function listTeacherInterventions(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  const classes = await listClassesForUser(teacherId);
  const classIds = classes.map((item) => item.id);
  if (!classIds.length) return [];
  return db.select({
    id: interventions.id,
    classroomId: interventions.classroomId,
    objective: interventions.objective,
    status: interventions.status,
    targetType: interventions.targetType,
    targetStudentId: interventions.targetStudentId,
  }).from(interventions)
    .where(inArray(interventions.classroomId, classIds))
    .orderBy(desc(interventions.createdAt));
}

export async function listSubmissionsForStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions).where(eq(submissions.studentId, studentId)).orderBy(desc(submissions.updatedAt));
}

export async function getUserOverview(userId: number, role: string) {
  const db = await getDb();
  if (!db) return { classrooms: 0, activities: 0, pendingSubmissions: 0, attentionSignals: 0 };
  const classes = await listClassesForUser(userId);
  const classIds = classes.map((item) => item.id);
  if (!classIds.length) return { classrooms: 0, activities: 0, pendingSubmissions: 0, attentionSignals: 0 };

  const [activityCount] = await db.select({ value: count() }).from(activities).where(inArray(activities.classroomId, classIds));
  const [signalCount] = await db
    .select({ value: count() })
    .from(learningSignals)
    .where(and(inArray(learningSignals.classroomId, classIds), inArray(learningSignals.status, ["atencao", "intervencao"])));
  const submissionCount = role === "aluno"
    ? await db.select({ value: count() }).from(submissions).where(and(eq(submissions.studentId, userId), eq(submissions.status, "pendente")))
    : await db.select({ value: count() }).from(submissions).innerJoin(activities, eq(submissions.activityId, activities.id))
      .where(and(inArray(activities.classroomId, classIds), eq(submissions.status, "enviada")));

  return {
    classrooms: classes.length,
    activities: activityCount?.value ?? 0,
    pendingSubmissions: submissionCount[0]?.value ?? 0,
    attentionSignals: signalCount?.value ?? 0,
  };
}

export async function createClassroom(input: {
  institutionId: number;
  grade: string;
  name: string;
  code: string;
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(classrooms).values(input);
  const classroomId = Number(result[0].insertId);
  await db.insert(classMemberships).values({ classroomId, userId: input.createdById, memberRole: "professor" });
  return classroomId;
}

export async function joinClassroomByCode(input: { userId: number; code: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const classroom = await db.select({ id: classrooms.id, name: classrooms.name, grade: classrooms.grade })
    .from(classrooms).where(eq(classrooms.code, input.code.toUpperCase())).limit(1);
  if (!classroom[0]) throw new Error("Código de turma não encontrado");
  await db.insert(classMemberships).values({ classroomId: classroom[0].id, userId: input.userId, memberRole: "aluno" })
    .onDuplicateKeyUpdate({ set: { joinedAt: new Date() } });
  return classroom[0];
}

export async function createActivity(input: typeof activities.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(activities).values(input);
  const activityId = Number(result[0].insertId);
  if (input.status === "publicada") {
    const students = await db.select({ userId: classMemberships.userId }).from(classMemberships)
      .where(and(eq(classMemberships.classroomId, input.classroomId), eq(classMemberships.memberRole, "aluno")));
    if (students.length) {
      await db.insert(activityAssignments).values(students.map((student) => ({ activityId, studentId: student.userId })));
    }
  }
  return activityId;
}

export async function submitActivity(input: { activityId: number; studentId: number; answerText: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const activity = await db.select({ classroomId: activities.classroomId }).from(activities).where(eq(activities.id, input.activityId)).limit(1);
  if (!activity[0] || !(await hasClassroomMembership(input.studentId, activity[0].classroomId))) {
    throw new Error("Você não tem vínculo com esta atividade");
  }
  await db.insert(submissions).values({
    activityId: input.activityId,
    studentId: input.studentId,
    answerText: input.answerText,
    status: "enviada",
    submittedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: { answerText: input.answerText, status: "enviada", submittedAt: new Date() } });
}

export async function createTeacherJournal(input: { teacherId: number; classroomId: number; subject: string; contentTopic: string; body: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!(await hasClassroomMembership(input.teacherId, input.classroomId))) throw new Error("Você não possui vínculo com esta turma");
  const result = await db.insert(teacherJournals).values(input);
  return Number(result[0].insertId);
}

export async function createIntervention(input: { teacherId: number; classroomId: number; targetType: "turma" | "aluno"; targetStudentId?: number; objective: string; status: "aprovada" | "encaminhada" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!(await hasClassroomMembership(input.teacherId, input.classroomId))) throw new Error("Você não possui vínculo com esta turma");
  const result = await db.insert(interventions).values({
    ...input,
    targetStudentId: input.targetStudentId ?? null,
    sentAt: input.status === "encaminhada" ? new Date() : null,
  });
  return Number(result[0].insertId);
}

export async function listTeacherJournals(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: teacherJournals.id,
    classroomId: teacherJournals.classroomId,
    subject: teacherJournals.subject,
    contentTopic: teacherJournals.contentTopic,
    body: teacherJournals.body,
    createdAt: teacherJournals.createdAt,
  }).from(teacherJournals).where(eq(teacherJournals.teacherId, teacherId)).orderBy(desc(teacherJournals.createdAt));
}

export async function listAttentionSignals(classroomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(learningSignals)
    .where(eq(learningSignals.classroomId, classroomId))
    .orderBy(desc(learningSignals.createdAt))
    .limit(40);
}


/** Exportação privada: retorna somente registros pertencentes ao usuário autenticado. */
export async function getUserDataExport(user: {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const [classes, overview] = await Promise.all([
    listClassesForUser(user.id),
    getUserOverview(user.id, user.role),
  ]);
  const [assignments, submissions, recognitions] = user.role === "aluno"
    ? await Promise.all([listAssignmentsForStudent(user.id), listSubmissionsForStudent(user.id), listRecognitionsForStudent(user.id)])
    : [[], [], []];
  const [teacherSubmissions, teacherRecognitions, interventions, journals] = user.role !== "aluno"
    ? await Promise.all([listTeacherSubmissions(user.id), listTeacherRecognitions(user.id), listTeacherInterventions(user.id), listTeacherJournals(user.id)])
    : [[], [], [], []];
  const hasInstitutionalAccess = ["coordenacao", "diretoria", "admin"].includes(user.role);
  const [institutions, institutionClassrooms] = hasInstitutionalAccess
    ? await Promise.all([listInstitutions(), listInstitutionClassrooms()])
    : [[], []];

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    overview,
    classes,
    studentData: { assignments, submissions, recognitions },
    teachingData: { submissions: teacherSubmissions, recognitions: teacherRecognitions, interventions, journals },
    institutionalData: { institutions, classrooms: institutionClassrooms },
  };
}
