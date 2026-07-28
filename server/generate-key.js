require('dotenv').config();
const crypto = require('crypto'); 
const prisma = require('./src/db/db-connection'); 

async function makeKey() { 
  const raw = 'sk_live_' + crypto.randomBytes(24).toString('hex'); 
  const hash = crypto.createHash('sha256').update(raw).digest('hex'); 
  const org = await prisma.organization.findFirst(); 
  
  if (!org) {
    console.log('No orgs found');
    return;
  }
  
  await prisma.apiKey.create({ 
    data: { 
      organizationId: org.id, 
      name: 'Test Key', 
      keyPrefix: raw.substring(0, 16), 
      keyHash: hash 
    } 
  }); 
  
  console.log('\n\n--- YOUR NEW RAW API KEY ---'); 
  console.log(raw); 
  console.log('----------------------------\n\n'); 
  
  await prisma.$disconnect(); 
} 

makeKey();
