"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizTaker } from "@/components/quiz-taker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Quiz = {
  id: string;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correctAnswers: number[];
  }>;
};

type Lesson = {
  id: string;
  title: string;
  content?: string;
  contentType?: string;
  multimediaFiles?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type?: string;
  }>;
  order: number;
  quiz?: {
    id: string;
    mandatory?: boolean;
  };
  quizCompletion?: {
    passed: boolean;
    attempts: number;
  };
  module: {
    id: string;
    title: string;
    order: number;
  };
};

type Progress = {
  completed: boolean;
  completedAt?: string;
};

type CourseProgress = {
  courseId: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
  progressMap: Record<string, Progress>;
};

export default function LearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const { refreshAllDashboards } = useDashboardRefresh();

  useEffect(() => {
    loadLessons();
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  // Auto-complete lessons with mandatory quizzes that have been passed
  useEffect(() => {
    if (!lessons.length || !progress) return;

    const lessonsToComplete = lessons.filter((lesson) => {
      const isMandatoryQuiz = lesson.quiz?.mandatory ?? false;
      const hasPassedQuiz = lesson.quizCompletion?.passed ?? false;
      const isNotCompleted = !progress.progressMap[lesson.id]?.completed;
      return isMandatoryQuiz && hasPassedQuiz && isNotCompleted;
    });

    if (lessonsToComplete.length > 0) {
      lessonsToComplete.forEach((lesson) => {
        toggleLessonCompletion(lesson.id, true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons, progress]);

  async function loadLessons() {
    const res = await fetch(`/api/courses/${resolvedParams.id}/modules`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      const allLessons: Lesson[] = [];

      for (const moduleData of data.modules) {
        const lessonRes = await fetch(`/api/modules/${moduleData.id}/lessons`, {
          credentials: "include",
        });
        if (lessonRes.ok) {
          const lessonData = await lessonRes.json();
          const lessonsWithModule = lessonData.lessons.map(
            (lesson: Lesson) => ({
              ...lesson,
              module: {
                id: moduleData.id,
                title: moduleData.title,
                order: moduleData.order,
              },
            }),
          );
          allLessons.push(...lessonsWithModule);
        }
      }

      // Sort by module order, then lesson order
      allLessons.sort((a, b) => {
        if (a.module.order !== b.module.order) {
          return a.module.order - b.module.order;
        }
        return a.order - b.order;
      });

      setLessons(allLessons);
    }
  }

  async function loadProgress() {
    const res = await fetch(`/api/courses/${resolvedParams.id}/progress`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setProgress(data);
    }
  }

  async function toggleLessonCompletion(lessonId: string, completed: boolean) {
    setLoading(true);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, completed }),
      credentials: "include",
    });
    setLoading(false);

    if (res.ok) {
      await loadProgress();
    }
  }

  async function openQuiz(lessonId: string) {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quiz) {
          // Ensure questions array exists and has proper structure
          type QuizQuestion = {
            id: string;
            text: string;
            type?: "radio" | "checkbox" | "text";
            options?: string[];
            correctAnswers?: number[];
          };
          const questions = (data.quiz.questions || []).map(
            (q: QuizQuestion) => ({
              ...q,
              type: q.type || "checkbox", // Default to checkbox if type is missing
              options: q.options || [],
              correctAnswers: q.correctAnswers || [],
            }),
          );

          // Only open quiz if it has questions
          if (questions.length > 0) {
            const quiz = {
              ...data.quiz,
              questions,
            };
            setCurrentQuiz(quiz);
            setCurrentLessonId(lessonId);
            setQuizModalOpen(true);
          } else {
            // Quiz exists but has no questions - don't show it
            console.warn("Quiz has no questions, not opening");
          }
        }
      }
    } catch (error) {
      console.error("Failed to load quiz:", error);
    }
  }

  async function handleQuizComplete(passed: boolean) {
    setQuizModalOpen(false);
    const lessonId = currentLessonId;
    setCurrentQuiz(null);
    setCurrentLessonId(null);

    // Refresh lessons to update quiz completion status
    await loadLessons();

    // If quiz is passed, automatically mark lesson as completed
    // This ensures the lesson is completed when mandatory quiz is passed
    if (passed && lessonId) {
      // Small delay to ensure quiz completion is saved first
      setTimeout(async () => {
        await toggleLessonCompletion(lessonId, true);
        await loadProgress();
        refreshAllDashboards();
      }, 500);
    } else {
      // Refresh progress even if failed
      setTimeout(() => {
        loadProgress();
      }, 500);
    }
  }

  if (!progress) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6 rounded" />
                    <div>
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/courses")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">Learning Progress</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{progress.percentage}%</div>
          <div className="text-muted-foreground text-sm">
            {progress.completedCount} of {progress.totalCount} lessons completed
          </div>
        </div>
      </div>

      <div className="h-4 w-full rounded-full bg-gray-200">
        <div
          className="h-4 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        ></div>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => {
          const lessonProgress = progress.progressMap[lesson.id];
          const isCompleted = lessonProgress?.completed || false;
          // A quiz only exists if it has an ID (API now filters out quizzes without questions)
          const hasQuiz = !!lesson.quiz?.id;
          const isMandatoryQuiz = lesson.quiz?.mandatory ?? false;
          const hasPassedQuiz = lesson.quizCompletion?.passed ?? false;
          // Can complete if: no quiz, or quiz is not mandatory, or mandatory quiz is passed
          const canComplete = !hasQuiz || !isMandatoryQuiz || hasPassedQuiz;
          // If mandatory quiz is passed, automatically mark as completed and disable checkbox
          const shouldAutoComplete = isMandatoryQuiz && hasPassedQuiz;
          const isCheckboxDisabled =
            loading || !canComplete || shouldAutoComplete;
          const isCheckboxChecked = isCompleted || shouldAutoComplete;

          return (
            <Card key={lesson.id} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isCheckboxChecked}
                    onCheckedChange={(checked) => {
                      // Prevent unchecking if mandatory quiz is passed
                      if (shouldAutoComplete) return;
                      toggleLessonCompletion(lesson.id, checked === true);
                    }}
                    disabled={isCheckboxDisabled}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {lesson.module.title} - {lesson.title}
                    </CardTitle>
                    {lessonProgress?.completedAt && (
                      <p className="text-muted-foreground text-sm">
                        Completed on{" "}
                        {new Date(
                          lessonProgress.completedAt,
                        ).toLocaleDateString()}
                      </p>
                    )}
                    {isMandatoryQuiz && !hasPassedQuiz && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        Pass the quiz to complete this lesson.
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              {(lesson.content ||
                (lesson.contentType === "multimedia" &&
                  lesson.multimediaFiles &&
                  lesson.multimediaFiles.length > 0)) && (
                <CardContent>
                  {lesson.contentType === "multimedia" ? (
                    <div className="space-y-4">
                      {/* Render embed code if present */}
                      {lesson.content &&
                        (() => {
                          const embedMatch = lesson.content.match(
                            /<!--EMBED_START-->([\s\S]*?)<!--EMBED_END-->/,
                          );
                          const textMatch = lesson.content.match(
                            /<!--TEXT_START-->([\s\S]*?)<!--TEXT_END-->/,
                          );

                          return (
                            <>
                              {embedMatch && (
                                <div
                                  className="w-full"
                                  dangerouslySetInnerHTML={{
                                    __html: embedMatch[1].trim(),
                                  }}
                                />
                              )}
                              {/* Render uploaded multimedia files */}
                              {lesson.multimediaFiles &&
                                lesson.multimediaFiles.length > 0 && (
                                  <div className="space-y-4">
                                    {lesson.multimediaFiles.map((file) => (
                                      <div key={file.id} className="space-y-2">
                                        {file.type?.startsWith("image/") && (
                                          <Image
                                            src={file.url}
                                            alt={file.name}
                                            width={800}
                                            height={600}
                                            className="w-full h-auto rounded-md"
                                            unoptimized
                                          />
                                        )}
                                        {file.type?.startsWith("video/") && (
                                          <video
                                            src={file.url}
                                            controls
                                            className="w-full rounded-md bg-black"
                                          >
                                            Your browser does not support the
                                            video tag.
                                          </video>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              {/* Render text content if present */}
                              {textMatch && (
                                <div
                                  className={cn(
                                    "prose prose-sm dark:prose-invert max-w-none",
                                    // Typography styling
                                    "[&_p]:mb-2 [&_p]:last:mb-0",
                                    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
                                    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
                                    "[&_li]:my-1",
                                    "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2",
                                    "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2",
                                    "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-2",
                                    "[&_strong]:font-bold",
                                    "[&_em]:italic",
                                    "[&_u]:underline",
                                    "[&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:px-0.5 [&_mark]:rounded",
                                    "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
                                    "[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2",
                                    "[&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80 [&_a]:cursor-pointer",
                                    "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-4",
                                    // Table styling
                                    "[&_table]:border-collapse [&_table]:border [&_table]:border-border [&_table]:my-4 [&_table]:w-full",
                                    "[&_table_td]:border [&_table_td]:border-border [&_table_td]:px-3 [&_table_td]:py-2 [&_table_td]:min-w-[100px]",
                                    "[&_table_th]:border [&_table_th]:border-border [&_table_th]:px-3 [&_table_th]:py-2 [&_table_th]:bg-muted [&_table_th]:font-semibold [&_table_th]:text-left",
                                    "[&_table_tr]:border-b [&_table_tr]:border-border",
                                    // Text alignment styling
                                    "[&_[style*='text-align:left']]:text-left",
                                    "[&_[style*='text-align:center']]:text-center",
                                    "[&_[style*='text-align:right']]:text-right",
                                    "[&_[style*='text-align:justify']]:text-justify",
                                  )}
                                  dangerouslySetInnerHTML={{
                                    __html: textMatch[1].trim(),
                                  }}
                                />
                              )}
                              {/* Backward compatibility: if no markers, render content as-is */}
                              {!embedMatch && !textMatch && lesson.content && (
                                <div
                                  className="w-full"
                                  dangerouslySetInnerHTML={{
                                    __html: lesson.content,
                                  }}
                                />
                              )}
                            </>
                          );
                        })()}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "prose prose-sm dark:prose-invert max-w-none",
                        // Typography styling
                        "[&_p]:mb-2 [&_p]:last:mb-0",
                        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
                        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
                        "[&_li]:my-1",
                        "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2",
                        "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2",
                        "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-2",
                        "[&_strong]:font-bold",
                        "[&_em]:italic",
                        "[&_u]:underline",
                        "[&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:px-0.5 [&_mark]:rounded",
                        "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
                        "[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2",
                        "[&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80 [&_a]:cursor-pointer",
                        "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-4",
                        // Table styling
                        "[&_table]:border-collapse [&_table]:border [&_table]:border-border [&_table]:my-4 [&_table]:w-full",
                        "[&_table_td]:border [&_table_td]:border-border [&_table_td]:px-3 [&_table_td]:py-2 [&_table_td]:min-w-[100px]",
                        "[&_table_th]:border [&_table_th]:border-border [&_table_th]:px-3 [&_table_th]:py-2 [&_table_th]:bg-muted [&_table_th]:font-semibold [&_table_th]:text-left",
                        "[&_table_tr]:border-b [&_table_tr]:border-border",
                        // Text alignment styling
                        "[&_[style*='text-align:left']]:text-left",
                        "[&_[style*='text-align:center']]:text-center",
                        "[&_[style*='text-align:right']]:text-right",
                        "[&_[style*='text-align:justify']]:text-justify",
                      )}
                      dangerouslySetInnerHTML={{ __html: lesson.content || "" }}
                    />
                  )}
                </CardContent>
              )}
              {lesson.quiz?.id && (
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openQuiz(lesson.id)}
                    className="gap-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {lesson.quizCompletion
                      ? lesson.quizCompletion.passed
                        ? "Quiz Passed"
                        : "Retake Quiz"
                      : "Take Quiz"}
                  </Button>
                  {lesson.quizCompletion && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Attempts: {lesson.quizCompletion.attempts} | Status:{" "}
                      {lesson.quizCompletion.passed ? "Passed" : "Failed"}
                    </p>
                  )}
                </CardContent>
              )}
              {/* Redo button - show for lessons with quizzes that have been completed */}
              {lesson.quiz?.id && lesson.quizCompletion && (
                <div className="absolute bottom-4 right-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!lesson.quiz?.id) return;

                      // Delete quiz completion
                      const res = await fetch(
                        `/api/quiz-completion?quizId=${lesson.quiz.id}`,
                        {
                          method: "DELETE",
                          credentials: "include",
                        },
                      );

                      if (res.ok) {
                        // Refresh lessons and progress
                        await loadLessons();
                        await loadProgress();
                        refreshAllDashboards();

                        // Open the quiz again
                        openQuiz(lesson.id);
                      }
                    }}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Redo
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quiz Modal */}
      <Dialog open={quizModalOpen} onOpenChange={setQuizModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz</DialogTitle>
          </DialogHeader>
          {currentQuiz && (
            <QuizTaker quiz={currentQuiz} onComplete={handleQuizComplete} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
