# Employee_Wellness_Management_Analytics (Team 4)

## Run frontend + backend together

First set up the ".env" file with your own string and information for MongoDb and SMTP and place it in the backend root with these:

```bash
MONGO_URI=connection string

MONGO_DB_NAME=employee_wellness_analytics

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email_id
SMTP_PASSWORD=app password from gmail
SMTP_USE_TLS=true
EMAIL_FROM=employee-wellness-analytics@gmail.com

FRONTEND_ORIGIN=http://localhost:5173
```

Then create a virtual environment using:

```bash
python -m venv .venv
```

Start the virtual environment using the command:
```bash
.venv/Scripts/activate
```

Download the libraries from the requirements.txt using the command:

```bash
pip install -r requirements.txt
```

Now,

``` bash
cd frontend
npm install
```
Then,
From the repo root:

```bash
npm install
npm run dev
```

- Frontend: Vite (default http://localhost:5173)
- Backend: Flask (default http://localhost:8000)
