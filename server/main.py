from datetime import datetime, time, timedelta
from typing import Dict, List, Tuple
from uuid import uuid4

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# Constants
# =============================
users_busy: Dict[int, List[Tuple[str, str]]] = {}
booked_slots: List[Tuple[str, str]] = []
booked_meetings: List[Dict] = []

WORKDAY_START = time(9, 0)
WORKDAY_END = time(18, 0)
TIME_FORMAT = "%H:%M"


# =============================
# Models
# =============================
class UserBusy(BaseModel):
    id: int
    busy: List[Tuple[str, str]]


class SlotsPayload(BaseModel):
    users: List[UserBusy]


class BookSlotPayload(BaseModel):
    startTime: str
    endTime: str
    title: str
    user_id: int = None


# =============================
# utils
# =============================
def merge_intervals(intervals: List[Tuple[datetime, datetime]]) -> List[List[datetime]]:
    merged = []
    for start, end in sorted(intervals):
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return merged


def get_busy_intervals(user_ids=None):
    all_busy = []
    if user_ids:
        for user_id in user_ids:
            if user_id in users_busy:
                all_busy.extend([tuple(slot) for slot in users_busy[user_id]])
        for meeting in booked_meetings:
            if "user_id" in meeting and meeting["user_id"] in user_ids:
                all_busy.append((meeting["startTime"], meeting["endTime"]))
    else:
        for busy in users_busy.values():
            all_busy.extend([tuple(slot) for slot in busy])
        for meeting in booked_meetings:
            all_busy.append((meeting["startTime"], meeting["endTime"]))
    busy_intervals = [
        (
            datetime.combine(
                datetime.today(), datetime.strptime(start, TIME_FORMAT).time()
            ),
            datetime.combine(
                datetime.today(), datetime.strptime(end, TIME_FORMAT).time()
            ),
        )
        for start, end in all_busy
    ]
    return merge_intervals(busy_intervals)


def get_free_intervals(merged, work_start, work_end):
    free = []
    prev_end = work_start
    for start, end in merged:
        if prev_end < start:
            free.append((prev_end, start))
        prev_end = max(prev_end, end)
    if prev_end < work_end:
        free.append((prev_end, work_end))
    return free


# =============================
# Endpoints
# =============================
@app.post("/slots")
def set_slots(payload: SlotsPayload):
    for user in payload.users:
        users_busy[user.id] = user.busy
    return {
        "message": "User slots updated successfully",
        "userCount": len(payload.users),
    }


@app.get("/suggest")
def suggest_slots(duration: int = Query(..., gt=0), user_id: int = Query(None)):
    merged = get_busy_intervals([user_id] if user_id is not None else None)
    work_start = datetime.combine(datetime.today(), WORKDAY_START)
    work_end = datetime.combine(datetime.today(), WORKDAY_END)
    free = get_free_intervals(merged, work_start, work_end)
    duration_td = timedelta(minutes=duration)
    result = []
    for start, end in free:
        slot_start = start
        while slot_start + duration_td <= end:
            slot_end = slot_start + duration_td
            result.append(
                [
                    slot_start.strftime(TIME_FORMAT),
                    slot_end.strftime(TIME_FORMAT),
                ]
            )
            if len(result) == 3:
                return result
            slot_start = slot_end
    return result


@app.get("/calendar/{userId}")
def get_calendar(userId: int):
    busy = users_busy.get(userId, [])
    user_meetings = (
        [
            {k: v for k, v in m.items() if k != "user_ids"}
            for m in booked_meetings
            if not m.get("user_ids") or userId in m.get("user_ids", [])
        ]
        if any("user_ids" in m for m in booked_meetings)
        else booked_meetings
    )
    return {
        "id": userId,
        "busy": busy,
        "meetings": user_meetings,
    }


@app.post("/book")
def book_slot(payload: BookSlotPayload):
    start = payload.startTime
    end = payload.endTime
    user_id = payload.user_id
    try:
        start_dt = datetime.strptime(start, TIME_FORMAT)
        end_dt = datetime.strptime(end, TIME_FORMAT)
    except Exception:
        return JSONResponse(
            status_code=400, content={"error": "Invalid time format. Use HH:MM"}
        )
    if start >= end:
        return JSONResponse(
            status_code=400, content={"error": "End time must be after start time"}
        )
    if start < WORKDAY_START.strftime(TIME_FORMAT) or end > WORKDAY_END.strftime(
        TIME_FORMAT
    ):
        return JSONResponse(
            status_code=400,
            content={"error": "Meeting must be within work hours (09:00-18:00)"},
        )
    duration = int((end_dt - start_dt).total_seconds() // 60)
    merged = get_busy_intervals([user_id] if user_id is not None else None)
    work_start = datetime.combine(datetime.today(), WORKDAY_START)
    work_end = datetime.combine(datetime.today(), WORKDAY_END)
    free = get_free_intervals(merged, work_start, work_end)
    duration_td = timedelta(minutes=duration)
    is_available = False
    for free_start, free_end in free:
        slot_start = free_start
        while slot_start + duration_td <= free_end:
            slot_end = slot_start + duration_td
            if (
                slot_start.strftime(TIME_FORMAT) == start
                and slot_end.strftime(TIME_FORMAT) == end
            ):
                is_available = True
                break
            slot_start = slot_end
        if is_available:
            break
    if not is_available:
        return JSONResponse(
            status_code=400, content={"error": "Time slot is not available"}
        )
    meeting = {
        "id": str(uuid4()),
        "startTime": start,
        "endTime": end,
        "title": payload.title,
        "bookedAt": datetime.now().isoformat(),
        "user_id": user_id,
    }
    booked_meetings.append(meeting)
    return {"message": "Meeting booked successfully", "meeting": meeting}


@app.get("/meetings")
def get_meetings():
    return [{k: v for k, v in m.items() if k != "user_ids"} for m in booked_meetings]


@app.get("/users")
def get_users():
    return [{"id": user_id, "busy": busy} for user_id, busy in users_busy.items()]
