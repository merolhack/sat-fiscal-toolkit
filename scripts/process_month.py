#!/usr/bin/env python3
"""
scripts/process_month.py
Wrapper script calling procesar_cfdi_mes for full consistency.
"""

from pathlib import Path
import sys

project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from scripts.procesar_cfdi_mes import main

if __name__ == "__main__":
    main()
