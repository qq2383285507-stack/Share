import os
from pathlib import Path
path = Path(".bmad/bmm/workflows/workflow-status/paths/method-brownfield.yaml")
print(path.read_text())
