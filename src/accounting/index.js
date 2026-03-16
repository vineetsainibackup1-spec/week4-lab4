const readline = require('readline');

const MAX_CENTS = 99999999; // PIC 9(6)V99 -> max 999,999.99

let storageBalanceCents = 1000_00; // initial 1000.00 in cents

function dataRead() {
  return storageBalanceCents;
}

function dataWrite(newCents) {
  storageBalanceCents = newCents;
}

function formatCents(cents) {
  return (cents / 100).toFixed(2);
}

// Non-interactive helpers for testing / programmatic use
function creditAmount(amountInput) {
  const amt = typeof amountInput === 'string' ? parseFloat(amountInput.replace(/,/g, '')) : Number(amountInput);
  if (Number.isNaN(amt)) {
    return { success: false, message: 'Invalid amount. Credit cancelled.' };
  }
  const amtCents = Math.round(amt * 100);
  const bal = dataRead();
  const newBal = bal + amtCents;
  if (Math.abs(newBal) > MAX_CENTS) {
    return { success: false, message: 'Operation would exceed allowed field size; rejected.' };
  }
  dataWrite(newBal);
  return { success: true, newBalance: newBal, message: 'Amount credited. New balance: ' + formatCents(newBal) };
}

function debitAmount(amountInput) {
  const amt = typeof amountInput === 'string' ? parseFloat(amountInput.replace(/,/g, '')) : Number(amountInput);
  if (Number.isNaN(amt)) {
    return { success: false, message: 'Invalid amount. Debit cancelled.' };
  }
  const amtCents = Math.round(amt * 100);
  const bal = dataRead();
  if (bal >= amtCents) {
    const newBal = bal - amtCents;
    dataWrite(newBal);
    return { success: true, newBalance: newBal, message: 'Amount debited. New balance: ' + formatCents(newBal) };
  } else {
    return { success: false, message: 'Insufficient funds for this debit.' };
  }
}

function viewBalance() {
  return dataRead();
}

function handleMenuChoice(choice) {
  const c = String(choice).trim();
  switch (c) {
    case '1':
      return { action: 'TOTAL' };
    case '2':
      return { action: 'CREDIT' };
    case '3':
      return { action: 'DEBIT' };
    case '4':
      return { action: 'EXIT' };
    default:
      return { action: 'INVALID', message: 'Invalid choice, please select 1-4.' };
  }
}

async function operations(passedOperation, questionFn) {
  const op = passedOperation.trim();
  if (op === 'TOTAL') {
    const bal = dataRead();
    console.log('Current balance: ' + formatCents(bal));
    return;
  }

  if (op === 'CREDIT') {
    if (typeof questionFn !== 'function') {
      throw new Error('Interactive credit requires a question function');
    }
    const ans = await questionFn('Enter credit amount: ');
    const amt = parseFloat(ans.replace(/,/g, ''));
    if (Number.isNaN(amt)) {
      console.log('Invalid amount. Credit cancelled.');
      return;
    }
    const amtCents = Math.round(amt * 100);
    const bal = dataRead();
    const newBal = bal + amtCents;
    if (Math.abs(newBal) > MAX_CENTS) {
      console.log('Operation would exceed allowed field size; rejected.');
      return;
    }
    dataWrite(newBal);
    console.log('Amount credited. New balance: ' + formatCents(newBal));
    return;
  }

  if (op === 'DEBIT') {
    if (typeof questionFn !== 'function') {
      throw new Error('Interactive debit requires a question function');
    }
    const ans = await questionFn('Enter debit amount: ');
    const amt = parseFloat(ans.replace(/,/g, ''));
    if (Number.isNaN(amt)) {
      console.log('Invalid amount. Debit cancelled.');
      return;
    }
    const amtCents = Math.round(amt * 100);
    const bal = dataRead();
    if (bal >= amtCents) {
      const newBal = bal - amtCents;
      dataWrite(newBal);
      console.log('Amount debited. New balance: ' + formatCents(newBal));
    } else {
      console.log('Insufficient funds for this debit.');
    }
    return;
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  let continueFlag = true;
  while (continueFlag) {
    console.log('--------------------------------');
    console.log('Account Management System');
    console.log('1. View Balance');
    console.log('2. Credit Account');
    console.log('3. Debit Account');
    console.log('4. Exit');
    console.log('--------------------------------');
    const choice = await question('Enter your choice (1-4): ');
    switch (choice.trim()) {
      case '1':
        await operations('TOTAL');
        break;
      case '2':
        await operations('CREDIT', question);
        break;
      case '3':
        await operations('DEBIT', question);
        break;
      case '4':
        continueFlag = false;
        break;
      default:
        console.log('Invalid choice, please select 1-4.');
    }
  }
  console.log('Exiting the program. Goodbye!');
  rl.close();
}

if (require.main === module) {
  main();
}

module.exports = {
  dataRead,
  dataWrite,
  formatCents,
  creditAmount,
  debitAmount,
  viewBalance,
  handleMenuChoice,
};
