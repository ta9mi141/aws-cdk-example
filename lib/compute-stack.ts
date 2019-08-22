import cdk = require("@aws-cdk/core");
import ec2 = require("@aws-cdk/aws-ec2");

interface ComputeStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    internetFacingSG: ec2.SecurityGroup;
    internalSG: ec2.SecurityGroup;
}

export class ComputeStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);

        const userData = ec2.UserData.forLinux({ shebang: "#!/bin/bash" });
        userData.addCommands("yum -y update", "yum -y install nginx", "systemctl enable nginx", "systemctl start nginx");
        for (let privateSubnet of props.vpc.privateSubnets) {
            new ec2.CfnInstance(this, "WebServer", {
                instanceType: ec2.InstanceSize.NANO,
                keyName: this.node.tryGetContext("key"),
                subnetId: privateSubnet.subnetId,
                securityGroupIds: [props.internalSG.securityGroupId],
                tags: [
                    {
                        key: "Name",
                        value: "Web-${privateSubnet.availabilityZone}"
                    }
                ],
                userData: cdk.Fn.base64(userData.render())
            });
        }
    }
}
