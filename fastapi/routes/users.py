from datetime import timedelta

from fastapi import BackgroundTasks, Depends
from starlette.status import HTTP_201_CREATED

from app.asgi import app
from dependencies import current_user
from models import User
from utils.email import send_email
from utils.tokens import create_token


@app.get("/check-availability")
async def check_availability(username: str = None, email: str = None):
    if email:
        clause = User.c.email == email
    else:
        clause = User.c.username == username
    users = await User.count(clause)
    return {"available": not users}


@app.get("/me", response_model=User.response_model())
async def get_current_user(user: User = Depends(current_user)):
    return user


@app.put("/me", response_model=User.response_model())
async def update_current_user(values: dict, user: User = Depends(current_user)):
    return await user.save(values)


@app.post(
    "/register", response_model=User.response_model(), status_code=HTTP_201_CREATED
)
async def register_user(user: User, background_tasks: BackgroundTasks):
    await user.save()
    background_tasks.add_task(
        send_email,
        "Welcome {{user.first_name}}",
        "welcome",
        {
            "user": user,
            "confirm_token": create_token(
                data={"sub": str(user.id)}, expires_delta=timedelta(days=1)
            ),
        },
    )
    return user


@app.get("/confirm-email/{token}")
async def confirm_email(token):
    user = await current_user(token)
    await user.save({"is_confirmed": True}, True)
