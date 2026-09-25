import { PrismaClient } from '@prisma/client'

const regions = ['ap-south-1','us-east-1','us-west-1','eu-west-1','eu-central-1','ap-southeast-1','ap-northeast-1','ca-central-1']
const projectId = 'jxblabvictlkjojyuinv'
const password = 'Jasirwar%4012'

async function main() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`
    const url = `postgresql://postgres.${projectId}:${password}@${host}:6543/postgres`
    const masked = `postgres.${projectId}@${host}:6543`
    console.log(`Testing region ${region}...`)
    const prisma = new PrismaClient({ datasources: { db: { url } } })
    try {
      await prisma.$connect()
      console.log(`✅ CONNECTED on region: ${region}`)
      console.log(`Working URL: postgresql://postgres.${projectId}:***@${host}:6543/postgres`)
      await prisma.$disconnect()
      process.exit(0)
    } catch (e: any) {
      const msg = e.message?.split('\n')[0]
      console.log(`  ❌ ${msg?.substring(0, 80)}`)
    } finally {
      await prisma.$disconnect().catch(() => {})
    }
  }
  console.log('\nNone worked. Check your Supabase project ID.')
}

main()
