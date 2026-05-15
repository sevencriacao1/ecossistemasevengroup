import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Download, Home, LogOut, PlayCircle, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchLearningTree,
  fetchProgress,
  getLessonAttachmentUrl,
  getLessonVideoUrl,
  getStorageImageUrl,
  upsertLessonProgress,
} from '../../services/learningService';
import { CourseTree, LessonProgress } from '../../types/learning';

function getCourseLessons(course: CourseTree) {
  return course.modules.flatMap((moduleItem) => moduleItem.lessons);
}

function findFirstLesson(course?: CourseTree | null) {
  return course ? getCourseLessons(course)[0] ?? null : null;
}

function getLessonProgress(progress: LessonProgress[], lessonId: string) {
  return progress.find((item) => item.lesson_id === lessonId);
}

function getCourseProgress(course: CourseTree, progress: LessonProgress[]) {
  const lessons = getCourseLessons(course);
  if (lessons.length === 0) return 0;
  const completed = lessons.filter((lesson) => getLessonProgress(progress, lesson.id)?.completed).length;
  return Math.round((completed / lessons.length) * 100);
}

function getRouteId(pathname: string, segment: 'cursos' | 'aulas') {
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf(segment);
  return index >= 0 ? parts[index + 1] : '';
}

export function CollaboratorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [courses, setCourses] = useState<CourseTree[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const courseId = getRouteId(location.pathname, 'cursos');
  const lessonId = getRouteId(location.pathname, 'aulas');
  const activeCourse = courses.find((course) => course.id === courseId) ?? null;
  const allLessons = useMemo(() => courses.flatMap(getCourseLessons), [courses]);
  const activeLesson = allLessons.find((lesson) => lesson.id === lessonId) ?? null;
  const courseForLesson = courses.find((course) => getCourseLessons(course).some((lesson) => lesson.id === activeLesson?.id)) ?? null;
  const completedCount = progress.filter((item) => item.completed).length;
  const globalProgress = allLessons.length ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const lastProgress = [...progress].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))[0];
  const continueLesson = allLessons.find((lesson) => lesson.id === lastProgress?.lesson_id)
    ?? findFirstLesson(activeCourse)
    ?? allLessons[0]
    ?? null;

  const refresh = async () => {
    if (!profile) return;
    const nextCourses = await fetchLearningTree();
    const companyCourses = nextCourses.filter((course) => course.company === profile.company);
    const preferModernSchema = companyCourses.some((course) => !course.id.startsWith('legacy-'));
    const nextProgress = await fetchProgress(profile.id, preferModernSchema);
    setCourses(companyCourses);
    setProgress(nextProgress);
  };

  useEffect(() => {
    refresh()
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : 'Não foi possível carregar suas aulas.');
      })
      .finally(() => setIsLoading(false));
  }, [profile?.id]);

  useEffect(() => {
    const loadCovers = async () => {
      const entries = await Promise.all(
        courses.map(async (course) => [course.id, await getStorageImageUrl('course-covers', course.cover_url)] as const)
      );
      setCoverUrls(Object.fromEntries(entries));
    };

    void loadCovers();
  }, [courses]);

  useEffect(() => {
    if (!activeLesson?.video_url) {
      setVideoUrl('');
      return;
    }

    getLessonVideoUrl(activeLesson.video_url)
      .then(setVideoUrl)
      .catch(() => setVideoUrl(''));
  }, [activeLesson]);

  useEffect(() => {
    if (!activeLesson?.attachment_url) {
      setAttachmentUrl('');
      return;
    }

    getLessonAttachmentUrl(activeLesson.attachment_url)
      .then(setAttachmentUrl)
      .catch(() => setAttachmentUrl(''));
  }, [activeLesson]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const openContinueLesson = (course?: CourseTree | null) => {
    const target = course
      ? getCourseLessons(course).find((lesson) => !getLessonProgress(progress, lesson.id)?.completed) ?? findFirstLesson(course)
      : continueLesson;

    if (target) navigate(`/dashboard/colaborador/aulas/${target.id}`);
  };

  const completeLesson = async () => {
    if (!profile || !activeLesson) return;
    await upsertLessonProgress(profile.id, activeLesson.id, 100);
    await refresh();

    const currentCourse = courseForLesson;
    const lessons = currentCourse ? getCourseLessons(currentCourse) : allLessons;
    const currentIndex = lessons.findIndex((lesson) => lesson.id === activeLesson.id);
    const nextLesson = lessons[currentIndex + 1];

    if (nextLesson) {
      navigate(`/dashboard/colaborador/aulas/${nextLesson.id}`);
    } else if (currentCourse) {
      navigate(`/dashboard/colaborador/cursos/${currentCourse.id}`);
    } else {
      navigate('/dashboard/colaborador');
    }
  };

  return (
    <main className="safe-page-x relative min-h-screen bg-[#F7F7F8] text-[#111114]">
      <header className="border-b border-[#E4E4E8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <button type="button" onClick={() => navigate('/home')} className="flex items-center gap-3 text-left">
            <img src="/assets/seven/Logo%20N.webp" alt="" className="h-10 w-10 object-contain" />
            <span>
              <span className="block text-sm font-semibold">Ecossistema Seven</span>
              <span className="block text-xs text-[#8A8A92]">Portal do colaborador</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/home')} aria-label="Home" className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E1E1E5] text-[#666670] transition hover:border-primary hover:text-primary">
              <Home className="h-4 w-4" />
            </button>
            <button type="button" onClick={handleSignOut} aria-label="Sair" className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E1E1E5] text-[#666670] transition hover:border-primary hover:text-primary">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <aside className="space-y-4">
          {[
            { label: 'Empresa', value: profile?.company ?? 'Seven', icon: ShieldCheck },
            { label: 'Cursos disponíveis', value: courses.length, icon: BookOpen },
            { label: 'Aulas concluídas', value: completedCount, icon: CheckCircle2 },
            { label: 'Progresso geral', value: `${globalProgress}%`, icon: PlayCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-lg border border-[#E6E6EA] bg-white p-5 shadow-[0_16px_38px_rgba(17,17,20,0.05)]">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-5 text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8A8A92]">{item.label}</p>
              </article>
            );
          })}
        </aside>

        <div className="space-y-6">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {!courseId && !lessonId && (
            <section className="rounded-lg border border-[#E6E6EA] bg-white p-5 shadow-[0_16px_38px_rgba(17,17,20,0.05)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{profile?.company}</p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.04em]">Cursos disponíveis</h1>
                  <p className="mt-2 text-sm leading-6 text-[#666670]">Escolha um curso para ver as aulas disponíveis.</p>
                </div>
                <Button type="button" onClick={() => openContinueLesson()} className="rounded-md">
                  Continuar de onde parou <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <CourseCards
                isLoading={isLoading}
                courses={courses}
                progress={progress}
                coverUrls={coverUrls}
                onOpenCourse={(course) => navigate(`/dashboard/colaborador/cursos/${course.id}`)}
              />
            </section>
          )}

          {activeCourse && !lessonId && (
            <section className="rounded-lg border border-[#E6E6EA] bg-white p-5 shadow-[0_16px_38px_rgba(17,17,20,0.05)]">
              <button type="button" onClick={() => navigate('/dashboard/colaborador')} className="mb-4 text-sm font-semibold text-primary">
                Voltar aos cursos
              </button>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{activeCourse.company}</p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.04em]">{activeCourse.title}</h1>
                  <p className="mt-2 text-sm leading-6 text-[#666670]">{activeCourse.description || 'Curso de onboarding interno.'}</p>
                </div>
                <Button type="button" onClick={() => openContinueLesson(activeCourse)} className="rounded-md">
                  Continuar aula <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {activeCourse.modules.map((moduleItem) => (
                  <article key={moduleItem.id} className="rounded-lg border border-[#ECECEF] bg-[#FAFAFB] p-4">
                    <h2 className="font-semibold">{moduleItem.order_index}. {moduleItem.title}</h2>
                    <div className="mt-3 grid gap-2">
                      {moduleItem.lessons.map((lesson) => {
                        const lessonProgress = getLessonProgress(progress, lesson.id);
                        return (
                          <button
                            type="button"
                            key={lesson.id}
                            onClick={() => navigate(`/dashboard/colaborador/aulas/${lesson.id}`)}
                            className="flex flex-col gap-3 rounded-md border border-[#ECECEF] bg-white px-3 py-3 text-left text-sm transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <PlayCircle className="h-4 w-4 text-primary" />
                              {lesson.title}
                            </span>
                            <span className={lessonProgress?.completed ? 'text-emerald-700' : 'text-[#8A8A92]'}>
                              {lessonProgress?.completed ? 'concluída' : `${lessonProgress?.progress ?? 0}%`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeLesson && lessonId && (
            <section className="rounded-lg border border-[#E6E6EA] bg-white p-5 shadow-[0_16px_38px_rgba(17,17,20,0.05)]">
              <button
                type="button"
                onClick={() => navigate(courseForLesson ? `/dashboard/colaborador/cursos/${courseForLesson.id}` : '/dashboard/colaborador')}
                className="mb-4 text-sm font-semibold text-primary"
              >
                Voltar ao curso
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Aula</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.04em]">{activeLesson.title}</h1>
              <p className="mt-2 text-sm leading-6 text-[#666670]">{activeLesson.description || 'Sem descrição.'}</p>

              <div className="mt-6 overflow-hidden rounded-lg border border-[#ECECEF] bg-black">
                {videoUrl ? (
                  <video src={videoUrl} controls className="aspect-video w-full bg-black" />
                ) : (
                  <div className="flex aspect-video items-center justify-center px-5 text-center text-sm leading-6 text-white/70">
                    Vídeo indisponível agora. O texto da aula continua disponível.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-md border border-[#ECECEF] bg-[#FAFAFB] p-4">
                <p className="whitespace-pre-line text-sm leading-7 text-[#55555D]">
                  {activeLesson.content || 'Conteúdo textual ainda não cadastrado para esta aula.'}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {attachmentUrl && (
                  <a href={attachmentUrl} className="inline-flex items-center rounded-md border border-[#D8D8DE] bg-[#F1F1F3] px-4 py-2 text-sm font-semibold text-[#111114] transition hover:border-primary">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar anexo
                  </a>
                )}
                <Button type="button" onClick={completeLesson} className="rounded-md">
                  Concluir aula
                </Button>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function CourseCards({
  isLoading,
  courses,
  progress,
  coverUrls,
  onOpenCourse,
}: {
  isLoading: boolean;
  courses: CourseTree[];
  progress: LessonProgress[];
  coverUrls: Record<string, string>;
  onOpenCourse: (course: CourseTree) => void;
}) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {isLoading ? (
        <p className="text-sm text-[#8A8A92]">Carregando conteúdos...</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-[#8A8A92]">Nenhum curso ativo para sua empresa ainda.</p>
      ) : courses.map((course) => {
        const courseProgress = getCourseProgress(course, progress);
        const coverUrl = coverUrls[course.id];
        return (
          <button
            type="button"
            key={course.id}
            onClick={() => onOpenCourse(course)}
            className="overflow-hidden rounded-lg border border-[#ECECEF] bg-[#FAFAFB] text-left transition hover:border-primary/40"
          >
            <div className="aspect-[3/2] bg-[#ECECEF]">
              {coverUrl ? (
                <img src={coverUrl} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-[#8A8A92]">Sem capa</div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold">{course.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#666670]">{course.description || 'Curso de onboarding interno.'}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-primary">{courseProgress}% concluído</span>
                <span className="text-sm font-semibold text-[#666670]">Acessar</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFEFF2]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${courseProgress}%` }} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
