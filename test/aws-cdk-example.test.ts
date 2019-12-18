import "@aws-cdk/assert/jest";
import assert = require("@aws-cdk/assert");
import cdk = require("@aws-cdk/core");

import { NetworkStack } from "../lib/network-stack";
import { ComputeStack } from "../lib/compute-stack";

test("NetworkStack Snapshot Tests", () => {
    const app = new cdk.App();
    const networkStack = new NetworkStack(app, "NetworkStack", { cidrMask: 24 });
    expect(assert.SynthUtils.toCloudFormation(networkStack)).toMatchSnapshot();
});

test("ComputeStack Snapshot Tests", () => {
    const app = new cdk.App();
    const networkStack = new NetworkStack(app, "NetworkStack", { cidrMask: 24 });
    const computeStack = new ComputeStack(app, "ComputeStack", { vpc: networkStack.vpc });
    expect(assert.SynthUtils.toCloudFormation(computeStack)).toMatchSnapshot();
});

test("NetworkStack Fine-Grained Assertions", () => {
    const app = new cdk.App();
    const networkStack = new NetworkStack(app, "NetworkStack", { cidrMask: 24 });
    expect(networkStack).toHaveResource("AWS::EC2::VPC", {
        CidrBlock: "10.0.0.0/16",
        Tags: [{ "Key": "Name", "Value": "Example-Vpc" }]
    });
});

test("NetworkStack Validation Tests With Valid CidrMask", () => {
    const app = new cdk.App();
    const networkStack = new NetworkStack(app, "NetworkStack", { cidrMask: 24 });
    expect(networkStack).toHaveResource("AWS::EC2::Subnet", {
        CidrBlock: "10.0.0.0/24"
    });
});

test("NetworkStack Validation Tests With Invalid CidrMask", () => {
    const app = new cdk.App();
    expect(() => {
        new NetworkStack(app, "NetworkStack", { cidrMask: 32 });
    }).toThrowError("Valid values of cidrMask are 16--28")
});
