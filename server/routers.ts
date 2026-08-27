import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { hasPlatformPermission, type PlatformPermission } from "@shared/platformRoles";
import { activityModeValues, activityStatusValues } from "../drizzle/schema";
import {
  createActivity,
  createClassroom,
  createInstitution,
  createIntervention,
  createDemoScenario,
  createRecognition,
  createTeacherJournal,
  getUserOverview,
  getInstitutionStats,
  getStudentLearningDetail,
  getUserDataExport,
  joinClassroomByCode,
  listActivitiesForUser,
  listAssignmentsForStudent,
  listAttentionSignals,
  listClassesForUser,
  listInstitutions,
  listRecognitionsForStudent,
  listSubmissionsForStudent,
  listInstitutionClassrooms,
  listTeacherRecognitions,
  listTeacherInterventions,
  listTeacherSubmissions,
  listStudentsForClassroom,
  listTeacherJournals,
  submitActivity,
  updateRecognition,
  updateUserRoleByEmail,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

/** Contratos protegidos da plataforma Learn; dados reais vêm apenas de perfis autorizados. */
const permittedProcedure = (permission: PlatformPermission) => protectedProcedure.use(({ ctx, next }) => {
  if (!hasPlatformPermission(ctx.user.role, permission)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não possui permissão para esta ação." });
  }
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  platform: router({
    overview: protectedProcedure.query(({ ctx }) => getUserOverview(ctx.user.id, ctx.user.role)),
    myClasses: protectedProcedure.query(({ ctx }) => listClassesForUser(ctx.user.id)),
    joinClass: permittedProcedure("student:self:read")
      .input(z.object({ code: z.string().min(4).max(18) }))
      .mutation(({ ctx, input }) => joinClassroomByCode({ userId: ctx.user.id, code: input.code })),
    institutions: permittedProcedure("classroom:manage").query(() => listInstitutions()),
    institutionDirectory: permittedProcedure("institution:read").query(() => listInstitutions()),
    institutionClassrooms: permittedProcedure("institution:read").query(() => listInstitutionClassrooms()),
    institutionStats: permittedProcedure("institution:read")
      .input(z.object({ institutionId: z.number().int().positive().optional(), classroomId: z.number().int().positive().optional(), grade: z.string().min(1).max(60).optional(), subject: z.string().min(1).max(90).optional(), periodDays: z.number().int().positive().max(3650).optional() }).optional())
      .query(({ input }) => getInstitutionStats(input)),
    createInstitution: permittedProcedure("institution:manage")
      .input(z.object({ name: z.string().min(2).max(180), code: z.string().min(2).max(24) }))
      .mutation(({ input }) => createInstitution({ name: input.name, code: input.code.toUpperCase() })),
    createDemoScenario: permittedProcedure("institution:manage")
      .mutation(({ ctx }) => createDemoScenario(ctx.user.id)),
    updateUserRole: permittedProcedure("permission:manage")
      .input(z.object({ email: z.string().email(), role: z.enum(["aluno", "professor", "coordenacao", "diretoria", "admin"]) }))
      .mutation(({ input }) => updateUserRoleByEmail(input)),
    myActivities: protectedProcedure.query(({ ctx }) => listActivitiesForUser(ctx.user.id)),
    myTeacherSubmissions: permittedProcedure("activity:manage").query(({ ctx }) => listTeacherSubmissions(ctx.user.id)),
    myRecognitions: permittedProcedure("activity:manage").query(({ ctx }) => listTeacherRecognitions(ctx.user.id)),
    myInterventions: permittedProcedure("intervention:manage").query(({ ctx }) => listTeacherInterventions(ctx.user.id)),
    createRecognition: permittedProcedure("activity:manage")
      .input(z.object({ studentId: z.number().int().positive(), category: z.string().min(2).max(70), message: z.string().max(12000).optional(), status: z.enum(["em_andamento", "conquistada"]), sourceType: z.enum(["atividade", "intervencao"]), activityId: z.number().int().positive().optional(), interventionId: z.number().int().positive().optional() }))
      .mutation(({ ctx, input }) => createRecognition({ ...input, teacherId: ctx.user.id })),
    updateRecognition: permittedProcedure("activity:manage")
      .input(z.object({ recognitionId: z.number().int().positive(), category: z.string().min(2).max(70), message: z.string().max(12000).optional(), status: z.enum(["em_andamento", "conquistada"]) }))
      .mutation(({ ctx, input }) => updateRecognition({ ...input, teacherId: ctx.user.id })),
    myJournals: permittedProcedure("classroom:manage").query(({ ctx }) => listTeacherJournals(ctx.user.id)),
    myAssignments: permittedProcedure("student:self:read").query(({ ctx }) => listAssignmentsForStudent(ctx.user.id)),
    mySubmissions: permittedProcedure("student:self:read").query(({ ctx }) => listSubmissionsForStudent(ctx.user.id)),
    myStudentRecognitions: permittedProcedure("student:self:read").query(({ ctx }) => listRecognitionsForStudent(ctx.user.id)),
    exportMyData: protectedProcedure.query(({ ctx }) => getUserDataExport({
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      createdAt: ctx.user.createdAt,
      updatedAt: ctx.user.updatedAt,
    })),
    classStudents: permittedProcedure("student:detail:read")
      .input(z.object({ classroomId: z.number().int().positive() }))
      .query(({ ctx, input }) => listStudentsForClassroom({ requesterId: ctx.user.id, classroomId: input.classroomId })),
    studentLearningDetail: permittedProcedure("student:detail:read")
      .input(z.object({ classroomId: z.number().int().positive(), studentId: z.number().int().positive() }))
      .query(({ ctx, input }) => getStudentLearningDetail({ requesterId: ctx.user.id, ...input })),
    attentionSignals: permittedProcedure("signal:read").input(z.object({ classroomId: z.number().int().positive() })).query(({ input }) => listAttentionSignals(input.classroomId)),
    createClass: permittedProcedure("classroom:manage")
      .input(z.object({ institutionId: z.number().int().positive(), grade: z.string().min(1).max(60), name: z.string().min(2).max(90), code: z.string().min(4).max(18) }))
      .mutation(({ ctx, input }) => createClassroom({ ...input, code: input.code.toUpperCase(), createdById: ctx.user.id })),
    createActivity: permittedProcedure("activity:manage")
      .input(z.object({
        classroomId: z.number().int().positive(), title: z.string().min(2).max(180), subject: z.string().min(2).max(90),
        contentTopic: z.string().max(140).optional(), instructions: z.string().min(2), dueAt: z.date().optional(), points: z.number().int().min(0).max(10000).default(100),
        aiMode: z.enum(activityModeValues).default("ESTUDO"), activityType: z.string().max(50).default("resposta_aberta"),
        status: z.enum(activityStatusValues).default("rascunho"), scheduledAt: z.date().optional(), attachmentKey: z.string().max(500).optional(),
      }))
      .mutation(({ ctx, input }) => createActivity({ ...input, createdById: ctx.user.id })),
    submitActivity: permittedProcedure("student:submission:write")
      .input(z.object({ activityId: z.number().int().positive(), answerText: z.string().min(1).max(20000) }))
      .mutation(({ ctx, input }) => submitActivity({ ...input, studentId: ctx.user.id })),
    createJournal: permittedProcedure("classroom:manage")
      .input(z.object({ classroomId: z.number().int().positive(), subject: z.string().min(2).max(90), contentTopic: z.string().min(2).max(140), body: z.string().min(2).max(12000) }))
      .mutation(({ ctx, input }) => createTeacherJournal({ ...input, teacherId: ctx.user.id })),
    createIntervention: permittedProcedure("intervention:manage")
      .input(z.object({ classroomId: z.number().int().positive(), targetType: z.enum(["turma", "aluno"]), targetStudentId: z.number().int().positive().optional(), objective: z.string().min(2).max(12000), status: z.enum(["aprovada", "encaminhada"]) }))
      .mutation(({ ctx, input }) => createIntervention({ ...input, teacherId: ctx.user.id })),
    axiaChat: protectedProcedure
      .input(z.object({ audience: z.enum(["aluno", "professor"]), message: z.string().min(2).max(5000) }))
      .mutation(async ({ input }) => {
        const roleInstruction = input.audience === "aluno"
          ? "Você é AXIA, uma tutora educacional acolhedora. Explique de forma clara, por etapas, sem dar a resposta pronta de atividades avaliativas. Incentive autonomia e diga quando a pessoa deve conversar com o professor."
          : "Você é AXIA, uma assistente pedagógica para professores. Sugira atividades, perguntas de checagem e intervenções inclusivas, mas não tome decisões no lugar do docente. Preserve a privacidade e não invente dados de estudantes.";
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `${roleInstruction} Responda em português brasileiro, com objetividade.` },
            { role: "user", content: input.message },
          ],
        });
        const content = response.choices?.[0]?.message?.content;
        const reply = typeof content === "string" ? content : "Não consegui concluir a orientação agora. Tente novamente em alguns instantes.";
        return { reply };
      }),
  }),
});

export type AppRouter = typeof appRouter;
