---
title: "Power Distribution"
owner: "Bryan Ng"
outline: [2,3]
---
# Power Distribution

[← Back to Electrical Subsystem](../../report.md#electrical)

<!-- #region report -->

## 4.2.2 Power Distribution & Electrical Protection

The FOD Hunter uses a nominal 48 V LiFePO₄ battery bus to supply the drivetrain, vacuum system and DC-DC converters. The distribution design combines a master battery protection and isolation path with separately protected high-current and low-voltage branches.

<CardGrid :cols="2">

<Card>

Primary Power Bus

48 V LiFePO₄ battery

</Card>

<Card>

Master Protection

100 A BMS, fuse and kill switch

</Card>

</CardGrid>

## Distribution Architecture

The battery output passes through the battery management system, the main fuse and the manual kill switch before reaching the 48 V distribution bus. From there, protected branches supply the motor driver, vacuum and DC-DC converters. The converters provide separate low-voltage rails for the onboard computer, auxiliary equipment and control electronics.

<Card>

<Figure src="../../../shared/assets/diagrams/electrical-diagram.svg" alt="FOD Hunter electrical power distribution and wiring diagram" />

</Card>

| Distribution stage | Components / supply | Purpose |
| --- | --- | --- |
| **Battery and master isolation** | 48 V 20 Ah LiFePO₄ battery, 100 A BMS, 100 A main fuse and 100 A kill switch | Stores energy, monitors battery conditions, protects the main output and provides manual isolation. |
| **48 V distribution** | XT60 power distribution board and branch fuse enclosure | Routes battery power to the high-current loads and converter inputs. |
| **Traction branch** | ZLAC8015D dual-channel motor driver and two 48 V hub motors | Supplies and controls the drivetrain. |
| **Vacuum branch** | 48 V industrial vacuum | Supplies the FOD collection system. |
| **Regulated branches** | 48 V-to-20 V, 48 V-to-12 V and 48 V-to-5 V DC-DC converters | Provides lower-voltage supplies for computing, auxiliary equipment and logic. |

## Branch Protection & Isolation

The 100 A main fuse protects the battery output wiring against a high-current fault, and the 100 A kill switch provides a manual means of isolating the system. The BMS provides battery-level protection and monitoring. Downstream circuits use branch fuses; the design inventory includes ANM fuses for high-current branches and automotive blade fuses for converter and auxiliary circuits.

| Protection element | Documented rating / type | Intended role |
| --- | --- | --- |
| **Battery management system** | 100 A BMS | Battery monitoring and internal cell protection. |
| **Main fuse** | 100 A, 8 AWG main circuit | Protects the main battery output circuit. |
| **Kill switch** | 100 A | Manual isolation of the vehicle power bus. |
| **High-current branch fuses** | 50 A ANM fuses | Branch protection for high-current loads. Confirm final branch assignments and ratings against measured load and startup current. |
| **Low-voltage branch fuses** | 10 A and 15 A automotive blade fuses | Protects the converter-fed computer, auxiliary and logic circuits; confirm each fuse against its wiring and load. |

## Low-Voltage Rails

DC-DC converters step down the 48 V bus so lower-voltage equipment does not connect directly to the traction supply. Separate rails are specified for the onboard computer, 12 V auxiliary loads and 5 V control and sensor electronics.

| Converter output | Documented loads |
| --- | --- |
| **20 V** | Onboard laptop / compute system. |
| **12 V** | Ethernet switch, cooling fans, headlights and indicator light tower. |
| **5 V** | STM32, UM980 GPS, CAN transceiver and compatible peripherals. |

The low-voltage branches are distributed through a blade-fuse block. Each converter and branch must be wired and fused for its actual input current, output current and conductor rating.

## Wiring & Verification

The component inventory specifies 8 AWG for the main battery loop, 12 AWG for the motor-driver leads, 16–18 AWG for converter and auxiliary power, and 20–22 AWG shielded twisted pair for communications and low-current signals. Final conductor and fuse selection must be checked against the installed wire length, routing, insulation temperature rating, connector ratings and measured continuous and startup currents.

In particular, the stated 50 A ANM branch fuse rating should be checked against the vacuum's documented operating and startup current before the vacuum branch is energized. The available load budget estimates 58.33 A for a 2800 W load at 48 V, so the fuse, wiring, connectors and load specification require reconciliation before confirming the final branch protection.

<!-- #endregion report -->
