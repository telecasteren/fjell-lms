"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { QuizTaker } from "@/components/quiz-taker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh";

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
  order: number;
  quiz?: {
    id: string;
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
            })
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
          setCurrentQuiz(data.quiz);
          setCurrentLessonId(lessonId);
          setQuizModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to load quiz:", error);
    }
  }

  function handleQuizComplete(passed: boolean) {
    setQuizModalOpen(false);
    setCurrentQuiz(null);
    setCurrentLessonId(null);
    // Optionally mark lesson as completed if quiz is passed
    if (passed) {
      toggleLessonCompletion(currentLessonId!, true);
      // Refresh lessons to update quiz completion status
      setTimeout(() => {
        loadLessons();
        refreshAllDashboards();
      }, 1000); // Small delay to ensure progress is saved
    } else {
      // Refresh lessons even if failed to update retake button
      setTimeout(() => {
        loadLessons();
      }, 500);
    }
  }

  if (!progress) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Learning Progress</h1>
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
        {lessons.map(lesson => {
          const lessonProgress = progress.progressMap[lesson.id];
          const isCompleted = lessonProgress?.completed || false;

          return (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={checked =>
                      toggleLessonCompletion(lesson.id, checked === true)
                    }
                    disabled={loading}
                  />
                  <div>
                    <CardTitle className="text-lg">
                      {lesson.module.title} - {lesson.title}
                    </CardTitle>
                    {lessonProgress?.completedAt && (
                      <p className="text-muted-foreground text-sm">
                        Completed on{" "}
                        {new Date(
                          lessonProgress.completedAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              {lesson.content && (
                <CardContent>
                  <p className="text-sm">{lesson.content}</p>
                </CardContent>
              )}
              {lesson.quiz && (
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
