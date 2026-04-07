import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/storage/index-db/schema/index.ts',
  out: './drizzle-rag',
  dialect: 'sqlite',
  driver: 'expo'
})
