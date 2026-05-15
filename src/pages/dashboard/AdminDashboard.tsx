import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Trash2,
  Edit3,
  FileText,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import {
  calculateReadiness,
  createCourse,
  createLesson,
  createManagedUser,
  createModule,
  deleteCourse,
  deleteModule,
  fetchAllProgress,
  fetchLearningTree,
  fetchUsers,
  listManagedAuthUsers,
  syncManagedUserProfile,
  updateLesson,
  updateManagedUser,
  updateCourse,
  updateModule,
  getStorageImageUrl,
  uploadCourseCover,
  uploadLessonAttachment,
  uploadLessonVideo,
  uploadProfileImage,
} from '../../services/learningService';
import { Company, CourseTree, Lesson, LessonProgress, ManagedAuthUser, UserProfile, UserRole, UserStatus } from '../../types/learning';

type AdminRoute = 'inicio' | 'cursos' | 'settings';
type ModalName = 'course' | 'editCourse' | 'module' | 'editModule' | 'lesson' | 'editLesson' | 'user' | 'editUser' | null;

const companyOptions: Company[] = ['Seven', 'ARQO'];
const roleOptions: UserRole[] = ['admin', 'colaborador'];
const statusOptions: UserStatus[] = ['ativo', 'inativo'];
const inputClass = 'h-10 rounded-md border border-[#D8D8DE] bg-white px-3 py-2 text-sm text-[#111114] placeholder-transparent outline-none transition focus:border-primary focus:ring-primary';
const textInputClass = 'rounded-md border border-[#D8D8DE] bg-white px-3 py-2 text-sm text-[#111114] placeholder-transparent outline-none transition focus:border-primary';

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[#E6E6EA] bg-white shadow-[0_16px_38px_rgba(17,17,20,0.05)] ${className}`}>
      {children}
    </section>
  );
}

