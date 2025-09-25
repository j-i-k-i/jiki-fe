"use client";

import { useState } from "react";
import { QuizCard } from "@/components/quiz-card/QuizCard";
import { mockQuizQuestions } from "@/components/quiz-card/mockData";

export default function QuizTestPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => (prev < mockQuizQuestions.length - 1 ? prev + 1 : 0));
  };

  const currentQuestion = mockQuizQuestions[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1;
  const totalQuestions = mockQuizQuestions.length;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Test Page</h1>
          <p className="text-gray-600">
            Question {questionNumber} of {totalQuestions}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <QuizCard question={currentQuestion} onNext={handleNextQuestion} />
          </div>
        </div>
      </div>
    </div>
  );
}
