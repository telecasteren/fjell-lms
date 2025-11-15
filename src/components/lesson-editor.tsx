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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

type QuestionType = "radio" | "checkbox" | "text";

type Question = {
  id: string;
  text: string;
  type: QuestionType;
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
  const [mandatory, setMandatory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "quiz">("content");
  const [contentType, setContentType] = useState<ContentType>("text");
  const [multimediaTab, setMultimediaTab] = useState<"embed" | "upload">(
    "embed",
  );
  const [embedCode, setEmbedCode] = useState("");
  const [uploadTextContent, setUploadTextContent] = useState<
    Record<string, string>
  >({});
  const [showUploadTextEditor, setShowUploadTextEditor] = useState<Set<string>>(
    new Set(),
  );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Load embed code and upload text content from lesson content
      if (data.lesson.contentType === "multimedia" && data.lesson.content) {
        // Try to parse content to extract embed code and text
        // For now, we'll check if content contains embed markers
        // Format: <!--EMBED_START-->...<!--EMBED_END--><!--TEXT_START-->...<!--TEXT_END-->
        const embedMatch = data.lesson.content.match(
          /<!--EMBED_START-->([\s\S]*?)<!--EMBED_END-->/,
        );
        const textMatch = data.lesson.content.match(
          /<!--TEXT_START-->([\s\S]*?)<!--TEXT_END-->/,
        );

        if (embedMatch) {
          setEmbedCode(embedMatch[1].trim());
          setMultimediaTab("embed");
        }
        if (textMatch) {
          // For backward compatibility, store text content
          // In the future, we might want to associate text with specific files
          setUploadTextContent({ default: textMatch[1].trim() });
          setShowUploadTextEditor(new Set(["default"]));
        }
        // If no markers, assume it's embed code (backward compatibility)
        if (!embedMatch && !textMatch && data.lesson.content.trim()) {
          setEmbedCode(data.lesson.content);
          setMultimediaTab("embed");
        }
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
        // Ensure all questions have a type field (default to "checkbox" for backward compatibility)
        const questions = (data.quiz.questions || []).map((q: Question) => ({
          ...q,
          type: q.type || "checkbox",
        }));
        setQuestions(questions);
        setMandatory(data.quiz.mandatory ?? false);
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
        const file = savedMultimediaFiles.find((f) => f.id === fileId);

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
      setSavedMultimediaFiles((prev) =>
        prev.filter((file) => !selectedFilesToDelete.has(file.id)),
      );
      setSelectedFilesToDelete(new Set());

      toast.success(`Deleted ${filesToDelete.length} file(s)`);

      // Reload lesson to get fresh data
      await loadLesson();
    } catch (error) {
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
      let contentToSave = lesson.content;

      // If multimedia type, combine embed code and upload text content
      if (contentType === "multimedia") {
        const parts: string[] = [];
        if (embedCode.trim()) {
          parts.push(`<!--EMBED_START-->${embedCode.trim()}<!--EMBED_END-->`);
        }
        // Combine all text content from different files
        const allTextContent = Object.values(uploadTextContent)
          .filter((text) => text.trim())
          .join("\n");
        if (allTextContent.trim()) {
          parts.push(
            `<!--TEXT_START-->${allTextContent.trim()}<!--TEXT_END-->`,
          );
        }
        contentToSave = parts.length > 0 ? parts.join("\n") : undefined;
      }

      const requestBody = {
        title: lesson.title,
        ...(contentToSave !== undefined &&
          contentToSave !== null && { content: contentToSave }),
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
        body: JSON.stringify({ questions, mandatory }),
        credentials: "include",
      });

      if (!quizRes.ok) {
        throw new Error("Failed to save quiz");
      }

      // Both saves successful, close editor
      toast.success("Lesson saved!");
      onClose();
    } catch (error) {
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
      type: "checkbox",
      options: ["", ""],
      correctAnswers: [],
    };
    setQuestions([...questions, newQuestion]);
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    );
  }

  // Function available for future use
  // function deleteQuestion(id: string) {
  //   setQuestions(questions.filter(q => q.id !== id));
  // }

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
        questions.filter((q) => q.id !== deleteConfirmation.questionId),
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
      options: [...questions.find((q) => q.id === questionId)!.options, ""],
    });
  }

  function updateOption(
    questionId: string,
    optionIndex: number,
    value: string,
  ) {
    const question = questions.find((q) => q.id === questionId)!;
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  }

  function toggleCorrectAnswer(questionId: string, optionIndex: number) {
    const question = questions.find((q) => q.id === questionId)!;

    // For radio questions, only one answer can be correct
    if (question.type === "radio") {
      updateQuestion(questionId, { correctAnswers: [optionIndex] });
    } else {
      // For checkbox questions, multiple answers can be correct
      const correctAnswers = question.correctAnswers.includes(optionIndex)
        ? question.correctAnswers.filter((i) => i !== optionIndex)
        : [...question.correctAnswers, optionIndex];
      updateQuestion(questionId, { correctAnswers });
    }
  }

  function handleQuestionTypeChange(questionId: string, newType: QuestionType) {
    const question = questions.find((q) => q.id === questionId)!;

    // When switching to radio, ensure only one correct answer
    if (newType === "radio" && question.correctAnswers.length > 1) {
      updateQuestion(questionId, {
        type: newType,
        correctAnswers: [question.correctAnswers[0]],
      });
    } else if (newType === "text") {
      // For text questions, clear options and correctAnswers
      // The correct answer will be stored in correctAnswers as text
      updateQuestion(questionId, {
        type: newType,
        options: [],
        correctAnswers: [],
      });
    } else {
      updateQuestion(questionId, { type: newType });
    }
  }

  function updateTextCorrectAnswer(questionId: string, value: string) {
    // For text questions, store the expected answer(s) in correctAnswers
    // We'll store it as a string in the first index
    updateQuestion(questionId, {
      correctAnswers: value ? [0] : [],
      options: value ? [value] : [],
    });
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
                  onChange={(e) =>
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
                  <RichTextEditor
                    content={lesson.content || ""}
                    onChange={(content) => setLesson({ ...lesson, content })}
                    placeholder="Enter lesson content..."
                    minHeight="16rem"
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
                  <Tabs
                    value={multimediaTab}
                    onValueChange={(v) =>
                      setMultimediaTab(v as "embed" | "upload")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="embed">Embed</TabsTrigger>
                      <TabsTrigger value="upload">Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="embed" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="embed-code">Embed Code</Label>
                        <textarea
                          id="embed-code"
                          placeholder="Paste your embed code here (e.g., Storylane, YouTube, etc.)"
                          value={embedCode}
                          onChange={(e) => setEmbedCode(e.target.value)}
                          className="bg-background w-full rounded-md border px-3 py-2 font-mono text-sm min-h-[200px]"
                        />
                        <p className="text-muted-foreground text-xs">
                          Paste the full embed code including &lt;script&gt; and
                          &lt;div&gt; tags.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                      <MultimediaUploader
                        onFilesChange={() => {}}
                        onUploadComplete={(uploadedFiles) => {
                          toast.success(
                            `${uploadedFiles.length} file(s) uploaded successfully`,
                          );
                          // Add uploaded files to saved files
                          setSavedMultimediaFiles((prev) => [
                            ...prev,
                            ...uploadedFiles,
                          ]);
                        }}
                        maxFiles={10}
                        allowedTypes={["images", "videos", "interactive"]}
                        className="w-full"
                        lessonId={lessonId}
                      />

                      {/* Display saved multimedia files with preview */}
                      {savedMultimediaFiles.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>
                              Uploaded Files ({savedMultimediaFiles.length})
                            </Label>
                          </div>
                          <div className="space-y-4">
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
                                      checked={selectedFilesToDelete.has(
                                        file.id,
                                      )}
                                      onChange={() =>
                                        toggleFileSelection(file.id)
                                      }
                                      className="border-primary h-4 w-4 cursor-pointer rounded border-2 bg-white"
                                    />
                                  </div>
                                  <CardContent className="p-4">
                                    {file.type?.startsWith("image/") && (
                                      <div className="space-y-2">
                                        <div className="relative w-1/2 aspect-video mx-auto">
                                          <Image
                                            src={file.url}
                                            alt={file.name}
                                            fill
                                            className="rounded-md object-contain"
                                            unoptimized
                                          />
                                        </div>
                                        <div>
                                          <p className="truncate text-sm font-medium">
                                            {file.name}
                                          </p>
                                          <p className="text-muted-foreground text-xs">
                                            {file.size
                                              ? `${(file.size / 1024).toFixed(2)} KB`
                                              : ""}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {file.type?.startsWith("video/") && (
                                      <div className="space-y-2">
                                        <video
                                          src={file.url}
                                          controls
                                          className="w-full rounded-md bg-black"
                                          onError={() => {
                                            console.error(
                                              "Video load error:",
                                              file.url,
                                            );
                                          }}
                                        >
                                          Your browser does not support the
                                          video tag.
                                        </video>
                                        <div>
                                          <p className="truncate text-sm font-medium">
                                            {file.name}
                                          </p>
                                          <p className="text-muted-foreground text-xs">
                                            {file.size
                                              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                                              : ""}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {!file.type?.startsWith("image/") &&
                                      !file.type?.startsWith("video/") && (
                                        <div className="flex items-center space-x-2">
                                          <FileText className="text-muted-foreground h-8 w-8" />
                                          <div className="flex-1">
                                            <p className="truncate text-sm font-medium">
                                              {file.name}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                              {file.type ||
                                                "Interactive content"}
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
                                      )}

                                    {/* Add text to content link */}
                                    {!showUploadTextEditor.has(file.id) && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => {
                                          setShowUploadTextEditor((prev) =>
                                            new Set(prev).add(file.id),
                                          );
                                          if (!uploadTextContent[file.id]) {
                                            setUploadTextContent((prev) => ({
                                              ...prev,
                                              [file.id]: "",
                                            }));
                                          }
                                        }}
                                        className="mt-2 p-0 h-auto"
                                      >
                                        Add text to content
                                      </Button>
                                    )}

                                    {/* Text editor below preview */}
                                    {showUploadTextEditor.has(file.id) && (
                                      <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>Additional Content</Label>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setShowUploadTextEditor(
                                                (prev) => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(file.id);
                                                  return newSet;
                                                },
                                              );
                                              setUploadTextContent((prev) => {
                                                const newContent = { ...prev };
                                                delete newContent[file.id];
                                                return newContent;
                                              });
                                            }}
                                            className="h-6 w-6 p-0"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <RichTextEditor
                                          content={
                                            uploadTextContent[file.id] || ""
                                          }
                                          onChange={(content) =>
                                            setUploadTextContent((prev) => ({
                                              ...prev,
                                              [file.id]: content,
                                            }))
                                          }
                                          placeholder="Add text content here..."
                                          minHeight="12rem"
                                        />
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
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
              <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/50">
                <Checkbox
                  id="mandatory"
                  checked={mandatory}
                  onCheckedChange={(checked) => setMandatory(checked === true)}
                />
                <Label htmlFor="mandatory" className="cursor-pointer">
                  Quiz is mandatory to complete the lesson
                </Label>
              </div>
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
                        onChange={(e) =>
                          updateQuestion(question.id, { text: e.target.value })
                        }
                        className="bg-background w-full rounded-md border px-3 py-2"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value) =>
                          handleQuestionTypeChange(
                            question.id,
                            value as QuestionType,
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="radio">
                            Single Choice (Radio)
                          </SelectItem>
                          <SelectItem value="checkbox">
                            Multiple Choice (Checkbox)
                          </SelectItem>
                          <SelectItem value="text">
                            Short Text Answer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {question.type === "text" ? (
                      <div className="space-y-2">
                        <Label>Expected Answer</Label>
                        <input
                          type="text"
                          placeholder="Enter the expected answer..."
                          value={question.options[0] || ""}
                          onChange={(e) =>
                            updateTextCorrectAnswer(question.id, e.target.value)
                          }
                          className="bg-background w-full rounded-md border px-3 py-2"
                        />
                        <p className="text-sm text-muted-foreground">
                          Students will type their answer in a text field. This
                          is the expected correct answer.
                        </p>
                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleDeleteQuestionClick(
                                question.id,
                                question.text,
                              )
                            }
                          >
                            Delete Question
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>
                          {question.type === "radio"
                            ? "Options (select one correct answer)"
                            : "Options (check correct answers)"}
                        </Label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type={
                                question.type === "radio" ? "radio" : "checkbox"
                              }
                              name={
                                question.type === "radio"
                                  ? `question-${question.id}`
                                  : undefined
                              }
                              checked={question.correctAnswers.includes(oIndex)}
                              onChange={() =>
                                toggleCorrectAnswer(question.id, oIndex)
                              }
                            />
                            <input
                              placeholder={`Option ${oIndex + 1}`}
                              value={option}
                              onChange={(e) =>
                                updateOption(
                                  question.id,
                                  oIndex,
                                  e.target.value,
                                )
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
                                question.text,
                              )
                            }
                          >
                            Delete Question
                          </Button>
                        </div>
                      </div>
                    )}
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
