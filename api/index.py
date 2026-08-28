import sys
import os

# Add parent directory to python path for Vercel serverless function
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
