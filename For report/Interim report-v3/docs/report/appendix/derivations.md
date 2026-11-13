---
title: "Appendix: Derivations"
description: "Derivations referred to from the design chapters."
owner: "Takeuchi Asuka"
---
# Appendix: Derivations

<!-- #region i -->
The motion ratio relates the stiffness felt at the wheel to the stiffness of the spring, because the spring is installed at an angle θ to the vertical. This appendix shows that the wheel rate is K<sub>w</sub> = K<sub>s</sub> cos²θ, which gives a motion ratio of 0.821 for the installation angle of 25° used in Section 4.2.2. Figure I.1 shows the geometry.

<Figure src="../members/asuka/assets/diagrams/suspension-motion-ratio-proof.svg" alt="Motion ratio geometry: the spring displacement is the component of the wheel displacement along the spring axis, and the wheel force is the vertical component of the spring force" style="max-width: 760px; margin: 28px auto;" caption="Figure I.1: Displacement geometry and force balance for a spring installed at angle θ to the vertical." />

A force at the wheel compresses the spring along its own axis. The wheel force and the spring force are:

$$F_{wheel} = K_w\,\Delta z_{wheel} \qquad (1)$$

$$F_{spring} = K_s\,\Delta z_{spring} \qquad (2)$$

Only the vertical component of the spring force acts at the wheel, so:

$$F_{wheel} = F_{spring}\cos\theta \qquad (3)$$

Substituting (1) and (2) into (3) gives:

$$K_w\,\Delta z_{wheel} = K_s\,\Delta z_{spring}\cos\theta$$

By the displacement geometry, the spring displacement is the component of the wheel displacement along the spring axis:

$$\Delta z_{spring} = \Delta z_{wheel}\cos\theta \qquad (4)$$

Substituting (4) gives:

$$K_w\,\Delta z_{wheel} = K_s\,(\Delta z_{wheel}\cos\theta)(\cos\theta)$$

$$K_w = K_s\cos^2\theta$$

For θ = 25°, cos²25° = 0.821, so K<sub>w</sub> = K<sub>s</sub> × 0.821, as used in Table 4.2.2.3. The derivation assumes that the angle θ stays constant over the travel of the suspension, which holds for the small displacements involved.
<!-- #endregion i -->
