import cdk = require("@aws-cdk/core");
import ec2 = require("@aws-cdk/aws-ec2");

interface ComputeStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    internalSG: ec2.SecurityGroup;
}

export class ComputeStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);

        const userData = ec2.UserData.forLinux({ shebang: "#!/bin/bash" });
        userData.addCommands("amazon-linux-extras -y install nginx1.12", "systemctl enable nginx", "systemctl start nginx");
        for (let privateSubnet of props.vpc.privateSubnets) {
            new ec2.CfnInstance(this, `WebInstance-${privateSubnet.node.id}`, {
                imageId: new ec2.AmazonLinuxImage({
                    generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
                    userData: userData
                }).getImage(this).imageId,
                instanceType: ec2.InstanceType.of(
                    ec2.InstanceClass.T3,
                    this.node.tryGetContext("env") === "production": ec2.InstanceSize.MEDIUM: ec2.InstanceSize.NANO
                ).toString(),
                keyName: this.node.tryGetContext("key"),
                subnetId: privateSubnet.subnetId,
                securityGroupIds: [props.internalSG.securityGroupId],
                tags: [
                    {
                        key: "Name",
                        value: `Example-Web-${privateSubnet.availabilityZone}`
                    }
                ]
            });
        }
    }
}
