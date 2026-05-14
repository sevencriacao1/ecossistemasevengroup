import { supabase } from '../lib/supabase';
import {
  AdminMetrics,
  Company,
  Course,
  CourseTree,
  HealthIssue,
  LearningModule,
  Lesson,
  LessonProgress,
  ManagedAuthUser,
  ReadinessScore,
  UserProfile,
  UserRole,
  UserStatus,
} from '../types/learning';

type ProfileRow = Record<string, unknown>;
type SupabaseMaybeError = { code?: string; message?: string; details?: string };

function isMissingRestResource(error: SupabaseMaybeError | null | undefined) {
  if (!error) return false;

  const text = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return (
    error.code === 'PGRST205'
    || error.code === '42P01'
    || text.includes('could not find the table')
    || text.includes('does not exist')
    || text.includes('schema cache')
  );
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asCompany(value: unknown): Company {
  return value === 'ARQO' ? 'ARQO' : 'Seven';
}

function asRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'colaborador';
}

function asStatus(value: unknown): UserStatus {
  return value === 'inativo' ? 'inativo' : 'ativo';
}

function normalizeProfile(row: ProfileRow): UserProfile {
  return {
    id: asString(row.id),
    email: asNullableString(row.email),
    username: asString(row.username, asString(row.email).split('@')[0] || 'usuario'),
    full_name: asNullableString(row.full_name) ?? asNullableString(row.nome),
    avatar_url: asNullableString(row.avatar_url),
    role: asRole(row.role ?? row.nivel_acesso),
    company: asCompany(row.company ?? row.empresa),
    status: asStatus(row.status),
  };
}

function buildCourseTree(courses: Course[], modules: LearningModule[], lessons: Lesson[]): CourseTree[] {
  return courses.map((course) => ({
    ...course,
    modules: modules
      .filter((moduleItem) => moduleItem.course_id === course.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((moduleItem) => ({
        ...moduleItem,
        lessons: lessons
          .filter((lesson) => lesson.module_id === moduleItem.id)
          .sort((a, b) => a.order_index - b.order_index),
      })),
  }));
}

function buildLegacyCourseTree(modules: LearningModule[]): CourseTree[] {
  const companies = Array.from(new Set(modules.map((moduleItem) => moduleItem.company ?? 'Seven')));

  return companies.map((company) => {
    const companyModules = modules
      .filter((moduleItem) => (moduleItem.company ?? 'Seven') === company)
      .sort((a, b) => a.order_index - b.order_index);

    return {
      id: `legacy-${company}`,
      company,
      title: company === 'ARQO' ? 'Curso ARQO' : 'Curso Seven Group',
      description: 'Conteudo carregado do schema legado enquanto a plataforma completa nao foi migrada.',
      cover_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      modules: companyModules.map((moduleItem) => ({ ...moduleItem, lessons: [] })),
    };
  });
}

export function calculateReadiness(course: CourseTree): ReadinessScore {
  const missing = [
    !course.cover_url ? 'capa' : '',
    course.modules.length === 0 ? 'modulos' : '',
    course.modules.every((moduleItem) => moduleItem.lessons.length === 0) ? 'aulas' : '',
    course.modules.some((moduleItem) => moduleItem.lessons.some((lesson) => !lesson.video_url)) ? 'videos' : '',
  ].filter(Boolean);

  return {
    score: Math.max(0, Math.round(((4 - missing.length) / 4) * 100)),
    missing,
  };
}

export function buildHealthIssues(courses: CourseTree[], users: UserProfile[]): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const invalidUsers = users.filter((user) => user.company !== 'Seven' && user.company !== 'ARQO');
  const incompleteUsers = users.filter((user) => !user.username || !user.role || !user.company);
  const coursesWithoutModules = courses.filter((course) => course.modules.length === 0);
  const modulesWithoutLessons = courses.flatMap((course) =>
    course.modules.filter((moduleItem) => moduleItem.lessons.length === 0)
  );
  const lessonsWithoutVideo = courses.flatMap((course) =>
    course.modules.flatMap((moduleItem) => moduleItem.lessons.filter((lesson) => !lesson.video_url))
  );

  issues.push({
    id: 'rls-shadow',
    label: 'Shadow Dashboard ativo',
    severity: 'ok',
    action: 'Dashboards novos estao isolados em /dashboard sem substituir /home.',
  });

  if (invalidUsers.length > 0) {
    issues.push({
      id: 'invalid-users',
      label: `${invalidUsers.length} usuarios com empresa invalida`,
      severity: 'critical',
      action: 'Normalizar empresa para Seven ou ARQO antes de publicar conteudos.',
    });
  }

  if (incompleteUsers.length > 0) {
    issues.push({
      id: 'incomplete-users',
      label: `${incompleteUsers.length} perfis incompletos`,
      severity: 'warning',
      action: 'Completar username, role e empresa nos perfis afetados.',
    });
  }

  if (coursesWithoutModules.length > 0) {
    issues.push({
      id: 'empty-courses',
      label: `${coursesWithoutModules.length} cursos sem modulos`,
      severity: 'warning',
      action: 'Adicionar modulos antes de liberar para colaboradores.',
    });
  }

  if (modulesWithoutLessons.length > 0) {
    issues.push({
      id: 'empty-modules',
      label: `${modulesWithoutLessons.length} modulos sem aulas`,
      severity: 'warning',
      action: 'Criar ao menos uma aula por modulo publicado.',
    });
  }

  if (lessonsWithoutVideo.length > 0) {
    issues.push({
      id: 'video-fallback',
      label: `${lessonsWithoutVideo.length} aulas sem video`,
      severity: 'warning',
      action: 'Fallback textual esta disponivel, mas o video deve ser enviado.',
    });
  }

  return issues;
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('username', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeProfile(row as ProfileRow));
}

