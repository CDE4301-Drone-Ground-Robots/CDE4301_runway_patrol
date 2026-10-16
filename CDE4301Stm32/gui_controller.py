import sys
import time
import math
import threading
import queue
import tkinter as tk
from tkinter import messagebox
import serial
import serial.tools.list_ports
import customtkinter as ctk

# ==============================================================================
# Theme & Color Definitions
# ==============================================================================
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

STATE_COLORS = {
    "DISENGAGE": {"bg": "#3A3D40", "border": "#6C757D", "text": "#E0E0E0"},
    "LOCK":      {"bg": "#1B4332", "border": "#2D6A4F", "text": "#D8F3DC"},
    "MOVEMENT":  {"bg": "#0D3B66", "border": "#1D4ED8", "text": "#E0F2FE"},
    "JERK":      {"bg": "#7C2D12", "border": "#EA580C", "text": "#FFEDD5"},
    "ERR":       {"bg": "#7F1D1D", "border": "#DC2626", "text": "#FEE2E2"},
    "OFFLINE":   {"bg": "#23272A", "border": "#4B5563", "text": "#9CA3AF"}
}

STATE_INFO = {
    "DISENGAGE": "Driver Coils OFF - Shaft Freewheeling (0x00)",
    "LOCK":      "Driver Active - Coils Energized, Shaft Locked at 0 RPM (0x08)",
    "MOVEMENT":  "Right Motor Spinning (Interactive GUI Teleoperation | Left = 0 RPM)",
    "JERK":      "Quick Stop Active - Emergency Deceleration Hold (0x05)",
    "ERR":       "Driver Hardware Alarm / Fault Active",
    "OFFLINE":   "Serial Port Disconnected"
}

SPEED_STEP_RPM = 50
MAX_SPEED_RPM = 350

