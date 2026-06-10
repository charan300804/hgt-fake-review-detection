import sys
sys.path.append('.')
from index import run_training, model_state, TrainingStatus
from pydantic import BaseModel

class Req(BaseModel):
    epochs: int = 50
    batch_size: int = 64
    learning_rate: float = 0.001

model_state['training_status'] = TrainingStatus(status="training", progress=0.0, current_epoch=0, total_epochs=50)
run_training(Req())
print("Training run finished.")
