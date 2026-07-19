from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("Gemini API Key not found!")

client = genai.Client(api_key=API_KEY)

app = Flask(__name__)
app.secret_key = 'super-secret-medintake-key-change-in-prod'

# Google Sheet IDs
VALIDATED_SHEET_ID = "1gK8zgjTrqfusdqdJMyc4AQHSNWtvHjnNdMcJw27jG7Q"
RAW_SHEET_ID = "1g-O69TStA_xvePi2Pm0raXXD6v8da-RBo7agvm_4QpQ"

# Hardcoded PIN for Demo
DOCTOR_PIN = "1234"


@app.route("/")
def home():
    return render_template("landing.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        pin = request.form.get("pin")
        if pin == DOCTOR_PIN:
            session["authenticated"] = True
            return redirect(url_for("doctor"))
        else:
            return render_template("login.html", error="Invalid PIN")
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("authenticated", None)
    return redirect(url_for("home"))

@app.route("/doctor")
def doctor():
    if not session.get("authenticated"):
        return redirect(url_for("login"))
    return render_template("doctor.html")

@app.route("/patient")
def patient():
    return render_template("patient.html")


@app.route("/chat", methods=["POST"])
def chat():

    user_message = request.json["message"]

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash",            contents=user_message
        )

        return jsonify({
            "response": response.text
        })

    except Exception as e:

        return jsonify({
            "response": str(e)
        })

import urllib.request
import csv
import io
from datetime import datetime

# Google Sheet ID from user link
GOOGLE_SHEET_ID = "1gK8zgjTrqfusdqdJMyc4AQHSNWtvHjnNdMcJw27jG7Q"

@app.route("/api/queue")
def get_queue():
    try:
        # Fetching Validated Patients
        validated_url = f"https://docs.google.com/spreadsheets/d/{VALIDATED_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Today's%20Validated%20Patients"
        
        req = urllib.request.Request(validated_url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        csv_data = response.read().decode('utf-8')
        
        reader = csv.DictReader(io.StringIO(csv_data))
        
        validated_patients = []
        for row in reader:
            # According to the screenshot columns:
            # Timestamp, Patient Name, Date of Birth, Email, Chief Complaint, Urgency, Speciality, Confidence Score, Brief Doc URL
            if not row.get('Patient Name'): 
                continue # Skip empty rows
                
            # Calculate Age
            age = 0
            dob_str = row.get('Date of Birth') or row.get('DOB', '')
            if dob_str:
                for fmt in ('%m/%d/%Y', '%Y-%m-%d', '%d/%m/%Y', '%m-%d-%Y'):
                    try:
                        dob = datetime.strptime(dob_str, fmt)
                        today = datetime.today()
                        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                        break
                    except ValueError:
                        pass
                
            validated_patients.append({
                "id": row.get('Timestamp', ''),
                "name": row.get('Patient Name', 'Unknown'),
                "dob": dob_str,
                "email": row.get('Email', '').lower().strip(),
                "age": age,
                "urgency": row.get('Urgency', 'Routine'),
                "specialty": row.get('Speciality', 'General'),
                "hpi": row.get('Chief Complaint', ''),
                "queue": "validated",
                "briefUrl": row.get('Brief Doc URL', '#')
            })
            
        nurse_patients = []
        try:
            # Try common sheet names for the raw submissions
            raw_csv_data = None
            for sheet_name in ["Needs_Nurse_Review", "Sheet1", "Form%20Responses%201", "raw%20submission"]:
                try:
                    raw_url = f"https://docs.google.com/spreadsheets/d/{RAW_SHEET_ID}/gviz/tq?tqx=out:csv&sheet={sheet_name}"
                    raw_req = urllib.request.Request(raw_url, headers={'User-Agent': 'Mozilla/5.0'})
                    raw_response = urllib.request.urlopen(raw_req)
                    raw_csv_data = raw_response.read().decode('utf-8')
                    # If it didn't throw an HTTP error, we successfully found the sheet tab!
                    break
                except urllib.error.HTTPError:
                    continue
            
            if not raw_csv_data:
                raise Exception("Could not find a valid sheet tab in the Nurse Review Google Sheet.")
                
            raw_reader = csv.DictReader(io.StringIO(raw_csv_data))
            
            for raw_row in raw_reader:
                # Sanitize keys (remove trailing spaces from Google Sheets)
                row = {k.strip(): v for k, v in raw_row.items() if k}
                # Fallback keys for typical Google Form outputs
                name = row.get('Full Name') or row.get('Patient Name') or row.get('Name', 'Unknown')
                if not name or name == 'Unknown':
                    continue
                    
                dob_str = row.get('Date of Birth') or row.get('DOB', '')
                age = 0
                try:
                    if dob_str:
                        for fmt in ('%m/%d/%Y', '%Y-%m-%d', '%d/%m/%Y', '%m-%d-%Y'):
                            try:
                                dob = datetime.strptime(dob_str, fmt)
                                today = datetime.today()
                                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                                break
                            except ValueError:
                                pass
                except:
                    pass
                    
                symptoms = row.get('Raw Symptoms') or row.get('Describe Your Symptoms') or row.get('Chief Complaint', '')
                
                nurse_patients.append({
                    "id": row.get('Timestamp', ''),
                    "name": name,
                    "dob": dob_str,
                    "email": (row.get('Email Address') or row.get('Email', '')).lower().strip(),
                    "age": age,
                    "queue": "nurse",
                    "flagReason": "Raw Submission: Pending automated validation or requires manual review",
                    "hpi": symptoms
                })
        except Exception as raw_e:
            print(f"Could not fetch raw submissions: {raw_e}")
            
        return jsonify({
            "validated": validated_patients,
            "nurse": nurse_patients
        })
        
    except Exception as e:
        print(f"Main Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)