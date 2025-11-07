"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuizEditor } from "@/components/quiz-editor";
import { LessonEditor } from "@/components/lesson-editor";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, ArrowLeft } from "lucide-react";

type Module = { id: string; title: string; order: number };
type Lesson = { id: string; title: string; content?: string; order: number };

export default function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleTitle, setModuleTitle] = useState("");
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [creatingLesson, setCreatingLesson] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    lessonId: string | null;
    lessonTitle: string;
    moduleId: string;
  }>({
    isOpen: false,
    lessonId: null,
    lessonTitle: "",
    moduleId: "",
  });
  const [deleteModuleConfirmation, setDeleteModuleConfirmation] = useState<{
    isOpen: boolean;
    moduleId: string | null;
    moduleTitle: string;
  }>({
    isOpen: false,
    moduleId: null,
    moduleTitle: "",
  });

  async function loadModules(courseId: string) {
    const res = await fetch(`/api/courses/${courseId}/modules`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setModules(data.modules);
    }
  }

  async function loadLessons(moduleId: string) {
    const res = await fetch(`/api/modules/${moduleId}/lessons`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLessons(prev => ({ ...prev, [moduleId]: data.lessons }));
    }
  }

  useEffect(() => {
    // Check if user is AUTHOR, WRITER, or ADMIN and redirect if not
    if (session?.user?.role && session.user.role !== "AUTHOR" && session.user.role !== "WRITER" && session.user.role !== "ADMIN") {
      router.push("/courses");
      return;
    }
    
    const loadData = async () => {
      const { id } = await params;
      await loadModules(id);
    };
    loadData();
  }, [params, session, router]);
  
  // Don't render if user is not AUTHOR, WRITER, or ADMIN
  if (session?.user?.role && session.user.role !== "AUTHOR" && session.user.role !== "WRITER" && session.user.role !== "ADMIN") {
    return <div>Redirecting...</div>;
  }

  async function createModule() {
    if (!moduleTitle.trim()) return;
    const { id } = await params;
    const res = await fetch(`/api/courses/${id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: moduleTitle }),
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setModuleTitle("");
      await loadModules(id);

      // Auto-create first lesson
      await createLesson(data.module.id, "Lesson 1");

      // Auto-expand the lessons section for the new module
      setExpandedModule(data.module.id);
      await loadLessons(data.module.id);
    }
  }

  async function createLesson(moduleId: string, title?: string) {
    if (!title) {
      setCreatingLesson(moduleId);
      setNewLessonTitle("");
      return;
    }
    const res = await fetch(`/api/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
      credentials: "include",
    });
    if (res.ok) {
      await loadLessons(moduleId);
    }
  }

  async function saveNewLesson(moduleId: string) {
    if (!newLessonTitle.trim()) return;

    const res = await fetch(`/api/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newLessonTitle.trim() }),
      credentials: "include",
    });

    if (res.ok) {
      await loadLessons(moduleId);
      setCreatingLesson(null);
      setNewLessonTitle("");
    }
  }

  function cancelLessonCreation() {
    setCreatingLesson(null);
    setNewLessonTitle("");
  }

  async function deleteLesson(lessonId: string, moduleId: string) {
    const res = await fetch(`/api/lessons/${lessonId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      await loadLessons(moduleId);
    }
  }

  function handleDeleteLessonClick(
    lessonId: string,
    lessonTitle: string,
    moduleId: string
  ) {
    setDeleteConfirmation({
      isOpen: true,
      lessonId,
      lessonTitle,
      moduleId,
    });
  }

  function handleDeleteLessonConfirm() {
    if (deleteConfirmation.lessonId && deleteConfirmation.moduleId) {
      deleteLesson(deleteConfirmation.lessonId, deleteConfirmation.moduleId);
    }
  }

  function handleDeleteLessonCancel() {
    setDeleteConfirmation({
      isOpen: false,
      lessonId: null,
      lessonTitle: "",
      moduleId: "",
    });
  }

  async function updateModule(moduleId: string) {
    if (!editingModuleTitle.trim()) return;

    const res = await fetch(`/api/modules/${moduleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingModuleTitle.trim() }),
      credentials: "include",
    });

    if (res.ok) {
      setModules(prev =>
        prev.map(m =>
          m.id === moduleId ? { ...m, title: editingModuleTitle.trim() } : m
        )
      );
      setEditingModule(null);
      setEditingModuleTitle("");
    }
  }

  async function deleteModule(moduleId: string) {
    const res = await fetch(`/api/modules/${moduleId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setModules(prev => prev.filter(m => m.id !== moduleId));
      if (expandedModule === moduleId) {
        setExpandedModule(null);
      }
    }
  }

  function startEditingModule(module: Module) {
    setEditingModule(module.id);
    setEditingModuleTitle(module.title);
  }

  function cancelEditingModule() {
    setEditingModule(null);
    setEditingModuleTitle("");
  }

  function canDeleteModule(moduleId: string) {
    const moduleLessons = lessons[moduleId] || [];
    return moduleLessons.length === 0;
  }

  function handleDeleteModuleClick(moduleId: string, moduleTitle: string) {
    setDeleteModuleConfirmation({
      isOpen: true,
      moduleId,
      moduleTitle,
    });
  }

  function handleDeleteModuleConfirm() {
    if (deleteModuleConfirmation.moduleId) {
      deleteModule(deleteModuleConfirmation.moduleId);
      setDeleteModuleConfirmation({
        isOpen: false,
        moduleId: null,
        moduleTitle: "",
      });
    }
  }

  function handleDeleteModuleCancel() {
    setDeleteModuleConfirmation({
      isOpen: false,
      moduleId: null,
      moduleTitle: "",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/courses")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Course Modules</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Module</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <input
            placeholder="Module title"
            value={moduleTitle}
            onChange={e => setModuleTitle(e.target.value)}
            className="bg-background flex-1 rounded-md border px-3 py-2"
          />
          <Button onClick={createModule}>Next</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {modules.map(module => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-2">
                  {editingModule === module.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        value={editingModuleTitle}
                        onChange={e => setEditingModuleTitle(e.target.value)}
                        className="bg-background flex-1 rounded-md border px-3 py-2"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            updateModule(module.id);
                          } else if (e.key === "Escape") {
                            cancelEditingModule();
                          }
                        }}
                      />
                      <Button size="sm" onClick={() => updateModule(module.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingModule}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span>{module.title}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingModule(module)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {canDeleteModule(module.id) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleDeleteModuleClick(module.id, module.title)
                          }
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (expandedModule === module.id) {
                      setExpandedModule(null);
                    } else {
                      setExpandedModule(module.id);
                      loadLessons(module.id);
                    }
                  }}
                >
                  {expandedModule === module.id ? "Hide" : "Show"} Lessons
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedModule === module.id && (
              <CardContent>
                <div className="space-y-2">
                  <Button onClick={() => createLesson(module.id)}>
                    Add Lesson
                  </Button>

                  {/* Inline lesson creation form */}
                  {creatingLesson === module.id && (
                    <div className="bg-muted/50 rounded border p-3">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">
                            Lesson Title
                          </label>
                          <input
                            placeholder="Enter lesson title..."
                            value={newLessonTitle}
                            onChange={e => setNewLessonTitle(e.target.value)}
                            className="bg-background mt-1 w-full rounded-md border px-3 py-2"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                saveNewLesson(module.id);
                              } else if (e.key === "Escape") {
                                cancelLessonCreation();
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveNewLesson(module.id)}
                            disabled={!newLessonTitle.trim()}
                          >
                            Save Lesson
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelLessonCreation}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {lessons[module.id]?.map(lesson => (
                    <div key={lesson.id} className="rounded border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.content && (
                            <p className="text-muted-foreground text-sm">
                              {lesson.content}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingLesson(lesson.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeleteLessonClick(
                                lesson.id,
                                lesson.title,
                                module.id
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {editingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <QuizEditor
            lessonId={editingQuiz}
            onClose={() => setEditingQuiz(null)}
          />
        </div>
      )}

      {editingLesson && (
        <LessonEditor
          lessonId={editingLesson}
          onClose={() => setEditingLesson(null)}
        />
      )}

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={handleDeleteLessonCancel}
        onConfirm={handleDeleteLessonConfirm}
        title="Delete Lesson"
        message={`Are you sure you want to delete "${deleteConfirmation.lessonTitle}"?\n\nAll files and multimedia associated with this lesson will be deleted.\n\nThis action cannot be undone.`}
        confirmText="Delete Lesson"
        cancelText="Cancel"
        variant="destructive"
      />

      <ConfirmationDialog
        isOpen={deleteModuleConfirmation.isOpen}
        onClose={handleDeleteModuleCancel}
        onConfirm={handleDeleteModuleConfirm}
        title="Delete Module"
        message={`Are you sure you want to delete the module "${deleteModuleConfirmation.moduleTitle}"? This action cannot be undone.`}
        confirmText="Delete Module"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