# ==============================================================================
# Main GUI Application
# ==============================================================================
class STM32ControllerGUI(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("STM32 ZLAC8015D Motor Controller - Teleoperation Dashboard")
        self.geometry("980x920")
        self.minsize(880, 800)

        # Serial handling
        self.ser = None
        self.serial_thread = None
        self.running = False
        self.rx_queue = queue.Queue()

        # Telemetry & State
        self.current_state = "OFFLINE"
        self.current_speed_rpm = 0
        self.target_needle_angle = 0
        self.current_needle_angle = 0
        self.hardware_statusword = "0x0000"
        self.slider_active = False

        # Build UI layout
        self._build_ui()

        # Animation & serial polling loops
        self.after(30, self._process_rx_queue)
        self.after(20, self._animate_gauge)

    def _build_ui(self):
        # -------------------------------------------------------------
        # 1. Header & Connection Bar
        # -------------------------------------------------------------
        self.top_frame = ctk.CTkFrame(self, corner_radius=10)
        self.top_frame.pack(fill="x", padx=15, pady=(12, 6))

        title_lbl = ctk.CTkLabel(
            self.top_frame,
            text="ZLAC8015D Motor Controller",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_lbl.pack(side="left", padx=15, pady=8)

        # Port Dropdown & Refresh
        self.port_var = ctk.StringVar(value="")
        self.port_dropdown = ctk.CTkComboBox(self.top_frame, variable=self.port_var, width=180)
        self.port_dropdown.pack(side="left", padx=5, pady=8)

        self.refresh_btn = ctk.CTkButton(
            self.top_frame, text="↻", width=34, command=self._refresh_ports
        )
        self.refresh_btn.pack(side="left", padx=2, pady=8)

        # Baud Rate
        self.baud_var = ctk.StringVar(value="115200")
        baud_menu = ctk.CTkComboBox(self.top_frame, variable=self.baud_var, values=["115200", "9600", "57600"], width=95)
        baud_menu.pack(side="left", padx=5, pady=8)

        # Connect / Disconnect Button
        self.connect_btn = ctk.CTkButton(
            self.top_frame,
            text="Connect",
            command=self._toggle_connection,
            fg_color="#10B981",
            hover_color="#059669",
            width=110
        )
        self.connect_btn.pack(side="right", padx=15, pady=8)

        self._refresh_ports()

        # -------------------------------------------------------------
        # 2. Live State Indicator Banner
        # -------------------------------------------------------------
        self.state_card = ctk.CTkFrame(self, corner_radius=10, border_width=2)
        self.state_card.pack(fill="x", padx=15, pady=4)

        self.state_label = ctk.CTkLabel(
            self.state_card,
            text="STATE: OFFLINE",
            font=ctk.CTkFont(size=22, weight="bold")
        )
        self.state_label.pack(pady=(8, 1))

        self.state_detail_lbl = ctk.CTkLabel(
            self.state_card,
            text=STATE_INFO["OFFLINE"],
            font=ctk.CTkFont(size=12)
        )
        self.state_detail_lbl.pack(pady=(0, 2))

        self.feedback_lbl = ctk.CTkLabel(
            self.state_card,
            text="CAN Driver Feedback: None",
            font=ctk.CTkFont(size=11, slant="italic"),
            text_color="#9CA3AF"
        )
        self.feedback_lbl.pack(pady=(0, 6))

        # -------------------------------------------------------------
        # 3. Dual Motor Telemetry Dashboard & Speedometer
        # -------------------------------------------------------------
        self.dashboard_frame = ctk.CTkFrame(self, corner_radius=10)
        self.dashboard_frame.pack(fill="x", padx=15, pady=6)

        self.dashboard_frame.columnconfigure(0, weight=1)
        self.dashboard_frame.columnconfigure(1, weight=2)

        # --- Left Motor Box (Safety Locked at 0 RPM) ---
        left_box = ctk.CTkFrame(self.dashboard_frame, corner_radius=8, fg_color="#1F242D")
        left_box.grid(row=0, column=0, padx=12, pady=10, sticky="nsew")

        ctk.CTkLabel(
            left_box, text="LEFT MOTOR (WHEEL 1)",
            font=ctk.CTkFont(size=13, weight="bold"), text_color="#9CA3AF"
        ).pack(pady=(12, 4))

        ctk.CTkLabel(
            left_box, text="0",
            font=ctk.CTkFont(size=42, weight="bold"), text_color="#64748B"
        ).pack(pady=(2, 0))

        ctk.CTkLabel(
            left_box, text="RPM (LOCKED)",
            font=ctk.CTkFont(size=12, weight="bold"), text_color="#64748B"
        ).pack(pady=(0, 6))

        badge = ctk.CTkLabel(
            left_box, text="[UNMOUNTED / SAFETY HELD]",
            font=ctk.CTkFont(size=11), fg_color="#334155", corner_radius=6, padx=8, pady=3
        )
        badge.pack(pady=(4, 12))

        # --- Right Motor Speedometer Gauge ---
        right_box = ctk.CTkFrame(self.dashboard_frame, corner_radius=8, fg_color="#181B20")
        right_box.grid(row=0, column=1, padx=12, pady=10, sticky="nsew")

        gauge_header = ctk.CTkFrame(right_box, fg_color="transparent")
        gauge_header.pack(fill="x", padx=10, pady=(6, 0))

        ctk.CTkLabel(
            gauge_header, text="RIGHT MOTOR SPEEDOMETER",
            font=ctk.CTkFont(size=14, weight="bold"), text_color="#38BDF8"
        ).pack(side="left")

        self.speed_status_badge = ctk.CTkLabel(
            gauge_header, text="0 RPM (STOPPED)",
            font=ctk.CTkFont(size=12, weight="bold"), text_color="#10B981"
        )
        self.speed_status_badge.pack(side="right")

        # Analog Gauge Canvas
        self.canvas_width = 380
        self.canvas_height = 175
        self.gauge_canvas = tk.Canvas(
            right_box,
            width=self.canvas_width,
            height=self.canvas_height,
            bg="#181B20",
            highlightthickness=0
        )
        self.gauge_canvas.pack(pady=(2, 6))

        # -------------------------------------------------------------
        # 4. Interactive Speed Controller (GUI Teleoperation)
        # -------------------------------------------------------------
        self.speed_frame = ctk.CTkFrame(self, corner_radius=10)
        self.speed_frame.pack(fill="x", padx=15, pady=6)

        speed_hdr = ctk.CTkFrame(self.speed_frame, fg_color="transparent")
        speed_hdr.pack(fill="x", padx=14, pady=(8, 2))

        ctk.CTkLabel(
            speed_hdr,
            text="RIGHT MOTOR VELOCITY CONTROL (TELEOPERATION)",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(side="left")

        self.target_speed_lbl = ctk.CTkLabel(
            speed_hdr,
            text="Target: 0 RPM (Stopped)",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#10B981"
        )
        self.target_speed_lbl.pack(side="right")

        # Interactive Slider Row with Nudge Buttons
        slider_row = ctk.CTkFrame(self.speed_frame, fg_color="transparent")
        slider_row.pack(fill="x", padx=12, pady=(4, 6))

        self.btn_nudge_down = ctk.CTkButton(
            slider_row,
            text="◀ -50 RPM",
            width=90,
            height=32,
            fg_color="#1E293B",
            hover_color="#334155",
            command=lambda: self.nudge_speed(-SPEED_STEP_RPM)
        )
        self.btn_nudge_down.pack(side="left", padx=(0, 10))

        self.speed_slider = ctk.CTkSlider(
            slider_row,
            from_=-MAX_SPEED_RPM,
            to=MAX_SPEED_RPM,
            number_of_steps=70,  # 10 RPM per step
            command=self._on_slider_change,
            height=20,
            progress_color="#38BDF8",
            button_color="#0284C7",
            button_hover_color="#0369A1"
        )
        self.speed_slider.set(0)
        self.speed_slider.pack(side="left", fill="x", expand=True, padx=5)

        # Bind slider mouse interactions
        self.speed_slider.bind("<Button-1>", self._on_slider_pressed)
        self.speed_slider.bind("<ButtonRelease-1>", self._on_slider_released)

        self.btn_nudge_up = ctk.CTkButton(
            slider_row,
            text="+50 RPM ▶",
            width=90,
            height=32,
            fg_color="#1E293B",
            hover_color="#334155",
            command=lambda: self.nudge_speed(SPEED_STEP_RPM)
        )
        self.btn_nudge_up.pack(side="right", padx=(10, 0))

        # Quick Preset Buttons Row
        preset_row = ctk.CTkFrame(self.speed_frame, fg_color="transparent")
        preset_row.pack(fill="x", padx=12, pady=(0, 10))
        preset_row.columnconfigure((0, 1, 2, 3, 4, 5, 6), weight=1, uniform="preset_col")

        self.preset_buttons = []
        presets = [
            ("-200", -200, "#C2410C", "#9A3412"),
            ("-100", -100, "#EA580C", "#C2410C"),
            ("-50",   -50, "#F97316", "#EA580C"),
            ("0 (STOP)", 0, "#0F766E", "#115E59"),
            ("+50",    50, "#0284C7", "#0369A1"),
            ("+100",  100, "#2563EB", "#1D4ED8"),
            ("+200",  200, "#1D4ED8", "#1E40AF"),
        ]

        for col, (lbl, rpm, bg, hov) in enumerate(presets):
            btn = ctk.CTkButton(
                preset_row,
                text=lbl,
                height=28,
                fg_color=bg,
                hover_color=hov,
                font=ctk.CTkFont(size=12, weight="bold"),
                command=lambda r=rpm: self.set_speed_preset(r)
            )
            btn.grid(row=0, column=col, padx=3, pady=2, sticky="nsew")
            self.preset_buttons.append(btn)

        # -------------------------------------------------------------
        # 5. Machine State & Safety Actions
        # -------------------------------------------------------------
        self.control_frame = ctk.CTkFrame(self, corner_radius=10)
        self.control_frame.pack(fill="x", padx=15, pady=6)

        ctrl_title = ctk.CTkLabel(
            self.control_frame,
            text="MACHINE STATE & SAFETY ACTIONS",
            font=ctk.CTkFont(size=13, weight="bold")
        )
        ctrl_title.pack(pady=(8, 4))

        btn_grid = ctk.CTkFrame(self.control_frame, fg_color="transparent")
        btn_grid.pack(pady=(0, 10), padx=12, fill="x")
        btn_grid.columnconfigure((0, 1, 2, 3, 4), weight=1, uniform="ctrl_col")

        self.btn_engage = ctk.CTkButton(
            btn_grid, text="ENGAGE / LOCK\n(Hold 0 RPM)",
            command=lambda: self.send_command('R'),
            height=46, fg_color="#15803D", hover_color="#166534"
        )
        self.btn_engage.grid(row=0, column=0, padx=4, pady=4, sticky="nsew")

        self.btn_stop = ctk.CTkButton(
            btn_grid, text="STOP & HOLD\n(Ramp to 0 RPM)",
            command=lambda: self.send_command('0'),
            height=46, fg_color="#0F766E", hover_color="#115E59"
        )
        self.btn_stop.grid(row=0, column=1, padx=4, pady=4, sticky="nsew")

        self.btn_disengage = ctk.CTkButton(
            btn_grid, text="FREEWHEEL\n(Coils OFF 0x00)",
            command=lambda: self.send_command('D'),
            height=46, fg_color="#475569", hover_color="#334155"
        )
        self.btn_disengage.grid(row=0, column=2, padx=4, pady=4, sticky="nsew")

        self.btn_jerk = ctk.CTkButton(
            btn_grid, text="QUICK STOP\n(Emergency 0x05)",
            command=lambda: self.send_command('E'),
            height=46, fg_color="#C2410C", hover_color="#9A3412"
        )
        self.btn_jerk.grid(row=0, column=3, padx=4, pady=4, sticky="nsew")

        self.btn_clear = ctk.CTkButton(
            btn_grid, text="CLEAR ALARM\n(Reset Fault 0x80)",
            command=lambda: self.send_command('C'),
            height=46, fg_color="#991B1B", hover_color="#7F1D1D"
        )
        self.btn_clear.grid(row=0, column=4, padx=4, pady=4, sticky="nsew")

        # -------------------------------------------------------------
        # 6. Live Serial Monitor / Telemetry Feed
        # -------------------------------------------------------------
        self.term_frame = ctk.CTkFrame(self, corner_radius=10)
        self.term_frame.pack(fill="both", expand=True, padx=15, pady=(0, 12))

        term_header = ctk.CTkFrame(self.term_frame, fg_color="transparent")
        term_header.pack(fill="x", padx=10, pady=(6, 2))

        term_title = ctk.CTkLabel(
            term_header,
            text="Live Serial Monitor (STM32 CAN Feed)",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        term_title.pack(side="left")

        clear_btn = ctk.CTkButton(
            term_header, text="Clear Log", width=70, height=22,
            command=self._clear_log, fg_color="#374151"
        )
        clear_btn.pack(side="right", padx=(5, 0))

        sync_btn = ctk.CTkButton(
            term_header, text="Sync State [?]", width=90, height=22,
            command=lambda: self.send_command('?'), fg_color="#1F2937", hover_color="#374151"
        )
        sync_btn.pack(side="right")

        self.log_text = ctk.CTkTextbox(
            self.term_frame, font=ctk.CTkFont(family="Consolas", size=11), wrap="char"
        )
        self.log_text.pack(fill="both", expand=True, padx=10, pady=(0, 8))

        # Initial Render
        self._update_state_ui("OFFLINE")
        self._draw_speedometer(0)

    # ==========================================================================
    # Canvas Speedometer Drawing
    # ==========================================================================
    def _draw_speedometer(self, speed_rpm):
        c = self.gauge_canvas
        c.delete("all")

        cx = self.canvas_width / 2
        cy = self.canvas_height - 30
        radius = 125

        def rpm_to_angle(rpm):
            clamped = max(-MAX_SPEED_RPM, min(MAX_SPEED_RPM, rpm))
            ratio = (clamped - (-MAX_SPEED_RPM)) / (2 * MAX_SPEED_RPM)
            return 200 - (ratio * 220)

        # Background track arc
        c.create_arc(
            cx - radius, cy - radius, cx + radius, cy + radius,
            start=-20, extent=220,
            style="arc", outline="#2A303C", width=16
        )

        # Active speed arc
        angle_0 = rpm_to_angle(0)
        angle_curr = rpm_to_angle(speed_rpm)
        extent = angle_0 - angle_curr

        if speed_rpm > 0:
            c.create_arc(
                cx - radius, cy - radius, cx + radius, cy + radius,
                start=angle_0, extent=-extent,
                style="arc", outline="#38BDF8", width=16
            )
        elif speed_rpm < 0:
            c.create_arc(
                cx - radius, cy - radius, cx + radius, cy + radius,
                start=angle_0, extent=-extent,
                style="arc", outline="#F97316", width=16
            )

        # Tick marks & numbers
        ticks = [-300, -200, -100, 0, 100, 200, 300]
        for t in ticks:
            ang_deg = rpm_to_angle(t)
            ang_rad = math.radians(ang_deg)

            r_inner = radius - 18
            r_outer = radius + 12

            x1 = cx + (r_inner * math.cos(ang_rad))
            y1 = cy - (r_inner * math.sin(ang_rad))
            x2 = cx + (r_outer * math.cos(ang_rad))
            y2 = cy - (r_outer * math.sin(ang_rad))

            c.create_line(x1, y1, x2, y2, fill="#4B5563", width=2)

            r_text = radius - 30
            xt = cx + (r_text * math.cos(ang_rad))
            yt = cy - (r_text * math.sin(ang_rad))
            label_text = f"{t:+d}" if t != 0 else "0"
            c.create_text(xt, yt, text=label_text, fill="#94A3B8", font=("Helvetica", 9))

        # Needle pointer
        curr_rad = math.radians(self.current_needle_angle)
        needle_len = radius - 10
        nx = cx + (needle_len * math.cos(curr_rad))
        ny = cy - (needle_len * math.sin(curr_rad))

        needle_color = "#38BDF8" if speed_rpm >= 0 else "#F97316"
        c.create_line(cx, cy, nx, ny, fill=needle_color, width=4)

        # Center Hub
        c.create_oval(cx - 10, cy - 10, cx + 10, cy + 10, fill="#1E293B", outline=needle_color, width=2)

        # Digital Readout
        sign_str = "+" if speed_rpm > 0 else ""
        digital_str = f"{sign_str}{speed_rpm} RPM"
        c.create_text(cx, cy + 16, text=digital_str, fill="#F8FAFC", font=("Consolas", 15, "bold"))

    def _animate_gauge(self):
        diff = self.target_needle_angle - self.current_needle_angle
        if abs(diff) > 0.5:
            self.current_needle_angle += diff * 0.25
            self._draw_speedometer(self.current_speed_rpm)
        elif self.current_needle_angle != self.target_needle_angle:
            self.current_needle_angle = self.target_needle_angle
            self._draw_speedometer(self.current_speed_rpm)

        self.after(25, self._animate_gauge)

    def _set_speed_telemetry(self, speed_rpm):
        self.current_speed_rpm = speed_rpm

        # Calculate target angle
        clamped = max(-MAX_SPEED_RPM, min(MAX_SPEED_RPM, speed_rpm))
        ratio = (clamped - (-MAX_SPEED_RPM)) / (2 * MAX_SPEED_RPM)
        self.target_needle_angle = 200 - (ratio * 220)

        # Update badge
        if speed_rpm > 0:
            self.speed_status_badge.configure(text=f"+{speed_rpm} RPM (FORWARD)", text_color="#38BDF8")
        elif speed_rpm < 0:
            self.speed_status_badge.configure(text=f"{speed_rpm} RPM (REVERSE)", text_color="#F97316")
        else:
            self.speed_status_badge.configure(text="0 RPM (STOPPED)", text_color="#10B981")

        # Sync slider & target label if user is not actively dragging it
        if not self.slider_active:
            self.speed_slider.set(speed_rpm)
            if speed_rpm > 0:
                self.target_speed_lbl.configure(text=f"Live Speed: +{speed_rpm} RPM (Forward)", text_color="#38BDF8")
            elif speed_rpm < 0:
                self.target_speed_lbl.configure(text=f"Live Speed: {speed_rpm} RPM (Reverse)", text_color="#F97316")
            else:
                self.target_speed_lbl.configure(text="Live Speed: 0 RPM (Stopped)", text_color="#10B981")

    # ==========================================================================
    # Slider & Direct Speed Control Handling
    # ==========================================================================
    def _on_slider_pressed(self, event=None):
        self.slider_active = True

    def _on_slider_change(self, value):
        rpm = int(round(value / 10.0) * 10)
        if rpm > 0:
            self.target_speed_lbl.configure(text=f"Target: +{rpm} RPM (Forward)", text_color="#38BDF8")
        elif rpm < 0:
            self.target_speed_lbl.configure(text=f"Target: {rpm} RPM (Reverse)", text_color="#F97316")
        else:
            self.target_speed_lbl.configure(text="Target: 0 RPM (Stopped)", text_color="#10B981")

    def _on_slider_released(self, event=None):
        self.slider_active = False
        rpm = int(round(self.speed_slider.get() / 10.0) * 10)
        self.send_speed(rpm)

    def set_speed_preset(self, rpm):
        if self.current_state in ("LOCK", "MOVEMENT"):
            self.speed_slider.set(rpm)
            self._on_slider_change(rpm)
            self.send_speed(rpm)
        else:
            self._append_log(f"[WARN] Cannot change speed in state [{self.current_state}]. Please ENGAGE first.\n")

    def nudge_speed(self, delta):
        if self.current_state in ("LOCK", "MOVEMENT"):
            new_rpm = max(-MAX_SPEED_RPM, min(MAX_SPEED_RPM, self.current_speed_rpm + delta))
            self.set_speed_preset(new_rpm)
        else:
            self._append_log(f"[WARN] Cannot change speed in state [{self.current_state}]. Please ENGAGE first.\n")

    def send_speed(self, rpm):
        if not self.ser or not self.ser.is_open:
            messagebox.showinfo("Not Connected", "Please connect to the STM32 COM port first.")
            return

        if self.current_state not in ("LOCK", "MOVEMENT"):
            self._append_log(f"[WARN] Cannot set speed in state [{self.current_state}]. Please ENGAGE first.\n")
            return

        try:
            cmd = f"V:{int(rpm)}\n"
            self.ser.write(cmd.encode("ascii"))
            self._append_log(f">>> Sent: Set Speed {rpm:+d} RPM\n")
        except Exception as e:
            self._append_log(f"[ERROR] Failed to send speed: {e}\n")

    # ==========================================================================
    # Port Detection & Serial Management
    # ==========================================================================
    def _refresh_ports(self):
        ports = serial.tools.list_ports.comports()
        port_list = [p.device for p in ports]
        if not port_list:
            port_list = ["No ports found"]

        self.port_dropdown.configure(values=port_list)

        stlink_found = False
        for p in ports:
            if "STLink" in p.description or "STM" in p.description:
                self.port_var.set(p.device)
                stlink_found = True
                break

        if not stlink_found and port_list:
            self.port_var.set(port_list[0])

    def _toggle_connection(self):
        if self.ser and self.ser.is_open:
            self._disconnect()
        else:
            self._connect()

    def _connect(self):
        port = self.port_var.get()
        if not port or port == "No ports found":
            messagebox.showwarning("Warning", "Please select a valid COM port.")
            return

        try:
            baud = int(self.baud_var.get())
            self.ser = serial.Serial(port, baudrate=baud, timeout=0.1)
            self.running = True

            self.serial_thread = threading.Thread(target=self._serial_reader, daemon=True)
            self.serial_thread.start()

            self.connect_btn.configure(text="Disconnect", fg_color="#DC2626", hover_color="#B91C1C")
            self._append_log(f"[SYS] Connected to {port} @ {baud} bps\n")

            # Default connected state is DISENGAGE
            self._update_state_ui("DISENGAGE")

            time.sleep(0.05)
            self.ser.write(b'?')

        except Exception as e:
            messagebox.showerror("Connection Error", f"Failed to open {port}:\n{e}")
            self.ser = None

    def _disconnect(self):
        self.running = False
        if self.ser:
            try:
                self.ser.close()
            except Exception:
                pass
            self.ser = None

        self.connect_btn.configure(text="Connect", fg_color="#10B981", hover_color="#059669")
        self._append_log("[SYS] Disconnected\n")
        self._set_speed_telemetry(0)
        self._update_state_ui("OFFLINE")

    def _serial_reader(self):
        buf = ""
        while self.running and self.ser and self.ser.is_open:
            try:
                data = self.ser.read(self.ser.in_waiting or 1)
                if data:
                    buf += data.decode("latin1", errors="replace")
                    while "\n" in buf:
                        line, buf = buf.split("\n", 1)
                        clean_line = line.strip("\r")
                        self.rx_queue.put(clean_line)
            except Exception:
                break
        self.rx_queue.put("__DISCONNECTED__")

    # ==========================================================================
    # Command Sending
    # ==========================================================================
    def send_command(self, cmd_char):
        if not self.ser or not self.ser.is_open:
            messagebox.showinfo("Not Connected", "Please connect to the STM32 COM port first.")
            return

        try:
            self.ser.write(cmd_char.encode("ascii"))
            self._append_log(f">>> Sent: '{cmd_char}'\n")
        except Exception as e:
            self._append_log(f"[ERROR] Failed to send: {e}\n")

    # ==========================================================================
    # Parsing STM32 Stream & Dynamic State UI Updates
    # ==========================================================================
    def _process_rx_queue(self):
        while not self.rx_queue.empty():
            line = self.rx_queue.get_nowait()
            if line == "__DISCONNECTED__":
                self._disconnect()
                continue

            self._append_log(line + "\n")
            self._parse_line(line)

        self.after(30, self._process_rx_queue)

    def _parse_line(self, line):
        # 1. State detection from STM32 prints
        if "CURRENT STATE : [DISENGAGE]" in line or "[STATE] DISENGAGE" in line:
            self._update_state_ui("DISENGAGE")
            self._set_speed_telemetry(0)
        elif "CURRENT STATE : [LOCK]" in line or "[STATE] LOCK" in line:
            self._update_state_ui("LOCK")
            self._set_speed_telemetry(0)
        elif "CURRENT STATE : [MOVEMENT]" in line or "[STATE] MOVEMENT" in line:
            self._update_state_ui("MOVEMENT")
        elif "CURRENT STATE : [JERK]" in line or "[STATE] JERK" in line:
            self._update_state_ui("JERK")
            self._set_speed_telemetry(0)
        elif "CURRENT STATE : [ERR]" in line or "[STATE] ERR" in line or "ALARM" in line or "FAULT" in line or "EMCY" in line:
            self._update_state_ui("ERR")
            self._set_speed_telemetry(0)

        # 2. Speed Telemetry Parsing
        if "[SPEED] Right:" in line:
            try:
                part = line.split("Right:")[1].split("RPM")[0].strip()
                rpm = int(part)
                self._set_speed_telemetry(rpm)
            except Exception:
                pass
        elif "RIGHT MOTOR RUNNING (" in line:
            try:
                part = line.split("(")[1].split("RPM")[0].strip()
                rpm = int(part)
                self._set_speed_telemetry(rpm)
            except Exception:
                pass

        # 3. CAN Driver feedback parsing
        if "Statusword: 0x" in line or "Statusword=0x" in line:
            idx = line.find("0x")
            if idx != -1:
                sw_str = line[idx:idx+6]
                self.feedback_lbl.configure(text=f"Live Driver Statusword: {sw_str} (Verified via CAN)")
                try:
                    sw_val = int(sw_str, 16)
                    # CiA 402 Bit 3 is Fault!
                    if (sw_val & 0x0008) != 0:
                        self._update_state_ui("ERR")
                        self._set_speed_telemetry(0)
                except Exception:
                    pass

    # ==========================================================================
    # Dynamic Button Interlocking Based on Current State
    # ==========================================================================
    def _update_state_ui(self, state_name):
        self.current_state = state_name
        colors = STATE_COLORS.get(state_name, STATE_COLORS["OFFLINE"])

        # Update State Banner
        self.state_card.configure(fg_color=colors["bg"], border_color=colors["border"])
        self.state_label.configure(text=f"STATE: [{state_name}]", text_color=colors["text"])
        self.state_detail_lbl.configure(text=STATE_INFO.get(state_name, ""))

        if state_name == "DISENGAGE":
            self.btn_engage.configure(state="normal")
            self.btn_stop.configure(state="disabled")
            self.btn_disengage.configure(state="disabled")
            self.btn_jerk.configure(state="disabled")
            self.btn_clear.configure(state="normal")

            # Disable speed controls
            self.speed_slider.configure(state="disabled")
            self.btn_nudge_up.configure(state="disabled")
            self.btn_nudge_down.configure(state="disabled")
            for btn in self.preset_buttons:
                btn.configure(state="disabled")

        elif state_name == "LOCK":
            self.btn_engage.configure(state="disabled")
            self.btn_stop.configure(state="disabled")  # Already stopped
            self.btn_disengage.configure(state="normal")
            self.btn_jerk.configure(state="disabled")
            self.btn_clear.configure(state="normal")

            # Enable speed controls
            self.speed_slider.configure(state="normal")
            self.btn_nudge_up.configure(state="normal")
            self.btn_nudge_down.configure(state="normal")
            for btn in self.preset_buttons:
                btn.configure(state="normal")

        elif state_name == "MOVEMENT":
            self.btn_engage.configure(state="disabled")
            self.btn_stop.configure(state="normal")
            self.btn_disengage.configure(state="normal")
            self.btn_jerk.configure(state="normal")
            self.btn_clear.configure(state="normal")

            # Enable speed controls
            self.speed_slider.configure(state="normal")
            self.btn_nudge_up.configure(state="normal")
            self.btn_nudge_down.configure(state="normal")
            for btn in self.preset_buttons:
                btn.configure(state="normal")

        elif state_name == "JERK":
            self.btn_engage.configure(state="normal")  # Re-enable driver to LOCK
            self.btn_stop.configure(state="disabled")
            self.btn_disengage.configure(state="normal")
            self.btn_jerk.configure(state="disabled")
            self.btn_clear.configure(state="normal")

            # Disable speed controls
            self.speed_slider.configure(state="disabled")
            self.btn_nudge_up.configure(state="disabled")
            self.btn_nudge_down.configure(state="disabled")
            for btn in self.preset_buttons:
                btn.configure(state="disabled")

        elif state_name == "ERR":
            self.btn_engage.configure(state="disabled")
            self.btn_stop.configure(state="disabled")
            self.btn_disengage.configure(state="disabled")
            self.btn_jerk.configure(state="disabled")
            self.btn_clear.configure(state="normal")  # Fault reset always available

            # Disable speed controls
            self.speed_slider.configure(state="disabled")
            self.btn_nudge_up.configure(state="disabled")
            self.btn_nudge_down.configure(state="disabled")
            for btn in self.preset_buttons:
                btn.configure(state="disabled")

        else: # OFFLINE
            for btn in [self.btn_engage, self.btn_stop, self.btn_disengage, self.btn_jerk, self.btn_clear]:
                btn.configure(state="disabled")

            self.speed_slider.configure(state="disabled")
            self.btn_nudge_up.configure(state="disabled")
            self.btn_nudge_down.configure(state="disabled")
            for btn in self.preset_buttons:
                btn.configure(state="disabled")

    def _append_log(self, text):
        self.log_text.insert("end", text)
        self.log_text.see("end")

    def _clear_log(self):
        self.log_text.delete("1.0", "end")


if __name__ == "__main__":
    app = STM32ControllerGUI()
    app.mainloop()
