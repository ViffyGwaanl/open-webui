import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/storage/db/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo'
})
