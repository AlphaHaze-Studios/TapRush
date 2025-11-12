import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  playerName: varchar("player_name", { length: 50 }).notNull(),
  score: integer("score").notNull(),
  combo: integer("combo").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 20 }).notNull().unique(),
  specialRule: text("special_rule").notNull(),
  targetScore: integer("target_score").notNull(),
  targetCombo: integer("target_combo").notNull(),
  timeLimit: integer("time_limit").notNull(),
  reward: integer("reward").notNull(),
});

export const challengeCompletions = pgTable("challenge_completions", {
  id: serial("id").primaryKey(),
  playerName: varchar("player_name", { length: 50 }).notNull(),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallenges.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  score: integer("score").notNull(),
  combo: integer("combo").notNull(),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).pick({
  playerName: true,
  score: true,
  combo: true,
});

export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).pick({
  date: true,
  specialRule: true,
  targetScore: true,
  targetCombo: true,
  timeLimit: true,
  reward: true,
});

export const insertChallengeCompletionSchema = createInsertSchema(challengeCompletions).pick({
  playerName: true,
  challengeId: true,
  score: true,
  combo: true,
});

export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type ChallengeCompletion = typeof challengeCompletions.$inferSelect;
export type InsertChallengeCompletion = z.infer<typeof insertChallengeCompletionSchema>;
