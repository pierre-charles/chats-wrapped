import {
  AggregatedStatsSchema,
  ChatDataSchema,
  DayStatsSchema,
  MessageSchema,
  type ActiveDay,
  type ActiveHours,
  type AggregatedStats,
  type ChatData,
  type DayAverage,
  type DayStats,
  type HourCount,
  type MediaSent,
  type Message,
  type MonthlyMessages,
  type UserCount,
} from "./schemas";

const MESSAGE_REGEX =
  /^\[(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})\] (.+?): (.+)$/;

const EMOJI_REGEX = /\p{Emoji_Presentation}/gu;

const MEDIA_CHECKS: [string, keyof MediaSent][] = [
  ["image omitted", "images"],
  ["gif omitted", "gifs"],
  ["video omitted", "videos"],
  ["audio omitted", "audios"],
  ["sticker omitted", "stickers"],
];

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EXCLUDED_WORDS = new Set([
  "",
  "omitted",
  "video",
  "audio",
  "poll",
  "sticker",
  "gif",
  "image",
]);

function parseMessage(line: string): Message | null {
  const match = line.match(MESSAGE_REGEX);
  if (!match) {
    return null;
  }

  const [, date, time, user, content] = match;
  const parsedDate = new Date(date.split("/").reverse().join("-"));

  const result = MessageSchema.safeParse({
    date: parsedDate,
    time,
    user: user.replace(/^~\s*/, "").trim(),
    content,
  });

  if (!result.success) {
    return null;
  }

  return result.data;
}

function countEmojis(message: string): UserCount {
  const matches = message.match(EMOJI_REGEX);
  if (!matches) {
    return {};
  }

  return matches.reduce<UserCount>((acc, emoji) => {
    acc[emoji] = (acc[emoji] ?? 0) + 1;
    return acc;
  }, {});
}

function buildDayStats(
  date: Date,
  messages: Message[],
  allUsers: string[],
): DayStats {
  const messageCount: UserCount = {};
  const emojisUsed: UserCount = {};
  const wordFrequency: UserCount = {};
  const media: MediaSent = {
    images: {},
    gifs: {},
    videos: {},
    audios: {},
    polls: {},
    stickers: {},
  };

  const deletedMessages: UserCount = {};
  const hourlyMessages: HourCount = {};

  for (const user of allUsers) {
    messageCount[user] ??= 0;
    deletedMessages[user] ??= 0;
  }

  for (const m of messages) {
    messageCount[m.user] = (messageCount[m.user] ?? 0) + 1;

    const hour = m.time.split(":")[0];
    hourlyMessages[hour] = (hourlyMessages[hour] ?? 0) + 1;

    if (
      m.content.includes("This message was deleted") ||
      m.content.includes("You deleted this message")
    ) {
      deletedMessages[m.user] = (deletedMessages[m.user] ?? 0) + 1;
    }

    for (const [emoji, count] of Object.entries(countEmojis(m.content))) {
      emojisUsed[emoji] = (emojisUsed[emoji] ?? 0) + count;
    }

    const lower = m.content.toLowerCase();
    const words = lower.replace(/[^\w\s]/g, "").split(/\s+/);

    for (const word of words) {
      if (EXCLUDED_WORDS.has(word)) {
        continue;
      }
      if (/^\d+$/.test(word)) {
        continue;
      }
      if (word.length <= 1) {
        continue;
      }
      wordFrequency[word] = (wordFrequency[word] ?? 0) + 1;
    }

    for (const [keyword, bucket] of MEDIA_CHECKS) {
      if (lower.includes(keyword)) {
        media[bucket][m.user] = (media[bucket][m.user] ?? 0) + 1;
      }
    }

    if (lower.includes("poll:")) {
      media.polls[m.user] = (media.polls[m.user] ?? 0) + 1;
    }
  }

  return DayStatsSchema.parse({
    date,
    totalMessages: messages.length,
    messageCount,
    emojisUsed: Object.entries(emojisUsed).map(([emoji, count]) => ({
      emoji,
      count,
    })),
    deletedMessages,
    mediaSent: media,
    wordFrequency,
    hourlyMessages,
  });
}

