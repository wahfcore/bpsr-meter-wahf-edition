# BPSR METER: WAHF EDITION

A custom-branded real-time DPS meter overlay for **Blue Protocol: Star Resonance**

![Version](https://img.shields.io/badge/version-1.0.0-cyan)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-AGPL--3.0-green)

## ✨ Features

- 🎨 **Custom WAHF Branding** - Personalized icon and cyan accent colors
- 📏 **Adjustable Scale** - Single-click button to cycle through 100%, 70%, 50%, 30% sizes
- 📍 **Smart Positioning** - Automatically positions to top-right corner on launch
- 💎 **Cyan Theme** - Matches Windows accent colors for seamless integration
- 📊 **Real-time Tracking** - DPS, HPS, and damage taken with 50ms update intervals
- 👥 **Dual Modes** - Nearby (Top 10 + your position) or Solo (personal stats only)
- 🏆 **Rank Badges** - Gold, Silver, Bronze badges for top 3 players
- 🎯 **Click-through** - Overlay becomes transparent when not hovering over controls

## 📥 Download

**[Download BPSR Meter WAHF Edition v1.0.0](https://github.com/wahfcore/bpsr-meter-wahf-edition/releases/download/v1.0.0/BPSR-Meter-WAHF-Edition-Portable.zip)**

## 🚀 Installation

### Requirements
- Windows 10/11
- **Npcap** (for packet capture)
  - Download: https://npcap.com/#download
  - ✅ Install with **"WinPcap API-compatible Mode"** enabled
  - ✅ Enable **"Support loopback traffic"**

### Setup
1. Download the ZIP file above
2. Extract to a folder of your choice
3. Run **BPSR Meter - WAHF Edition.exe**
4. The overlay will appear in the top-right corner

⚠️ **Important:** After launching, you must **change instance** or **change line** in-game for the meter to start detecting players.

## 🎮 Controls

| Button | Function |
|--------|----------|
| **🔄 Sync** | Refresh and reset statistics |
| **⬌ Drag** | Move the overlay (when unlocked) |
| **Nearby/Solo** | Toggle between group and personal view |
| **DMG/TANK/HEAL** | Sort players by different metrics |
| **7** (Scale) | Click to cycle: 1 → 7 → 5 → 3 (100% → 70% → 50% → 30%) |
| **🔓 Lock** | Lock position to prevent accidental movement |
| **✕ Close** | Exit the application |

## 🎨 Customization

### Current Scale
The scale button displays a single digit representing the current size:
- **1** = 100% (full size)
- **7** = 70% (default, optimized for handhelds)
- **5** = 50% (compact)
- **3** = 30% (minimal)

### Color Scheme
- **Primary Accent:** Cyan (`#00B7C3`)
- **Rank Badges:** 🥇 Gold, 🥈 Silver, 🥉 Bronze
- **Local Player:** Highlighted with cyan border when in top 3

## 📸 Screenshots

The overlay features:
- Minimalistic dark design with blur effects
- Class icons for visual identification
- Real-time HP bars with color-coded indicators
- Damage percentage visualization
- Position-based gradient backgrounds

## 🔧 Technical Details

- **Framework:** Electron
- **Packet Capture:** Npcap
- **Update Interval:** 50ms
- **Default Position:** Top-right corner
- **Default Scale:** 70%

## 📝 Notes

- The overlay is click-through by default (mouse passes through)
- Hover over the controls area to interact with buttons
- Statistics automatically reset when changing channels/instances
- The meter needs to capture initial player data packets when entering new zones

## 🙏 Credits

- **Modified by:** WAHF
- **Original Project:** Blue Protocol DPS Meter
- **License:** AGPL-3.0

## 📄 License

This project is licensed under the AGPL-3.0 License - see the original project for details.

---

**Made with 💙 by WAHF for the Blue Protocol community**
