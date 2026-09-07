import { z } from "zod";

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const moodCardInputSchema = z.object({
  title: z.string().min(1).max(40).describe("Short, punchy card title (2-5 words)"),
  blurb: z
    .string()
    .min(1)
    .max(160)
    .describe("One evocative sentence (max ~20 words) describing the vibe"),
  emoji: z.string().min(1).max(8).describe("A single emoji that captures the vibe"),
  accent: z
    .string()
    .regex(HEX_COLOR, "accent must be a 6-digit hex color like #f4a261")
    .describe("Accent color as a 6-digit hex string, e.g. #f4a261"),
});

export type MoodCardInput = z.infer<typeof moodCardInputSchema>;

export const updateMoodCardInputSchema = z.object({
  id: z.string().describe("The id of the card to update (see the board context)"),
  title: moodCardInputSchema.shape.title.optional(),
  blurb: moodCardInputSchema.shape.blurb.optional(),
  emoji: moodCardInputSchema.shape.emoji.optional(),
  accent: moodCardInputSchema.shape.accent.optional(),
});

export type UpdateMoodCardInput = z.infer<typeof updateMoodCardInputSchema>;

export type MoodCard = MoodCardInput & {
  id: string;
  createdAt: number;
};

export const ADD_CARD_TOOL = "addMoodCard";
export const UPDATE_CARD_TOOL = "updateMoodCard";
export const CLEAR_BOARD_TOOL = "clearBoard";
