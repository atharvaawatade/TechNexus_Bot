from dataclasses import dataclass
from datetime import datetime

@dataclass
class Event:
    name: str
    start_date: datetime
    end_date: datetime
    location: str
    description: str
    registration_link: str