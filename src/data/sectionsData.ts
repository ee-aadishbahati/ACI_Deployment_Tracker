import { Section, Task } from '../types';
import { testCasesMapping } from './testCasesData';

function createTaskWithTestCase(text: string, fabricSpecific: boolean = true, ndoCentralized: boolean = false): Task {
  const testCase = testCasesMapping[text];
  
  const createDeterministicId = (text: string): string => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `task-${Math.abs(hash).toString(36)}`;
  };
  
  return {
    id: createDeterministicId(text),
    text,
    checked: false,
    notes: '',
    testCase,
    fabricSpecific,
    ndoCentralized,
    addedToSubChecklist: false
  };
}

export const sectionsData: Section[] = [
  {
    id: "section1",
    title: "1. Multi-Site Pre-Deployment Planning",
    expanded: true,
    subsections: [
      {
        title: "Non-Technical Tasks",
        tasks: [
          createTaskWithTestCase("Define project scope and objectives for multi-site ACI deployment", false),
          createTaskWithTestCase("Establish project timeline and milestones", false),
          createTaskWithTestCase("Identify stakeholders and communication plan", false),
          createTaskWithTestCase("Determine budget and resource allocation", false),
          createTaskWithTestCase("Establish change management procedures", false),
          createTaskWithTestCase("Define success criteria and acceptance testing", false),
          createTaskWithTestCase("Create risk assessment and mitigation plan", false),
          createTaskWithTestCase("Establish project governance and decision-making process", false),
          createTaskWithTestCase("Define roles and responsibilities for each site", false),
          createTaskWithTestCase("Create communication protocols between sites", false),
          createTaskWithTestCase("Establish escalation procedures", false),
          createTaskWithTestCase("Define maintenance windows and coordination", false),
          createTaskWithTestCase("Create disaster recovery and business continuity plan", false),
          createTaskWithTestCase("Establish security and compliance requirements", false),
          createTaskWithTestCase("Define documentation standards and requirements", false),
          createTaskWithTestCase("Create training plan for operations teams", false),
          createTaskWithTestCase("Establish vendor management and support procedures", false),
          createTaskWithTestCase("Define performance monitoring and reporting requirements", false),
          createTaskWithTestCase("Create handover procedures to operations teams", false),
          createTaskWithTestCase("Establish ongoing support and maintenance procedures", false)
        ]
      },
      {
        title: "Technical Planning",
        tasks: [
          createTaskWithTestCase("Conduct detailed site surveys for all locations", true),
          createTaskWithTestCase("Design multi-site ACI fabric architecture", false),
          createTaskWithTestCase("Plan IP addressing scheme for all sites", false),
          createTaskWithTestCase("Design VLAN and VRF strategy across sites", false),
          createTaskWithTestCase("Plan inter-site connectivity requirements", false),
          createTaskWithTestCase("Design security policies and segmentation", false),
          createTaskWithTestCase("Plan QoS policies and traffic engineering", false),
          createTaskWithTestCase("Design monitoring and logging strategy", false),
          createTaskWithTestCase("Plan backup and restore procedures", false),
          createTaskWithTestCase("Design high availability and redundancy", false),
          createTaskWithTestCase("Plan capacity and scalability requirements", false),
          createTaskWithTestCase("Design integration with existing infrastructure", false),
          createTaskWithTestCase("Plan migration strategy from existing network", false),
          createTaskWithTestCase("Design testing and validation procedures", false),
          createTaskWithTestCase("Create detailed implementation plan", false),
          createTaskWithTestCase("Design rollback procedures", false),
          createTaskWithTestCase("Plan software and firmware versions", false),
          createTaskWithTestCase("Design configuration templates and standards", false),
          createTaskWithTestCase("Plan automation and orchestration requirements", false),
          createTaskWithTestCase("Create detailed network diagrams and documentation", false)
        ]
      }
    ]
  },
  {
    id: "section2", 
    title: "2. Site-Specific Infrastructure Preparation",
    subsections: [
      {
        title: "Physical Infrastructure",
        tasks: [
          createTaskWithTestCase("Verify rack space and mounting requirements at each site", true),
          createTaskWithTestCase("Confirm power requirements and availability at each site", true),
          createTaskWithTestCase("Verify cooling requirements and HVAC capacity at each site", true),
          createTaskWithTestCase("Check physical security measures at each site", true),
          createTaskWithTestCase("Verify cable management and pathways at each site", true),
          createTaskWithTestCase("Confirm environmental monitoring at each site", true),
          createTaskWithTestCase("Verify fire suppression systems at each site", true),
          createTaskWithTestCase("Check access control and badge requirements at each site", true),
          createTaskWithTestCase("Verify maintenance access and procedures at each site", true),
          createTaskWithTestCase("Confirm emergency procedures at each site", true)
        ]
      },
      {
        title: "Hardware Installation", 
        tasks: [
          createTaskWithTestCase("Install APIC controllers at each site", true),
          createTaskWithTestCase("Install spine switches at each site", true),
          createTaskWithTestCase("Install leaf switches at each site", true),
          createTaskWithTestCase("Install border leaf switches for inter-site connectivity", true),
          createTaskWithTestCase("Install console servers at each site", true),
          createTaskWithTestCase("Install out-of-band management switches at each site", true),
          createTaskWithTestCase("Connect power cables and verify power status", true),
          createTaskWithTestCase("Connect console cables for out-of-band access", true),
          createTaskWithTestCase("Connect management network cables", true),
          createTaskWithTestCase("Label all cables and ports according to standards", true),
          createTaskWithTestCase("Verify all hardware is properly seated and secured", true),
          createTaskWithTestCase("Document serial numbers and asset tags", true),
          createTaskWithTestCase("Verify hardware warranty and support coverage", true),
          createTaskWithTestCase("Create hardware inventory documentation", true),
          createTaskWithTestCase("Verify hardware meets design specifications", true)
        ]
      }
    ]
  },
  {
    id: "section3",
    title: "3. Individual Fabric Deployment", 
    subsections: [
      {
        title: "Initial Fabric Setup",
        tasks: [
          createTaskWithTestCase("Connect to APIC console port and verify connectivity", true),
          createTaskWithTestCase("Perform initial setup script on first APIC at each site", true),
          createTaskWithTestCase("Configure admin credentials following security standards", true),
          createTaskWithTestCase("Set management IP address, subnet mask, and gateway", true),
          createTaskWithTestCase("Configure DNS and NTP settings", true),
          createTaskWithTestCase("Set up fabric name and fabric ID for each site", true),
          createTaskWithTestCase("Configure TEP pool address range for each fabric", true),
          createTaskWithTestCase("Set up infrastructure VLAN for each fabric", true),
          createTaskWithTestCase("Configure multicast address pool", true),
          createTaskWithTestCase("Verify APIC GUI access via HTTPS", true),
          createTaskWithTestCase("Update APIC software to target version (if required)", true),
          createTaskWithTestCase("Configure APIC cluster (for multi-APIC deployments)", true),
          createTaskWithTestCase("Verify cluster formation and health", true),
          createTaskWithTestCase("Register leaf switches to the fabric", true),
          createTaskWithTestCase("Register spine switches to the fabric", true),
          createTaskWithTestCase("Verify switch registration status in APIC", true),
          createTaskWithTestCase("Confirm TEP address assignment to switches", true),
          createTaskWithTestCase("Verify fabric node topology in APIC GUI", true),
          createTaskWithTestCase("Update switch software to target version (if required)", true),
          createTaskWithTestCase("Verify switch control plane connectivity", true)
        ]
      }
    ]
  },
  {
    id: "section4",
    title: "4. Nexus Dashboard Orchestrator (NDO) Deployment",
    subsections: [
      {
        title: "Nexus Dashboard Deployment (Tertiary Site)",
        tasks: [
          createTaskWithTestCase("Verify hardware requirements for Nexus Dashboard", false, true),
          createTaskWithTestCase("Install and configure Nexus Dashboard cluster", false, true),
          createTaskWithTestCase("Configure Nexus Dashboard networking (management, cluster, data)", false, true),
          createTaskWithTestCase("Set up Nexus Dashboard authentication and user management", false, true),
          createTaskWithTestCase("Install NDO application on Nexus Dashboard", false, true),
          createTaskWithTestCase("Configure Nexus Dashboard high availability", false, true),
          createTaskWithTestCase("Set up Nexus Dashboard backup and restore procedures", false, true),
          createTaskWithTestCase("Configure Nexus Dashboard monitoring and alerting", false, true),
          createTaskWithTestCase("Verify Nexus Dashboard health and status", false, true),
          createTaskWithTestCase("Update Nexus Dashboard software to recommended version", false, true)
        ]
      },
      {
        title: "NDO Configuration (Centralized Management)",
        tasks: [
          createTaskWithTestCase("Configure NDO system settings (backup, logging, etc.)", false, true),
          createTaskWithTestCase("Add and register ACI sites to NDO", false, true),
          createTaskWithTestCase("Configure site connectivity and inter-site networking", false, true),
          createTaskWithTestCase("Set up NDO backup and restore procedures", false, true),
          createTaskWithTestCase("Configure NDO monitoring and alerting", false, true),
          createTaskWithTestCase("Verify NDO health and operational status", false, true),
          createTaskWithTestCase("Configure NDO user access and permissions", false, true),
          createTaskWithTestCase("Set up NDO logging and audit trails", false, true),
          createTaskWithTestCase("Configure NDO integration with external systems", false, true),
          createTaskWithTestCase("Test NDO failover and recovery procedures", false, true)
        ]
      }
    ]
  },
  {
    id: "section5",
    title: "5. Multi-Site Policy Configuration",
    subsections: [
      {
        title: "Network Configuration",
        tasks: [
          createTaskWithTestCase("Create interface policies (CDP, LLDP, link speed) for each site", true),
          createTaskWithTestCase("Configure switch policies for each site", true),
          createTaskWithTestCase("Set up VLAN pools with multi-site considerations", true),
          createTaskWithTestCase("Configure physical domains for each site", true),
          createTaskWithTestCase("Set up VMM domains with multi-site considerations (if integrating with virtualization)", true),
          createTaskWithTestCase("Create AEP (Attachable Entity Profiles) for each site", true),
          createTaskWithTestCase("Configure interface policy groups for each site", true),
          createTaskWithTestCase("Set up interface profiles for each site", true),
          createTaskWithTestCase("Create switch profiles for each site", true),
          createTaskWithTestCase("Configure border leaf switches for inter-site connectivity", true)
        ]
      }
    ]
  },
  {
    id: "section6",
    title: "6. External Connectivity & Integration",
    subsections: [
      {
        title: "External System Integration",
        tasks: [
          createTaskWithTestCase("Configure external firewall integration", true),
          createTaskWithTestCase("Configure load balancer integration", true),
          createTaskWithTestCase("Set up external routing (BGP/OSPF/EIGRP)", true),
          createTaskWithTestCase("Configure external network connectivity", true),
          createTaskWithTestCase("Set up external monitoring integration", true),
          createTaskWithTestCase("Configure external authentication integration", true),
          createTaskWithTestCase("Set up external logging integration", true),
          createTaskWithTestCase("Configure external backup integration", true),
          createTaskWithTestCase("Test external system connectivity", true),
          createTaskWithTestCase("Verify external system functionality", true)
        ]
      }
    ]
  },
  {
    id: "section7", 
    title: "7. Testing & Validation",
    subsections: [
      {
        title: "Connectivity Testing",
        tasks: [
          createTaskWithTestCase("Test inter-site control plane connectivity", false),
          createTaskWithTestCase("Test inter-site data plane connectivity", false),
          createTaskWithTestCase("Verify stretched VRF functionality across sites", false),
          createTaskWithTestCase("Test stretched Bridge Domain functionality", false),
          createTaskWithTestCase("Verify L3Out connectivity from each site", true),
          createTaskWithTestCase("Test external connectivity through each site", true),
          createTaskWithTestCase("Verify policy deployment consistency across sites", false),
          createTaskWithTestCase("Test inter-site security policy enforcement", false),
          createTaskWithTestCase("Verify QoS policy enforcement across sites", false),
          createTaskWithTestCase("Test multicast functionality across sites (if applicable)", false)
        ]
      },
      {
        title: "Failure and Recovery Testing",
        tasks: [
          createTaskWithTestCase("Test APIC controller failure and recovery at each site", true),
          createTaskWithTestCase("Verify spine switch failure and recovery at each site", true),
          createTaskWithTestCase("Test leaf switch failure and recovery at each site", true),
          createTaskWithTestCase("Verify border leaf switch failure and recovery at each site", true),
          createTaskWithTestCase("Test inter-site link failure and recovery", false),
          createTaskWithTestCase("Verify NDO failure and recovery", false, true),
          createTaskWithTestCase("Test Nexus Dashboard failure and recovery", false, true),
          createTaskWithTestCase("Verify site isolation and recovery", true),
          createTaskWithTestCase("Test partial site failure and recovery", true),
          createTaskWithTestCase("Verify complete site failure and recovery", true)
        ]
      }
    ]
  },
  {
    id: "section8",
    title: "8. Documentation & Handover",
    subsections: [
      {
        title: "Documentation",
        tasks: [
          createTaskWithTestCase("Create comprehensive network documentation", false),
          createTaskWithTestCase("Document all configurations and policies", false),
          createTaskWithTestCase("Create operational procedures and runbooks", false),
          createTaskWithTestCase("Document troubleshooting procedures", false),
          createTaskWithTestCase("Create disaster recovery procedures", false),
          createTaskWithTestCase("Document backup and restore procedures", false),
          createTaskWithTestCase("Create monitoring and alerting documentation", false),
          createTaskWithTestCase("Document security policies and procedures", false),
          createTaskWithTestCase("Create change management procedures", false),
          createTaskWithTestCase("Document maintenance procedures", false)
        ]
      },
      {
        title: "Handover",
        tasks: [
          createTaskWithTestCase("Conduct knowledge transfer sessions", false),
          createTaskWithTestCase("Provide operational training", false),
          createTaskWithTestCase("Establish ongoing support procedures", false),
          createTaskWithTestCase("Create escalation procedures", false),
          createTaskWithTestCase("Document vendor support contacts", false),
          createTaskWithTestCase("Establish monitoring and alerting", false),
          createTaskWithTestCase("Create performance baselines", false),
          createTaskWithTestCase("Establish capacity planning procedures", false),
          createTaskWithTestCase("Create security monitoring procedures", false),
          createTaskWithTestCase("Finalize project closure activities", false)
        ]
      }
    ]
  }
];
