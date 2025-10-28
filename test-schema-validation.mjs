#!/usr/bin/env node
/**
 * Test Zod schema validation for expense and revenue forms
 * This verifies that the schemas correctly transform "none" to undefined
 */

import { z } from 'zod';

// Replicate the expense schema transformations
const testExpenseSchema = z.object({
  date: z.coerce.date(),
  category: z.string(),
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  description: z.string(),
  vendor: z.string().transform(val => val === '' ? undefined : val).optional(),
  receipt: z.string().transform(val => val === '' ? undefined : val).optional(),
  projectId: z.string().transform(val => (val === '' || val === 'none') ? undefined : val).optional(),
});

// Replicate the revenue schema transformations
const testRevenueSchema = z.object({
  date: z.coerce.date(),
  source: z.string(),
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  description: z.string(),
  clientId: z.string().transform(val => (val === '' || val === 'none') ? undefined : val).optional(),
  invoiceId: z.string().transform(val => (val === '' || val === 'none') ? undefined : val).optional(),
});

console.log('═'.repeat(60));
console.log('🧪 TESTING ZOD SCHEMA VALIDATION');
console.log('═'.repeat(60));

// Test 1: Expense with projectId = "none"
console.log('\n📝 TEST 1: Expense with projectId = "none"');
console.log('─'.repeat(60));

const expenseInput = {
  date: new Date().toISOString(),
  category: 'operations',
  amount: '500.00',
  description: 'Test expense without project',
  vendor: '',
  receipt: '',
  projectId: 'none',
};

console.log('Input:', JSON.stringify(expenseInput, null, 2));

try {
  const parsed = testExpenseSchema.parse(expenseInput);
  console.log('Parsed output:', JSON.stringify(parsed, null, 2));
  
  if (parsed.projectId === undefined) {
    console.log('✅ SUCCESS: projectId="none" was transformed to undefined');
  } else {
    console.log(`❌ FAILED: projectId should be undefined but is "${parsed.projectId}"`);
  }
  
  if (parsed.vendor === undefined) {
    console.log('✅ SUCCESS: vendor="" was transformed to undefined');
  } else {
    console.log(`❌ FAILED: vendor should be undefined but is "${parsed.vendor}"`);
  }
  
  if (parsed.receipt === undefined) {
    console.log('✅ SUCCESS: receipt="" was transformed to undefined');
  } else {
    console.log(`❌ FAILED: receipt should be undefined but is "${parsed.receipt}"`);
  }
} catch (error) {
  console.log('❌ VALIDATION ERROR:', error.message);
  if (error.errors) {
    console.log('Errors:', JSON.stringify(error.errors, null, 2));
  }
}

// Test 2: Revenue with clientId and invoiceId = "none"
console.log('\n📝 TEST 2: Revenue with clientId="none" and invoiceId="none"');
console.log('─'.repeat(60));

const revenueInput = {
  date: new Date().toISOString(),
  source: 'service',
  amount: '1200.00',
  description: 'Test revenue without client/invoice',
  clientId: 'none',
  invoiceId: 'none',
};

console.log('Input:', JSON.stringify(revenueInput, null, 2));

try {
  const parsed = testRevenueSchema.parse(revenueInput);
  console.log('Parsed output:', JSON.stringify(parsed, null, 2));
  
  if (parsed.clientId === undefined) {
    console.log('✅ SUCCESS: clientId="none" was transformed to undefined');
  } else {
    console.log(`❌ FAILED: clientId should be undefined but is "${parsed.clientId}"`);
  }
  
  if (parsed.invoiceId === undefined) {
    console.log('✅ SUCCESS: invoiceId="none" was transformed to undefined');
  } else {
    console.log(`❌ FAILED: invoiceId should be undefined but is "${parsed.invoiceId}"`);
  }
} catch (error) {
  console.log('❌ VALIDATION ERROR:', error.message);
  if (error.errors) {
    console.log('Errors:', JSON.stringify(error.errors, null, 2));
  }
}

// Test 3: Expense with empty string projectId
console.log('\n📝 TEST 3: Expense with projectId = ""');
console.log('─'.repeat(60));

const expenseInput2 = {
  date: new Date().toISOString(),
  category: 'operations',
  amount: '300.00',
  description: 'Test expense with empty string',
  vendor: 'Test Vendor',
  receipt: '',
  projectId: '',
};

console.log('Input:', JSON.stringify(expenseInput2, null, 2));

try {
  const parsed = testExpenseSchema.parse(expenseInput2);
  console.log('Parsed output:', JSON.stringify(parsed, null, 2));
  
  if (parsed.projectId === undefined) {
    console.log('✅ SUCCESS: projectId="" was transformed to undefined');
  } else {
    console.log(`❌ FAILED: projectId should be undefined but is "${parsed.projectId}"`);
  }
} catch (error) {
  console.log('❌ VALIDATION ERROR:', error.message);
  if (error.errors) {
    console.log('Errors:', JSON.stringify(error.errors, null, 2));
  }
}

console.log('\n═'.repeat(60));
console.log('✅ SCHEMA VALIDATION TESTS COMPLETE');
console.log('═'.repeat(60));
