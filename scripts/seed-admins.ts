import 'ts-node/register';
import { ADMINS } from '../config/admins';
// TODO: replace with your ORM/repo
// import { db } from '../server/db';

async function main() {
  console.log('Admins to be seeded:', ADMINS.map(a => a.email).join(', '));
  
  // TODO: Implement actual database seeding when you have your DB setup
  // for (const a of ADMINS) {
  //   await db.admin.upsert({
  //     where: { email: a.email.toLowerCase() },
  //     update: { access: a.access },
  //     create: { email: a.email.toLowerCase(), access: a.access },
  //   });
  // }
  
  console.log('✅ Admin seeding completed (mock)');
}

main().catch(e => { 
  console.error('❌ Admin seeding failed:', e); 
  process.exit(1); 
});



