import { BookOpen, Lightbulb, Moon, Coffee, type LucideIcon } from "lucide-react";

export const BGU_DOMAIN = "@post.bgu.ac.il";

export function isValidBguEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(BGU_DOMAIN);
}

/**
 * Hour blocks from 06:00 to 24:00 (6:00 AM to midnight), each represented by
 * its start hour. The last block (23:00) runs until 00:00.
 */
export const HOUR_BLOCKS: string[] = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  return `${String(hour).padStart(2, "0")}:00`;
});

export function formatHourBlock(start: string): string {
  const hour = parseInt(start.slice(0, 2), 10);
  const fmt = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
  return `${fmt(hour)}–${fmt(hour + 1)}`;
}

/** Friendly study tips injected into active chats to keep momentum going. */
export const STUDY_TIPS: string[] = [
  "Try the Pomodoro technique — 25 min focused, then a 5 min break. Your brain will thank you! 🍅",
  "Teaching a concept out loud to your partner is one of the fastest ways to actually learn it. 🗣️",
  "Pick a tiny, specific goal for this session (e.g. 'finish problem set 3') — small wins add up. 🎯",
  "Phones face-down, notifications off. Even 20 distraction-free minutes beats an hour of half-focus. 📵",
  "Stuck? Explain exactly where you got lost — naming the gap often reveals the answer. 💡",
  "Hydrate and stretch between topics. A quick reset keeps focus sharp for the long haul. 💧",
];

export function getStudyTip(index: number): string {
  return STUDY_TIPS[index % STUDY_TIPS.length];
}

export type StudyStyle = {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const STUDY_STYLES: StudyStyle[] = [
  { id: "help", label: "Help with the material", icon: BookOpen, description: "Looking for or offering explanations" },
  { id: "brainstorm", label: "Brainstorming", icon: Lightbulb, description: "Bounce ideas and solve together" },
  { id: "quiet", label: "Quiet companion", icon: Moon, description: "Focused, silent co-working" },
  { id: "chill", label: "Chill study", icon: Coffee, description: "Relaxed pace, coffee & notes" },
];

export function getStudyStyle(id: string | null | undefined): StudyStyle | undefined {
  return STUDY_STYLES.find((s) => s.id === id);
}

export const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];

export const DEGREE_PROGRAMS = [
  "Computer Science",
  "Software Engineering",
  "Electrical & Computer Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Biomedical Engineering",
  "Industrial Engineering & Management",
  "Mechanical Engineering",
  "Chemical Engineering",
  "Materials Engineering",
  "Economics",
  "Business Management",
  "Psychology",
  "Medicine",
  "Nursing",
  "Life Sciences",
  "Communication Studies",
  "Geology",
  "Other",
];
