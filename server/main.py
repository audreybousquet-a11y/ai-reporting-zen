from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

app = FastAPI()
templates = Jinja2Templates(directory="templates")

USERNAME = "admin"
PASSWORD = "aria2024"

def check_auth(request: Request):
    return request.cookies.get("session") == "authenticated"

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    if not check_auth(request):
        return RedirectResponse("/login")
    return templates.TemplateResponse(request=request, name="home.html")

@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse(request=request, name="login.html")

@app.post("/login")
def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if username == USERNAME and password == PASSWORD:
        response = RedirectResponse("/", status_code=302)
        response.set_cookie("session", "authenticated")
        return response
    return templates.TemplateResponse(request=request, name="login.html", context={"error": "Identifiants incorrects"})

@app.get("/logout")
def logout():
    response = RedirectResponse("/login")
    response.delete_cookie("session")
    return response
