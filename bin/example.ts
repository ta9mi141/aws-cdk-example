#!/usr/bin/env node
import "source-map-support/register";
import cdk = require("@aws-cdk/core");
import { NetworkStack } from "../lib/network-stack";
import { ComputeStack } from "../lib/compute-stack";

const app = new cdk.App();
const networkStack = new NetworkStack(app, "NetworkStack", { cidrMask: 24 });
new ComputeStack(app, "ComputeStack", { vpc: networkStack.vpc });
