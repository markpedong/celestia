import { config } from 'dotenv';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

config({ path: '.env' });

const confirmationPhrase = 'RESET CELESTIA';
const password = process.env.DB_RESET_CONFIRMATION_PASSWORD;

const main = async () => {
  if (!password) throw new Error('DB_RESET_CONFIRMATION_PASSWORD is missing from .env.');
  if (!input.isTTY) throw new Error('db:reset requires an interactive terminal confirmation.');

  const prompt = createInterface({ input, output });
  try {
    console.log('\nWARNING: This permanently deletes all application database records, Supabase Auth users, and uploaded storage files.');
    console.log('This action cannot be undone.\n');

    const phrase = await prompt.question(`Type ${confirmationPhrase} to continue: `);
    if (phrase !== confirmationPhrase) throw new Error('Reset cancelled: confirmation phrase did not match.');

    const enteredPassword = await prompt.question('Enter the database reset password: ');
    if (enteredPassword !== password) throw new Error('Reset cancelled: password did not match.');
  } finally {
    prompt.close();
  }
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
