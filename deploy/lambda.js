const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');

// AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables should be set
// https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html
// Environment variables can be configured with .env files or CI/CD settings
// https://gitlab.com/help/ci/variables/README

// Configure the deployment using the following
const config = {
  functionName: '',
};

const execSync = cmd => childProcess.execSync(cmd, { stdio: [0, 1, 2] });
const begin = msg => console.log(['\033[1m', msg, '\033[0m'].join(''));
const error = msg => {
  console.error(['\033[1;31m', 'Error: ', msg, '\033[0m'].join(''));
  process.exit(1);
};

// Read in .env files and check for credentials
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`));
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}`));
dotenv.config(path.resolve(__dirname, `.env.local`));
dotenv.config();

if (!config.functionName) error('No deployment functionName configured');
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  error('No AWS credentials found in environment variables');
}

// Package using yarn into a temp dir
const packageDir = fs.mkdtempSync('/tmp/lambda-');
const packageTarball = path.join(packageDir, 'package.tgz');
const packageExtracted = path.join(packageDir, 'package');
const packageZip = path.join(packageDir, 'package.zip');
execSync(`yarn pack --silent -f ${packageTarball}`);
execSync(`tar -C ${packageDir} -xzf ${packageTarball}`);
// Use the node Docker linux image to install dependencies
const npmInstall = 'npm install --production --silent --no-audit';
execSync(`docker run -v ${packageExtracted}:/run/package -w /run/package --rm node ${npmInstall}`);
// Zip the files
execSync(`zip -q -r -j -9 ${packageZip} ${packageExtracted}/*`);
begin(`Uploading ${packageZip}`);

// Deploy to lambda
const lambda = new AWS.Lambda({ apiVersion: 'latest' });
const zipData = fs.readFileSync(packageZip);
const params = { FunctionName: config.functionName, Publish: true, ZipFile: zipData };
lambda.updateFunctionCode(params, err => {
  if (err) {
    error(err);
  } else {
    console.log(`\u{1f680}  ${config.functionName} has been updated`);
  }
});
