#!/usr/bin/env node
/**
 * Git Stepwise Push Scheduler (git_push_schedule.js)
 * 
 * Automates committing and pushing the codebase in logical, bite-sized steps:
 *  Step 1: Project Scaffolding & Configuration
 *  Step 2: Core Data, Country Datasets & Types
 *  Step 3: Server, Backend Services & AI Agents
 *  Step 4: Frontend UI System (Styles, Components, Layouts)
 *  Step 5: Application Views, Pages & Documentation Specs
 *  Step 6: Remaining files & final state check
 * 
 * Usage:
 *   node git_push_schedule.js
 *   node git_push_schedule.js --delay 10 (wait 10s between commits)
 *   node git_push_schedule.js --skip-push (commit only, do not push to remote)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const delaySeconds = parseInt(getArgValue('--delay', '5'), 10);
const skipPush = args.includes('--skip-push');

function getArgValue(flag, defaultVal) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return defaultVal;
}

function run(cmd, allowFail = false) {
  try {
    console.log(`\x1b[36m> ${cmd}\x1b[0m`);
    const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
    if (output && output.trim()) console.log(output.trim());
    return output ? output.trim() : '';
  } catch (err) {
    if (!allowFail) {
      console.error(`\x1b[31mError running command:\x1b[0m ${cmd}`);
      if (err.stdout) console.error(err.stdout.toString());
      if (err.stderr) console.error(err.stderr.toString());
      process.exit(1);
    }
    return null;
  }
}

function sleep(seconds) {
  if (seconds <= 0) return;
  console.log(`\x1b[90mWaiting ${seconds}s before next step...\x1b[0m`);
  execSync(`powershell -Command "Start-Sleep -Seconds ${seconds}"`);
}

function hasStagedChanges() {
  try {
    const diff = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return diff.trim().length > 0;
  } catch {
    return false;
  }
}

function hasAnyChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

function getRemoteBranch() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim() || 'main';
    const remotes = execSync('git remote', { encoding: 'utf-8' }).trim();
    if (!remotes) return null;
    const remote = remotes.split(/\r?\n/)[0];
    return { remote, branch };
  } catch {
    return null;
  }
}

// Ensure Git repository is initialized
if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
  console.log('\x1b[33mGit repository not initialized. Running git init...\x1b[0m');
  run('git init');
  run('git branch -M main');
}

// Defined staged commits in 5+ logical architectural steps
const commitSteps = [
  {
    step: 1,
    title: 'chore: initialize project scaffolding, configs and dependencies',
    description: 'Setup build tools, package dependencies, typescript and environment templates',
    paths: [
      '.gitignore',
      '.env.example',
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'vite.config.ts',
      'firebase.json',
      '.firebaserc',
      'firestore.rules',
      'metadata.json'
    ]
  },
  {
    step: 2,
    title: 'feat(data): add country datasets, schema types, and census models',
    description: 'Setup demographic, civic and indicator datasets and domain typings',
    paths: [
      'src/types/',
      'src/data/',
      'src/config/'
    ]
  },
  {
    step: 3,
    title: 'feat(backend): implement server handlers, agent planners, and services',
    description: 'Setup backend API handlers, civic planning services, and agent tools',
    paths: [
      'server.ts',
      'src/services/',
      'src/agents/',
      'src/utils/',
      'src/contexts/'
    ]
  },
  {
    step: 4,
    title: 'feat(ui): design tokens, responsive components, and styling primitives',
    description: 'Setup atomic design components, CSS variables, icons and HTML entry',
    paths: [
      'index.html',
      'src/index.css',
      'src/components/',
      'assets/'
    ]
  },
  {
    step: 5,
    title: 'feat(views): implement application routes, views and specs',
    description: 'Connect routes, application screens, dashboard views and specifications',
    paths: [
      'src/main.tsx',
      'src/App.tsx',
      'src/pages/',
      'src/routes/',
      '01_PRODUCT_AUDIT.md',
      '02_INFORMATION_ARCHITECTURE.md',
      '03_FEATURE_MATRIX.md',
      '04_COMPONENT_AUDIT.md',
      '05_PAGE_HIERARCHY.md',
      '06_IMPLEMENTATION_SEQUENCE.md',
      'BUILD_PLAN.md',
      'CivicPulse_Master_Discussion_Prompt.md',
      'New_Build_plan.md',
      'llms.txt',
      'security_spec.md'
    ]
  },
  {
    step: 6,
    title: 'chore: finalize repository docs, scripts, and helper automation',
    description: 'Add documentation, push and pull automation scripts',
    paths: [
      'README.md',
      'push.bat',
      'pull.bat',
      'git_push_schedule.js',
      'scripts/'
    ]
  }
];

console.log('\n\x1b[32m====================================================\x1b[0m');
console.log('\x1b[32m  Stepwise Git Staged Commits & Push Scheduler     \x1b[0m');
console.log('\x1b[32m====================================================\x1b[0m\n');

for (const step of commitSteps) {
  console.log(`\x1b[35m▶ [Step ${step.step}/${commitSteps.length}] ${step.title}\x1b[0m`);
  console.log(`  \x1b[90m${step.description}\x1b[0m`);

  // Stage defined paths that exist
  let pathsFound = 0;
  for (const p of step.paths) {
    if (fs.existsSync(path.resolve(process.cwd(), p))) {
      run(`git add "${p}"`, true);
      pathsFound++;
    }
  }

  if (hasStagedChanges()) {
    run(`git commit -m "${step.title}" -m "${step.description}"`);
    console.log(`\x1b[32m  ✔ Step ${step.step} committed successfully!\x1b[0m`);

    const remoteInfo = getRemoteBranch();
    if (!skipPush && remoteInfo) {
      console.log(`  \x1b[34mPushing Step ${step.step} to ${remoteInfo.remote}/${remoteInfo.branch}...\x1b[0m`);
      run(`git push -u ${remoteInfo.remote} ${remoteInfo.branch}`, true);
    } else if (!remoteInfo && !skipPush) {
      console.log('  \x1b[33m(Notice: Remote repository origin not set yet. Committed locally.)\x1b[0m');
    }

    sleep(delaySeconds);
  } else {
    console.log(`  \x1b[90m(No changes staged for Step ${step.step} - skipping)\x1b[0m`);
  }
  console.log('');
}

// Final pass: any leftover files
if (hasAnyChanges()) {
  console.log('\x1b[35m▶ [Final Pass] Staging remaining files...\x1b[0m');
  run('git add .');
  if (hasStagedChanges()) {
    run('git commit -m "chore: complete project files snapshot"');
    console.log('\x1b[32m  ✔ Final commit completed.\x1b[0m');

    const remoteInfo = getRemoteBranch();
    if (!skipPush && remoteInfo) {
      console.log(`  \x1b[34mPushing final commit to ${remoteInfo.remote}/${remoteInfo.branch}...\x1b[0m`);
      run(`git push -u ${remoteInfo.remote} ${remoteInfo.branch}`, true);
    }
  }
  console.log('');
}

console.log('\x1b[32m====================================================\x1b[0m');
console.log('\x1b[32m  All Stepwise Commits Finished!                    \x1b[0m');
console.log('\x1b[32m====================================================\x1b[0m');
console.log('Run \x1b[36mgit log --oneline -n 10\x1b[0m to review your commit history.\n');
