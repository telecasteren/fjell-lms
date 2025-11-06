"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswers: number[];
};

type QuizEditorProps = {
  lessonId: string;
  onClose: () => void;
};

export function QuizEditor({ lessonId, onClose }: QuizEditorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
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
        setQuestions(data.quiz.questions || []);
      }
    }
  }

  async function saveQuiz() {
    setLoading(true);
    const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions }),
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
      options: ["", ""],
      correctAnswers: [],
    };
    setQuestions([...questions, newQuestion]);
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  }

  function deleteQuestion(id: string) {
    setQuestions(questions.filter(q => q.id !== id));
  }

  function addOption(questionId: string) {
    updateQuestion(questionId, {
      options: [...questions.find(q => q.id === questionId)!.options, ""]
    });
  }

  function updateOption(questionId: string, optionIndex: number, value: string) {
    const question = questions.find(q => q.id === questionId)!;
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  }

  function toggleCorrectAnswer(questionId: string, optionIndex: number) {
    const question = questions.find(q => q.id === questionId)!;
    const newCorrectAnswers = question.correctAnswers.includes(optionIndex)
      ? question.correctAnswers.filter(i => i !== optionIndex)
      : [...question.correctAnswers, optionIndex];
    updateQuestion(questionId, { correctAnswers: newCorrectAnswers });
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Quiz Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between">
          <Button onClick={addQuestion}>Add Question</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
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
                    onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 bg-background"
                  />
                </div>
                <Button variant="destructive" onClick={() => deleteQuestion(question.id)}>
                  Delete
                </Button>
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
                      onChange={() => toggleCorrectAnswer(question.id, oIndex)}
                    />
                    <input
                      placeholder={`Option ${oIndex + 1}`}
                      value={option}
                      onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                      className="flex-1 rounded-md border px-3 py-2 bg-background"
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={() => addOption(question.id)}>
                  Add Option
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
