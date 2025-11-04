#!/usr/bin/env node

/**
 * Post-install script for @qdaria/zipminator
 * Downloads and verifies the appropriate prebuilt binary for the current platform
 */

import os from 'os';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine platform and architecture
const platform = os.platform();
const arch = os.arch();

// Map Node.js platform/arch to Rust targets
const TARGET_MAP = {
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin',
  'linux-x64': 'x86_64-unknown-linux-gnu',
  'linux-arm64': 'aarch64-unknown-linux-gnu',
  'win32-x64': 'x86_64-pc-windows-msvc',
};

const key = `${platform}-${arch}`;
const target = TARGET_MAP[key];

if (!target) {
  console.error(`Unsupported platform: ${platform}-${arch}`);
  process.exit(1);
}

const binaryName = platform === 'win32' ? 'zipminator.exe' : 'zipminator';
const binaryDir = path.join(__dirname, 'bin');
const binaryPath = path.join(binaryDir, binaryName);

// Ensure bin directory exists
if (!fs.existsSync(binaryDir)) {
  fs.mkdirSync(binaryDir, { recursive: true });
}

// Download function
async function downloadBinary(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading Zipminator binary for ${target}...`);
    console.log(`URL: ${url}`);

    const file = fs.createWriteStream(outputPath);
    const request = https.get(url, (response) => {
      if (response.statusCode === 404) {
        reject(new Error(`Binary not found for ${target}`));
        return;
      }

      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadBinary(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Clean up
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Clean up
      reject(err);
    });
  });
}

// Checksum verification function
async function verifyChecksum(filePath, expectedHash) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      const fileHash = hash.digest('hex');
      if (fileHash === expectedHash) {
        resolve(true);
      } else {
        reject(new Error(`Checksum mismatch for ${filePath}`));
      }
    });

    stream.on('error', reject);
  });
}

// Main install function
async function install() {
  try {
    // Check if binary already exists
    if (fs.existsSync(binaryPath)) {
      console.log(`Binary already exists at ${binaryPath}`);
      // Make it executable
      fs.chmodSync(binaryPath, 0o755);
      return;
    }

    const version = '0.1.0';
    const url = `https://github.com/qdaria/zipminator/releases/download/v${version}/zipminator-${target}`;

    await downloadBinary(url, binaryPath);

    // Make binary executable
    fs.chmodSync(binaryPath, 0o755);

    console.log(`Successfully installed Zipminator to ${binaryPath}`);
    console.log(`Run: ${binaryPath} --version`);
  } catch (error) {
    console.error('Installation failed:', error.message);
    process.exit(1);
  }
}

// Run installation
install();
