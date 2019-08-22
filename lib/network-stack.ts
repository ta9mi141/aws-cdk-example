import cdk = require("@aws-cdk/core");
import ec2 = require("@aws-cdk/aws-ec2");

export class NetworkStack extends cdk.Stack {
    readonly vpc: ec2.Vpc;
    readonly internetFacingSG: ec2.SecurityGroup;
    readonly internalSG: ec2.SecurityGroup;
    readonly cidr: string = "10.0.0.0/16";

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, "Vpc", {
            cidr: this.cidr,
            subnetConfiguration: [
                {
                    name: "Example-Public",
                    cidrMask: 24,
                    subnetType: ec2.SubnetType.PUBLIC
                },
                {
                    name: "Example-Private",
                    cidrMask: 24,
                    subnetType: ec2.SubnetType.PRIVATE
                }
            ]
        });

        this.vpc.node.applyAspect(new cdk.Tag("Name", "Example-Vpc"));
        for (let subnet of this.vpc.publicSubnets) {
            subnet.node.applyAspect(new cdk.Tag("Name", `${subnet.node.id.replace(/Subnet[0-9]$/, "")}-${subnet.availabilityZone}`));
        }
        for (let subnet of this.vpc.privateSubnets) {
            subnet.node.applyAspect(new cdk.Tag("Name", `${subnet.node.id.replace(/Subnet[0-9]$/, "")}-${subnet.availabilityZone}`));
        }

        this.internetFacingSG = new ec2.SecurityGroup(this, "InternetFacingSG", {
            allowAllOutbound: true,
            securityGroupName: "Internet-facing Security Group",
            vpc: this.vpc
        });
        this.internetFacingSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow inbound HTTP access from all IPv4 addresses");
        this.internetFacingSG.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), "Allow inbound HTTP access from all IPv6 addresses");
        this.internetFacingSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow inbound HTTPS access from all IPv4 addresses");
        this.internetFacingSG.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), "Allow inbound HTTPS access from all IPv6 addresses");
        this.internetFacingSG.node.applyAspect(new cdk.Tag("Name", "Example-Internet-facing"));

        this.internalSG = new ec2.SecurityGroup(this, "InternalSG", {
            allowAllOutbound: true,
            securityGroupName: "Internal Security Group",
            vpc: this.vpc
        });
        this.internalSG.addIngressRule(this.internalSG, ec2.Port.allTraffic());
        this.internalSG.node.applyAspect(new cdk.Tag("Name", "Example-Internal"));
    }
}
