import cdk = require("@aws-cdk/core");
import ec2 = require("@aws-cdk/aws-ec2");
import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");

interface ComputeStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class ComputeStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);

        const internalSG = new ec2.SecurityGroup(this, "InternalSG", {
            allowAllOutbound: true,
            securityGroupName: "Internal Security Group",
            vpc: props.vpc
        });
        internalSG.addIngressRule(internalSG, ec2.Port.allTraffic());
        internalSG.node.applyAspect(new cdk.Tag("Name", "Example-Internal"));

        const userData = ec2.UserData.forLinux({ shebang: "#!/bin/bash" });
        userData.addCommands(
            "amazon-linux-extras install -y nginx1.12",
            "systemctl enable nginx",
            "systemctl start nginx"
        );

        const targets: elbv2.IApplicationLoadBalancerTarget[] = [];
        for (let privateSubnet of props.vpc.privateSubnets) {
            const instance = new ec2.CfnInstance(this, `WebInstance-${privateSubnet.node.id}`, {
                imageId: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }).getImage(this).imageId,
                instanceType: ec2.InstanceType.of(
                    ec2.InstanceClass.T3,
                    this.node.tryGetContext("env") === "production" ? ec2.InstanceSize.MEDIUM : ec2.InstanceSize.NANO
                ).toString(),
                keyName: this.node.tryGetContext("key"),
                subnetId: privateSubnet.subnetId,
                securityGroupIds: [internalSG.securityGroupId],
                tags: [
                    {
                        key: "Name",
                        value: `Example-Web-${privateSubnet.availabilityZone}`
                    }
                ],
                userData: cdk.Fn.base64(userData.render())
            });
            targets.push(new elbv2.InstanceTarget(instance.ref.toString()));
        }

        const alb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
            vpc: props.vpc,
            internetFacing: true,
            loadBalancerName: "Example-Alb"
        });
        alb.addListener("Listener", {
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            open: true,
            defaultTargetGroups: [
                new elbv2.ApplicationTargetGroup(this, "TargetGroup", {
                    vpc: props.vpc,
                    port: 80,
                    protocol: elbv2.ApplicationProtocol.HTTP,
                    healthCheck: {
                        path: "/index.html",
                        port: "80",
                        protocol: elbv2.Protocol.HTTP
                    },
                    targetGroupName: "Example-Web-TargetGroup",
                    targets: targets
                })
            ]
        });
        const albSG = ec2.SecurityGroup.fromSecurityGroupId(this, "AlbSG", cdk.Fn.select(0, alb.loadBalancerSecurityGroups));
        albSG.addEgressRule(internalSG, ec2.Port.tcp(80), "Allow outbound traffic to instances on the health check port");
        internalSG.addIngressRule(albSG, ec2.Port.tcp(80), "Allow inbound traffic to instances on the health check port");
    }
}
