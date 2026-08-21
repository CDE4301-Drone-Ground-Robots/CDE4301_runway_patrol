#!/usr/bin/env python3
"""
Generate a clean, high-resolution occupancy grid map for the Airport Runway.

Runway operating area:
  X: [-100.0, 200.0] m (300 m along runway)
  Y: [-100.0, 100.0] m (200 m cross-runway)

Runway centerline is at Y = 0.0.
Runway boundaries:
  Heading slope: -605 / 2615 ≈ -0.23135
  North grass boundary: Y_north(X) = +34.0 - 0.23135 * X
  South grass boundary: Y_south(X) = -34.0 - 0.23135 * X
"""

import os
import numpy as np

RESOLUTION = 0.10  # 0.10 m per pixel
X_MIN = -100.0
X_MAX = 200.0
Y_MIN = -100.0
Y_MAX = 100.0

W_m = X_MAX - X_MIN
H_m = Y_MAX - Y_MIN

W = int(round(W_m / RESOLUTION))
H = int(round(H_m / RESOLUTION))

print(f"Generating airport runway map: {W} x {H} pixels ({W_m} m x {H_m} m) at {RESOLUTION} m/px")

FREE = 254
OCCUPIED = 0
SLOPE = -605.0 / 2615.0

# Initialize with OCCUPIED (0 / black) for grass keepout
grid = np.zeros((H, W), dtype=np.uint8)

for r in range(H):
    # Image row 0 is top (Y_MAX), row H-1 is bottom (Y_MIN)
    y_world = Y_MAX - (r + 0.5) * RESOLUTION
    for c in range(W):
        x_world = X_MIN + (c + 0.5) * RESOLUTION

        y_north = 34.0 + SLOPE * x_world
        y_south = -34.0 + SLOPE * x_world

        # Inside asphalt runway
        if (y_south + 0.5) <= y_world <= (y_north - 0.5):
            grid[r, c] = FREE
        else:
            grid[r, c] = OCCUPIED

# Boundary edge markers along the runway perimeter
for x_m in np.arange(X_MIN, X_MAX, 10.0):
    for y_m in [34.0 + SLOPE * x_m, -34.0 + SLOPE * x_m]:
        r_c = int((Y_MAX - y_m) / RESOLUTION)
        c_c = int((x_m - X_MIN) / RESOLUTION)
        for dr in range(-1, 2):
            for dc in range(-1, 2):
                if 0 <= r_c + dr < H and 0 <= c_c + dc < W:
                    grid[r_c + dr, c_c + dc] = OCCUPIED

script_dir = os.path.dirname(os.path.abspath(__file__))
pgm_path = os.path.join(script_dir, "runway_map.pgm")
yaml_path = os.path.join(script_dir, "runway_map.yaml")

with open(pgm_path, "wb") as f:
    header = f"P5\n{W} {H}\n255\n".encode()
    f.write(header)
    f.write(grid.tobytes())

yaml_content = f"""image: runway_map.pgm
mode: trinary
resolution: {RESOLUTION}
origin: [{X_MIN}, {Y_MIN}, 0.0]
negate: 0
occupied_thresh: 0.65
free_thresh: 0.196
"""

with open(yaml_path, "w") as f:
    f.write(yaml_content)

print(f"Successfully wrote {pgm_path} and {yaml_path}")
