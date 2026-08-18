#!/usr/bin/env python3
"""
Generate a clean hand-crafted occupancy grid map for the runway world.

Runway dimensions (from runway.sdf):
  Length:  100 m  (X axis, robot drives in +X direction)
  Width:    20 m  (Y axis, centred at Y=0)

Map layout:
  - FREE  (white, 254): inside the runway surface
  - WALL  (black,   0): 1-cell border around the runway edges
  - UNKNOWN (grey, 205): 2m margin beyond the walls (for costmap edge behaviour)

Robot spawns at world (0, 0), which should land in free space near the
left end of the runway.
"""

import struct
import os

# ── Tuneable parameters ────────────────────────────────────────────────────────
RESOLUTION   = 0.05          # metres per pixel
RUNWAY_LEN   = 100.0         # metres (X)
RUNWAY_WID   = 20.0          # metres (Y, centred on Y=0)
MARGIN       = 2.0           # grey unknown border beyond walls (metres)
WALL         = 1             # wall thickness in pixels
# ──────────────────────────────────────────────────────────────────────────────

FREE    = 254
WALL_V  = 0
UNKNOWN = 205

# Map spans: X: [-MARGIN, RUNWAY_LEN+MARGIN],  Y: [-RUNWAY_WID/2-MARGIN, +RUNWAY_WID/2+MARGIN]
origin_x = -MARGIN
origin_y = -(RUNWAY_WID / 2 + MARGIN)

map_width_m  = RUNWAY_LEN + 2 * MARGIN
map_height_m = RUNWAY_WID + 2 * MARGIN

W = int(round(map_width_m  / RESOLUTION))   # pixel columns
H = int(round(map_height_m / RESOLUTION))   # pixel rows

print(f"Map size: {W} × {H} pixels  ({map_width_m:.1f} m × {map_height_m:.1f} m)")
print(f"Origin (bottom-left): ({origin_x}, {origin_y})")

# Initialise to UNKNOWN
grid = bytearray([UNKNOWN] * (W * H))

def cell(col, row):
    return row * W + col

def world_to_pixel(wx, wy):
    """Convert world coordinates to pixel (col, row). Row 0 = top of image (max Y)."""
    col = int((wx - origin_x) / RESOLUTION)
    row = H - 1 - int((wy - origin_y) / RESOLUTION)
    return col, row

# Runway boundary in pixel space
# Runway: X [0, RUNWAY_LEN],  Y [-RUNWAY_WID/2, +RUNWAY_WID/2]
px_run_x0, _ = world_to_pixel(0.0,           0.0)
px_run_x1, _ = world_to_pixel(RUNWAY_LEN,    0.0)
_, px_run_y1  = world_to_pixel(0.0,           RUNWAY_WID / 2)    # row for top edge (min row)
_, px_run_y0  = world_to_pixel(0.0,          -RUNWAY_WID / 2)    # row for bottom edge (max row)

# Fill interior of runway with FREE
for row in range(px_run_y1 + WALL, px_run_y0 - WALL + 1):
    for col in range(px_run_x0 + WALL, px_run_x1 - WALL + 1):
        if 0 <= row < H and 0 <= col < W:
            grid[cell(col, row)] = FREE

# Draw WALL border around runway edges
for row in range(px_run_y1, px_run_y0 + 1):
    for w in range(WALL):
        # Left wall
        c = px_run_x0 + w
        if 0 <= c < W and 0 <= row < H:
            grid[cell(c, row)] = WALL_V
        # Right wall
        c = px_run_x1 - w
        if 0 <= c < W and 0 <= row < H:
            grid[cell(c, row)] = WALL_V

for col in range(px_run_x0, px_run_x1 + 1):
    for w in range(WALL):
        # Top wall
        r = px_run_y1 + w
        if 0 <= r < H and 0 <= col < W:
            grid[cell(col, r)] = WALL_V
        # Bottom wall
        r = px_run_y0 - w
        if 0 <= r < H and 0 <= col < W:
            grid[cell(col, r)] = WALL_V

# ── Write PGM (binary P5) ─────────────────────────────────────────────────────
script_dir = os.path.dirname(os.path.abspath(__file__))
pgm_path  = os.path.join(script_dir, "runway_map.pgm")
yaml_path = os.path.join(script_dir, "runway_map.yaml")

with open(pgm_path, "wb") as f:
    header = f"P5\n{W} {H}\n255\n".encode()
    f.write(header)
    f.write(bytes(grid))

print(f"Written: {pgm_path}")

# ── Write map YAML ─────────────────────────────────────────────────────────────
yaml_content = f"""\
image: {pgm_path}
mode: trinary
resolution: {RESOLUTION}
origin: [{origin_x}, {origin_y}, 0.0]
negate: 0
occupied_thresh: 0.65
free_thresh: 0.196
"""

with open(yaml_path, "w") as f:
    f.write(yaml_content)

print(f"Written: {yaml_path}")
print("\nDone! Rebuild the package to install the new map.")