export function aggregateStats(dayObjects: DayStats[]): AggregatedStats {
  const totalEmojisUsed = new Map<string, number>();
  const totalMessagesByUser: UserCount = {};
  const deletedMessagesCount: UserCount = {};
  const mediaCounts: MediaSent = {
    images: {},
    gifs: {},
    videos: {},
    audios: {},
    polls: {},
    stickers: {},
  };
  const averageMessagePerIndividualDay: Record<string, DayAverage> = {};
  const activeHours: ActiveHours = {};
  const wordsSentCount = new Map<string, number>();
  let totalMessages = 0;
  let mostActiveDay: ActiveDay = {
    totalMessages: 0,
    date: new Date(0),
  };
  let leastActiveDay: ActiveDay = {
    totalMessages: Infinity,
    date: new Date(0),
  };

  for (const day of dayObjects) {
    totalMessages += day.totalMessages;

    if (day.totalMessages > mostActiveDay.totalMessages) {
      mostActiveDay = { totalMessages: day.totalMessages, date: day.date };
    }
    if (day.totalMessages < leastActiveDay.totalMessages) {
      leastActiveDay = { totalMessages: day.totalMessages, date: day.date };
    }

    for (const [user, count] of Object.entries(day.messageCount)) {
      totalMessagesByUser[user] = (totalMessagesByUser[user] ?? 0) + count;
    }

    for (const { emoji, count } of day.emojisUsed) {
      totalEmojisUsed.set(emoji, (totalEmojisUsed.get(emoji) ?? 0) + count);
    }

    for (const type of Object.keys(mediaCounts) as Array<keyof MediaSent>) {
      const sent = day.mediaSent[type];
      for (const [user, count] of Object.entries(sent)) {
        mediaCounts[type][user] = (mediaCounts[type][user] ?? 0) + count;
      }
    }

    for (const [user, count] of Object.entries(day.deletedMessages)) {
      deletedMessagesCount[user] = (deletedMessagesCount[user] ?? 0) + count;
    }

    for (const [word, count] of Object.entries(day.wordFrequency)) {
      wordsSentCount.set(word, (wordsSentCount.get(word) ?? 0) + count);
    }

    const dayIndex = day.date.getDay();
    const dayName = DAYS_OF_WEEK[dayIndex];
    averageMessagePerIndividualDay[dayName] ??= {
      dayCount: 0,
      totalMessages: 0,
      average: 0,
    };
    averageMessagePerIndividualDay[dayName].dayCount++;
    averageMessagePerIndividualDay[dayName].totalMessages += day.totalMessages;
    averageMessagePerIndividualDay[dayName].average = Math.round(
      averageMessagePerIndividualDay[dayName].totalMessages /
        averageMessagePerIndividualDay[dayName].dayCount,
    );

    activeHours[dayName] ??= {};
    for (const [hour, count] of Object.entries(day.hourlyMessages)) {
      activeHours[dayName][hour] = (activeHours[dayName][hour] ?? 0) + count;
    }
  }

  const totalDays = dayObjects.length;
  const averageMessagePerDay = Math.round(totalMessages / totalDays);
  const averageMessagePerUserPerDay = Object.entries(totalMessagesByUser).map(
    ([user, count]) => ({ user, average: Math.round(count / totalDays) }),
  );

  if (leastActiveDay.totalMessages === Infinity) {
    leastActiveDay = { totalMessages: 0, date: new Date(0) };
  }

  const sortedWords = new Map([...wordsSentCount].sort((a, b) => b[1] - a[1]));

  return AggregatedStatsSchema.parse({
    days: totalDays,
    totalMessages,
    averageMessagePerDay,
    averageMessagePerUserPerDay,
    averageMessagePerIndividualDay,
    totalMessagesByUser,
    totalEmojisUsed: Object.fromEntries(totalEmojisUsed),
    totalMediaSent: mediaCounts,
    deletedMessagesCount,
    wordsSentCount: Object.fromEntries(sortedWords),
    mostActiveDay,
    leastActiveDay,
    activeHours,
  });
}

export function parseChatFile(content: string):
  | {
      success: true;
      data: ChatData;
    }
  | {
      success: false;
      error: string;
    } {
  const cleaned = content.replace(/[‎‏‪-‮​]/g, "");
  const lines = cleaned.split(/\r?\n/);
  const users = new Set<string>();
  const messagesByDate = new Map<number, Message[]>();
  let lastMessage: Message | null = null;

  for (const line of lines) {
    const parsed = parseMessage(line);

    if (!parsed) {
      if (lastMessage && line.trim()) {
        lastMessage.content += "\n" + line;
      }
      continue;
    }

    parsed.content = parsed.content
      .replace("<This message was edited>", "")
      .replace(/</g, "")
      .replace(/>/g, "");

    users.add(parsed.user);

    const key = parsed.date.getTime();
    const existing = messagesByDate.get(key) ?? [];
    existing.push(parsed);
    messagesByDate.set(key, existing);
    lastMessage = parsed;
  }

  const allUsers = Array.from(users);
  const dayStats = Array.from(messagesByDate.entries()).map(
    ([timestamp, msgs]) => buildDayStats(new Date(timestamp), msgs, allUsers),
  );

  const stats = aggregateStats(dayStats);

  const messagesPerUserPerMonth: MonthlyMessages[] = [];
  for (const day of dayStats) {
    const month = day.date.toISOString().slice(0, 7);
    let monthEntry = messagesPerUserPerMonth.find((m) => m.month === month);
    if (!monthEntry) {
      monthEntry = { month, users: {} };
      messagesPerUserPerMonth.push(monthEntry);
    }
    for (const [user, count] of Object.entries(day.messageCount)) {
      monthEntry.users[user] = (monthEntry.users[user] ?? 0) + count;
    }
  }

  const result = ChatDataSchema.safeParse({
    stats,
    messagesPerUserPerMonth,
    dayStats,
    users: allUsers,
    lastUpdated: dayStats.at(-1)?.date ?? new Date(0),
  });

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return { success: true, data: result.data };
}
