from fastapi import BackgroundTasks, Depends

from app.asgi import app
from dependencies import current_user
from models import User
from utils.email import send_email


@app.get('/check-availability')
async def check_availability(username: str = None, email: str = None):
    if email:
        clause = (User.c.email == email)
    else:
        clause = (User.c.username == username)
    user = await User.get(clause)
    return {'available': not user}


# curl -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4ZmM1Mzg4MC1kZDY4LTRjZWYtYWFlMi0zZjkyNzAwODNlMDUiLCJleHAiOjE1NTgwMzQ4MjUsImlzcyI6IiJ9.buRKVsO3DJQRsLFhCDFHAnhGJVRvzlo2_cR3gyVpT1w' http://localhost:8000/me
@app.get('/me', response_model=User.response_model())
async def get_me(user: User = Depends(current_user)):
    return user


# curl -X PUT -d '{"id":"8fc53880-dd68-4cef-aae2-3f9270083e05", "email":"marc@example.com"}' -H 'Content-Type: application/json' -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4ZmM1Mzg4MC1kZDY4LTRjZWYtYWFlMi0zZjkyNzAwODNlMDUiLCJleHAiOjE1NTgwMzQ4MjUsImlzcyI6IiJ9.buRKVsO3DJQRsLFhCDFHAnhGJVRvzlo2_cR3gyVpT1w' http://localhost:8000/me
@app.put('/me', response_model=User.response_model())
async def update_me(values: dict, user: User = Depends(current_user)):
    return await user.save(values)


# curl -d '{"name":"marc", "email":"marc@example.com", "password":"abcd1234"}' -H 'Content-Type: application/json' http://localhost:8000/register
@app.post('/register', response_model=User.response_model())
async def register_user(user: User, background_tasks: BackgroundTasks):
    await user.save()
    # background_tasks.add_task(send_email, 'Welcome {{user.name}}', 'welcome', {
    #                           'user': user, 'confirm_token': create_token()})
    return user


@app.get('/confirm-email/{token}')
async def confirm_email(token):
    user = await current_user(token)
    await user.save({'is_confirmed': True}, True)
