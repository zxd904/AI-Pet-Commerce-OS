const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.analyticsRecord.findMany({
    take: 20,
    orderBy: { recordDate: 'desc' }
  });
  console.log('Analytics Records:', JSON.stringify(records, null, 2));
  
  const users = await prisma.user.findMany();
  console.log('\nUsers:', JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))