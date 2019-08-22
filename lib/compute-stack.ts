import cdk = require("@aws-cdk/core");
import ec2 = require("@aws-cdk/aws-ec2");
import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");

interface ComputeStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    internalSG: ec2.SecurityGroup;
}

export class ComputeStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);

        const alb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
            vpc: props.vpc,
            internetFacing: true,
            loadBalancerName: "Example-Alb"
        });
        const listener = alb.addListener("Listener", {
            port: 80,
            open: true
        });

        const userData = ec2.UserData.forLinux({ shebang: "#!/bin/bash" });
        userData.addCommands("yum -y update", "yum -y install nginx", "systemctl enable nginx", "systemctl start nginx");
        for (let privateSubnet of props.vpc.privateSubnets) {
            const instance = new ec2.CfnInstance(this, `WebInstance-${privateSubnet.node.id}`, {
                instanceType: ec2.InstanceSize.NANO,
                keyName: this.node.tryGetContext("key"),
                subnetId: privateSubnet.subnetId,
                securityGroupIds: [props.internalSG.securityGroupId],
                tags: [
                    {
                        key: "Name",
                        value: "Example-Web-${privateSubnet.availabilityZone}"
                    }
                ],
                userData: cdk.Fn.base64(userData.render())
            });
            listener.addTargets(`Target-${privateSubnet.node.id}`, {
                port: 80,
                targets: [new elbv2.InstanceTarget(instance.ref.toString())]
            });
        }
    }
}
