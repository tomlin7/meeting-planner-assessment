# =============================
# Imports and Setup
# =============================
import json
import os

from dotenv import load_dotenv

import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import requests
import streamlit as st

load_dotenv()
API_URL = os.getenv("API_URL", "http://localhost:8000")

# =============================
# UI: Busy Slots Input
# =============================
st.title("Smart Meeting Planner")

st.header("Paste your /slots JSON")
default_json = '{\n  "users": [\n    { "id": 1, "busy": [["09:00","10:30"], ["13:00","14:00"]] },\n    { "id": 2, "busy": [["11:00","12:00"], ["15:00","16:00"]] }\n  ]\n}'
slots_json = st.text_area("Paste JSON for /slots", value=default_json, height=200)


def send_busy_slots():
    try:
        payload = json.loads(slots_json)
        resp = requests.post(f"{API_URL}/slots", json=payload)
        if resp.ok:
            st.success(resp.json().get("message", "Slots updated!"))
            st.session_state["available_users"] = payload["users"]
            if payload["users"]:
                st.session_state["selected_user_id"] = payload["users"][0]["id"]
                st.session_state["_force_timeline_refresh"] = True
        else:
            st.error(f"Error: {resp.text}")
    except Exception as e:
        st.error(f"Invalid JSON or request failed: {e}")


if st.button("Send Busy Slots 🚀"):
    send_busy_slots()

# =============================
# UI: Meeting Suggestion
# =============================
st.header("Suggest a Meeting Time")
duration = st.number_input(
    "Meeting duration (minutes)", min_value=1, max_value=480, value=30
)

if "available_users" in st.session_state:
    st.subheader("Select Meeting Participant")
    selected_user_id = st.selectbox(
        "Choose participant",
        options=[user["id"] for user in st.session_state["available_users"]],
        index=0,
    )
    st.session_state["selected_user_id"] = selected_user_id

if "suggested_slots" not in st.session_state:
    st.session_state["suggested_slots"] = []


def fetch_suggestions():
    try:
        params = {"duration": duration}
        if (
            "available_users" in st.session_state
            and "selected_user_id" in st.session_state
        ):
            params["user_id"] = st.session_state["selected_user_id"]
        resp = requests.get(f"{API_URL}/suggest", params=params)
        if resp.ok:
            slots = resp.json()
            st.session_state["suggested_slots"] = slots
            return slots
        else:
            st.error(f"Error: {resp.text}")
            st.session_state["suggested_slots"] = []
            return []
    except Exception as e:
        st.error(f"Request failed: {e}")
        st.session_state["suggested_slots"] = []
        return []


if st.button("Suggest Free Windows 🕵️"):
    fetch_suggestions()

slots = st.session_state.get("suggested_slots", [])
if slots:
    st.write("### Free Windows:")
    for i, slot in enumerate(slots):
        col1, col2, col3 = st.columns([2, 2, 1])
        with col1:
            st.write(f"{slot[0]} - {slot[1]}")
        with col2:
            st.write(":alarm_clock: Ready for action!")
        with col3:
            if st.button("Book", key=f"book_{i}"):
                if (
                    "available_users" in st.session_state
                    and "selected_user_id" in st.session_state
                ):
                    book_payload = {
                        "startTime": slot[0],
                        "endTime": slot[1],
                        "title": "Meeting",
                        "user_id": st.session_state["selected_user_id"],
                    }
                    book_resp = requests.post(f"{API_URL}/book", json=book_payload)
                    if book_resp.ok:
                        st.success(book_resp.json().get("message", "Slot booked!"))
                        fetch_suggestions()
                    else:
                        st.error(f"Booking failed: {book_resp.text}")


# =============================
# Utility: Fetch User Calendar
# =============================
def fetch_user_calendar(user_id):
    try:
        resp = requests.get(f"{API_URL}/calendar/{user_id}")
        if resp.ok:
            return resp.json()
        else:
            st.error(f"Error fetching calendar: {resp.text}")
            return None
    except Exception as e:
        st.error(f"Request failed: {e}")
        return None


# =============================
# UI: Timeline/Gantt Chart
# =============================
user_to_show = st.session_state.get("selected_user_id")

user_calendar = None
if user_to_show is not None:
    user_calendar = fetch_user_calendar(user_to_show)

if user_calendar:
    st.subheader(f"Timeline for User {user_to_show}")
    busy_slots = user_calendar["busy"]
    meeting_slots = [
        [m["startTime"], m["endTime"]] for m in user_calendar.get("meetings", [])
    ]
    if not busy_slots and not meeting_slots:
        st.warning(
            "No busy slots found for this user. Please make sure to submit busy slots using the JSON above."
        )
    work_start = 9 * 60
    work_end = 18 * 60
    busy_intervals = []
    for start, end in busy_slots:
        s = int(start[:2]) * 60 + int(start[3:])
        e = int(end[:2]) * 60 + int(end[3:])
        busy_intervals.append((s, e, "busy"))
    for start, end in meeting_slots:
        s = int(start[:2]) * 60 + int(start[3:])
        e = int(end[:2]) * 60 + int(end[3:])
        busy_intervals.append((s, e, "meeting"))
    busy_intervals.sort()

    merged = []
    for s, e, typ in busy_intervals:
        if not merged or s > merged[-1][1] or typ != merged[-1][2]:
            merged.append([s, e, typ])
        else:
            merged[-1][1] = max(merged[-1][1], e)

    free_intervals = []
    prev_end = work_start
    for s, e, _ in merged:
        if prev_end < s:
            free_intervals.append((prev_end, s))
        prev_end = max(prev_end, e)
    if prev_end < work_end:
        free_intervals.append((prev_end, work_end))
    fig, ax = plt.subplots(figsize=(8, 1.5))
    for s, e, typ in merged:
        color = "red" if typ == "busy" else "blue"
        ax.barh(0, e - s, left=s, color=color, height=0.5)
    for s, e in free_intervals:
        ax.barh(0, e - s, left=s, color="green", height=0.5)
    ax.set_xlim(work_start, work_end)
    ax.set_xticks([i * 60 for i in range(9, 19)])
    ax.set_xticklabels([f"{i:02d}:00" for i in range(9, 19)])
    ax.set_yticks([])
    ax.set_xlabel("Time")
    ax.set_title(f"User {user_to_show} Workday Timeline")
    busy_patch = mpatches.Patch(color="red", label="Busy")
    meeting_patch = mpatches.Patch(color="blue", label="Meeting")
    free_patch = mpatches.Patch(color="green", label="Free")
    ax.legend(handles=[busy_patch, meeting_patch, free_patch], loc="upper right")
    st.pyplot(fig)
