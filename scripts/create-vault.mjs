#!/usr/bin/env node
// Run this locally: node scripts/create-vault.mjs
//
// Prompts for your GitHub PAT and a passphrase, encrypts the PAT
// (PBKDF2-SHA256 + AES-256-GCM, matching lib/githubClient.ts's browser-side
// decryption exactly), and writes the result to vault.json in this
// directory. Neither the PAT nor the passphrase are sent anywhere — this is
// entirely local. Commit the output yourself to:
//   pfalexns-posts/.auth/vault.json
//
// Re-run this any time you rotate the PAT or change the passphrase.

import { createCipheriv, randomBytes, pbkdf2Sync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { writeFileSync } from "node:fs";

const ITERATIONS = 600_000; // matches lib/githubClient.ts

const rl = createInterface({ input: process.stdin, output: process.stdout });

console.log("This runs entirely on your machine. Nothing is sent anywhere.\n");
console.log("Input isn't masked — make sure nobody's looking over your shoulder.\n");

const pat = await rl.question("GitHub PAT (fine-grained, scoped to pfalexns-posts + pfalexns-drafts, Contents R/W): ");
const passphrase = await rl.question("Passphrase to protect it with (use a real passphrase, not a short PIN): ");
const confirm = await rl.question("Confirm passphrase: ");
rl.close();

if (!pat.trim()) {
  console.error("No PAT entered, aborting.");
  process.exit(1);
}
if (passphrase !== confirm) {
  console.error("Passphrases did not match, aborting.");
  process.exit(1);
}
if (passphrase.length < 12) {
  console.warn(
    "\nWarning: that passphrase is short. vault.json will be public, so it's offline-brute-forceable.",
  );
  console.warn("Proceeding anyway — re-run this script any time to switch to a stronger one.\n");
}

const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(passphrase, salt, ITERATIONS, 32, "sha256");

const cipher = createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(pat.trim(), "utf8"), cipher.final()]);
const authTag = cipher.getAuthTag();
// Web Crypto's AES-GCM expects the auth tag appended to the ciphertext.
const ciphertext = Buffer.concat([encrypted, authTag]);

const vault = {
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  ciphertext: ciphertext.toString("base64"),
  iterations: ITERATIONS,
};

writeFileSync("vault.json", JSON.stringify(vault, null, 2) + "\n");
console.log("\nWrote vault.json. This file is safe to make public (it's ciphertext).");
console.log("Commit it to pfalexns-posts/.auth/vault.json, e.g.:\n");
console.log("  cp vault.json /path/to/pfalexns-posts/.auth/vault.json");
console.log("  cd /path/to/pfalexns-posts && git add .auth/vault.json && git commit -m 'Add auth vault' && git push\n");
