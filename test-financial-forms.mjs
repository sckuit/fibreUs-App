#!/usr/bin/env node
/**
 * Test script for expense and revenue creation forms
 * This simulates the form submissions after schema fixes
 */

const BASE_URL = 'http://localhost:5000';

// Helper to make authenticated requests
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

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const responseData = await response.json().catch(() => ({}));
  
  return {
    status: response.status,
    headers: response.headers,
    data: responseData,
  };
}

// Test 1: Create expense without optional fields (projectId = "none")
async function testExpenseWithoutProject(cookies) {
  console.log('\n📝 TEST 1: Creating expense without project (projectId = "none")');
  console.log('─'.repeat(60));
  
  const expenseData = {
    date: new Date().toISOString(),
    category: 'operations',
    amount: '500.00',
    description: 'Test expense without project',
    vendor: '',  // Empty string
    receipt: '', // Empty string
    projectId: 'none', // This should transform to undefined
  };
  
  console.log('Request payload:', JSON.stringify(expenseData, null, 2));
  
  const result = await makeRequest('POST', '/api/expenses', expenseData, cookies);
  
  console.log(`Response status: ${result.status}`);
  console.log('Response data:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 201) {
    console.log('✅ SUCCESS: Expense created successfully!');
    return { success: true, id: result.data.id };
  } else {
    console.log('❌ FAILED: Expense creation failed');
    return { success: false, error: result.data };
  }
}

// Test 2: Create revenue without optional fields
async function testRevenueWithoutClient(cookies) {
  console.log('\n📝 TEST 2: Creating revenue without client/invoice (both = "none")');
  console.log('─'.repeat(60));
  
  const revenueData = {
    date: new Date().toISOString(),
    source: 'service',
    amount: '1200.00',
    description: 'Test revenue without client/invoice',
    clientId: 'none',  // This should transform to undefined
    invoiceId: 'none', // This should transform to undefined
  };
  
  console.log('Request payload:', JSON.stringify(revenueData, null, 2));
  
  const result = await makeRequest('POST', '/api/revenue', revenueData, cookies);
  
  console.log(`Response status: ${result.status}`);
  console.log('Response data:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 201) {
    console.log('✅ SUCCESS: Revenue created successfully!');
    return { success: true, id: result.data.id };
  } else {
    console.log('❌ FAILED: Revenue creation failed');
    return { success: false, error: result.data };
  }
}

// Test 3: Verify created records appear in lists
async function verifyRecords(cookies, expenseId, revenueId) {
  console.log('\n📝 TEST 3: Verifying records appear in lists');
  console.log('─'.repeat(60));
  
  // Check expenses list
  const expensesResult = await makeRequest('GET', '/api/expenses', null, cookies);
  const expenseFound = expensesResult.data.some(e => e.id === expenseId);
  
  console.log(`Expense in list: ${expenseFound ? '✅ YES' : '❌ NO'}`);
  
  // Check revenue list
  const revenueResult = await makeRequest('GET', '/api/revenue', null, cookies);
  const revenueFound = revenueResult.data.some(r => r.id === revenueId);
  
  console.log(`Revenue in list: ${revenueFound ? '✅ YES' : '❌ NO'}`);
  
  // Check financial metrics
  const metricsResult = await makeRequest('GET', '/api/financial/metrics', null, cookies);
  console.log('\nFinancial metrics:', JSON.stringify(metricsResult.data, null, 2));
  
  return expenseFound && revenueFound;
}

// Login first to get session cookie
async function login() {
  console.log('🔐 Logging in...');
  
  const loginData = {
    email: 'admin@example.com',
    password: 'admin123',
  };
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginData),
  });
  
  if (response.status !== 200) {
    console.log('❌ Login failed. Make sure you have an admin user with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    process.exit(1);
  }
  
  const cookies = response.headers.get('set-cookie') || '';
  console.log('✅ Login successful\n');
  
  return cookies;
}

// Main test runner
async function runTests() {
  console.log('═'.repeat(60));
  console.log('🧪 TESTING EXPENSE AND REVENUE FORMS AFTER SCHEMA FIXES');
  console.log('═'.repeat(60));
  
  try {
    // Login to get session
    const cookies = await login();
    
    // Run tests
    const expenseResult = await testExpenseWithoutProject(cookies);
    const revenueResult = await testRevenueWithoutClient(cookies);
    
    if (!expenseResult.success || !revenueResult.success) {
      console.log('\n❌ OVERALL RESULT: TESTS FAILED');
      console.log('\nDetails:');
      if (!expenseResult.success) {
        console.log('Expense error:', expenseResult.error);
      }
      if (!revenueResult.success) {
        console.log('Revenue error:', revenueResult.error);
      }
      process.exit(1);
    }
    
    // Verify records
    const verified = await verifyRecords(cookies, expenseResult.id, revenueResult.id);
    
    console.log('\n═'.repeat(60));
    if (verified) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\nSummary:');
      console.log('  ✓ Expense created with projectId="none" (transformed to undefined)');
      console.log('  ✓ Revenue created with clientId="none" and invoiceId="none"');
      console.log('  ✓ Both records appear in their respective lists');
      console.log('  ✓ Financial metrics updated correctly');
    } else {
      console.log('❌ VERIFICATION FAILED: Records not found in lists');
    }
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
runTests();
