require('dotenv').config();
const connectDB = require('../config/db');
const Test = require('../models/Test');
const Laboratory = require('../models/Laboratory');

(async () => {
  await connectDB();
  const lab = await Laboratory.findOne({ phone: '7724817688' });
  if (lab) {
    const totalTests = await Test.countDocuments({ laboratoryId: lab._id, isActive: true });
    console.log('\n📊 Laboratory:', lab.labName);
    console.log('📦 Total Active Tests:', totalTests);
    const tests = await Test.find({ laboratoryId: lab._id, isActive: true })
      .select('name price category')
      .sort({ name: 1 })
      .limit(30);
    console.log('\n📋 Sample Tests (first 30):');
    tests.forEach((t, i) => console.log(`   ${i+1}. ${t.name} - ₹${t.price} - ${t.category || 'N/A'}`));
  } else {
    console.log('❌ Laboratory not found');
  }
  process.exit(0);
})();

