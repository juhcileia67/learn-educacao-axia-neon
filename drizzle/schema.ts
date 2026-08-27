import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Atlas Neon Imersivo: modelo institucional que separa dados de aprendizagem,
 * docência e gestão, preservando a privacidade individual de cada estudante.
 */
export const roleValues = ["user", "aluno", "professor", "coordenacao", "diretoria", "admin"] as const;
export const activityModeValues = ["ESTUDO", "ATIVIDADE", "AVALIACAO"] as const;
export const activityStatusValues = ["rascunho", "agendada", "publicada", "encerrada"] as const;
export const submissionStatusValues = ["pendente", "enviada", "devolvida", "concluida"] as const;
export const signalStatusValues = ["bem", "observar", "atencao", "intervencao"] as const;
export const recognitionStatusValues = ["em_andamento", "conquistada"] as const;
export const recognitionSourceValues = ["atividade", "intervencao"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", roleValues).default("aluno").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const institutions = mysqlTable("institutions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  code: varchar("code", { length: 24 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const classrooms = mysqlTable(
  "classrooms",
  {
    id: int("id").autoincrement().primaryKey(),
    institutionId: int("institutionId").notNull(),
    grade: varchar("grade", { length: 60 }).notNull(),
    name: varchar("name", { length: 90 }).notNull(),
    code: varchar("code", { length: 18 }).notNull().unique(),
    createdById: int("createdById").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("classrooms_institution_idx").on(table.institutionId)],
);

export const classMemberships = mysqlTable(
  "class_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    classroomId: int("classroomId").notNull(),
    userId: int("userId").notNull(),
    memberRole: mysqlEnum("memberRole", ["aluno", "professor"] as const).notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("class_memberships_unique").on(table.classroomId, table.userId),
    index("class_memberships_user_idx").on(table.userId),
  ],
);

export const activities = mysqlTable(
  "activities",
  {
    id: int("id").autoincrement().primaryKey(),
    classroomId: int("classroomId").notNull(),
    createdById: int("createdById").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    subject: varchar("subject", { length: 90 }).notNull(),
    contentTopic: varchar("contentTopic", { length: 140 }),
    instructions: text("instructions").notNull(),
    dueAt: timestamp("dueAt"),
    points: int("points").default(100).notNull(),
    aiMode: mysqlEnum("aiMode", activityModeValues).default("ESTUDO").notNull(),
    activityType: varchar("activityType", { length: 50 }).default("resposta_aberta").notNull(),
    status: mysqlEnum("status", activityStatusValues).default("rascunho").notNull(),
    attachmentKey: varchar("attachmentKey", { length: 500 }),
    publishedAt: timestamp("publishedAt"),
    scheduledAt: timestamp("scheduledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("activities_classroom_idx").on(table.classroomId),
    index("activities_creator_idx").on(table.createdById),
  ],
);

export const activityAssignments = mysqlTable(
  "activity_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId").notNull(),
    studentId: int("studentId").notNull(),
    assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("activity_assignments_unique").on(table.activityId, table.studentId),
    index("activity_assignments_student_idx").on(table.studentId),
  ],
);

export const submissions = mysqlTable(
  "submissions",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId").notNull(),
    studentId: int("studentId").notNull(),
    answerText: text("answerText"),
    attachmentKey: varchar("attachmentKey", { length: 500 }),
    status: mysqlEnum("status", submissionStatusValues).default("pendente").notNull(),
    score: int("score"),
    teacherFeedback: text("teacherFeedback"),
    submittedAt: timestamp("submittedAt"),
    feedbackAt: timestamp("feedbackAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("submissions_unique").on(table.activityId, table.studentId),
    index("submissions_student_idx").on(table.studentId),
  ],
);

export const learningSignals = mysqlTable(
  "learning_signals",
  {
    id: int("id").autoincrement().primaryKey(),
    classroomId: int("classroomId").notNull(),
    studentId: int("studentId").notNull(),
    subject: varchar("subject", { length: 90 }).notNull(),
    contentTopic: varchar("contentTopic", { length: 140 }).notNull(),
    category: varchar("category", { length: 90 }).notNull(),
    status: mysqlEnum("status", signalStatusValues).default("bem").notNull(),
    evidence: text("evidence"),
    suggestedAction: text("suggestedAction"),
    reviewedByTeacher: boolean("reviewedByTeacher").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("learning_signals_class_idx").on(table.classroomId),
    index("learning_signals_student_idx").on(table.studentId),
  ],
);

export const teacherJournals = mysqlTable(
  "teacher_journals",
  {
    id: int("id").autoincrement().primaryKey(),
    teacherId: int("teacherId").notNull(),
    classroomId: int("classroomId").notNull(),
    subject: varchar("subject", { length: 90 }).notNull(),
    contentTopic: varchar("contentTopic", { length: 140 }).notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("teacher_journals_class_idx").on(table.classroomId)],
);

export const interventions = mysqlTable(
  "interventions",
  {
    id: int("id").autoincrement().primaryKey(),
    classroomId: int("classroomId").notNull(),
    teacherId: int("teacherId").notNull(),
    targetType: mysqlEnum("targetType", ["turma", "aluno"] as const).notNull(),
    targetStudentId: int("targetStudentId"),
    objective: text("objective").notNull(),
    status: mysqlEnum("status", ["rascunho", "aprovada", "encaminhada"] as const).default("rascunho").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    sentAt: timestamp("sentAt"),
  },
  (table) => [index("interventions_class_idx").on(table.classroomId)],
);

export const recognitions = mysqlTable(
  "recognitions",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: int("studentId").notNull(),
    teacherId: int("teacherId").notNull(),
    category: varchar("category", { length: 70 }).notNull(),
    message: text("message"),
    status: mysqlEnum("status", recognitionStatusValues).default("conquistada").notNull(),
    sourceType: mysqlEnum("sourceType", recognitionSourceValues),
    activityId: int("activityId"),
    interventionId: int("interventionId"),
    awardedAt: timestamp("awardedAt").defaultNow().notNull(),
  },
  (table) => [index("recognitions_student_idx").on(table.studentId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
