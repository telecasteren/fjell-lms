"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctAnswers: number[];
};

type Quiz = {
  id: string;
  questions: QuizQuestion[];
};

interface QuizTakerProps {
  quiz: Quiz;
  onComplete: (passed: boolean) => void;
}

export function QuizTaker({ quiz, onComplete }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number[]>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});
  const [passed, setPassed] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  function handleAnswerToggle(optionIndex: number) {
    const questionId = currentQuestion.id;
    const current = selectedAnswers[questionId] || [];

    if (current.includes(optionIndex)) {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: current.filter(i => i !== optionIndex),
      }));
    } else {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: [...current, optionIndex],
      }));
    }
  }

  async function submitQuiz() {
    const results: Record<string, boolean> = {};
    let correctCount = 0;

    quiz.questions.forEach(question => {
      const selected = selectedAnswers[question.id] || [];
      const isCorrect =
        selected.length === question.correctAnswers.length &&
        selected.every(answer => question.correctAnswers.includes(answer));

      results[question.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setQuizResults(results);
    setShowResults(true);

    const quizPassed = correctCount >= Math.ceil(quiz.questions.length * 0.7); // 70% pass rate
    const percentage = Math.round((correctCount / quiz.questions.length) * 100);
    setPassed(quizPassed);
    setAttempts(prev => prev + 1);

    // Save quiz completion to database
    try {
      const res = await fetch("/api/quiz-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          passed: quizPassed,
          score: percentage,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to save quiz completion");
      }
    } catch (error) {
      console.error("Error saving quiz completion:", error);
    }
  }

  function retryQuiz() {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizResults({});
    setPassed(null);
  }

  function nextQuestion() {
    if (isLastQuestion) {
      submitQuiz();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }

  if (showResults) {
    const correctCount = Object.values(quizResults).filter(Boolean).length;
    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Quiz Results
            {passed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold">
              {correctCount}/{totalQuestions} ({percentage}%)
            </div>
            <Badge
              variant={passed ? "default" : "destructive"}
              className="px-4 py-2 text-lg"
            >
              {passed ? "PASSED" : "FAILED"}
            </Badge>
            <p className="text-muted-foreground mt-2 text-sm">
              You need 70% to pass. Attempt #{attempts}
            </p>
          </div>

          <div className="space-y-3">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="rounded border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium">Question {index + 1}:</span>
                  {quizResults[question.id] ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <p className="mb-2 text-sm">{question.text}</p>
                <div className="text-muted-foreground text-xs">
                  Correct answers:{" "}
                  {question.correctAnswers
                    .map(i => question.options[i])
                    .join(", ")}
                </div>
              </div>
            ))}
          </div>

          <div className="space-x-2 text-center">
            {!passed ? (
              <>
                <Button onClick={retryQuiz} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => onComplete(passed ?? false)}
                  variant="secondary"
                  className="gap-2"
                >
                  Close Quiz
                </Button>
              </>
            ) : (
              <Button
                onClick={() => onComplete(passed ?? true)}
                variant="default"
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Close Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg">{currentQuestion.text}</p>

        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`option-${index}`}
                checked={(selectedAnswers[currentQuestion.id] || []).includes(
                  index
                )}
                onCheckedChange={() => handleAnswerToggle(index)}
              />
              <label htmlFor={`option-${index}`} className="text-sm">
                {option}
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() =>
              setCurrentQuestionIndex(prev => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button onClick={nextQuestion}>
            {isLastQuestion ? "Submit Quiz" : "Next Question"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
