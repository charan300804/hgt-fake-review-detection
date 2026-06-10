import subprocess
import time
import os
import sys

def run_services():
    """
    Unified launch script for the HGT Fraud Detection System.
    Starts the FastAPI ML service and the Next.js frontend in separate processes.
    """
    print("="*60)
    print("🚀 Starting HGT Fraud Detection System")
    print("="*60)
    
    root_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.join(root_dir, "mini-services", "ml-service")

    # 1. Start ML Service (FastAPI)
    print(f"\n[1/2] Starting ML Service (FastAPI) on port 5001...")
    try:
        # Use CREATE_NEW_CONSOLE on Windows to keep logs separate and visible
        ml_process = subprocess.Popen(
            [sys.executable, "index.py"],
            cwd=ml_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
        )
    except Exception as e:
        print(f"❌ Failed to start ML Service: {e}")
        return

    # 2. Wait for ML Service to initialize
    print("⏳ Waiting for model to load (5 seconds)...")
    time.sleep(5)
    
    # 3. Start Frontend (Next.js)
    print(f"[2/2] Starting Frontend (Next.js) on port 3000...")
    try:
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=root_dir,
            shell=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
        )
    except Exception as e:
        print(f"❌ Failed to start Frontend: {e}")
        ml_process.terminate()
        return

    print("\n" + "="*60)
    print("✅ System is launching!")
    print(f"🔗 Frontend:   http://localhost:3000")
    print(f"🔗 ML Service: http://localhost:5001")
    print("="*60)
    print("\nKeep this window open or check the newly opened consoles for logs.")
    print("Press Ctrl+C in the respective windows to stop services.")

if __name__ == "__main__":
    run_services()
