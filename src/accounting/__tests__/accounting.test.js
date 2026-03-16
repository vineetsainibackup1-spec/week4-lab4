const path = require('path');

// require the module under test
const accounting = require('../index');

const { dataRead, dataWrite, formatCents, creditAmount, debitAmount, viewBalance, handleMenuChoice } = accounting;

beforeEach(() => {
  // reset to initial COBOL default 1000.00
  dataWrite(1000_00);
});

test('TC-01: View current balance (TOTAL)', () => {
  expect(formatCents(viewBalance())).toBe('1000.00');
});

test('TC-02: Credit a positive amount', () => {
  const res = creditAmount('250.50');
  expect(res.success).toBe(true);
  expect(formatCents(res.newBalance)).toBe('1250.50');
  expect(formatCents(dataRead())).toBe('1250.50');
});

test('TC-03: Credit zero amount', () => {
  const res = creditAmount('0.00');
  expect(res.success).toBe(true);
  expect(formatCents(res.newBalance)).toBe('1000.00');
});

test('TC-04: Credit negative amount (behavior check)', () => {
  const res = creditAmount('-50.00');
  // current implementation accepts negative and reduces balance
  expect(res.success).toBe(true);
  expect(formatCents(res.newBalance)).toBe('950.00');
});

test('TC-05: Debit with sufficient funds', () => {
  const res = debitAmount('200.00');
  expect(res.success).toBe(true);
  expect(formatCents(res.newBalance)).toBe('800.00');
});

test('TC-06: Debit with insufficient funds', () => {
  dataWrite(100_00); // set balance to 100.00
  const res = debitAmount('200.00');
  expect(res.success).toBe(false);
  expect(res.message).toBe('Insufficient funds for this debit.');
  expect(formatCents(dataRead())).toBe('100.00');
});

test('TC-07: Amount field overflow / large value', () => {
  const res = creditAmount('1000000.00');
  expect(res.success).toBe(false);
  expect(res.message).toMatch(/exceed allowed field size/);
});

test('TC-08: Non-numeric input for amount', () => {
  const res = creditAmount('abc');
  expect(res.success).toBe(false);
  expect(res.message).toBe('Invalid amount. Credit cancelled.');
});

test('TC-09: Menu invalid selection handling', () => {
  const res = handleMenuChoice('9');
  expect(res.action).toBe('INVALID');
  expect(res.message).toBe('Invalid choice, please select 1-4.');
});

test('TC-10: Persistence across runs (no persistence)', () => {
  // modify balance
  creditAmount('100.00');
  expect(formatCents(dataRead())).toBe('1100.00');
  // simulate restart by spawning a fresh node process that requires the module
  const { spawnSync } = require('child_process');
  const node = process.execPath;
  const script = "console.log(require('./src/accounting').formatCents(require('./src/accounting').viewBalance()));";
  const rv = spawnSync(node, ['-e', script], { cwd: process.cwd(), encoding: 'utf8' });
  const out = rv.stdout.trim();
  expect(out).toBe('1000.00');
});
