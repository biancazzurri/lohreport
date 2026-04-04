#!/usr/bin/env npx tsx
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const bucketName = process.argv[2];
const region = process.argv[3] ?? "us-east-1";

if (!bucketName) {
  console.error("Usage: npx tsx scripts/setup-s3.ts <bucket-name> [region]");
  process.exit(1);
}

const iamUserName = `health-tracker-${bucketName}`;
const envLocalPath = path.resolve(process.cwd(), ".env.local");

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    console.error(`Command failed: ${cmd}`);
    console.error(error.stderr ?? error.message ?? String(err));
    process.exit(1);
  }
}

// 1. Create S3 bucket
console.log(`Creating S3 bucket: ${bucketName} in ${region}`);
if (region === "us-east-1") {
  run(`aws s3api create-bucket --bucket ${bucketName} --region ${region}`);
} else {
  run(
    `aws s3api create-bucket --bucket ${bucketName} --region ${region} ` +
      `--create-bucket-configuration LocationConstraint=${region}`
  );
}

// 2. Block public access
console.log("Blocking public access...");
run(
  `aws s3api put-public-access-block --bucket ${bucketName} ` +
    `--public-access-block-configuration ` +
    `BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true`
);

// 3. Enable CORS
console.log("Enabling CORS...");
const corsConfig = JSON.stringify({
  CORSRules: [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT"],
      AllowedOrigins: ["*"],
      MaxAgeSeconds: 3000,
    },
  ],
});
run(
  `aws s3api put-bucket-cors --bucket ${bucketName} --cors-configuration '${corsConfig}'`
);

// 4. Create IAM user
console.log(`Creating IAM user: ${iamUserName}`);
run(`aws iam create-user --user-name ${iamUserName}`);

// 5. Attach inline policy
console.log("Attaching inline IAM policy...");
const bucketArn = `arn:aws:s3:::${bucketName}`;
const policy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: ["s3:PutObject", "s3:GetObject"],
      Resource: `${bucketArn}/*`,
    },
    {
      Effect: "Allow",
      Action: ["s3:ListBucket"],
      Resource: bucketArn,
    },
  ],
});
run(
  `aws iam put-user-policy --user-name ${iamUserName} ` +
    `--policy-name health-tracker-s3-policy ` +
    `--policy-document '${policy}'`
);

// 6. Create access key
console.log("Creating IAM access key...");
const accessKeyOutput = run(
  `aws iam create-access-key --user-name ${iamUserName}`
);
const accessKeyData = JSON.parse(accessKeyOutput) as {
  AccessKey: { AccessKeyId: string; SecretAccessKey: string };
};
const accessKeyId = accessKeyData.AccessKey.AccessKeyId;
const secretAccessKey = accessKeyData.AccessKey.SecretAccessKey;

// 7. Write to .env.local, preserving non-S3 lines
console.log(`Writing credentials to ${envLocalPath}`);
let existingLines: string[] = [];
if (fs.existsSync(envLocalPath)) {
  existingLines = fs
    .readFileSync(envLocalPath, "utf8")
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith("NEXT_PUBLIC_S3_BUCKET=") &&
        !line.startsWith("NEXT_PUBLIC_S3_REGION=") &&
        !line.startsWith("NEXT_PUBLIC_S3_ACCESS_KEY=") &&
        !line.startsWith("NEXT_PUBLIC_S3_SECRET_KEY=")
    );
}

const s3Lines = [
  `NEXT_PUBLIC_S3_BUCKET=${bucketName}`,
  `NEXT_PUBLIC_S3_REGION=${region}`,
  `NEXT_PUBLIC_S3_ACCESS_KEY=${accessKeyId}`,
  `NEXT_PUBLIC_S3_SECRET_KEY=${secretAccessKey}`,
];

const allLines = [...existingLines, ...s3Lines].filter(
  (line, idx, arr) => line !== "" || idx === arr.length - 1
);

fs.writeFileSync(envLocalPath, allLines.join("\n") + "\n", "utf8");

console.log("\nDone! Credentials written to .env.local:");
console.log(`  NEXT_PUBLIC_S3_BUCKET=${bucketName}`);
console.log(`  NEXT_PUBLIC_S3_REGION=${region}`);
console.log(`  NEXT_PUBLIC_S3_ACCESS_KEY=${accessKeyId}`);
console.log(`  NEXT_PUBLIC_S3_SECRET_KEY=<hidden>`);
