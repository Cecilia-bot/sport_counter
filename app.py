#backend using flask framework

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/api', methods=['GET'])
def get():
    return jsonify({'message': 'something'})

@app.route('/api', methods=['POST'])
def api():
    if request.method == "POST":
        user = request.form.get("users")
        # test = request.form.get("test")
        # return f"Received data: {user}-{test}"
        return f"Received data: {user}"

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)