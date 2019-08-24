import cdk = require("@aws-cdk/core");
import ec2 = require("@aws-cdk/aws-ec2");

export class NetworkStack extends cdk.Stack {
    readonly vpc: ec2.Vpc;
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
    }
}