export async function updateUserProfile(
  id: string,
  values: Partial<Pick<UserProfile, 'email' | 'username' | 'full_name' | 'role' | 'company' | 'status'>>
) {
  const { error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', id);

  if (error) throw error;
}

export async function createManagedUser(values: {
  email: string;
  password: string;
  fullName: string;
  username: string;
  role: UserRole;
  company?: Company;
  status?: UserStatus;
  avatarUrl?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: {
      action: 'create',
      email: values.email,
      password: values.password,
      full_name: values.fullName,
      username: values.username,
      role: values.role,
      company: values.company ?? 'Seven',
      status: values.status ?? 'ativo',
      avatar_url: values.avatarUrl ?? null,
    },
  });

  if (error) throw error;
  return data;
}

export async function listManagedAuthUsers() {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'list' },
  });

  if (error) throw error;
  return (data?.users ?? []) as ManagedAuthUser[];
}

export async function syncManagedUserProfile(id: string) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'sync_profile', id },
  });

  if (error) throw error;
  return data;
}

export async function updateManagedUser(values: {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  username: string;
  role: UserRole;
  company?: Company;
  status: UserStatus;
  avatarUrl?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: {
      action: 'update',
      id: values.id,
      email: values.email,
      password: values.password,
      full_name: values.fullName,
      username: values.username,
      role: values.role,
      company: values.company ?? 'Seven',
      status: values.status,
      avatar_url: values.avatarUrl ?? null,
    },
  });

  if (error) throw error;
  return data;
}

export async function uploadProfileImage(file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export async function uploadCourseCover(file: File) {
  await assertImageSize(file, 600, 400);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await supabase.storage
    .from('course-covers')
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export async function getStorageImageUrl(bucket: 'profile-images' | 'course-covers', path: string | null) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error) return '';
  return data.signedUrl;
}

async function assertImageSize(file: File, maxWidth: number, maxHeight: number) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Não foi possível validar a imagem.'));
      image.src = url;
    });

    if (image.width > maxWidth || image.height > maxHeight) {
      throw new Error(`A imagem deve ter no máximo ${maxWidth}x${maxHeight}px.`);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fetchLearningTree() {
  const modulesResponse = await supabase
    .from('modules')
    .select('*')
    .order('order_index', { ascending: true });

  if (modulesResponse.error) throw modulesResponse.error;

  const modules = ((modulesResponse.data ?? []) as Array<Record<string, unknown>>).map((moduleItem) => ({
    id: asString(moduleItem.id),
    course_id: asString(moduleItem.course_id, `legacy-${asCompany(moduleItem.company ?? moduleItem.empresa)}`),
    company: asCompany(moduleItem.company ?? moduleItem.empresa),
    title: asString(moduleItem.title, asString(moduleItem.titulo, 'Modulo')),
    description: asNullableString(moduleItem.description) ?? asNullableString(moduleItem.descricao),
    duration: asNullableString(moduleItem.duration),
    order_index: Number(moduleItem.order_index ?? moduleItem.ordem ?? 1),
    created_at: asString(moduleItem.created_at, new Date().toISOString()),
    updated_at: asNullableString(moduleItem.updated_at) ?? undefined,
  }));

  const hasModernModuleLink = modules.some((moduleItem) => !moduleItem.course_id.startsWith('legacy-'));
  if (!hasModernModuleLink) {
    return buildLegacyCourseTree(modules);
  }

  const coursesResponse = await supabase
    .from('courses')
    .select('*')
    .order('company')
    .order('created_at', { ascending: true });

  if (isMissingRestResource(coursesResponse.error)) {
    return buildLegacyCourseTree(modules);
  }

  if (coursesResponse.error) throw coursesResponse.error;

  const lessonsResponse = await supabase
    .from('lessons')
    .select('*')
    .order('order_index', { ascending: true });

  if (isMissingRestResource(lessonsResponse.error)) {
    return buildCourseTree((coursesResponse.data ?? []) as Course[], modules, []);
  }

  if (lessonsResponse.error) throw lessonsResponse.error;

  return buildCourseTree(
    (coursesResponse.data ?? []) as Course[],
    modules,
    (lessonsResponse.data ?? []) as Lesson[]
  );
}

function normalizeLegacyProgress(data: Array<Record<string, unknown>>): LessonProgress[] {
  return data.map((item) => ({
    id: asString(item.id),
    user_id: asString(item.user_id),
    lesson_id: asString(item.lesson_id, asString(item.module_id)),
    progress: Number(item.progress ?? item.progresso ?? 0),
    completed: item.completed === true || item.status === 'concluido',
    completed_at: asNullableString(item.completed_at),
    created_at: asString(item.created_at, asString(item.updated_at, new Date().toISOString())),
    updated_at: asNullableString(item.updated_at) ?? undefined,
  }));
}

export async function fetchProgress(userId: string, preferModernSchema = false) {
  if (preferModernSchema) {
    const lessonProgressResponse = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId);

    if (!isMissingRestResource(lessonProgressResponse.error)) {
      if (lessonProgressResponse.error) throw lessonProgressResponse.error;
      return (lessonProgressResponse.data ?? []) as LessonProgress[];
    }
  }

  const legacyProgressResponse = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (isMissingRestResource(legacyProgressResponse.error)) return [];
  if (legacyProgressResponse.error) throw legacyProgressResponse.error;

  return normalizeLegacyProgress((legacyProgressResponse.data ?? []) as Array<Record<string, unknown>>);
}

