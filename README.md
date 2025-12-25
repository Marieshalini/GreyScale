# 🎨 HueMate – Color Vision Accessibility Chrome Extension

HueMate is a Chrome Extension designed to enhance web accessibility for users with Color Vision Deficiency (CVD). It provides real-time color simulation, correction, and contrast optimization to improve readability and visual clarity across any website.

## 🚀 Features

* CVD Simulation
  Simulates Protanopia, Deuteranopia, and Tritanopia to visualize how content appears to colorblind users.

* Daltonization-Style Color Correction
  Applies intelligent color adjustments to improve color distinguishability.

* WCAG Contrast Checker
  Detects text elements that fail the WCAG 2.1 contrast ratio standard (4.5:1).

* Automatic and Manual Contrast Fixing
  Auto-fix all low-contrast elements or manually fix individual issues.

* Persistent Accessibility Profiles
  Save, load, and delete custom accessibility settings using Chrome Storage.

* Real-Time Page Manipulation
  Applies filters instantly without page reload using content scripts.

---

## 🧠 How It Works

1. The popup UI allows users to select simulation modes, correction modes, and adjust hue, saturation, and brightness.
2. The background service worker manages communication between the popup and active tabs.
3. A content script injects SVG filters and dynamically modifies the webpage using CSS filters and DOM manipulation.
4. Contrast ratios are calculated using relative luminance formulas to identify WCAG violations.
5. Low-contrast text is highlighted and can be automatically or manually corrected.

## 🛠️ Tech Stack

* HTML
* CSS
* JavaScript
* Chrome Extensions API (Manifest V3)
* SVG Filters
* WCAG Accessibility Standards
* DOM Manipulation

## 📈 Impact

* Scans all visible text elements on a webpage to detect contrast issues below WCAG standards.
* Applies accessibility enhancements instantly across any active tab.
* Supports multiple saved profiles for personalized accessibility preferences.

## 🎯 Use Cases

* Improving web readability for colorblind users
* Accessibility testing for designers and developers
* Learning project for Chrome Extensions and web accessibility standards

## 👩‍💻 Author

Marie Shalini S


Just say which one.
