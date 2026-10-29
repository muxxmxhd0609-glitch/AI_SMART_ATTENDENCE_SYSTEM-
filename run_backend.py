import sys
from pathlib import Path
import uvicorn

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

if __name__ == "__main__":
    print("=================================================================")
    print("   RGIT BANGALORE - AI SMART ATTENDANCE SERVER (v2.0)            ")
    print("   Coordinates: Lat 13.033090, Lon 77.597786                     ")
    print("   Docs: http://127.0.0.1:8000/docs                              ")
    print("=================================================================")
    uvicorn.run("rgit_app.main:app", host="0.0.0.0", port=8000, reload=True)
