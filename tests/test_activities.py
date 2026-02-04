import copy
from copy import deepcopy
from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

# Snapshot inicial para restaurar entre pruebas
_initial_activities = deepcopy(activities)

@pytest.fixture(autouse=True)
def reset_activities():
    # Restaurar el estado inicial antes de cada prueba
    activities.clear()
    activities.update(deepcopy(_initial_activities))

client = TestClient(app)

def test_get_activities():
    r = client.get('/activities')
    assert r.status_code == 200
    data = r.json()
    assert 'Chess Club' in data


def test_signup_adds_participant():
    email = 'testuser@example.com'
    r = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r.status_code == 200
    assert f"Signed up {email}" in r.json()['message']

    r2 = client.get('/activities')
    assert email in r2.json()['Chess Club']['participants']


def test_signup_duplicate_returns_400():
    email = 'testdup@example.com'
    r = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r.status_code == 200
    r2 = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r2.status_code == 400


def test_remove_participant():
    email = 'toremove@example.com'
    client.post(f"/activities/Chess%20Club/signup?email={email}")
    r = client.post(f"/activities/Chess%20Club/remove?email={email}")
    assert r.status_code == 200

    r2 = client.get('/activities')
    assert email not in r2.json()['Chess Club']['participants']


def test_remove_missing_returns_400():
    r = client.post('/activities/Chess%20Club/remove?email=doesnotexist@example.com')
    assert r.status_code == 400
