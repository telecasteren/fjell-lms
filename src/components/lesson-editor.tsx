"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { MultimediaUploader } from "@/components/multimedia-uploader";
import { X, FileText, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";

type Lesson = {
  id: string;
  title: string;
  content?: string;
  contentType?: string;
  order: number;
};

type ContentType = "text" | "scorm" | "multimedia";

type SavedMultimediaFile = {
  id: string;
  name: string;
  url: string;
  size: number;
  type?: string;
  metadata?: Record<string, unknown>;
};

type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswers: number[];
};

type LessonEditorProps = {
  lessonId: string;
  onClose: () => void;
};

export function LessonEditor({ lessonId, onClose }: LessonEditorProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "quiz">("content");
  const [contentType, setContentType] = useState<ContentType>("text");
  const [savedMultimediaFiles, setSavedMultimediaFiles] = useState<
    SavedMultimediaFile[]
  >([]);
  const [selectedFilesToDelete, setSelectedFilesToDelete] = useState<
    Set<string>
  >(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    questionId: string | null;
    questionText: string;
  }>({
    isOpen: false,
    questionId: null,
    questionText: "",
  });

  useEffect(() => {
    loadLesson();
    loadQuiz();
  }, [lessonId]);

  async function loadLesson() {
    const res = await fetch(`/api/lessons/${lessonId}`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLesson(data.lesson);
      if (data.lesson.contentType) {
        setContentType(data.lesson.contentType as ContentType);
      }
      // Load saved multimedia files
      if (data.lesson.multimediaFiles) {
        setSavedMultimediaFiles(data.lesson.multimediaFiles);
      }
    }
  }

  async function loadQuiz() {
    const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.quiz) {
        setQuestions(data.quiz.questions || []);
      }
    }
  }

  function toggleFileSelection(fileId: string) {
    const newSelection = new Set(selectedFilesToDelete);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFilesToDelete(newSelection);
  }

  async function deleteSelectedFiles() {
    if (selectedFilesToDelete.size === 0) {
      toast.error("Please select files to delete");
      return;
    }

    setLoading(true);

    try {
      const filesToDelete = Array.from(selectedFilesToDelete);

      // Delete each file from server and Bunny Storage
      for (const fileId of filesToDelete) {
        const file = savedMultimediaFiles.find(f => f.id === fileId);

        // Call DELETE endpoint to remove from database and Bunny Storage
        const response = await fetch(`/api/lessons/${lessonId}/multimedia`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
          credentials: "include",
        });

        if (!response.ok) {
          toast.error(`Failed to delete ${file?.name || "file"}`);
        }
      }

      // Update local state to remove deleted files
      setSavedMultimediaFiles(prev =>
        prev.filter(file => !selectedFilesToDelete.has(file.id))
      );
      setSelectedFilesToDelete(new Set());

      toast.success(`Deleted ${filesToDelete.length} file(s)`);

      // Reload lesson to get fresh data
      await loadLesson();
    } catch {
      console.error("Error deleting files:", error);
      toast.error("Failed to delete files");
    } finally {
      setLoading(false);
    }
  }

  async function saveLesson() {
    if (!lesson) return;
    setLoading(true);

    try {
      const requestBody = {
        title: lesson.title,
        ...(lesson.content !== null && { content: lesson.content }),
        contentType: contentType,
      };

      console.log("Sending lesson data:", requestBody);

      // Save lesson content
      const lessonRes = await fetch(`/api/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      if (!lessonRes.ok) {
        throw new Error("Failed to save lesson content");
      }

      // Save quiz data
      const quizRes = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
        credentials: "include",
      });

      if (!quizRes.ok) {
        throw new Error("Failed to save quiz");
      }

      // Both saves successful, close editor
      toast.success("Lesson saved!");
      onClose();
    } catch {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save lesson. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function addQuestion() {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      options: ["", ""],
      correctAnswers: [],
    };
    setQuestions([...questions, newQuestion]);
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setQuestions(questions.map(q => (q.id === id ? { ...q, ...updates } : q)));
  }

  function deleteQuestion(id: string) {
    setQuestions(questions.filter(q => q.id !== id));
  }

  function handleDeleteQuestionClick(questionId: string, questionText: string) {
    setDeleteConfirmation({
      isOpen: true,
      questionId,
      questionText,
    });
  }

  function handleDeleteQuestionConfirm() {
    if (deleteConfirmation.questionId) {
      setQuestions(
        questions.filter(q => q.id !== deleteConfirmation.questionId)
      );
    }
  }

  function handleDeleteQuestionCancel() {
    setDeleteConfirmation({
      isOpen: false,
      questionId: null,
      questionText: "",
    });
  }

  function addOption(questionId: string) {
    updateQuestion(questionId, {
      options: [...questions.find(q => q.id === questionId)!.options, ""],
    });
  }

  function updateOption(
    questionId: string,
    optionIndex: number,
    value: string
  ) {
    const question = questions.find(q => q.id === questionId)!;
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  }

  function toggleCorrectAnswer(questionId: string, optionIndex: number) {
    const question = questions.find(q => q.id === questionId)!;
    const correctAnswers = question.correctAnswers.includes(optionIndex)
      ? question.correctAnswers.filter(i => i !== optionIndex)
      : [...question.correctAnswers, optionIndex];
    updateQuestion(questionId, { correctAnswers });
  }

  if (!lesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Lesson: {lesson.title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <div className="mb-6 flex space-x-2">
            <Button
              variant={activeTab === "content" ? "default" : "outline"}
              onClick={() => setActiveTab("content")}
            >
              Content
            </Button>
            <Button
              variant={activeTab === "quiz" ? "default" : "outline"}
              onClick={() => setActiveTab("quiz")}
            >
              Quiz
            </Button>
          </div>

          {activeTab === "content" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <input
                  id="title"
                  placeholder="Lesson title"
                  value={lesson.title}
                  onChange={e =>
                    setLesson({ ...lesson, title: e.target.value })
                  }
                  className="bg-background w-full rounded-md border px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-type">Content Type</Label>
                <Select
                  value={contentType}
                  onValueChange={(value: ContentType) => setContentType(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text editor</SelectItem>
                    <SelectItem value="scorm">SCORM</SelectItem>
                    <SelectItem value="multimedia">Multimedia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contentType === "text" && (
                <div className="space-y-2">
                  <Label htmlFor="content">Lesson Content</Label>
                  <textarea
                    id="content"
                    placeholder="Enter lesson content..."
                    value={lesson.content || ""}
                    onChange={e =>
                      setLesson({ ...lesson, content: e.target.value })
                    }
                    className="bg-background h-64 w-full rounded-md border px-3 py-2"
                  />
                </div>
              )}

              {contentType === "scorm" && (
                <div className="space-y-2">
                  <Label htmlFor="scorm-content">SCORM Content</Label>
                  <div className="bg-background text-muted-foreground flex h-64 w-full items-center justify-center rounded-md border px-3 py-2">
                    SCORM upload functionality coming soon
                  </div>
                </div>
              )}

              {contentType === "multimedia" && (
                <div className="space-y-4">
                  <Label htmlFor="multimedia-content">Multimedia Content</Label>
                  <MultimediaUploader
                    onFilesChange={() => {}}
                    onUploadComplete={uploadedFiles => {
                      toast.success(
                        `${uploadedFiles.length} file(s) uploaded successfully`
                      );
                      // Add uploaded files to saved files
                      setSavedMultimediaFiles(prev => [
                        ...prev,
                        ...uploadedFiles,
                      ]);
                    }}
                    maxFiles={10}
                    allowedTypes={["images", "videos", "interactive"]}
                    className="w-full"
                    lessonId={lessonId}
                  />

                  {/* Display saved multimedia files */}
                  {savedMultimediaFiles.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>
                          Uploaded Files ({savedMultimediaFiles.length})
                        </Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {savedMultimediaFiles.map(
                          (file: SavedMultimediaFile, index: number) => (
                            <Card
                              key={file.id || index}
                              className="relative overflow-hidden"
                            >
                              {/* Checkbox overlay */}
                              <div className="absolute top-1 left-1 z-10">
                                <input
                                  type="checkbox"
                                  checked={selectedFilesToDelete.has(file.id)}
                                  onChange={() => toggleFileSelection(file.id)}
                                  className="border-primary h-4 w-4 cursor-pointer rounded border-2 bg-white"
                                />
                              </div>
                              {file.type?.startsWith("image/") && (
                                <div className="relative h-32 space-y-2">
                                  <Image
                                    src={file.url}
                                    alt={file.name}
                                    fill
                                    className="rounded-md object-cover"
                                    unoptimized
                                  />
                                  <CardContent className="p-3">
                                    <p className="truncate text-sm font-medium">
                                      {file.name}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {file.size
                                        ? `${(file.size / 1024).toFixed(2)} KB`
                                        : ""}
                                    </p>
                                  </CardContent>
                                </div>
                              )}
                              {file.type?.startsWith("video/") && (
                                <div className="space-y-2">
                                  <video
                                    src={file.url}
                                    controls
                                    className="h-32 w-full bg-black"
                                    onError={e => {
                                      console.error(
                                        "Video load error:",
                                        file.url
                                      );
                                    }}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                  <CardContent className="p-3">
                                    <p className="truncate text-sm font-medium">
                                      {file.name}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {file.size
                                        ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                                        : ""}
                                    </p>
                                  </CardContent>
                                </div>
                              )}
                              {!file.type?.startsWith("image/") &&
                                !file.type?.startsWith("video/") && (
                                  <CardContent className="p-3">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="text-muted-foreground h-8 w-8" />
                                      <div className="flex-1">
                                        <p className="truncate text-sm font-medium">
                                          {file.name}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                          {file.type || "Interactive content"}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          window.open(file.url, "_blank")
                                        }
                                        className="h-8"
                                      >
                                        Open
                                      </Button>
                                    </div>
                                  </CardContent>
                                )}
                            </Card>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                {contentType === "multimedia" &&
                  selectedFilesToDelete.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedFiles}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">
                        Delete {selectedFilesToDelete.size} selected file(s)
                      </span>
                    </Button>
                  )}
                <div className="ml-auto flex space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={saveLesson} disabled={loading}>
                    {loading ? "Saving..." : "Save Lesson"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Quiz Questions</h3>
                <Button onClick={addQuestion}>Add Question</Button>
              </div>

              {questions.map((question, qIndex) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="space-y-2">
                      <Label>Question {qIndex + 1}</Label>
                      <textarea
                        placeholder="Enter question text..."
                        value={question.text}
                        onChange={e =>
                          updateQuestion(question.id, { text: e.target.value })
                        }
                        className="bg-background w-full rounded-md border px-3 py-2"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Options (check correct answers)</Label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={question.correctAnswers.includes(oIndex)}
                            onChange={() =>
                              toggleCorrectAnswer(question.id, oIndex)
                            }
                          />
                          <input
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={e =>
                              updateOption(question.id, oIndex, e.target.value)
                            }
                            className="bg-background flex-1 rounded-md border px-3 py-2"
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          onClick={() => addOption(question.id)}
                        >
                          Add Option
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            handleDeleteQuestionClick(
                              question.id,
                              question.text
                            )
                          }
                        >
                          Delete Question
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={saveLesson} disabled={loading}>
                  {loading ? "Saving..." : "Save Lesson"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={handleDeleteQuestionCancel}
        onConfirm={handleDeleteQuestionConfirm}
        title="Delete Question"
        message={`Are you sure you want to delete this question? This action cannot be undone.`}
        confirmText="Delete Question"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
