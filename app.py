#backend using flask framework

from flask import Flask, render_template, request, jsonify
import glob
import os

app = Flask(__name__)

@app.route('/api', methods=['GET'])
def get():
    return jsonify({'message': 'something'})

# @app.route('/api', methods=['POST'])
# def api():
#     if request.method == "POST":
#         user = request.form.get("users")
#         # test = request.form.get("test")
#         # return f"Received data: {user}-{test}"
#         return f"Received data: {user}"

@app.route('/')
def index():
    return render_template('index.html')

def list_users():
    users_path = glob.glob("assets/data/*.txt")
    users = []
    for user in users_path:
        users.append(os.path.splitext(os.path.basename(user))[0])
    return users

@app.route('/api', methods=['POST'])
def read_user(): # needs to be adapted for both user1 and 2!!!!
    if request.method == "POST":
        action = request.form.get("action")
        user = request.form.get("users")
        if action == "select_user":
            with open("assets/data/" + user + ".txt") as user_file:
                return user_file.read()

if __name__ == "__main__":
    app.run(debug=True)
    # print(list_users())