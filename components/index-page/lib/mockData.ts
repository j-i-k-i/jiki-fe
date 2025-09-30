export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  locked: boolean;
  xpReward: number;
  estimatedTime: number;
  icon: string;
  position: { x: number; y: number };
}

export function generateMockExercises(): Exercise[] {
  const exercises: Exercise[] = [
    {
      id: "1",
      title: "Hello World",
      description: "Your first program",
      difficulty: "easy",
      completed: true,
      locked: false,
      xpReward: 10,
      estimatedTime: 5,
      icon: "👋",
      position: { x: 0, y: 0 }
    },
    {
      id: "2",
      title: "Variables",
      description: "Learn about variables",
      difficulty: "easy",
      completed: true,
      locked: false,
      xpReward: 15,
      estimatedTime: 10,
      icon: "📦",
      position: { x: 0, y: 150 }
    },
    {
      id: "3",
      title: "Functions",
      description: "Create reusable code",
      difficulty: "easy",
      completed: false,
      locked: false,
      xpReward: 20,
      estimatedTime: 15,
      icon: "🔧",
      position: { x: -100, y: 300 }
    },
    {
      id: "4",
      title: "Arrays",
      description: "Work with collections",
      difficulty: "medium",
      completed: false,
      locked: false,
      xpReward: 25,
      estimatedTime: 20,
      icon: "📊",
      position: { x: 100, y: 300 }
    },
    {
      id: "5",
      title: "Loops",
      description: "Repeat actions",
      difficulty: "medium",
      completed: false,
      locked: true,
      xpReward: 30,
      estimatedTime: 20,
      icon: "🔄",
      position: { x: 0, y: 450 }
    },
    {
      id: "6",
      title: "Objects",
      description: "Complex data structures",
      difficulty: "medium",
      completed: false,
      locked: true,
      xpReward: 35,
      estimatedTime: 25,
      icon: "🎯",
      position: { x: -100, y: 600 }
    },
    {
      id: "7",
      title: "Classes",
      description: "Object-oriented programming",
      difficulty: "hard",
      completed: false,
      locked: true,
      xpReward: 40,
      estimatedTime: 30,
      icon: "🏗️",
      position: { x: 100, y: 600 }
    },
    {
      id: "8",
      title: "Async/Await",
      description: "Handle asynchronous operations",
      difficulty: "hard",
      completed: false,
      locked: true,
      xpReward: 45,
      estimatedTime: 35,
      icon: "⏱️",
      position: { x: 0, y: 750 }
    },
    {
      id: "9",
      title: "Error Handling",
      description: "Deal with errors gracefully",
      difficulty: "hard",
      completed: false,
      locked: true,
      xpReward: 50,
      estimatedTime: 30,
      icon: "🛡️",
      position: { x: -100, y: 900 }
    },
    {
      id: "10",
      title: "Final Project",
      description: "Build something amazing",
      difficulty: "hard",
      completed: false,
      locked: true,
      xpReward: 100,
      estimatedTime: 60,
      icon: "🎓",
      position: { x: 0, y: 1050 }
    }
  ];

  return exercises;
}

export interface UserProgress {
  currentLevel: number;
  totalXp: number;
  streak: number;
  completedExercises: number;
  totalExercises: number;
}

export function getMockUserProgress(): UserProgress {
  return {
    currentLevel: 3,
    totalXp: 25,
    streak: 5,
    completedExercises: 2,
    totalExercises: 10
  };
}