export async function upsertLessonProgress(userId: string, lessonId: string, progress: number) {
  const completed = progress >= 100;
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      progress,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' });

  if (error) throw error;
}

export async function createCourse(values: {
  company: Company;
  title: string;
  description: string;
  cover_url?: string;
}) {
  const { error } = await supabase.from('courses').insert({
    company: values.company,
    title: values.title,
    description: values.description,
    cover_url: values.cover_url || null,
  });

  if (error) throw error;
}

export async function updateCourse(id: string, values: Partial<Course>) {
  const { error } = await supabase
    .from('courses')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateModule(id: string, values: Partial<LearningModule>) {
  const { error } = await supabase
    .from('modules')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteModule(id: string) {
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createModule(values: {
  course_id: string;
  title: string;
  description: string;
  order_index: number;
}) {
  const { error } = await supabase.from('modules').insert(values);
  if (error) throw error;
}

export async function createLesson(values: {
  module_id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  video_url?: string | null;
  attachment_url?: string | null;
}) {
  const { error } = await supabase.from('lessons').insert(values);
  if (error) throw error;
}

export async function updateLesson(id: string, values: Partial<Lesson>) {
  const { error } = await supabase
    .from('lessons')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function uploadLessonVideo(file: File) {
  const extension = file.name.split('.').pop() || 'mp4';
  const path = `${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from('lesson-videos')
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export async function uploadLessonAttachment(file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await supabase.storage
    .from('lesson-attachments')
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export async function getLessonVideoUrl(videoPath: string) {
  if (/^https?:\/\//.test(videoPath)) return videoPath;

  const { data, error } = await supabase.storage
    .from('lesson-videos')
    .createSignedUrl(videoPath, 60 * 30);

  if (error) throw error;
  return data.signedUrl;
}

export async function getLessonAttachmentUrl(attachmentPath: string) {
  if (/^https?:\/\//.test(attachmentPath)) return attachmentPath;

  const { data, error } = await supabase.storage
    .from('lesson-attachments')
    .createSignedUrl(attachmentPath, 60 * 30, { download: true });

  if (error) throw error;
  return data.signedUrl;
}

export function buildAdminMetrics(
  users: UserProfile[],
  courses: CourseTree[],
  progress: LessonProgress[]
): AdminMetrics {
  const totalLessons = courses.reduce(
    (courseTotal, course) => courseTotal + course.modules.reduce(
      (moduleTotal, moduleItem) => moduleTotal + moduleItem.lessons.length,
      0
    ),
    0
  );
  const completedLessons = progress.filter((item) => item.completed).length;
  const averageProgress = progress.length
    ? Math.round(progress.reduce((sum, item) => sum + item.progress, 0) / progress.length)
    : 0;

  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.status === 'ativo').length,
    totalCourses: courses.length,
    totalLessons,
    completedLessons,
    averageProgress,
  };
}

export async function fetchAllProgress(preferModernSchema = false) {
  if (preferModernSchema) {
    const lessonProgressResponse = await supabase.from('lesson_progress').select('*');
    if (!isMissingRestResource(lessonProgressResponse.error)) {
      if (lessonProgressResponse.error) throw lessonProgressResponse.error;
      return (lessonProgressResponse.data ?? []) as LessonProgress[];
    }
  }

  const legacyProgressResponse = await supabase.from('user_progress').select('*');
  if (isMissingRestResource(legacyProgressResponse.error)) return [];
  if (legacyProgressResponse.error) throw legacyProgressResponse.error;

  return normalizeLegacyProgress((legacyProgressResponse.data ?? []) as Array<Record<string, unknown>>);
}
