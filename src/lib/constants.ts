import { BookOpen, Lightbulb, Moon, Coffee, type LucideIcon } from "lucide-react";

export const BGU_DOMAIN = "@post.bgu.ac.il";

export function isValidBguEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(BGU_DOMAIN);
}

/** Hour blocks from 08:00 to 22:00, each represented by its start hour. */
export const HOUR_BLOCKS: string[] = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 8;
  return `${String(hour).padStart(2, "0")}:00`;
});

export function formatHourBlock(start: string): string {
  const hour = parseInt(start.slice(0, 2), 10);
  const fmt = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return `${fmt(hour)}–${fmt(hour + 1)}`;
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
