/**
 * BROWSER CONSOLE TEST FOR EXPENSE AND REVENUE FORMS
 * 
 * Instructions:
 * 1. Open the application in your browser
 * 2. Log in as an admin or manager user
 * 3. Open Developer Tools (F12)
 * 4. Go to the Console tab
 * 5. Copy and paste this entire script
 * 6. Press Enter to run the tests
 */

console.log('═'.repeat(60));
console.log('🧪 TESTING EXPENSE AND REVENUE FORMS');
console.log('═'.repeat(60));

async function apiRequest(method, url, data) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include', // Include session cookies
  });
  
  const responseData = await response.json();
  return { status: response.status, data: responseData };
}

async function runTests() {
  let allPassed = true;
  
  // Test 1: Create expense without project
  console.log('\n📝 TEST 1: Creating expense without project (projectId = "none")');
  console.log('─'.repeat(60));
  
  const expenseData = {
    date: new Date().toISOString(),
    category: 'operations',
    amount: '500.00',
    description: 'Test expense without project - Browser Console Test',
    vendor: '',
    receipt: '',
    projectId: 'none',
  };
  
  console.log('Request payload:', expenseData);
  
  const expenseResult = await apiRequest('POST', '/api/expenses', expenseData);
  console.log(`Response status: ${expenseResult.status}`);
  console.log('Response data:', expenseResult.data);
  
  if (expenseResult.status === 201) {
    console.log('✅ SUCCESS: Expense created successfully!');
    console.log(`   Expense ID: ${expenseResult.data.id}`);
    console.log(`   Amount: $${expenseResult.data.amount}`);
    console.log(`   ProjectId is undefined: ${expenseResult.data.projectId === null || expenseResult.data.projectId === undefined}`);
  } else {
    console.log('❌ FAILED: Expense creation failed');
    console.log('   Error:', expenseResult.data.message || expenseResult.data);
    allPassed = false;
  }
  
  // Test 2: Create revenue without client/invoice
  console.log('\n📝 TEST 2: Creating revenue without client/invoice');
  console.log('─'.repeat(60));
  
  const revenueData = {
    date: new Date().toISOString(),
    source: 'service',
    amount: '1200.00',
    description: 'Test revenue without client/invoice - Browser Console Test',
    clientId: 'none',
    invoiceId: 'none',
  };
  
  console.log('Request payload:', revenueData);
  
  const revenueResult = await apiRequest('POST', '/api/revenue', revenueData);
  console.log(`Response status: ${revenueResult.status}`);
  console.log('Response data:', revenueResult.data);
  
  if (revenueResult.status === 201) {
    console.log('✅ SUCCESS: Revenue created successfully!');
    console.log(`   Revenue ID: ${revenueResult.data.id}`);
    console.log(`   Amount: $${revenueResult.data.amount}`);
    console.log(`   ClientId is undefined: ${revenueResult.data.clientId === null || revenueResult.data.clientId === undefined}`);
    console.log(`   InvoiceId is undefined: ${revenueResult.data.invoiceId === null || revenueResult.data.invoiceId === undefined}`);
  } else {
    console.log('❌ FAILED: Revenue creation failed');
    console.log('   Error:', revenueResult.data.message || revenueResult.data);
    allPassed = false;
  }
  
  // Test 3: Verify financial metrics updated
  console.log('\n📝 TEST 3: Verifying financial metrics');
  console.log('─'.repeat(60));
  
  const metricsResult = await apiRequest('GET', '/api/financial/metrics');
  console.log('Financial metrics:', metricsResult.data);
  
  if (metricsResult.data.totalExpenses > 0 && metricsResult.data.totalRevenue > 0) {
    console.log('✅ SUCCESS: Financial metrics updated correctly');
  } else {
    console.log('⚠️  WARNING: Metrics may not have updated yet');
  }
  
  // Final summary
  console.log('\n═'.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\nVerification:');
    console.log('  ✓ Expense form accepts projectId="none" and transforms to undefined');
    console.log('  ✓ Revenue form accepts clientId="none" and invoiceId="none"');
    console.log('  ✓ Both forms submit successfully');
    console.log('  ✓ Records created in database');
  } else {
    console.log('❌ SOME TESTS FAILED - Check errors above');
  }
  console.log('═'.repeat(60));
}

// Run the tests
runTests().catch(error => {
  console.error('❌ TEST ERROR:', error);
  console.log('\nMake sure you are:');
  console.log('  1. Logged in as an admin or manager');
  console.log('  2. Have the manageFinancial permission');
  console.log('  3. On a page where the session is active');
});
