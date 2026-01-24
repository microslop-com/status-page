# 📡 Microslop Status
**Real-time tracking for when the "Cloud" becomes "Slop."**

[![Status Page](https://img.shields.io/badge/Live-Status_Page-blue?style=for-the-badge)](https://status.microslop.com)

## 📖 Overview
`status.microslop.com` is a community-driven, automated status dashboard designed for sysadmins who are tired of official dashboards claiming "Everything is Nominal" while their entire tenant is on fire.

This page performs automated health checks against public Microsoft endpoints and aggregates community signals (Reddit, X, Downdetector) to provide a "Slop-O-Meter" reading.

## 🛠 Features
* **Automated Health Checks:** Pings O365 health endpoints every 30 seconds.
* **Zero-Gaslighting UI:** If it's broken, the site turns red. No corporate jargon.
* **Community Smoke Signals:** Quick links to where the *real* troubleshooting happens (r/sysadmin).
* **Anti-Spam Contact:** Built-in obfuscated contact for reporting new outages.

## 🚀 How it Works
The dashboard uses a client-side JavaScript engine to verify connectivity:
1.  **Ping:** Attempts a `fetch()` to `outlook.office365.com/owa/healthcheck.htm`.
2.  **Latency Check:** If response > 2000ms, status moves to **Degraded**.
3.  **Failure Check:** If the fetch fails entirely, status moves to **MAXIMUM SLOP**.

## 🤝 Contributing
Found a better way to detect an outage? Want to add a "Days Since Last MFA Meltdown" counter? 
1. Fork the repo.
2. Make your snarky (but functional) changes.
3. Submit a Pull Request.

## 📬 Contact
Got a tip or a screenshot of a funny error message? 
Reach out at: **info@microslop.com**

---
*Disclaimer: Microslop is a satirical project. We are not affiliated with Microsoft, though we are frequently affected by them.*
