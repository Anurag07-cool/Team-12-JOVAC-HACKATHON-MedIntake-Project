# MedIntake - Modern EHR Platform

MedIntake is a premium, ultra-modern Electronic Health Record (EHR) web application designed to streamline the patient intake process and provide a seamless clinical triage experience. Built with a focus on speed, aesthetics, and usability, it bridges the gap between patient data collection and clinical review.

## 🚀 Features

The application is divided into two distinct, secure portals:

### 1. Patient Engagement Portal
*   **Digital Intake Form:** A fully integrated Google Form allowing patients to securely submit their health information prior to their visit.
*   **Live Status Tracker:** Patients can enter their email and DOB to instantly track their visit progress (e.g., "Processing", "Needs Clarification", "Ready").
*   **Modern UI:** A clean, welcoming, and reassuring interface designed to reduce patient anxiety.

### 2. Clinician Triage Hub (Staff Only)
*   **Secure Access:** Protected by a glassmorphism login screen requiring a security PIN (Default: `1234`).
*   **Split-Screen Workspace:** Built for high-speed scanning by doctors and nurses.
    *   **Active Clinical Queue (Left):** Displays validated patients whose data has been processed and confirmed. Features urgency indicators and clinical briefs.
    *   **Needs Nurse Review (Right):** Flags raw submissions that require manual intervention or clarification before they can be moved to the active queue.
*   **Live Google Sheets Integration:** Automatically fetches and syncs live patient data directly from connected Google Sheets.

## 🛠️ Technology Stack

*   **Backend:** Python with Flask
*   **Frontend:** HTML5, Vanilla JavaScript
*   **Styling:** Tailwind CSS (via CDN) with custom CSS elements for micro-animations and glassmorphism.
*   **Database/Data Source:** Google Sheets Integration (via `urllib` and `csv` parsing)
*   **Workflow Automation:** Designed to integrate with n8n workflows that process raw Google Form submissions and validate them into a separate Google Sheet.

## ⚙️ Setup and Installation

1. **Clone the repository.**
2. **Install dependencies:**
   Make sure you have Python installed, then install Flask and python-dotenv.
   ```bash
   pip install Flask python-dotenv google-genai
   ```
3. **Configure Environment:**
   Create a `.env` file in the root directory and add your Gemini API Key if you are using AI features:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. **Google Sheets Configuration (app.py):**
   Ensure your Google Sheets are set to "Anyone with the link can view". The application expects two sheets:
   *   `VALIDATED_SHEET_ID`: The sheet containing processed, ready-to-see patients.
   *   `RAW_SHEET_ID`: The sheet containing raw submissions needing nurse review.
5. **Run the Server:**
   ```bash
   python app.py
   ```
6. **Access the App:**
   Open your browser and navigate to `http://127.0.0.1:5000/`.

## 🔒 Security Note
The current Clinician Hub uses a hardcoded PIN (`1234`) for demonstration purposes during development/hackathons. For production environments, this should be replaced with a robust authentication system (e.g., OAuth, JWT, or database-backed user sessions).
