//@ts-check
const { spawn } = require('child_process');
const { existsSync, unlinkSync, writeFileSync, readFileSync } = require('fs');
const { queuePath, lockPath } = require('./env.js');
const { exit } = require('process');


const firstInstance = ()=>{
  writeFileSync(lockPath, JSON.stringify({ time: new Date().getTime(), pid: process.pid }));
  writeFileSync(queuePath, '');
  console.log(process.argv.slice(2));
  const p = spawn(
    './node_modules/.pnpm/electron@28.0.0/node_modules/electron/dist/electron',
    ['.', ...process.argv.slice(2)],
    { stdio: 'inherit', cwd: __dirname },
  )
  writeFileSync(lockPath, JSON.stringify({ time: new Date().getTime(), pid: p.pid }));
  p.on('exit', () => unlinkSync(lockPath));
  p.on('error', () => unlinkSync(lockPath));

}

const secondInstance = async ()=>{
  // console.log('here')


  // writeFileSync(queuePath, JSON.stringify({
  //   args: process.argv.slice(2),
  //   cwd: process.cwd,
  //   time: new Date().getTime(),
  // }));
  // const args = process.argv.slice(2);
  // if (args.includes('--increase')) increaseBrightness(+1);
  // if (args.includes('--decrease')) increaseBrightness(-1);
  try {
    const { pid } = JSON.parse('' + readFileSync(lockPath));
    process.kill(pid, 'SIGUSR1'); // does not kill. Just pokes the process if it's alive and throws error if not
  } catch (err) {
    firstInstance();
  }
}

if (existsSync(lockPath)) secondInstance();
else firstInstance();
