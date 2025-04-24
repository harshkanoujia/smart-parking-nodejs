const os = require('os');
const fs = require('fs');
const path = require('path');
require('express-async-errors');
const winston = require('winston');

// check log folder 
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);


const { combine, timestamp, printf, colorize, json } = winston.format;

const timestampFmt = timestamp({ format: "YYYY-MM-DD HH:mm:ss" });
const logPrinter = printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`);

// "info" level in logfile.log
const filterOnlyInfo = winston.format((info) => info.level === "info" ? info : false);


module.exports = function () {

  winston.configure({
    level: "info",
    format: combine(timestampFmt, logPrinter),
    transports: [
      new winston.transports.Console({
        format: combine(colorize(), timestampFmt, logPrinter),
      }),
      new winston.transports.File({
        filename: "logs/logfile.log",
        format: combine(filterOnlyInfo(), timestamp(), json()),
      }),
      new winston.transports.File({
        filename: "logs/errors.log",
        level: "error",
        format: combine(timestamp(), json()), // only errors
      })
    ],
    exitOnError: true,
  });


  process.on("uncaughtException", (err) => {

    winston.error("uncaughtException :", errorLog(err));
    console.error(errorLog(err));

    fs.appendFileSync("logs/uncaughtExceptions.log", JSON.stringify(errorLog) + "\n");
    process.exit(1);
    
  });

  process.on("unhandledRejection", (err) => {

    winston.error('unhandledRejection :', errorLog(err));
    console.error(errorLog(err));

    fs.appendFileSync("logs/unhandledRejections.log", JSON.stringify(rejectLog) + "\n");
    process.exit(1);

    // throw err;  // already log
  });

};


// Stack trace parser
function parseStackToObject(stackArray) {
  const regex = /^\s*at\s+(?:(.*?)\s+\()?(.+):(\d+):(\d+)\)?$/;

  return stackArray.map((line) => {
    const match = line.match(regex);
    if (!match) return null;

    const functionName = match[1] || null;
    const methodName = functionName ? functionName.split(".").pop() : null;
    const isNative = /\(native\)|\[native code\]|node:internal/.test(line);

    return {
      file: match[2],
      line: +match[3],          // parseInt(match[3], 10),  same 
      column: +match[4],        // parseInt(match[4], 10),
      function: functionName,
      method: methodName,
      native: isNative,
    };
  }).filter(Boolean);
}

function errorLog(err){
  const rawStack = err.stack?.split("\n").slice(1).map(l => l.trim()) || [];

  return {
    date: new Date().toString(),
    message: err.message,
    trace: parseStackToObject(rawStack),
    process: {
      pid: process.pid,
      uid: process.getuid?.(),
      gid: process.getgid?.(),
      cwd: process.cwd(),
      execPath: process.execPath,
      version: process.version,
      argv: process.argv,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    },
    os: {
      hostname: os.hostname(),
      loadavg: os.loadavg(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    },
    stack: err.stack.split("\n")   // err.stack.split("\n").map((l) => l.trim())
  };
}

// error < warn < info < verbose < debug < silly