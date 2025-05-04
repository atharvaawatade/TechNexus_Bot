import os
from pymongo import MongoClient
from models.event import Event

client = MongoClient(os.environ.get("MONGO_URI", "mongodb+srv://atharva2021:123@cluster0.so5reec.mongodb.net/"))
db = client["techNexus"]
collection = db["events"]

def get_events():
    events = list(collection.find({}, {"_id": 0}))
    return [Event(**event) for event in events]

def search_events(keyword: str):
    query = {"$or": [
        {"name": {"$regex": keyword, "$options": "i"}},
        {"description": {"$regex": keyword, "$options": "i"}}
    ]}
    events = list(collection.find(query, {"_id": 0}))
    return [Event(**event) for event in events]