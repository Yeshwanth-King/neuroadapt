export type AccessibilityMode = "normal" | "dyslexia" | "adhd" | "low-vision";

export interface LessonSection {
  heading: string;
  paragraphs: string[];
}

export interface DemoLesson {
  title: string;
  subtitle: string;
  sections: LessonSection[];
}

export const DEMO_LESSON: DemoLesson = {
  title: "Photosynthesis",
  subtitle: "How plants make their food",
  sections: [
    {
      heading: "What is photosynthesis?",
      paragraphs: [
        "Photosynthesis is how plants make their food. Plants use sunlight, water, and carbon dioxide from the air. They turn these into sugar and oxygen. The sugar gives the plant energy. The oxygen goes into the air for us to breathe.",
      ],
    },
    {
      heading: "Where does it happen?",
      paragraphs: [
        "Leaves are like small factories where this happens. Chlorophyll in the leaves makes them green and captures sunlight. Without photosynthesis, there would be no life on Earth as we know it.",
      ],
    },
    {
      heading: "Why it matters",
      paragraphs: [
        "Plants release the oxygen we breathe. They also form the base of most food chains. Understanding photosynthesis helps us protect our environment and grow food better.",
      ],
    },
  ],
};