function resolveRoute(pathname: string): AdminRoute {
  if (pathname.includes('/cursos')) return 'cursos';
  if (pathname.includes('/settings')) return 'settings';
  return 'inicio';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A8A92]">{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111114]/55 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#E6E6EA] bg-white p-5 text-[#111114] shadow-[0_24px_70px_rgba(17,17,20,0.18)]">
        <header className="mb-5 flex items-center justify-between gap-4 border-b border-[#ECECEF] pb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E6E6EA] text-[#62626A]">
            <X className="h-4 w-4" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function SelectField<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-10 rounded-md border border-[#D8D8DE] bg-white px-3 text-sm text-[#111114] outline-none transition focus:border-primary disabled:bg-[#F1F1F3] disabled:text-[#8A8A92]"
    >
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function FilePicker({
  label,
  accept,
  helper,
  onChange,
}: {
  label: string;
  accept?: string;
  helper?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#CFCFD6] bg-[#FAFAFB] px-4 py-5 text-center transition hover:border-primary hover:bg-primary/5">
      <UploadIcon />
      <span className="mt-2 text-sm font-semibold text-[#111114]">{label}</span>
      {helper && <span className="mt-1 text-xs leading-5 text-[#8A8A92]">{helper}</span>}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function UploadProgress({ value }: { value: number }) {
  if (value <= 0) return null;

  return (
    <div className="rounded-lg border border-[#E6E6EA] bg-[#FAFAFB] p-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8A92]">
        <span>Enviando arquivo</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7E7EC]">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D8D8DE] bg-[#F1F1F3] text-[#111114] transition hover:border-primary hover:bg-white"
    >
      {children}
    </button>
  );
}

function InfoBadge({ value, tone }: { value: string; tone: 'role' | 'company' | 'status' }) {
  const styles = {
    role: value === 'admin' ? 'bg-[#111114] text-white' : 'bg-primary/10 text-primary',
    company: value === 'ARQO' ? 'bg-[#F2EBDD] text-[#8A6722]' : 'bg-[#F3F3F5] text-[#111114]',
    status: value === 'ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
  };

  return (
    <span className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>
      {value}
    </span>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-4 left-4 right-4 z-[180] rounded-lg border px-4 py-3 text-sm font-medium shadow-[0_18px_45px_rgba(17,17,20,0.16)] sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm ${
        type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {message}
    </div>
  );
}

function UploadIcon() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-primary shadow-[0_8px_20px_rgba(17,17,20,0.08)]">
      <Plus className="h-4 w-4" />
    </span>
  );
}

function progressForUser(user: UserProfile, progress: LessonProgress[], courses: CourseTree[]) {
  const userProgress = progress.filter((item) => item.user_id === user.id);
  const companyCourses = courses.filter((course) => course.company === user.company);
  const lessons = companyCourses.flatMap((course) => course.modules.flatMap((moduleItem) => moduleItem.lessons));
  const modules = companyCourses.flatMap((course) => course.modules);
  const completed = userProgress.filter((item) => item.completed).length;
  const total = lessons.length || modules.length || 1;
  const percent = lessons.length
    ? Math.round((completed / total) * 100)
    : Math.round(userProgress.reduce((sum, item) => sum + item.progress, 0) / Math.max(userProgress.length, 1));
  const latest = [...userProgress].sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at))[0];
  const currentModule = modules.find((moduleItem) => (
    moduleItem.id === latest?.lesson_id
    || moduleItem.lessons.some((lesson) => lesson.id === latest?.lesson_id)
  ));

  return {
    percent: Number.isFinite(percent) ? percent : 0,
    currentModule: currentModule?.title ?? 'Não iniciado',
    completed,
    total: lessons.length || modules.length,
  };
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const route = resolveRoute(location.pathname);
  const { profile, signOut } = useAuth();
  const [courses, setCourses] = useState<CourseTree[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [authUsers, setAuthUsers] = useState<ManagedAuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalName>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [editingCourse, setEditingCourse] = useState<CourseTree | null>(null);
  const [editingModule, setEditingModule] = useState<CourseTree['modules'][number] | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [courseForm, setCourseForm] = useState({ company: 'Seven' as Company, title: '', description: '', cover_url: '' });
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order_index: 1 });
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content: '', order_index: 1 });
  const [lessonVideo, setLessonVideo] = useState<File | null>(null);
  const [lessonAttachment, setLessonAttachment] = useState<File | null>(null);
  const [courseCoverFile, setCourseCoverFile] = useState<File | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    role: 'colaborador' as UserRole,
    company: 'Seven' as Company,
    status: 'ativo' as UserStatus,
    avatarUrl: '',
  });

  const refresh = async () => {
    setError('');
    const nextCourses = await fetchLearningTree();
    const preferModernSchema = nextCourses.some((course) => !course.id.startsWith('legacy-'));
    const [nextUsers, nextProgress] = await Promise.all([fetchUsers(), fetchAllProgress(preferModernSchema)]);
    const nextAuthUsers = await listManagedAuthUsers().catch(() => []);
    setCourses(nextCourses);
    setUsers(nextUsers);
    setProgress(nextProgress);
    setAuthUsers(nextAuthUsers);
    setSelectedCourseId((current) => current || nextCourses[0]?.id || '');
  };

  useEffect(() => {
    refresh()
      .catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : 'Não foi possível carregar o dashboard.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!feedback && !error) return undefined;

    const timer = window.setTimeout(() => {
      setFeedback('');
      setError('');
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [error, feedback]);

  useEffect(() => {
    const loadProfileImages = async () => {
      const entries = await Promise.all(
        users.map(async (user) => [user.id, await getStorageImageUrl('profile-images', user.avatar_url)] as const)
      );
      setProfileImages(Object.fromEntries(entries));
    };

    void loadProfileImages();
  }, [users]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const selectedModule = selectedCourse?.modules.find((moduleItem) => moduleItem.id === selectedModuleId) ?? null;
  const collaborators = users.filter((user) => user.role === 'colaborador');
  const admins = users.filter((user) => user.role === 'admin');
  const missingProfiles = authUsers.filter((authUser) => !authUser.has_profile);
  const closeModal = () => {
    setModal(null);
    setEditingCourse(null);
    setEditingModule(null);
    setEditingLesson(null);
    setEditingUser(null);
    setLessonVideo(null);
    setLessonAttachment(null);
    setCourseCoverFile(null);
    setProfileImageFile(null);
    setUploadProgress(0);
  };

  const withUploadProgress = async <T,>(uploadTask: () => Promise<T>) => {
    setUploadProgress(8);
    const timer = window.setInterval(() => {
      setUploadProgress((current) => Math.min(92, current + 12));
    }, 220);

    try {
      const result = await uploadTask();
      setUploadProgress(100);
      return result;
    } finally {
      window.clearInterval(timer);
      window.setTimeout(() => setUploadProgress(0), 650);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const submitCourse = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (!courseCoverFile) {
        throw new Error('Anexe uma capa de curso com no máximo 600x400 px.');
      }
      const coverUrl = courseCoverFile ? await withUploadProgress(() => uploadCourseCover(courseCoverFile)) : courseForm.cover_url;
      await createCourse({ ...courseForm, cover_url: coverUrl });
      setCourseForm({ company: 'Seven', title: '', description: '', cover_url: '' });
      await refresh();
      setFeedback('Curso criado com sucesso.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao criar curso.');
    }
  };

  const submitCourseEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingCourse) return;
    try {
      const coverUrl = courseCoverFile ? await withUploadProgress(() => uploadCourseCover(courseCoverFile)) : courseForm.cover_url;
      await updateCourse(editingCourse.id, { ...courseForm, cover_url: coverUrl });
      await refresh();
      setFeedback('Curso atualizado.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao editar curso.');
    }
  };

  const handleDeleteCourse = async (course: CourseTree) => {
    if (!window.confirm(`Excluir o curso "${course.title}" e seus módulos/aulas?`)) return;
    try {
      await deleteCourse(course.id);
      setSelectedCourseId('');
      await refresh();
      setFeedback('Curso excluído.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao excluir curso.');
    }
  };

  const submitModule = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCourse) return;
    try {
      await createModule({ ...moduleForm, course_id: selectedCourse.id });
      setModuleForm({ title: '', description: '', order_index: moduleForm.order_index + 1 });
      await refresh();
      setFeedback('Módulo criado com sucesso.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao criar módulo.');
    }
  };

  const submitModuleEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingModule) return;
    try {
      await updateModule(editingModule.id, moduleForm);
      await refresh();
      setFeedback('Módulo atualizado.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao editar módulo.');
    }
  };

  const handleDeleteModule = async (moduleItem: CourseTree['modules'][number]) => {
    if (!window.confirm(`Excluir o módulo "${moduleItem.title}" e suas aulas?`)) return;
    try {
      await deleteModule(moduleItem.id);
      await refresh();
      setFeedback('Módulo excluído.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao excluir módulo.');
    }
  };

  const submitLesson = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedModuleId) return;
    try {
      const videoPath = lessonVideo ? await withUploadProgress(() => uploadLessonVideo(lessonVideo)) : null;
      const attachmentPath = lessonAttachment ? await withUploadProgress(() => uploadLessonAttachment(lessonAttachment)) : null;
      await createLesson({ ...lessonForm, module_id: selectedModuleId, video_url: videoPath, attachment_url: attachmentPath });
      setLessonForm({ title: '', description: '', content: '', order_index: lessonForm.order_index + 1 });
      await refresh();
      setFeedback('Aula criada com sucesso.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao criar aula.');
    }
  };

  const submitLessonEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingLesson) return;
    try {
      const videoPath = lessonVideo ? await withUploadProgress(() => uploadLessonVideo(lessonVideo)) : editingLesson.video_url;
      const attachmentPath = lessonAttachment ? await withUploadProgress(() => uploadLessonAttachment(lessonAttachment)) : editingLesson.attachment_url;
      await updateLesson(editingLesson.id, {
        title: lessonForm.title,
        description: lessonForm.description,
        content: lessonForm.content,
        order_index: lessonForm.order_index,
        video_url: videoPath,
        attachment_url: attachmentPath,
      });
      await refresh();
      setFeedback('Aula atualizada.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao editar aula.');
    }
  };

  const submitUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const avatarUrl = profileImageFile ? await withUploadProgress(() => uploadProfileImage(profileImageFile)) : userForm.avatarUrl;
      await createManagedUser({ ...userForm, avatarUrl });
      setUserForm({ email: '', password: '', username: '', fullName: '', role: 'colaborador', company: 'Seven', status: 'ativo', avatarUrl: '' });
      await refresh();
      setFeedback('Usuário criado pela função segura.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'A função admin-users ainda não está implantada ou retornou erro.');
    }
  };

  const submitUserEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    try {
      await updateManagedUser({
        id: editingUser.id,
        email: userForm.email,
        password: userForm.password || undefined,
        username: userForm.username,
        fullName: userForm.fullName,
        role: userForm.role,
        company: userForm.role === 'admin' ? 'Seven' : userForm.company,
        status: userForm.status,
        avatarUrl: profileImageFile ? await withUploadProgress(() => uploadProfileImage(profileImageFile)) : userForm.avatarUrl,
      });
      await refresh();
      setFeedback('Usuário atualizado.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao editar usuário.');
    }
  };

  const handleSyncProfile = async (id: string) => {
    try {
      await syncManagedUserProfile(id);
      await refresh();
      setFeedback('Perfil sincronizado com Authentication.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível sincronizar o perfil.');
    }
  };

  const openCourseEditor = (course: CourseTree) => {
    setEditingCourse(course);
    setCourseForm({
      company: course.company,
      title: course.title,
      description: course.description ?? '',
      cover_url: course.cover_url ?? '',
    });
    setModal('editCourse');
  };

  const openModuleEditor = (moduleItem: CourseTree['modules'][number]) => {
    setEditingModule(moduleItem);
    setModuleForm({
      title: moduleItem.title,
      description: moduleItem.description ?? '',
      order_index: moduleItem.order_index,
    });
    setModal('editModule');
  };

  const openLessonEditor = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? '',
      content: lesson.content ?? '',
      order_index: lesson.order_index,
    });
    setModal('editLesson');
  };

  const openUserEditor = (user: UserProfile) => {
    setEditingUser(user);
    setUserForm({
      email: user.email ?? '',
      password: '',
      username: user.username,
      fullName: user.full_name ?? '',
      role: user.role,
      company: user.company,
      status: user.status,
      avatarUrl: user.avatar_url ?? '',
    });
    setModal('editUser');
  };

  if (location.pathname === '/dashboard/admin/') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return (
    <main className="safe-page-x relative min-h-screen bg-[#F7F7F8] text-[#111114]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-[#E4E4E8] bg-white px-5 py-5 shadow-[8px_0_28px_rgba(17,17,20,0.04)] lg:min-h-screen lg:border-b-0 lg:border-r">
          <div>
            <button type="button" onClick={() => navigate('/home')} className="flex items-center gap-3 text-left">
              <img src="/assets/seven/Logo%20N.webp" alt="" className="h-9 w-9 object-contain" />
              <span>
                <span className="block text-sm font-semibold">Ecossistema Seven</span>
                <span className="block text-xs text-[#8A8A92]">Admin Dashboard</span>
              </span>
            </button>
          </div>

          <nav className="mt-8 grid gap-2 lg:flex-1 lg:content-start">
            {[
              { id: 'inicio' as const, label: 'Início', href: '/dashboard/admin', icon: BarChart3 },
              { id: 'cursos' as const, label: 'Cursos', href: '/dashboard/admin/cursos', icon: BookOpen },
              { id: 'settings' as const, label: 'Configurações', href: '/dashboard/admin/settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={`flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold transition ${
                    route === item.id ? 'bg-primary text-white shadow-[0_12px_30px_rgba(223,117,13,0.18)]' : 'text-[#5F5F66] hover:bg-[#F4F4F5] hover:text-[#111114]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#E1E1E5] bg-white text-sm font-semibold text-[#666670] transition hover:border-primary hover:text-primary lg:mt-auto"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </aside>

        <section className="min-w-0 px-5 py-6 sm:px-8 lg:px-10">
          <header className="mb-7 flex flex-col gap-4 border-b border-[#E4E4E8] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Admin</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {route === 'inicio' ? 'Início' : route === 'cursos' ? 'Cursos' : 'Configurações'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666670]">
                {profile?.full_name || profile?.username}, a plataforma nova segue isolada da home institucional.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate('/home')} className="rounded-md">
              Voltar para home
            </Button>
          </header>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center text-[#8A8A92]">Carregando dashboard...</div>
          ) : route === 'inicio' ? (
            <div className="space-y-7">
              <CollaboratorGroup
                title="Colaboradores Seven Group"
                company="Seven"
                users={collaborators.filter((user) => user.company === 'Seven')}
                courses={courses}
                progress={progress}
                profileImages={profileImages}
              />
              <CollaboratorGroup
                title="Colaboradores ARQO"
                company="ARQO"
                users={collaborators.filter((user) => user.company === 'ARQO')}
                courses={courses}
                progress={progress}
                profileImages={profileImages}
              />
            </div>
          ) : route === 'cursos' ? (
            <div className="grid gap-7 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
              <aside className="space-y-4">
                <Button type="button" onClick={() => setModal('course')} className="w-full rounded-md">
                  <Plus className="mr-2 h-4 w-4" /> Criar curso
                </Button>
                {courses.map((course) => {
                  const readiness = calculateReadiness(course);
                  return (
                    <button
                      type="button"
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`w-full rounded-lg border p-4 text-left transition ${selectedCourse?.id === course.id ? 'border-primary bg-primary/10 shadow-[0_14px_34px_rgba(223,117,13,0.12)]' : 'border-[#E6E6EA] bg-white hover:border-primary/40'}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{course.company}</p>
                      <h2 className="mt-2 font-semibold">{course.title}</h2>
                      <p className="mt-2 text-xs text-[#8A8A92]">Prontidão {readiness.score}%</p>
                    </button>
                  );
                })}
              </aside>

              <Panel className="p-5">
                {selectedCourse ? (
                  <>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{selectedCourse.company}</p>
                        <h2 className="mt-2 text-2xl font-semibold">{selectedCourse.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#666670]">{selectedCourse.description || 'Sem descrição.'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <IconButton label="Editar curso" onClick={() => openCourseEditor(selectedCourse)}>
                          <Edit3 className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Excluir curso" onClick={() => void handleDeleteCourse(selectedCourse)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Inserir módulo" onClick={() => setModal('module')}>
                          <Plus className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {selectedCourse.modules.map((moduleItem) => (
                        <article key={moduleItem.id} className="rounded-lg border border-[#ECECEF] bg-[#FAFAFB] p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="font-semibold">{moduleItem.order_index}. {moduleItem.title}</h3>
                              <p className="mt-1 text-sm text-[#666670]">{moduleItem.description || 'Sem descrição.'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <IconButton label="Editar módulo" onClick={() => openModuleEditor(moduleItem)}>
                                <Edit3 className="h-4 w-4" />
                              </IconButton>
                              <IconButton label="Excluir módulo" onClick={() => void handleDeleteModule(moduleItem)}>
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                              <IconButton
                                label="Criar aula"
                                onClick={() => {
                                  setSelectedModuleId(moduleItem.id);
                                  setModal('lesson');
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </IconButton>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2">
                            {moduleItem.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex flex-col gap-3 rounded-md border border-[#ECECEF] bg-white px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span>{lesson.order_index}. {lesson.title}</span>
                                <IconButton label="Editar aula" onClick={() => openLessonEditor(lesson)}>
                                  <Edit3 className="h-4 w-4" />
                                </IconButton>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#666670]">Crie um curso para iniciar o ambiente de configuração.</p>
                )}
              </Panel>
            </div>
          ) : (
            <div className="space-y-7">
              {missingProfiles.length > 0 && (
                <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                  <h2 className="font-semibold text-amber-900">Usuários em Authentication sem profile</h2>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Eles existem no Supabase Auth, mas não aparecem nas listas porque a dashboard lê `public.profiles`.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {missingProfiles.map((authUser) => (
                      <article key={authUser.id} className="flex flex-col gap-3 rounded-md border border-amber-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">{authUser.full_name || authUser.email || authUser.id}</p>
                          <p className="text-xs text-amber-800">{authUser.email || authUser.id}</p>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => void handleSyncProfile(authUser.id)} className="rounded-md">
                          Sincronizar profile
                        </Button>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <div className="flex justify-end">
                <Button type="button" onClick={() => setModal('user')} className="rounded-md">
                  <Plus className="mr-2 h-4 w-4" /> Criar usuário
                </Button>
              </div>

              <UserCanvas title="Admins" icon={<ShieldCheck className="h-5 w-5 text-primary" />} users={admins} onEdit={openUserEditor} admin />
              <UserCanvas title="Colaboradores" icon={<Users className="h-5 w-5 text-primary" />} users={collaborators} onEdit={openUserEditor} />
            </div>
          )}
        </section>
      </div>

      {(modal === 'course' || modal === 'editCourse') && (
        <Modal title={modal === 'course' ? 'Criar curso' : 'Editar curso'} onClose={closeModal}>
          <form onSubmit={modal === 'course' ? submitCourse : submitCourseEdit} className="grid gap-4">
            <Field label="Empresa"><SelectField value={courseForm.company} options={companyOptions} onChange={(company) => setCourseForm((current) => ({ ...current, company }))} /></Field>
            <Field label="Título"><Input className={inputClass} value={courseForm.title} onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
            <Field label="Descrição"><textarea value={courseForm.description} onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))} className={`${textInputClass} min-h-24`} /></Field>
            <FilePicker
              label={courseCoverFile ? courseCoverFile.name : 'Anexar capa do curso'}
              accept="image/*"
              helper="Imagem obrigatória até 600x400 px."
              onChange={setCourseCoverFile}
            />
            <UploadProgress value={uploadProgress} />
            <Button type="submit" className="rounded-md">{modal === 'course' ? 'Salvar curso' : 'Atualizar curso'}</Button>
          </form>
        </Modal>
      )}

      {(modal === 'module' || modal === 'editModule') && (
        <Modal title={modal === 'module' ? `Inserir módulo em ${selectedCourse?.title ?? 'curso'}` : 'Editar módulo'} onClose={closeModal}>
          <form onSubmit={modal === 'module' ? submitModule : submitModuleEdit} className="grid gap-4">
            <Field label="Título"><Input className={inputClass} value={moduleForm.title} onChange={(event) => setModuleForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
            <Field label="Descrição"><textarea value={moduleForm.description} onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))} className={`${textInputClass} min-h-20`} /></Field>
            <Field label="Ordem"><Input className={inputClass} type="number" min={1} value={moduleForm.order_index} onChange={(event) => setModuleForm((current) => ({ ...current, order_index: Number(event.target.value) }))} required /></Field>
            <Button type="submit" className="rounded-md">{modal === 'module' ? 'Salvar módulo' : 'Atualizar módulo'}</Button>
          </form>
        </Modal>
      )}

      {(modal === 'lesson' || modal === 'editLesson') && (
        <Modal title={modal === 'lesson' ? `Criar aula em ${selectedModule?.title ?? 'módulo'}` : 'Editar aula'} onClose={closeModal}>
          <form onSubmit={modal === 'lesson' ? submitLesson : submitLessonEdit} className="grid gap-4">
            <Field label="Título"><Input className={inputClass} value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
            <Field label="Descrição"><Input className={inputClass} value={lessonForm.description} onChange={(event) => setLessonForm((current) => ({ ...current, description: event.target.value }))} /></Field>
            <Field label="Texto da aula"><textarea value={lessonForm.content} onChange={(event) => setLessonForm((current) => ({ ...current, content: event.target.value }))} className={`${textInputClass} min-h-40`} /></Field>
            <FilePicker label={lessonVideo ? lessonVideo.name : 'Anexar vídeo aula'} accept="video/*" helper="Selecione o arquivo de vídeo da aula." onChange={setLessonVideo} />
            <FilePicker label={lessonAttachment ? lessonAttachment.name : 'Anexar arquivo de apoio'} helper="PDF, imagem, planilha ou material complementar." onChange={setLessonAttachment} />
            <UploadProgress value={uploadProgress} />
            <Field label="Ordem"><Input className={inputClass} type="number" min={1} value={lessonForm.order_index} onChange={(event) => setLessonForm((current) => ({ ...current, order_index: Number(event.target.value) }))} required /></Field>
            <Button type="submit" className="rounded-md">{modal === 'lesson' ? 'Salvar aula' : 'Atualizar aula'}</Button>
          </form>
        </Modal>
      )}

      {(modal === 'user' || modal === 'editUser') && (
        <Modal title={modal === 'user' ? 'Criar usuário' : 'Editar usuário'} onClose={closeModal}>
          <form onSubmit={modal === 'user' ? submitUser : submitUserEdit} className="grid gap-4">
            <FilePicker label={profileImageFile ? profileImageFile.name : 'Inserir imagem do usuário'} accept="image/*" helper="Foto exibida nos cards de acompanhamento." onChange={setProfileImageFile} />
            <UploadProgress value={uploadProgress} />
            <Field label="Nome"><Input className={inputClass} value={userForm.fullName} onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))} required /></Field>
            <Field label="Usuário"><Input className={inputClass} value={userForm.username} onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))} required /></Field>
            <Field label="Email"><Input className={inputClass} type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} required /></Field>
            <Field label={modal === 'user' ? 'Senha' : 'Nova senha (opcional)'}><Input className={inputClass} type="password" minLength={6} value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} required={modal === 'user'} /></Field>
            <Field label="Role"><SelectField value={userForm.role} options={roleOptions} onChange={(role) => setUserForm((current) => ({ ...current, role }))} /></Field>
            <Field label="Empresa"><SelectField value={userForm.company} options={companyOptions} disabled={userForm.role === 'admin'} onChange={(company) => setUserForm((current) => ({ ...current, company }))} /></Field>
            <Field label="Status"><SelectField value={userForm.status} options={statusOptions} onChange={(status) => setUserForm((current) => ({ ...current, status }))} /></Field>
            <Button type="submit" className="w-full rounded-md">{modal === 'user' ? 'Criar usuário' : 'Salvar alterações'}</Button>
          </form>
        </Modal>
      )}
      <Toast message={error || feedback} type={error ? 'error' : 'success'} />
    </main>
  );
}

function UserCanvas({
  title,
  icon,
  users,
  onEdit,
  admin = false,
}: {
  title: string;
  icon: ReactNode;
  users: UserProfile[];
  onEdit: (user: UserProfile) => void;
  admin?: boolean;
}) {
  return (
    <section className="rounded-lg border border-[#E6E6EA] bg-white shadow-[0_16px_38px_rgba(17,17,20,0.05)]">
      <header className="flex items-center gap-3 border-b border-[#ECECEF] px-5 py-4">
        {icon}
        <h2 className="font-semibold">{title}</h2>
      </header>
      <div className={`hidden gap-3 border-b border-[#ECECEF] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A92] md:grid ${admin ? 'md:grid-cols-[1.2fr_0.7fr_0.7fr_0.4fr]' : 'md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.4fr]'}`}>
        <span>Usuário</span>
        <span>Role</span>
        {!admin && <span>Empresa</span>}
        <span>Status</span>
        <span>Editar</span>
      </div>
      {users.map((user) => (
        <article key={user.id} className={`grid gap-3 border-b border-[#F0F0F2] px-5 py-4 text-sm last:border-b-0 md:items-center ${admin ? 'md:grid-cols-[1.2fr_0.7fr_0.7fr_0.4fr]' : 'md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.4fr]'}`}>
          <div>
            <p className="font-semibold">{user.full_name || user.username}</p>
            <p className="text-xs text-[#8A8A92]">{user.email || user.username}</p>
          </div>
          <InfoBadge value={user.role} tone="role" />
          {!admin && <InfoBadge value={user.company} tone="company" />}
          <InfoBadge value={user.status} tone="status" />
          <button type="button" onClick={() => onEdit(user)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E6E6EA] text-[#666670] hover:border-primary hover:text-primary">
            <Edit3 className="h-4 w-4" />
          </button>
        </article>
      ))}
      {users.length === 0 && (
        <div className="flex items-center gap-2 px-5 py-6 text-sm text-[#8A8A92]">
          <FileText className="h-4 w-4" />
          Nenhum usuário encontrado.
        </div>
      )}
    </section>
  );
}

function CollaboratorGroup({
  title,
  company,
  users,
  courses,
  progress,
  profileImages,
}: {
  title: string;
  company: Company;
  users: UserProfile[];
  courses: CourseTree[];
  progress: LessonProgress[];
  profileImages: Record<string, string>;
}) {
  const [sortMode, setSortMode] = useState<'alphabetical' | 'progress'>('alphabetical');
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const sortedUsers = useMemo(() => {
    return [...users].sort((first, second) => {
      if (sortMode === 'progress') {
        return progressForUser(second, progress, courses).percent - progressForUser(first, progress, courses).percent;
      }

      return (first.full_name || first.username).localeCompare(second.full_name || second.username);
    });
  }, [courses, progress, sortMode, users]);
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const pageUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [sortMode, users.length]);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{company}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{title}</h2>
        </div>
        <span className="rounded-md border border-[#E6E6EA] bg-white px-3 py-2 text-sm font-semibold text-[#666670]">
          {users.length} ativos
        </span>
      </div>
      <div className="mb-4 flex justify-end">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#666670]">
          Ordenar
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as 'alphabetical' | 'progress')}
            className="h-10 rounded-md border border-[#D8D8DE] bg-white px-3 text-sm text-[#111114] outline-none focus:border-primary"
          >
            <option value="alphabetical">Ordem alfabética</option>
            <option value="progress">Progresso do curso</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pageUsers.map((user) => {
          const userProgress = progressForUser(user, progress, courses);
          const imageUrl = profileImages[user.id];
          return (
            <article key={user.id} className="min-h-[268px] rounded-lg border border-[#E6E6EA] bg-white p-5 shadow-[0_16px_38px_rgba(17,17,20,0.05)]">
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F0F0F2] text-xl font-semibold text-primary">
                    {imageUrl ? (
                      <img src={imageUrl} alt={user.full_name || user.username} className="h-full w-full object-cover" />
                    ) : (
                      (user.full_name || user.username).slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <InfoBadge value={user.status} tone="status" />
                </div>

                <div className="mt-5">
                  <h3 className="text-lg font-semibold">{user.full_name || user.username}</h3>
                  <p className="mt-1 text-sm text-[#8A8A92]">{user.email || user.username}</p>
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8A8A92]">Empresa</span>
                    <InfoBadge value={user.company} tone="company" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8A8A92]">Módulo atual</span>
                    <span className="max-w-[min(12rem,52vw)] truncate font-semibold">{userProgress.currentModule}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8A8A92]">Progresso</span>
                    <span className="font-semibold">{userProgress.percent}%</span>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-[#EFEFF2]">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, userProgress.percent)}%` }} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {users.length === 0 && (
        <Panel className="p-6 text-sm text-[#8A8A92]">
          Nenhum colaborador designado para {company}.
        </Panel>
      )}

      {totalPages > 1 && (
        <footer className="mt-5 flex items-center justify-end gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((nextPage) => (
            <button
              key={nextPage}
              type="button"
              onClick={() => setPage(nextPage)}
              className={`h-9 min-w-9 rounded-md border px-3 text-sm font-semibold ${page === nextPage ? 'border-primary bg-primary text-white' : 'border-[#D8D8DE] bg-white text-[#666670]'}`}
            >
              {nextPage}
            </button>
          ))}
        </footer>
      )}
    </section>
  );
}
