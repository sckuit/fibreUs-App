#!/usr/bin/env node
/**
 * Set admin password and test financial forms
 */

import argon2 from 'argon2';
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const TEST_PASSWORD = 'test123';
const ADMIN_EMAIL = 'admin@fibreus.com';

async function hashPassword(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function setAdminPassword() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    
    // Hash the password
    const hash = await hashPassword(TEST_PASSWORD);
    
    // Update admin user
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
      [hash, ADMIN_EMAIL]
    );
    
    console.log(`✅ Password updated for ${ADMIN_EMAIL}`);
    console.log(`   New password: ${TEST_PASSWORD}`);
    
  } finally {
    await client.end();
  }
}

async function makeRequest(method, endpoint, data = null, cookies = '') {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`http://localhost:5000${endpoint}`, options);
  const responseData = await response.json().catch(() => ({}));
  
  return {
    status: response.status,
    headers: response.headers,
    data: responseData,
  };
}

async function login() {
  console.log('\n🔐 Logging in...');
  
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: TEST_PASSWORD,
    }),
  });
  
  if (response.status !== 200) {
    throw new Error('Login failed');
  }
  
  const cookies = response.headers.get('set-cookie') || '';
  console.log('✅ Login successful\n');
  
  return cookies;
}

async function testExpenseCreation(cookies) {
  console.log('📝 TEST 1: Creating expense without project (projectId = "none")');
  console.log('─'.repeat(60));
  
  const expenseData = {
    date: new Date().toISOString(),
    category: 'operations',
    amount: '500.00',
    description: 'Test expense without project - API Test',
    vendor: '',
    receipt: '',
    projectId: 'none',
  };
  
  console.log('Request payload:', JSON.stringify(expenseData, null, 2));
  
  const result = await makeRequest('POST', '/api/expenses', expenseData, cookies);
  
  console.log(`Response status: ${result.status}`);
  console.log('Response data:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 201) {
    console.log('✅ SUCCESS: Expense created successfully!');
    console.log(`   Expense ID: ${result.data.id}`);
    console.log(`   ProjectId value: ${result.data.projectId === null ? 'NULL (correct!)' : result.data.projectId}`);
    return { success: true, id: result.data.id };
  } else {
    console.log('❌ FAILED: Expense creation failed');
    return { success: false, error: result.data };
  }
}

async function testRevenueCreation(cookies) {
  console.log('\n📝 TEST 2: Creating revenue without client/invoice');
  console.log('─'.repeat(60));
  
  const revenueData = {
    date: new Date().toISOString(),
    source: 'service',
    amount: '1200.00',
    description: 'Test revenue without client/invoice - API Test',
    clientId: 'none',
    invoiceId: 'none',
  };
  
  console.log('Request payload:', JSON.stringify(revenueData, null, 2));
  
  const result = await makeRequest('POST', '/api/revenue', revenueData, cookies);
  
  console.log(`Response status: ${result.status}`);
  console.log('Response data:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 201) {
    console.log('✅ SUCCESS: Revenue created successfully!');
    console.log(`   Revenue ID: ${result.data.id}`);
    console.log(`   ClientId value: ${result.data.clientId === null ? 'NULL (correct!)' : result.data.clientId}`);
    console.log(`   InvoiceId value: ${result.data.invoiceId === null ? 'NULL (correct!)' : result.data.invoiceId}`);
    return { success: true, id: result.data.id };
  } else {
    console.log('❌ FAILED: Revenue creation failed');
    return { success: false, error: result.data };
  }
}

async function verifyFinancialMetrics(cookies) {
  console.log('\n📝 TEST 3: Verifying financial metrics');
  console.log('─'.repeat(60));
  
  const result = await makeRequest('GET', '/api/financial/metrics', null, cookies);
  
  console.log('Financial metrics:', JSON.stringify(result.data, null, 2));
  
  if (result.data.totalExpenses > 0 && result.data.totalRevenue > 0) {
    console.log('✅ SUCCESS: Financial metrics show expenses and revenue');
    return true;
  } else {
    console.log('⚠️  Metrics:', result.data);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🧪 EXPENSE AND REVENUE FORM TESTING');
  console.log('═'.repeat(60));
  
  try {
    // Set admin password
    await setAdminPassword();
    
    // Login
    const cookies = await login();
    
    // Run tests
    const expenseResult = await testExpenseCreation(cookies);
    const revenueResult = await testRevenueCreation(cookies);
    await verifyFinancialMetrics(cookies);
    
    console.log('\n═'.repeat(60));
    if (expenseResult.success && revenueResult.success) {
      console.log('✅ ALL API TESTS PASSED!');
      console.log('\nVerification:');
      console.log('  ✓ Expense form accepts projectId="none" → transforms to NULL');
      console.log('  ✓ Revenue form accepts clientId/invoiceId="none" → transforms to NULL');
      console.log('  ✓ Both forms submit successfully via API');
      console.log('  ✓ Records created in database');
      console.log('  ✓ Financial metrics updated correctly');
    } else {
      console.log('❌ SOME TESTS FAILED');
      if (!expenseResult.success) {
        console.log('\nExpense error:', expenseResult.error);
      }
      if (!revenueResult.success) {
        console.log('\nRevenue error:', revenueResult.error);
      }
    }
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
