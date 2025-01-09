$(document).ready(function () {
    $("button[id='select_user']").click(function (event) {
        event.preventDefault(); // Prevent the page from refreshing
        var username = $("input[name='users']").val(); // Get the value of the input field
        if (!username) {
            alert("Please type a username.");
            return;
        }
        $.ajax({
            url: "http://127.0.0.1:5000/",
            type: "POST",
            data: { users: username, action: "select_user" },
            success: function (response) {
                // Update the HTML with the new data returned by the server
                $("#counter").text(response.counter);
            },
            error: function () {
                console.error("Error while sending request to the backend");
            }
        });
    });
    $("button[id='add']").click(function (event) {
        event.preventDefault(); // Prevent the page from refreshing
        var username = $("input[name='users']").val(); 
        if (!username) {
            alert("Please type a username before adding.");
            return;
        }
        $.ajax({
            url: "http://127.0.0.1:5000/",
            type: "POST",
            data: { users: username, action: "add" },
            success: function (response) { 
                // Update the HTML with the new data returned by the server
                $("#counter").text(response.counter);
            },
            error: function () {
                console.error("Error while sending request to the backend");
            }
        });
    });
    $("button[id='create_user']").click(function (event) {
        event.preventDefault(); // Prevent the page from refreshing
        var user = $("input[name='new_user']").val(); 
        if (!user) {
            alert("Please type a username before adding.");
            return;
        }
        $.ajax({
            url: "http://127.0.0.1:5000/",
            type: "POST",
            data: { new_user: user, action: "create_user" },
            success: function (response) { 
                alert("User " + response.new_user + " successfully created!");
                $("input[name='new_user']").val("")
                $("input[name='users']").val(response.new_user)
                $("button[id='select_user']").click()
            },
            error: function () {
                console.error("Error while sending request to the backend");
            }
        });
    });
});

