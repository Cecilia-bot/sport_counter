#backend using flask framework

from flask import Flask, render_template, request, jsonify
import os
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
application = app
file_path = os.path.dirname(__file__)
CORS(app)  # This allows CORS for all routes by default

# route == function from flask (app)
# route defines html path and methods that will call the python function (index)
@app.route('/', methods=["GET", "POST"])
def index():
    count = 0
    user_exists = False
    user = request.form.get("users")
    if user:
        selected_user = user.lower()
    action = request.form.get("action")
    if request.method == "POST":
        if action == "select_user":
            user_exists = check_user(selected_user)
            if user_exists:
                count = read_user(selected_user)
        if action == "add":
            current_count = read_user(selected_user)
            count = add_one(current_count, selected_user)
        if action == "create_user":
            create_user(selected_user)
        # counter=count --> counter is in html, count in python
        return jsonify({'counter': count, 'user': selected_user, 'exists': user_exists})
    return render_template('index.html')

def read_user(user):
    with open(file_path + "/static/data/" + user + ".txt") as user_file:
        return user_file.read()

def add_one(count, user):
    filename = os.path.join(file_path, "static/data/", user + ".txt") 
    modification_date = datetime.fromtimestamp(os.path.getmtime(filename)).date()
    today = datetime.today().date()
    if today > modification_date:
        with open(filename, "w") as user_file:
            user_file.write(str(int(count) + 1))
            return int(count) + 1
    else:
        return count == -1
    
def create_user(user):
    with open(file_path + "/static/data/" + user + ".txt", "w") as user_file:
        user_file.write("0")

def check_user(user):
    user_path = os.path.join(file_path, "static/data/", user + ".txt")
    if os.path.exists(user_path):
        return True 

@app.after_request
def add_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return response

if __name__ == "__main__":
    app.run(debug=True)
