#backend using flask framework

from flask import Flask, render_template, request
import os

app = Flask(__name__)
application = app
file_path = os.path.dirname(__file__)

# route == function from flask (app)
# route defines html path and methods that will call the python function (index)
@app.route('/', methods=["GET", "POST"])
def index():
    count = 0
    user = None
    selected_user = request.form.get("users")
    action = request.form.get("action")
    if request.method == "POST":
        if action == "select_user":
            count, user = read_user(selected_user)
        if action == "add":
            current_count, user = read_user(selected_user)
            count = add_one(current_count, user)
        # counter=count --> counter is in html, count in python
    return render_template('index.html', counter=count, user=user)

def read_user(user): # needs to be adapted for both user1 and 2!!!!
    with open(file_path + "/static/data/" + user + ".txt") as user_file:
        return user_file.read(), user

def add_one(count, user):
    with open(file_path + "/static/data/" + user + ".txt", "w") as user_file:
        user_file.write(str(int(count) + 1))
        return int(count) + 1

if __name__ == "__main__":
    app.run(debug=False)
