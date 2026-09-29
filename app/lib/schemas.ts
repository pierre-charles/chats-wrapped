import { z } from "zod";

/** Matches WhatsApp message format: `[DD/MM/YYYY, HH:MM:SS] User: Content` */
const MESSAGE_REGEX =
  /^\[(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})\] (.+?): (.+)$/;

export const RawMessageSchema = z.string().transform((rawLine, context) => {
  const match = rawLine.match(MESSAGE_REGEX);
  if (!match) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid message format",
    });
    return z.NEVER;
  }
  const [, date, time, user, content] = match;
  return {
    date: new Date(date.split("/").reverse().join("-")),
    time,
    user: user.replace(/^~\s*/, "").trim(),
    content,
  };
});

export const MessageSchema = z.object({
  date: z.coerce.date(),
  time: z.string(),
  user: z.string(),
  content: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

const UserCountSchema = z.record(z.string(), z.number());

export type UserCount = z.infer<typeof UserCountSchema>;

export const EmojiCountSchema = z.object({
  emoji: z.string(),
  count: z.number(),
});

export type EmojiCount = z.infer<typeof EmojiCountSchema>;

export const MediaSentSchema = z.object({
  images: UserCountSchema,
  gifs: UserCountSchema,
  videos: UserCountSchema,
  audios: UserCountSchema,
  polls: UserCountSchema,
  stickers: UserCountSchema,
});

export type MediaSent = z.infer<typeof MediaSentSchema>;

export const HourCountSchema = z.record(z.string(), z.number());

export type HourCount = z.infer<typeof HourCountSchema>;

export const DayStatsSchema = z.object({
  date: z.coerce.date(),
  totalMessages: z.number(),
  messageCount: UserCountSchema,
  emojisUsed: z.array(EmojiCountSchema),
  deletedMessages: UserCountSchema,
  mediaSent: MediaSentSchema,
  wordFrequency: UserCountSchema,
  hourlyMessages: HourCountSchema,
  emojisUsedByUser: z.record(z.string(), UserCountSchema),
  wordFrequencyByUser: z.record(z.string(), UserCountSchema),
  hourlyMessagesByUser: z.record(z.string(), HourCountSchema),
});

export type DayStats = z.infer<typeof DayStatsSchema>;

export const UserAverageSchema = z.object({
  user: z.string(),
  average: z.number(),
});

export type UserAverage = z.infer<typeof UserAverageSchema>;

export const DayAverageSchema = z.object({
  dayCount: z.number(),
  totalMessages: z.number(),
  average: z.number(),
});

export type DayAverage = z.infer<typeof DayAverageSchema>;

export const ActiveDaySchema = z.object({
  totalMessages: z.number(),
  date: z.coerce.date(),
});

export type ActiveDay = z.infer<typeof ActiveDaySchema>;

export const DayOfWeekSchema = z.enum([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

export const ActiveHoursSchema = z.record(DayOfWeekSchema, HourCountSchema);

export type ActiveHours = z.infer<typeof ActiveHoursSchema>;

export const AggregatedStatsSchema = z.object({
  days: z.number(),
  totalMessages: z.number(),
  averageMessagePerDay: z.number(),
  averageMessagePerUserPerDay: z.array(UserAverageSchema),
  averageMessagePerIndividualDay: z.record(DayOfWeekSchema, DayAverageSchema),
  totalMessagesByUser: UserCountSchema,
  totalEmojisUsed: UserCountSchema,
  totalMediaSent: MediaSentSchema,
  deletedMessagesCount: UserCountSchema,
  wordsSentCount: UserCountSchema,
  mostActiveDay: ActiveDaySchema,
  leastActiveDay: ActiveDaySchema,
  activeHours: ActiveHoursSchema,
  emojisUsedByUser: z.record(z.string(), UserCountSchema),
  wordsUsedByUser: z.record(z.string(), UserCountSchema),
  activeHoursByUser: z.record(z.string(), ActiveHoursSchema),
});

export type AggregatedStats = z.infer<typeof AggregatedStatsSchema>;

export const MonthlyMessagesSchema = z.object({
  month: z.string(),
  users: UserCountSchema,
});

export type MonthlyMessages = z.infer<typeof MonthlyMessagesSchema>;

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

export const FileInputSchema = z.object({
  name: z.string().refine((n) => n.endsWith(".txt"), "File must be a .txt"),
  size: z.number().max(MAX_FILE_SIZE, "File must be under 200MB"),
});

export type FileInput = z.infer<typeof FileInputSchema>;

export const ChatDataSchema = z.object({
  stats: AggregatedStatsSchema,
  messagesPerUserPerMonth: z.array(MonthlyMessagesSchema),
  dayStats: z.array(DayStatsSchema),
  users: z.array(z.string()),
  lastUpdated: z.coerce.date(),
});

export type ChatData = z.infer<typeof ChatDataSchema>;

export const ParseResultSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), data: ChatDataSchema }),
  z.object({ success: z.literal(false), error: z.string() }),
]);

export type ParseResult = z.infer<typeof ParseResultSchema>;

export const SlugSchema = z
  .string()
  .transform((s) => s.toLowerCase().replace(/\s+/g, "-"));

export const UserSlugParamsSchema = z.object({ slug: SlugSchema });

export const MEDIA_LABELS = [
  ["images", "Images sent"],
  ["gifs", "GIFs sent"],
  ["videos", "Videos sent"],
  ["audios", "Audio clips sent"],
  ["stickers", "Stickers sent"],
  ["polls", "Polls sent"],
] as const;
