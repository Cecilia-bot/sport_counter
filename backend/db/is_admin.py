import sqlite3
dbname = "/app/db/app.db"
connection = sqlite3.connect(dbname)
cursor = connection.cursor()
ADMIN_GROUP = ["barile.cec@gmail.com", "vmacarios@gmail.com"]
sql = list()
sql.append("SELECT * FROM table_users;")
sql.append("ALTER TABLE table_users ADD is_admin INTEGER;")
for email in ADMIN_GROUP:
    sql.append("UPDATE table_users SET is_admin = 1 WHERE email = '%s';" % (email))
sql.append("SELECT * FROM table_users;")
try:
    for statement in sql:
        cursor.execute(statement)
        if statement.strip().upper().startswith('SELECT'):
            results = cursor.fetchall()
            for row in results:
                print(row)
    connection.commit()
except sqlite3.OperationalError as error:
    print(error)
finally:
    connection.close()