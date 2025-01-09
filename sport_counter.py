#backend using flask framework

from flask import Flask, render_template, request, jsonify
import os
from flask_cors import CORS

app = Flask(__name__)
application = app
file_path = os.path.dirname(__file__)
CORS(app)  # This allows CORS for all routes by default

# route == function from flask (app)
# route defines html path and methods that will call the python function (index)
@app.route('/', methods=["GET", "POST"])
def index():
    count = 0
    user = None
    new_user = request.form.get("new_user")
    selected_user = request.form.get("users")
    action = request.form.get("action")
    if request.method == "POST":
        if action == "select_user":
            count, user = read_user(selected_user)
        if action == "add":
            current_count, user = read_user(selected_user)
            count = add_one(current_count, user)
        if action == "create_user":
            create_user(new_user)
        # counter=count --> counter is in html, count in python
        return jsonify({'counter': count, 'new_user': new_user})
    return render_template('index.html', counter=count, user=user, new_user=new_user)

def read_user(user):
    with open(file_path + "/static/data/" + user + ".txt") as user_file:
        return user_file.read(), user

def add_one(count, user):
    with open(file_path + "/static/data/" + user + ".txt", "w") as user_file:
        user_file.write(str(int(count) + 1))
        return int(count) + 1
    
def create_user(user):
    with open(file_path + "/static/data/" + user + ".txt", "w") as user_file:
        user_file.write("0")

@app.after_request
def add_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return response

if __name__ == "__main__":
    app.run(debug=True)
