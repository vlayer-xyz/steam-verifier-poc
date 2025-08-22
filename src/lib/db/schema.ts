import { pgTable, text, timestamp, integer, jsonb, uuid } from 'drizzle-orm/pg-core'

export const verifications = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  steamId: text('steam_id').notNull(),
  steamUsername: text('steam_username').notNull(),
  steamAvatar: text('steam_avatar'),
  steamProfileUrl: text('steam_profile_url'),
  gameCount: integer('game_count').notNull(),
  gamesData: jsonb('games_data').notNull(),
  vlayerProof: jsonb('vlayer_proof'),
  webhookSent: text('webhook_sent').notNull().default('false'),
  webhookStatus: integer('webhook_status'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Verification = typeof verifications.$inferSelect
export type NewVerification = typeof verifications.$inferInsert