"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QuestionType = "radio" | "checkbox" | "text";

type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswers: number[];
};

type QuizEditorProps = {
  lessonId: string;
  onClose: () => void;
};

export function QuizEditor({ lessonId, onClose }: QuizEditorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mandatory, setMandatory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function loadQuiz() {
    const res = await fetch(`/api/lessons/${lessonId}/quiz`);
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

  async function saveQuiz() {
    setLoading(true);
    const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions, mandatory }),
    });
    setLoading(false);
    if (res.ok) {
      onClose();
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

  function deleteQuestion(id: string) {
    setQuestions(questions.filter((q) => q.id !== id));
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
      const newCorrectAnswers = question.correctAnswers.includes(optionIndex)
        ? question.correctAnswers.filter((i) => i !== optionIndex)
        : [...question.correctAnswers, optionIndex];
      updateQuestion(questionId, { correctAnswers: newCorrectAnswers });
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

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Quiz Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
        <div className="flex justify-between">
          <Button onClick={addQuestion}>Add Question</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveQuiz} disabled={loading}>
              {loading ? "Saving..." : "Save Quiz"}
            </Button>
          </div>
        </div>

        {questions.map((question, qIndex) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <Label>Question {qIndex + 1}</Label>
                  <textarea
                    placeholder="Enter question text..."
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(question.id, { text: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 bg-background"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={() => deleteQuestion(question.id)}
                >
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value) =>
                    handleQuestionTypeChange(question.id, value as QuestionType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radio">Single Choice (Radio)</SelectItem>
                    <SelectItem value="checkbox">
                      Multiple Choice (Checkbox)
                    </SelectItem>
                    <SelectItem value="text">Short Text Answer</SelectItem>
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
                    className="w-full rounded-md border px-3 py-2 bg-background"
                  />
                  <p className="text-sm text-muted-foreground">
                    Students will type their answer in a text field. This is the
                    expected correct answer.
                  </p>
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
                        type={question.type === "radio" ? "radio" : "checkbox"}
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
                          updateOption(question.id, oIndex, e.target.value)
                        }
                        className="flex-1 rounded-md border px-3 py-2 bg-background"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addOption(question.id)}
                  >
                    Add Option
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
